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
    tracks: {},          // id -> { seq (ring A), seqB, useB, probability, synth, channel, notes:Set }
    edits: {},           // genreId -> { bpm, swing, tracks:{...}, synth:{trackId:{path:value}} }
    noteSeeds: {},       // trackId -> [indices]
    swing: NEUTRAL_SWING,
    playing: false,
    tick: 0              // global 16th counter; each track folds it into its own A+B cycle
  };

  // Debug handle for the desk (and for in-browser verification).
  window.__tune = state;

  // The desk tunes the genres and RHYTHM 001's example rhythms alike; the examples
  // sit after a rule in the list and go out under their own key.
  const presets = () => (window.GENRE_PRESETS || []).concat(window.EXAMPLE_PRESETS || []);
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

  const editFor = (g) => (state.edits[g.id] ||= { bpm: g.bpm, swing: g.swing ?? NEUTRAL_SWING, tracks: {}, synth: {} });

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
        // Ring A always plays. Ring B, when enabled, plays after it: the cycle
        // is A's steps then B's steps, exactly as the live app concatenates
        // outer/inner. Probability lives on both rings and is one number per track.
        seq: new EuclideanSequencer(16, 0, 0, 100, NEUTRAL_DISTRIBUTION),
        seqB: new EuclideanSequencer(16, 0, 0, 100, NEUTRAL_DISTRIBUTION),
        useB: false,
        probability: 100,
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
    // Bipolar MPC-style swing (engine.js): 50 straight, above late, below early.
    // Applied per event in the clock; Tone's own positive-only swing stays off.
    Tone.getTransport().swing = 0;
    state.swing = Math.min(SWING_MAX, Math.max(SWING_MIN, Number(pct) || NEUTRAL_SWING));
    const sl = document.getElementById('swingControl');
    const out = document.getElementById('swingValue');
    if (sl) sl.value = state.swing;
    if (out) out.textContent = formatSwing(state.swing);
  }

  // Which ring a track is on at this tick, and the step within it.
  function ringAt(t, tick) {
    const nA = t.seq.steps;
    const nB = t.useB ? t.seqB.steps : 0;
    const p = tick % (nA + nB);
    return p < nA ? { seq: t.seq, step: p } : { seq: t.seqB, step: p - nA };
  }

  function startClock() {
    Tone.getTransport().scheduleRepeat((time) => {
      const tick = state.tick;
      const when = time + swingOffsetSeconds(tick, state.swing, Tone.Time('16n').toSeconds());
      for (const id of Object.keys(state.tracks)) {
        const t = state.tracks[id];
        const r = ringAt(t, tick);
        if (r.seq.pulses > 0 && r.seq.getStep(r.step)) trigger(t, when);
      }
      Tone.getDraw().schedule(() => paintPlayhead(tick), when);
      state.tick += 1;
    }, '16n');
  }

  // ---- pattern helpers ---------------------------------------------------
  // Render a track's A(+B) cycle exactly as playback reads it: rotation applied,
  // a cycle shorter than the bar loops, a longer one is shown in full so the
  // strip and the target line up on the first 16.
  function renderBar(t) {
    const cycle = t.seq.steps + (t.useB ? t.seqB.steps : 0);
    const out = [];
    for (let tick = 0; tick < Math.max(BAR_STEPS, cycle); tick++) {
      const r = ringAt(t, tick);
      const rotated = ((r.step - r.seq.rotation) % r.seq.steps + r.seq.steps) % r.seq.steps;
      out.push(r.seq.pattern && r.seq.pattern[rotated] ? 1 : 0);
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
    let ruled = false;
    for (const g of presets()) {
      if (g.kind === 'example' && !ruled) { list.appendChild(el('div', 'genre-rule', 'rhythm 001 examples')); ruled = true; }
      const b = el('button', 'genre-item' + (g.verified || g.kind === 'example' ? '' : ' unreachable'));
      b.type = 'button';
      b.dataset.genre = g.id;
      b.appendChild(el('span', 'genre-name', g.label));
      if (!g.verified && g.kind !== 'example') b.appendChild(el('span', 'genre-flag', 'no ring'));
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
        euclid.appendChild(buildEuclidControl(def.id, key, 'a'));
      }
      euclid.appendChild(buildProbabilityControl(def.id));
      panel.appendChild(euclid);

      // --- ring B: a second set of the same four, played after ring A
      const ringB = el('div', 'tune-section euclid-controls ring-b');
      ringB.dataset.label = 'ring b';
      const toggle = el('button', 'ring-toggle', 'add ring b');
      toggle.type = 'button';
      toggle.id = 'ringb-' + def.id;
      toggle.title = 'Play a second ring after this one (the cycle becomes A then B)';
      toggle.addEventListener('click', () => {
        const t = state.tracks[def.id];
        t.useB = !t.useB;
        recordEdit(def.id);
        syncTrack(def.id);
        refreshExport();
      });
      ringB.appendChild(toggle);
      const ringBBody = el('div', 'ring-b-body');
      ringBBody.id = 'ringb-body-' + def.id;
      for (const key of ['steps', 'pulses', 'rotation', 'distribution']) {
        ringBBody.appendChild(buildEuclidControl(def.id, key, 'b'));
      }
      ringB.appendChild(ringBBody);
      panel.appendChild(ringB);

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
          const t = state.tracks[def.id];
          t.seq.updateParams(tp.steps, tp.pulses, tp.rotation, t.probability, tp.distribution);
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

  const ringSeq = (trackId, ring) => (ring === 'b' ? state.tracks[trackId].seqB : state.tracks[trackId].seq);

  function buildEuclidControl(trackId, key, ring) {
    const wrap = el('div', 'param-control');
    wrap.appendChild(el('label', null, key === 'distribution' ? 'dist' : key));
    const num = el('input', 'value-display euclid-number');
    num.type = 'number';
    num.id = 'num-' + trackId + '-' + ring + '-' + key;
    const range = el('input');
    range.type = 'range';
    range.id = 'rng-' + trackId + '-' + ring + '-' + key;
    // Distribution's slider walks the DETENT LIST by index -- that is the whole
    // point of the detents -- so its position has to be translated back into a
    // distribution value before it reaches the sequencer. The number box next to
    // it takes a raw 0-100 value and snaps to the nearest detent.
    range.addEventListener('input', (e) => {
      const raw = Number(e.target.value);
      if (key !== 'distribution') return setParam(trackId, key, raw, ring);
      const detents = ringSeq(trackId, ring).distributionDetents();
      const i = Math.max(0, Math.min(detents.length - 1, raw));
      setParam(trackId, key, detents[i], ring);
    });
    num.addEventListener('change', (e) => {
      const raw = Number(e.target.value);
      if (key !== 'distribution') return setParam(trackId, key, raw, ring);
      setParam(trackId, key, nearest(ringSeq(trackId, ring).distributionDetents(), raw), ring);
    });
    wrap.appendChild(num);
    wrap.appendChild(range);
    return wrap;
  }

  // One probability per track, 0-100, applied to both rings: each hit that the
  // pattern schedules is then kept with this chance.
  function buildProbabilityControl(trackId) {
    const wrap = el('div', 'param-control');
    wrap.appendChild(el('label', null, 'prob'));
    const num = el('input', 'value-display euclid-number');
    num.type = 'number'; num.id = 'num-' + trackId + '-prob'; num.min = 0; num.max = 100;
    const range = el('input');
    range.type = 'range'; range.id = 'rng-' + trackId + '-prob'; range.min = 0; range.max = 100; range.step = 1;
    const apply = (v) => setProbability(trackId, Math.max(0, Math.min(100, Math.round(Number(v)))));
    range.addEventListener('input', e => apply(e.target.value));
    num.addEventListener('change', e => apply(e.target.value));
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
  function setParam(trackId, key, value, ring = 'a') {
    const t = state.tracks[trackId];
    const s = ringSeq(trackId, ring);
    const next = {
      steps: key === 'steps' ? value : s.steps,
      pulses: key === 'pulses' ? value : s.pulses,
      rotation: key === 'rotation' ? value : s.rotation,
      distribution: key === 'distribution' ? value : s.distribution
    };
    s.updateParams(next.steps, next.pulses, next.rotation, t.probability, next.distribution);
    recordEdit(trackId);
    syncTrack(trackId);
    refreshExport();
  }

  function setProbability(trackId, value) {
    const t = state.tracks[trackId];
    t.probability = value;
    for (const s of [t.seq, t.seqB]) s.updateParams(s.steps, s.pulses, s.rotation, value, s.distribution);
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
    const t = state.tracks[trackId];
    const e = editFor(g);
    e.tracks[trackId] = ringParams(t);
  }

  // The preset shape for one track: ring A flat, probability, and ring B as a
  // nested block or null when unused (so a plain one-ring preset stays plain).
  function ringParams(t) {
    const a = t.seq, b = t.seqB;
    return {
      steps: a.steps, pulses: a.pulses, rotation: a.rotation, distribution: a.distribution,
      probability: t.probability,
      b: t.useB ? { steps: b.steps, pulses: b.pulses, rotation: b.rotation, distribution: b.distribution } : null
    };
  }

  // Keep every control, both strips and the match readout in step with the
  // sequencer. Distribution is snapped to its detents, so its slider indexes the
  // detent list rather than the raw 0-100 range.
  function syncRing(trackId, ring) {
    const s = ringSeq(trackId, ring);
    const detents = s.distributionDetents();
    const bounds = {
      steps: [1, 16, s.steps],
      pulses: [0, s.steps, s.pulses],
      rotation: [0, Math.max(0, s.steps - 1), s.rotation],
      distribution: [0, Math.max(0, detents.length - 1),
        Math.max(0, detents.indexOf(nearest(detents, s.distribution)))]
    };
    for (const [key, [min, max, val]] of Object.entries(bounds)) {
      const rng = document.getElementById('rng-' + trackId + '-' + ring + '-' + key);
      const num = document.getElementById('num-' + trackId + '-' + ring + '-' + key);
      if (!rng) continue;
      rng.min = min; rng.max = max; rng.step = 1; rng.value = val;
      if (key === 'distribution') {
        num.value = s.distribution;
        num.min = 0; num.max = 100;
      } else {
        num.min = min; num.max = max; num.value = val;
      }
    }
  }

  function syncTrack(trackId) {
    const t = state.tracks[trackId];
    syncRing(trackId, 'a');
    syncRing(trackId, 'b');

    const prob = document.getElementById('rng-' + trackId + '-prob');
    const probNum = document.getElementById('num-' + trackId + '-prob');
    if (prob) prob.value = t.probability;
    if (probNum) probNum.value = t.probability;

    const toggle = document.getElementById('ringb-' + trackId);
    const body = document.getElementById('ringb-body-' + trackId);
    if (toggle) {
      toggle.textContent = t.useB ? 'remove ring b' : 'add ring b';
      toggle.classList.toggle('active', t.useB);
    }
    if (body) body.hidden = !t.useB;

    const live = renderBar(t);
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
    // A ring-B cycle longer than a bar needs more cells; a bar boundary is drawn
    // every 16 so the eye can still find "one".
    while (row.children.length < bits.length) {
      const c = el('div', 'pattern-cell');
      c.dataset.i = row.children.length;
      row.appendChild(c);
    }
    while (row.children.length > Math.max(BAR_STEPS, bits.length)) row.removeChild(row.lastChild);
    row.style.gridTemplateColumns = 'repeat(' + row.children.length + ', 1fr)';
    [...row.children].forEach((cell, i) => {
      cell.classList.toggle('hit', !!bits[i]);
      cell.classList.toggle('mismatch', !!compare && bits[i] !== compare[i]);
      cell.classList.toggle('bar', i > 0 && i % BAR_STEPS === 0);
    });
  }

  function paintPlayhead(tick) {
    document.querySelectorAll('.pattern-row.live .pattern-cell.playing')
      .forEach(c => c.classList.remove('playing'));
    document.querySelectorAll('.pattern-row.live').forEach(row => {
      const c = row.children[tick % row.children.length];
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
    Tone.getTransport().bpm.value = bpm;
    document.getElementById('bpmControl').value = bpm;
    setSwing((edited && edited.swing != null) ? edited.swing : (g.swing ?? NEUTRAL_SWING));

    for (const def of defs()) {
      const src = (edited && edited.tracks[def.id]) || g.tracks[def.id];
      const t = state.tracks[def.id];
      t.probability = (src && src.probability != null) ? src.probability : 100;
      if (src) {
        t.seq.updateParams(src.steps, src.pulses, src.rotation, t.probability, src.distribution);
      } else {
        // Melodic tracks have no entry in the preset bank yet -- that is one of
        // the things this page exists to produce. Start them silent.
        t.seq.updateParams(16, 0, 0, t.probability, NEUTRAL_DISTRIBUTION);
      }
      const b = src && src.b;
      t.useB = !!b;
      if (b) t.seqB.updateParams(b.steps, b.pulses, b.rotation, t.probability, b.distribution);
      else t.seqB.updateParams(t.seq.steps, 0, 0, t.probability, NEUTRAL_DISTRIBUTION);
      syncTrack(def.id);
    }

    // An example can pin a melodic track to one grid note (the beep stays one pitch).
    if (g.notes) for (const [tid, idx] of Object.entries(g.notes)) if (state.tracks[tid]) state.tracks[tid].notes = new Set(idx);

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
      return { ...g, bpm: (e && e.bpm) || g.bpm, swing: (e && e.swing != null) ? e.swing : (g.swing ?? NEUTRAL_SWING), tracks, synth };
    });
    return JSON.stringify({
      presets: out.filter(g => g.kind !== 'example'),
      examples: out.filter(g => g.kind === 'example'),
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
      Tone.getTransport().bpm.value = v;
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
        Tone.getTransport().stop();
        state.playing = false;
        state.tick = 0;
        play.textContent = 'play';
        play.classList.remove('active');
      } else {
        Tone.getTransport().start();
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
