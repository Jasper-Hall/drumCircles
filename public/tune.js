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
    edits: {},           // genreId -> { bpm, tracks:{id:{steps,pulses,rotation,distribution}} }
    synthEdits: {},      // trackId -> { 'envelope.decay': 0.3, ... }
    noteSeeds: {},       // trackId -> [indices]
    playing: false,
    step: 0
  };

  const presets = () => window.GENRE_PRESETS || [];
  // Tuned state persisted back into presets.js. Layered on top of SYNTH_DEFS on
  // boot so a reload of the desk picks up where the last session left off.
  const tunedSynth = () => window.SYNTH_DEFAULTS || {};
  const tunedNotes = () => window.NOTE_SEEDS || {};
  const tunedScale = () => window.TUNED_SCALE || null;
  const defs = () => window.SYNTH_DEFS || [];
  const genre = () => presets().find(g => g.id === state.genreId);

  // ---- audio -------------------------------------------------------------
  // FX sends default to zero -- dry by default is a deliberate change from the
  // current app, where everything arrives pre-soaked in reverb.
  function buildAudio() {
    for (const def of defs()) {
      const opts = JSON.parse(JSON.stringify(def.options));
      let synth;
      if (def.engine === 'PolySynth') {
        synth = new Tone.PolySynth(Tone.Synth, opts);
        if (def.maxPolyphony) synth.maxPolyphony = def.maxPolyphony;
      } else {
        synth = new Tone[def.engine](opts);
      }
      const channel = new Tone.Channel({
        volume: (window.TRACK_VOLUMES || {})[def.id] ?? -20,
        pan: 0
      }).toDestination();
      synth.connect(channel);

      state.tracks[def.id] = {
        def,
        synth,
        channel,
        seq: new EuclideanSequencer(16, 0, 0, 100, NEUTRAL_DISTRIBUTION),
        notes: new Set(tunedNotes()[def.id] || []),
        params: {}
      };
      // Previously dialled synth values become this session's starting point and
      // stay in the export, so they are not silently dropped on the next save.
      for (const [path, value] of Object.entries(tunedSynth()[def.id] || {})) {
        applyParam(state.tracks[def.id], path, value);
        (state.synthEdits[def.id] ||= {})[path] = value;
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
    if (track.def.engine === 'NoiseSynth') { s.triggerAttackRelease('16n', time); return; }
    const notes = [...track.notes];
    if (!track.def.melodic) {
      const n = notes.length ? noteFor(track, notes[0]) : (track.def.engine === 'MetalSynth' ? 'C4' : 'C1');
      s.triggerAttackRelease(n, '16n', time);
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
      if (spec.options) {
        const sel = el('select');
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
        r.type = 'range';
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
    (state.synthEdits[trackId] ||= {})[path] = value;
    refreshExport();
  }

  function recordEdit(trackId) {
    const g = genre();
    if (!g) return;
    const s = state.tracks[trackId].seq;
    const e = (state.edits[g.id] ||= { bpm: g.bpm, swing: g.swing || 0, tracks: {} });
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
      return { ...g, bpm: (e && e.bpm) || g.bpm, swing: (e && e.swing != null) ? e.swing : (g.swing || 0), tracks };
    });
    return JSON.stringify({
      presets: out,
      synthDefaults: state.synthEdits,
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
      if (g) (state.edits[g.id] ||= { bpm: g.bpm, swing: g.swing || 0, tracks: {} }).bpm = v;
      refreshExport();
    });

    document.getElementById('swingControl').addEventListener('input', e => {
      const v = Number(e.target.value);
      setSwing(v);
      const g = genre();
      if (g) (state.edits[g.id] ||= { bpm: g.bpm, swing: g.swing || 0, tracks: {} }).swing = v;
      refreshExport();
    });

    const play = document.getElementById('playButton');
    play.addEventListener('click', async () => {
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
  document.addEventListener('DOMContentLoaded', () => {
    buildAudio();
    buildGenreList();
    buildTracks();
    wire();
    startClock();
    selectGenre((presets()[0] || {}).id);
  });
})();
