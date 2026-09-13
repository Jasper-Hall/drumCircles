/* tune.js -- the internal tuning desk (tune.html).
 *
 * Temporary tool. Its whole job is to let the values that only an ear can settle
 * -- genre preset parameters, synth defaults, note seeds -- be dialled in against
 * the REAL engine, then exported as JSON to paste back into the repo.
 *
 * It deliberately does not import groovebox.js: that file boots the whole live
 * app on DOMContentLoaded. It shares the parts that must not diverge --
 * EuclideanSequencer from engine.js, the roster and param specs from synths.js,
 * the preset bank from presets.js.
 */
(() => {
  'use strict';

  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const NOTE_ROWS = 3;   // the rebuild reduces the grid from many rows to three
  const NOTE_COLS = 8;
  const BAR_STEPS = 16;

  // ---- state -------------------------------------------------------------
  // `edits` holds every deviation from the shipped presets.js, keyed by genre id.
  // Nothing is written back automatically; the export panel is the only output.
  const state = {
    genreId: null,
    scale: 'minor',
    root: 'C',
    tracks: {},          // id -> { seq, synth, channel, notes:Set, params:{} }
    edits: {},           // genreId -> { bpm, swing, tracks:{...}, synth:{trackId:{path:value}} }
    noteSeeds: {},       // trackId -> [indices]
    playing: false,
    step: 0
  };

  // Debug handle for the desk (and for in-browser verification).
  window.__tune = state;

  const presets = () => window.GENRE_PRESETS || [];
  // Tuned state persisted back into presets.js. Layered on top of SYNTH_DEFS on
  // boot so a reload of the desk picks up where the last session left off.
  const tunedSynth = () => window.SYNTH_DEFAULTS || {};
  const tunedNotes = () => window.NOTE_SEEDS || {};
  const tunedScale = () => window.TUNED_SCALE || null;
  const defs = () => window.SYNTH_DEFS || [];
  const genre = () => presets().find(g => g.id === state.genreId);

  // Synth params are PER GENRE. Resolution order, later wins:
  //   SYNTH_DEFS spec default  <  SYNTH_DEFAULTS (global, from presets.js)
  //   <  genre.synth[track] (shipped)  <  this session's edits for the genre.
  // Every param is resolved on every genre switch so nothing leaks between genres.
  function resolvedSynth(trackId) {
    const def = defs().find(d => d.id === trackId);
    const g = genre();
    const e = g && state.edits[g.id];
    const out = {};
    for (const [path, spec] of Object.entries(def.params)) {
      let v = spec.default;
      const glob = tunedSynth()[trackId];
      if (glob && glob[path] != null) v = glob[path];
      const shipped = g && g.synth && g.synth[trackId];
      if (shipped && shipped[path] != null) v = shipped[path];
      const ed = e && e.synth && e.synth[trackId];
      if (ed && ed[path] != null) v = ed[path];
      out[path] = v;
    }
    return out;
  }

  const editFor = (g) => (state.edits[g.id] ||= { bpm: g.bpm, swing: g.swing || 0, tracks: {}, synth: {} });

  // ---- audio -------------------------------------------------------------
  // FX sends default to zero -- dry by default is a deliberate change from the
  // current app, where everything arrives pre-soaked in reverb.
  // Tone 14 wraps its context in standardized-audio-context; the AudioWorklet the
  // kick needs must be constructed on the NATIVE context underneath. That handle
  // is a private field, but Tone is pinned to 14.8.49 on the CDN so it is stable.
  function nativeContext() {
    const rc = Tone.getContext().rawContext;
    if (rc instanceof AudioContext) return rc;
    if (rc && rc._nativeAudioContext instanceof AudioContext) return rc._nativeAudioContext;
    if (rc && rc._nativeContext instanceof AudioContext) return rc._nativeContext;
    throw new Error('no native AudioContext under Tone.getContext().rawContext');
  }

  async function buildAudio() {
    const raw = nativeContext();
    for (const def of defs()) {
      const opts = JSON.parse(JSON.stringify(def.options));
      let synth, kick = null, samplers = null;
      const channel = new Tone.Channel({
        volume: (window.TRACK_VOLUMES || {})[def.id] ?? -20,
        pan: 0
      }).toDestination();

      if (def.engine === 'FaustKickVA') {
        // The MutaxKick VA engine as an AudioWorklet on the native context Tone
        // is running on -- same clock, so transport times line up. A native node
        // cannot be connected into Tone's wrapped graph, so the kick gets its own
        // native gain straight to the destination; `channel` stays as the volume
        // source of truth and is mirrored onto that gain.
        kick = await window.createFaustKick(raw);
        for (const [k, v] of Object.entries(opts)) kick.set(k, v);
        const gain = raw.createGain();
        gain.gain.value = Tone.dbToGain((window.TRACK_VOLUMES || {})[def.id] ?? -20);
        kick.node.connect(gain);
        gain.connect(raw.destination);
        kick.outGain = gain;
        synth = null;
      } else if (def.engine === 'Sampler') {
        // One Tone.Sampler per kit entry, all loaded up front, only the chosen
        // one wired in -- so switching is instant and never re-fetches.
        samplers = {};
        for (const entry of def.kit) {
          samplers[entry.id] = new Tone.Sampler({ urls: { C3: entry.file }, attack: opts.attack, release: opts.release });
        }
        synth = samplers[def.kit[0].id];
        synth.connect(channel);
      } else if (def.engine === 'PolySynth') {
        synth = new Tone.PolySynth(Tone.Synth, opts);
        if (def.maxPolyphony) synth.maxPolyphony = def.maxPolyphony;
        synth.connect(channel);
      } else {
        synth = new Tone[def.engine](opts);
        synth.connect(channel);
      }

      state.tracks[def.id] = {
        def,
        synth,
        kick,
        samplers,
        kitIndex: 0,
        pitchSemis: 0,
        channel,
        seq: new EuclideanSequencer(16, 0, 0, 100, NEUTRAL_DISTRIBUTION),
        notes: new Set(tunedNotes()[def.id] || []),
        params: {}
      };
      // Previously dialled synth values become this session's starting point and
      // stay in the export, so they are not silently dropped on the next save.
      for (const [path, value] of Object.entries(tunedSynth()[def.id] || {})) {
        applyParam(state.tracks[def.id], path, value);
      }
      if (state.tracks[def.id].notes.size) state.noteSeeds[def.id] = [...state.tracks[def.id].notes];
    }
    const sc = tunedScale();
    if (sc) { state.scale = sc.scale || state.scale; state.root = sc.root || state.root; }
  }

  // Write a dotted path ('envelope.decay') into a live Tone node. Tone exposes
  // most of these as Signal/Param objects with a .value, and plain fields
  // otherwise, so both have to be handled.
  function applyParam(track, path, value) {
    if (track.kick) { track.kick.set(path, value); return; }
    if (track.samplers) {
      if (path === 'sample') {
        const entry = track.def.kit[Math.max(0, Math.min(track.def.kit.length - 1, Math.round(value)))];
        if (!entry || track.samplers[entry.id] === track.synth) return;
        track.synth.disconnect();
        track.synth = track.samplers[entry.id];
        track.synth.connect(track.channel);
        track.kitIndex = track.def.kit.indexOf(entry);
        return;
      }
      if (path === 'pitch') { track.pitchSemis = Number(value); return; }
      // attack / release apply to every sampler in the kit so switching keeps them
      for (const smp of Object.values(track.samplers)) smp[path] = value;
      return;
    }
    const parts = path.split('.');
    let node = track.synth;
    // PolySynth proxies its voices through set().
    if (track.def.engine === 'PolySynth') {
      const patch = {};
      let cur = patch;
      parts.forEach((p, i) => {
        if (i === parts.length - 1) cur[p] = value;
        else { cur[p] = {}; cur = cur[p]; }
      });
      track.synth.set(patch);
      return;
    }
    for (let i = 0; i < parts.length - 1; i++) {
      node = node && node[parts[i]];
      if (!node) return;
    }
    const leaf = parts[parts.length - 1];
    if (node && node[leaf] && typeof node[leaf] === 'object' && 'value' in node[leaf]) {
      node[leaf].value = value;
    } else if (node) {
      node[leaf] = value;
    }
  }

  function noteFor(track, index) {
    const scale = window.SCALES[state.scale];
    const baseMidi = Tone.Frequency(state.root + '0').toMidi();
    let octave = Math.floor(index / scale.length);
    const degree = index % scale.length;
    // Kick is a kick: never let the grid pitch it out of the bottom octaves.
    if (track.def.octaveLock) {
      octave = Math.min(track.def.octaveLock.max, Math.max(track.def.octaveLock.min, octave));
    } else {
      octave += 3;
    }
    return Tone.Frequency(baseMidi + scale[degree] + octave * 12, 'midi').toNote();
  }

  function trigger(track, time) {
    const s = track.synth;
    const notes = [...track.notes];
    if (track.kick) {
      // Fundamental from the (octave-locked) grid if any note is chosen, else the
      // engine's own freq knob. Gate is an AudioParam, so this is sample-accurate.
      const freq = notes.length ? Tone.Frequency(noteFor(track, notes[0])).toFrequency() : null;
      track.kick.trigger(time, freq);
      return;
    }
    if (track.samplers && !track.def.melodic) {
      s.triggerAttackRelease(Tone.Frequency('C3').transpose(track.pitchSemis).toNote(), '8n', time);
      return;
    }
    if (track.def.engine === 'NoiseSynth') { s.triggerAttackRelease('16n', time); return; }
    if (!track.def.melodic) {
      const n = notes.length ? noteFor(track, notes[0]) : (track.def.engine === 'MetalSynth' ? 'C4' : 'C1');
      s.triggerAttackRelease(n, '16n', time);
      return;
    }
    if (track.samplers) {
      // melodic sampler: the grid repitches the sample around C3
      if (!notes.length) { s.triggerAttackRelease(Tone.Frequency('C3').transpose(track.pitchSemis).toNote(), '8n', time); return; }
      track._i = ((track._i || 0) + 1) % notes.length;
      const midi = Tone.Frequency(noteFor(track, notes[track._i])).toMidi() - 48 + 60 + track.pitchSemis; // grid octave 3 -> C3
      s.triggerAttackRelease(Tone.Frequency(midi, 'midi').toNote(), '8n', time);
      return;
    }
    if (!notes.length) return;
    track._i = ((track._i || 0) + 1) % notes.length;
    s.triggerAttackRelease(noteFor(track, notes[track._i]), '16n', time);
  }

  function setSwing(pct) {
    // Tone's swing is 0-1 on the swingSubdivision; the app's slider is 0-100 on
    // 16ths, so keep that convention here and in the exported preset.
    Tone.Transport.swingSubdivision = '16n';
    Tone.Transport.swing = Math.max(0, Math.min(100, Number(pct) || 0)) / 100;
    const sl = document.getElementById('swingControl');
    const out = document.getElementById('swingValue');
    if (sl) sl.value = pct;
    if (out) out.textContent = Math.round(pct) + '%';
  }

  function startClock() {
    Tone.Transport.scheduleRepeat((time) => {
      const step = state.step;
      for (const id of Object.keys(state.tracks)) {
        const t = state.tracks[id];
        if (t.seq.pulses > 0 && t.seq.getStep(step)) trigger(t, time);
      }
      Tone.Draw.schedule(() => paintPlayhead(step), time);
      state.step = (state.step + 1) % BAR_STEPS;
    }, '16n');
  }

  // ---- pattern helpers ---------------------------------------------------
  // Render a sequencer across one 16-step bar exactly as playback reads it:
  // getStep() applies rotation, and a pattern shorter than the bar simply loops.
  function renderBar(seq) {
    const out = [];
    for (let step = 0; step < BAR_STEPS; step++) {
      const rotated = ((step - seq.rotation) % seq.steps + seq.steps) % seq.steps;
      out.push(seq.pattern && seq.pattern[rotated] ? 1 : 0);
    }
    return out;
  }

  const targetBits = (target) =>
    target ? target.split('').map(c => (c === 'x' || c === '1' ? 1 : 0)) : null;

  // ---- UI: build ---------------------------------------------------------
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function buildGenreList() {
    const list = document.getElementById('genreList');
    list.innerHTML = '';
    for (const g of presets()) {
      const b = el('button', 'genre-item' + (g.verified ? '' : ' unreachable'));
      b.type = 'button';
      b.dataset.genre = g.id;
      b.appendChild(el('span', 'genre-name', g.label));
      if (!g.verified) b.appendChild(el('span', 'genre-flag', 'no ring'));
      b.appendChild(el('span', 'genre-bpm', g.bpm + ' bpm'));
      b.title = g.note || '';
      b.addEventListener('click', () => selectGenre(g.id));
      list.appendChild(b);
    }
  }

  function buildTracks() {
    const host = document.getElementById('tuneTracks');
    host.innerHTML = '';
    for (const def of defs()) {
      const track = state.tracks[def.id];
      const panel = el('div', 'track');
      panel.dataset.track = def.id;
      panel.appendChild(el('div', 'track-name', def.label));

      // --- four euclidean controls, in the order the rebuild shows them
      const euclid = el('div', 'tune-section euclid-controls');
      euclid.dataset.label = 'rhythm';
      for (const key of ['steps', 'pulses', 'rotation', 'distribution']) {
        euclid.appendChild(buildEuclidControl(def.id, key));
      }
      panel.appendChild(euclid);

      // --- live pattern vs target
      const pat = el('div', 'tune-section pattern-section');
      pat.dataset.label = 'pattern';
      pat.appendChild(el('div', 'pattern-strip-label', 'live — what these params play'));
      pat.appendChild(buildStrip(def.id, 'live'));
      if (!def.melodic) {
        pat.appendChild(el('div', 'pattern-strip-label', 'target — researched canon (see confidence)'));
        pat.appendChild(buildStrip(def.id, 'target'));
        pat.appendChild(el('div', 'match-readout', '—')).dataset.for = def.id;
        const snap = el('button', 'snap-canon', 'snap to canon');
        snap.type = 'button';
        snap.dataset.for = def.id;
        snap.hidden = true;
        snap.title = 'Set the four knobs to the one-ring setting that reproduces the researched pattern';
        snap.addEventListener('click', () => {
          const g = genre();
          const tp = g && g.tracks[def.id] && g.tracks[def.id].targetParams;
          if (!tp) return;
          state.tracks[def.id].seq.updateParams(tp.steps, tp.pulses, tp.rotation, 100, tp.distribution);
          recordEdit(def.id);
          syncTrack(def.id);
          refreshExport();
        });
        pat.appendChild(snap);
      }
      panel.appendChild(pat);

      // --- note seeds
      const notes = el('div', 'tune-section');
      notes.dataset.label = 'notes';
      if (def.octaveLock) {
        notes.appendChild(el('div', 'note-grid-hint',
          'octave locked ' + def.octaveLock.min + '–' + def.octaveLock.max + ' (kick)'));
      }
      notes.appendChild(buildNoteGrid(def.id));
      panel.appendChild(notes);

      // --- synth defaults, collapsed
      panel.appendChild(buildSynthDefaults(def));

      host.appendChild(panel);
    }
  }

  function buildEuclidControl(trackId, key) {
    const wrap = el('div', 'param-control');
    wrap.appendChild(el('label', null, key === 'distribution' ? 'dist' : key));
    const num = el('input', 'value-display euclid-number');
    num.type = 'number';
    num.id = 'num-' + trackId + '-' + key;
    const range = el('input');
    range.type = 'range';
    range.id = 'rng-' + trackId + '-' + key;
    // Distribution's slider walks the DETENT LIST by index -- that is the whole
    // point of the detents -- so its position has to be translated back into a
    // distribution value before it reaches the sequencer. The number box next to
    // it takes a raw 0-100 value and snaps to the nearest detent.
    range.addEventListener('input', (e) => {
      const raw = Number(e.target.value);
      if (key !== 'distribution') return setParam(trackId, key, raw);
      const detents = state.tracks[trackId].seq.distributionDetents();
      const i = Math.max(0, Math.min(detents.length - 1, raw));
      setParam(trackId, key, detents[i]);
    });
    num.addEventListener('change', (e) => {
      const raw = Number(e.target.value);
      if (key !== 'distribution') return setParam(trackId, key, raw);
      setParam(trackId, key, nearest(state.tracks[trackId].seq.distributionDetents(), raw));
    });
    wrap.appendChild(num);
    wrap.appendChild(range);
    return wrap;
  }

  function buildStrip(trackId, kind) {
    const row = el('div', 'pattern-row ' + kind);
    row.id = 'strip-' + kind + '-' + trackId;
    for (let i = 0; i < BAR_STEPS; i++) {
      const c = el('div', 'pattern-cell');
      c.dataset.i = i;
      row.appendChild(c);
    }
    return row;
  }

  function buildNoteGrid(trackId) {
    const grid = el('div', 'note-selection');
    grid.style.gridTemplateColumns = 'repeat(' + NOTE_COLS + ', 1fr)';
    for (let i = 0; i < NOTE_ROWS * NOTE_COLS; i++) {
      const b = el('button', 'note-button');
      b.type = 'button';
      b.dataset.index = i;
      if (state.tracks[trackId].notes.has(i)) b.classList.add('selected');
      b.addEventListener('click', () => {
        const t = state.tracks[trackId];
        if (t.notes.has(i)) t.notes.delete(i); else t.notes.add(i);
        state.noteSeeds[trackId] = [...t.notes].sort((a, b2) => a - b2);
        b.classList.toggle('selected', t.notes.has(i));
        refreshExport();
      });
      grid.appendChild(b);
    }
    return grid;
  }

  function buildSynthDefaults(def) {
    const d = el('details', 'synth-defaults');
    d.appendChild(el('summary', null, 'synth defaults'));
    const body = el('div', 'synth-controls');
    for (const [path, spec] of Object.entries(def.params)) {
      const wrap = el('div', 'param-control');
      wrap.appendChild(el('label', null, spec.label || path));
      const cid = 'syn-' + def.id + '-' + path.replace(/\./g, '_');
      if (spec.kind === 'kitIndex') {
        const start = (tunedSynth()[def.id] || {})[path] ?? spec.default;
        const out = el('span', 'value-display', def.kit[start] ? def.kit[start].label : String(start));
        const r = el('input');
        r.type = 'range'; r.id = cid;
        r.min = 0; r.max = def.kit.length - 1; r.step = 1; r.value = start;
        r.addEventListener('input', e => {
          const i = Number(e.target.value);
          out.textContent = def.kit[i] ? def.kit[i].label : String(i);
          setSynthParam(def.id, path, i);
        });
        wrap.appendChild(out);
        wrap.appendChild(r);
      } else if (spec.options) {
        const sel = el('select'); sel.id = cid;
        for (const o of spec.options) {
          const opt = el('option', null, o);
          opt.value = o;
          sel.appendChild(opt);
        }
        sel.value = (tunedSynth()[def.id] || {})[path] ?? spec.default;
        sel.addEventListener('change', e => setSynthParam(def.id, path, e.target.value));
        wrap.appendChild(sel);
      } else {
        const start = (tunedSynth()[def.id] || {})[path] ?? spec.default;
        const out = el('span', 'value-display', String(start));
        const r = el('input');
        r.type = 'range'; r.id = cid;
        r.min = spec.min; r.max = spec.max; r.step = spec.step; r.value = start;
        r.addEventListener('input', e => {
          out.textContent = e.target.value;
          setSynthParam(def.id, path, Number(e.target.value));
        });
        wrap.appendChild(out);
        wrap.appendChild(r);
      }
      body.appendChild(wrap);
    }
    d.appendChild(body);
    return d;
  }

  // ---- UI: update --------------------------------------------------------
  function setParam(trackId, key, value) {
    const t = state.tracks[trackId];
    const s = t.seq;
    const next = {
      steps: key === 'steps' ? value : s.steps,
      pulses: key === 'pulses' ? value : s.pulses,
      rotation: key === 'rotation' ? value : s.rotation,
      distribution: key === 'distribution' ? value : s.distribution
    };
    s.updateParams(next.steps, next.pulses, next.rotation, 100, next.distribution);
    recordEdit(trackId);
    syncTrack(trackId);
    refreshExport();
  }

  function setSynthParam(trackId, path, value) {
    applyParam(state.tracks[trackId], path, value);
    const g = genre();
    if (g) ((editFor(g).synth ||= {})[trackId] ||= {})[path] = value;
    refreshExport();
  }

  function recordEdit(trackId) {
    const g = genre();
    if (!g) return;
    const s = state.tracks[trackId].seq;
    const e = editFor(g);
    e.tracks[trackId] = {
      steps: s.steps, pulses: s.pulses, rotation: s.rotation, distribution: s.distribution
    };
  }

  // Keep every control, both strips and the match readout in step with the
  // sequencer. Distribution is snapped to its detents, so its slider indexes the
  // detent list rather than the raw 0-100 range.
  function syncTrack(trackId) {
    const t = state.tracks[trackId];
    const s = t.seq;
    const detents = s.distributionDetents();

    const bounds = {
      steps: [1, 16, s.steps],
      pulses: [0, s.steps, s.pulses],
      rotation: [0, Math.max(0, s.steps - 1), s.rotation],
      distribution: [0, Math.max(0, detents.length - 1),
        Math.max(0, detents.indexOf(nearest(detents, s.distribution)))]
    };
    for (const [key, [min, max, val]] of Object.entries(bounds)) {
      const rng = document.getElementById('rng-' + trackId + '-' + key);
      const num = document.getElementById('num-' + trackId + '-' + key);
      if (!rng) continue;
      rng.min = min; rng.max = max; rng.step = 1; rng.value = val;
      if (key === 'distribution') {
        num.value = s.distribution;
        num.min = 0; num.max = 100;
      } else {
        num.min = min; num.max = max; num.value = val;
      }
    }

    const live = renderBar(s);
    const g = genre();
    const target = targetBits(g && g.tracks[trackId] && g.tracks[trackId].target);
    paintStrip('strip-live-' + trackId, live, target);
    if (target) {
      paintStrip('strip-target-' + trackId, target, live);
      const off = live.reduce((n, v, i) => n + (v !== target[i] ? 1 : 0), 0);
      const read = document.querySelector('.match-readout[data-for="' + trackId + '"]');
      if (read) {
        const conf = g.targetConfidence ? '  · research ' + g.targetConfidence : '';
        read.textContent = (off === 0 ? 'MATCH' : 'OFF BY ' + off) + conf;
        read.classList.toggle('match', off === 0);
        read.classList.toggle('off', off !== 0);
      }
      // "snap to canon" is only offered where one ring can actually get there
      const snap = document.querySelector('.snap-canon[data-for="' + trackId + '"]');
      if (snap) {
        const tp = g.tracks[trackId] && g.tracks[trackId].targetParams;
        snap.hidden = !tp || off === 0;
      }
    }
  }

  const nearest = (list, v) =>
    list.reduce((b, d) => (Math.abs(d - v) < Math.abs(b - v) ? d : b), list[0]);

  function paintStrip(id, bits, compare) {
    const row = document.getElementById(id);
    if (!row) return;
    [...row.children].forEach((cell, i) => {
      cell.classList.toggle('hit', !!bits[i]);
      cell.classList.toggle('mismatch', !!compare && bits[i] !== compare[i]);
      cell.textContent = bits[i] ? '' : '';
    });
  }

  function paintPlayhead(step) {
    document.querySelectorAll('.pattern-row.live .pattern-cell.playing')
      .forEach(c => c.classList.remove('playing'));
    document.querySelectorAll('.pattern-row.live').forEach(row => {
      const c = row.children[step];
      if (c) c.classList.add('playing');
    });
  }

  // ---- genre selection ---------------------------------------------------
  function selectGenre(id, { keepEdits = true } = {}) {
    state.genreId = id;
    const g = genre();
    if (!g) return;
    if (!keepEdits) delete state.edits[id];
    const edited = state.edits[id];

    const bpm = (edited && edited.bpm) || g.bpm;
    Tone.Transport.bpm.value = bpm;
    document.getElementById('bpmControl').value = bpm;
    setSwing((edited && edited.swing != null) ? edited.swing : (g.swing || 0));

    for (const def of defs()) {
      const src = (edited && edited.tracks[def.id]) || g.tracks[def.id];
      const t = state.tracks[def.id];
      if (src) {
        t.seq.updateParams(src.steps, src.pulses, src.rotation, 100, src.distribution);
      } else {
        // Melodic tracks have no entry in the preset bank yet -- that is one of
        // the things this page exists to produce. Start them silent.
        t.seq.updateParams(16, 0, 0, 100, NEUTRAL_DISTRIBUTION);
      }
      syncTrack(def.id);
    }

    // Synth params follow the genre. Apply the resolved set to the engines and
    // repaint the controls so what you see is what the genre sounds like.
    for (const def of defs()) {
      const vals = resolvedSynth(def.id);
      for (const [path, v] of Object.entries(vals)) {
        applyParam(state.tracks[def.id], path, v);
        const c = document.getElementById('syn-' + def.id + '-' + path.replace(/\./g, '_'));
        if (!c) continue;
        c.value = v;
        const disp = c.parentElement && c.parentElement.querySelector('.value-display');
        if (disp) {
          const spec = def.params[path];
          disp.textContent = (spec.kind === 'kitIndex' && def.kit[v]) ? def.kit[v].label : String(v);
        }
      }
    }

    document.querySelectorAll('.genre-item').forEach(b =>
      b.classList.toggle('selected', b.dataset.genre === id));
    refreshExport();
  }

  // ---- export ------------------------------------------------------------
  function buildExport() {
    const out = presets().map(g => {
      const e = state.edits[g.id];
      const tracks = {};
      for (const [tid, tp] of Object.entries(g.tracks)) {
        const ed = e && e.tracks[tid];
        tracks[tid] = ed ? { ...ed, target: tp.target } : { ...tp };
      }
      if (e) for (const [tid, tp] of Object.entries(e.tracks)) if (!tracks[tid]) tracks[tid] = { ...tp };
      const synth = {};
      for (const tid of Object.keys(g.synth || {})) synth[tid] = { ...(g.synth[tid]) };
      if (e && e.synth) for (const [tid, ps] of Object.entries(e.synth)) synth[tid] = { ...(synth[tid] || {}), ...ps };
      return { ...g, bpm: (e && e.bpm) || g.bpm, swing: (e && e.swing != null) ? e.swing : (g.swing || 0), tracks, synth };
    });
    return JSON.stringify({
      presets: out,
      synthDefaults: tunedSynth(),   // the global base layer, unchanged by the desk
      noteSeeds: state.noteSeeds,
      scale: state.scale,
      root: state.root
    }, null, 2);
  }

  function refreshExport() {
    document.getElementById('exportBox').value = buildExport();
  }

  // ---- wiring ------------------------------------------------------------
  function wire() {
    const scaleSel = document.getElementById('scaleSelect');
    for (const name of Object.keys(window.SCALES)) {
      const o = el('option', null, name); o.value = name; scaleSel.appendChild(o);
    }
    scaleSel.value = state.scale;
    scaleSel.addEventListener('change', e => { state.scale = e.target.value; refreshExport(); });

    const rootSel = document.getElementById('rootNote');
    for (const n of NOTE_NAMES) { const o = el('option', null, n); o.value = n; rootSel.appendChild(o); }
    rootSel.value = state.root;
    rootSel.addEventListener('change', e => { state.root = e.target.value; refreshExport(); });

    document.getElementById('bpmControl').addEventListener('change', e => {
      const v = Number(e.target.value);
      Tone.Transport.bpm.value = v;
      const g = genre();
      if (g) editFor(g).bpm = v;
      refreshExport();
    });

    document.getElementById('swingControl').addEventListener('input', e => {
      const v = Number(e.target.value);
      setSwing(v);
      const g = genre();
      if (g) editFor(g).swing = v;
      refreshExport();
    });

    const play = document.getElementById('playButton');
    play.addEventListener('click', async () => {
      await unlockAudio();          // engine.js: Tone.start + resume + silent buffer
      await Tone.start();
      if (state.playing) {
        Tone.Transport.stop();
        state.playing = false;
        state.step = 0;
        play.textContent = 'play';
        play.classList.remove('active');
      } else {
        Tone.Transport.start();
        state.playing = true;
        play.textContent = 'stop';
        play.classList.add('active');
      }
    });

    document.getElementById('copyBtn').addEventListener('click', async () => {
      const box = document.getElementById('exportBox');
      try {
        await navigator.clipboard.writeText(box.value);
        status('copied ' + box.value.length + ' chars');
      } catch {
        box.select();
        status('clipboard blocked — text selected, copy manually');
      }
    });

    document.getElementById('downloadBtn').addEventListener('click', () => {
      const blob = new Blob([buildExport()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'drum-circles-tuning.json';
      a.click();
      URL.revokeObjectURL(a.href);
      status('downloaded');
    });

    document.getElementById('revertBtn').addEventListener('click', () => {
      if (state.genreId) selectGenre(state.genreId, { keepEdits: false });
      status('reverted to shipped values');
    });
  }

  function status(msg) {
    const s = document.getElementById('copyStatus');
    s.textContent = msg;
    clearTimeout(status._t);
    status._t = setTimeout(() => { s.textContent = ''; }, 2500);
  }

  // ---- boot --------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    setPlaybackAudioSession();   // engine.js: play through the iOS mute switch
    try {
      await buildAudio();        // async: the kick compiles its wasm here
    } catch (e) {
      console.error('audio build failed', e);
      status('audio failed to build: ' + (e && e.message ? e.message : e));
    }
    buildGenreList();
    buildTracks();
    wire();
    startClock();
    selectGenre((presets()[0] || {}).id);
  });
})();
