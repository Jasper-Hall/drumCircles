/* app.js -- drum-circles, the public app (index.html).
 *
 * Built for people arriving from the Euclid video series, mostly on a phone:
 * land on a row of genre presets and an overview of every track's ring, press
 * play and hear something straight away, then swipe across the tracks. Each
 * track shows four knobs (steps, PULSES, rotation, distribution), its ring and
 * a three-row note grid; everything else -- probability, ring B, level, sends
 * and the synth itself -- waits behind "advanced".
 *
 * Sound is entirely player.js, shared with the tuning desk (tune.html), so a
 * genre plays here exactly as it was dialled there. Presets are presets.js.
 *
 * Picking a genre loads it exactly as tuned. Picking it again rolls a
 * variation: the drums (kick, snare, hat, perc) hold their canonical pattern
 * and only the melodic voices move -- pulses by one, rotation, distribution by
 * a detent or two, and the notes.
 */
(() => {
  'use strict';

  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const NOTE_ROWS = 3;
  const NOTE_COLS = 8;
  // The order genres appear in, as specified for the app. Anything in presets.js
  // that is not listed here is appended after.
  const GENRE_ORDER = ['dancehall', 'reggaeton', 'ukgarage', 'ukfunky', 'bailefunk', 'house', 'bouyon',
    'cumbia', 'dembow', 'kuduro', 'tribal', 'ukdrill', 'hyphy'];
  const DEFAULT_GENRE = 'dancehall';
  // Tracks whose pattern IS the genre: never varied.
  const LOCKED = new Set(['kick', 'snare', 'hat', 'perc']);
  // Tracks where the note grid does nothing (unpitched one-shots).
  const NO_GRID = new Set(['snare', 'hat']);
  // Grid cells a variation draws notes from: the lower two octaves of the grid.
  const VARY_NOTE_SPAN = 14;

  const state = {
    genreId: null,
    variation: 0,
    scale: 'minor',
    root: 'C',
    swing: NEUTRAL_SWING,
    bpm: 120,
    tracks: {},
    tick: 0,
    playing: false,
    ready: false
  };
  window.__app = state;   // debug handle

  const defs = () => window.SYNTH_DEFS || [];
  const genres = () => {
    const all = window.GENRE_PRESETS || [];
    const ordered = GENRE_ORDER.map(id => all.find(g => g.id === id)).filter(Boolean);
    return ordered.concat(all.filter(g => !GENRE_ORDER.includes(g.id)));
  };
  const genre = () => genres().find(g => g.id === state.genreId);

  const ui = { cards: {}, minis: {}, tabs: {}, knobs: {} };
  const player = window.createPlayer(state, { onStep });

  // ---- small helpers -----------------------------------------------------
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  const SVG_NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs = {}) {
    const n = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  }
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const range = (lo, hi) => Array.from({ length: Math.max(0, hi - lo + 1) }, (_, i) => lo + i);
  const nearestIndex = (list, v) =>
    list.reduce((best, d, i) => (Math.abs(d - v) < Math.abs(list[best] - v) ? i : best), 0);
  // The detent a sequencer's distribution actually sounds as. A tuned value can
  // sit anywhere on a plateau of identical patterns; the knob and the ring both
  // name the plateau by its detent, so 'EUC' means the pattern IS euclidean.
  function shownDistribution(seq) {
    const now = seq.pattern.join();
    const base = seq.bjorklund(seq.steps, seq.pulses);
    return seq.distributionDetents().find(d => seq.applyDistribution(base, d).join() === now) ?? seq.distribution;
  }

  // ---- knob ----------------------------------------------------------------
  // A rotary knob over a list of allowed values (so distribution can walk its
  // detents and steps/pulses can re-bound each other). Drag up/down or
  // sideways, scroll, or use the arrow keys; double-tap resets.
  // opts: { label, values(), get(), set(v), format(v), reset(), bold, bipolarAt }
  function knob(opts) {
    const wrap = el('div', 'knob' + (opts.bold ? ' knob-bold' : ''));
    const face = el('div', 'knob-face');
    face.tabIndex = 0;
    face.setAttribute('role', 'slider');
    face.setAttribute('aria-label', opts.label);
    const s = svg('svg', { viewBox: '-50 -50 100 100', 'aria-hidden': 'true' });
    const ARC_R = 40;
    const track = svg('path', { class: 'knob-track' });
    const fill = svg('path', { class: 'knob-fill' });
    const cap = svg('circle', { class: 'knob-cap', r: 29 });
    const pointer = svg('line', { class: 'knob-pointer', x1: 0, y1: -12, x2: 0, y2: -26 });
    s.append(track, fill, cap, pointer);
    face.appendChild(s);
    const readout = el('div', 'knob-value');
    const label = el('div', 'knob-label', opts.label);
    wrap.append(face, readout, label);

    const MIN_A = -135, MAX_A = 135;
    const polar = (a) => {
      const r = (a - 90) * Math.PI / 180;
      return [ARC_R * Math.cos(r), ARC_R * Math.sin(r)];
    };
    const arc = (a0, a1) => {
      if (Math.abs(a1 - a0) < 0.01) return '';
      const [x0, y0] = polar(Math.min(a0, a1));
      const [x1, y1] = polar(Math.max(a0, a1));
      const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
      return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${ARC_R} ${ARC_R} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
    };
    track.setAttribute('d', arc(MIN_A, MAX_A));

    // Angle for list index i. A bipolar knob pins its neutral value to 12 o'clock.
    function angleFor(i, list) {
      const n = list.length;
      if (n <= 1) return 0;
      if (opts.bipolarAt != null) {
        const ni = list.indexOf(opts.bipolarAt);
        if (ni > 0 && ni < n - 1) {
          return i <= ni ? MIN_A * (ni - i) / ni : MAX_A * (i - ni) / (n - 1 - ni);
        }
      }
      return MIN_A + (MAX_A - MIN_A) * i / (n - 1);
    }
    function paint() {
      const list = opts.values();
      const i = nearestIndex(list, opts.get());
      const a = angleFor(i, list);
      const zero = opts.bipolarAt != null && list.includes(opts.bipolarAt) ? angleFor(list.indexOf(opts.bipolarAt), list) : MIN_A;
      fill.setAttribute('d', arc(zero, a));
      pointer.setAttribute('transform', `rotate(${a.toFixed(2)})`);
      const v = list[i];
      readout.textContent = opts.format ? opts.format(v) : String(v);
      face.setAttribute('aria-valuetext', readout.textContent);
      face.setAttribute('aria-valuenow', String(v));
    }
    function stepTo(i) {
      const list = opts.values();
      const v = list[clamp(i, 0, list.length - 1)];
      if (v !== opts.get()) { opts.set(v); }
      paint();
    }

    let drag = null;
    face.addEventListener('pointerdown', (e) => {
      const list = opts.values();
      drag = { x: e.clientX, y: e.clientY, i: nearestIndex(list, opts.get()), n: list.length, id: e.pointerId };
      face.setPointerCapture(e.pointerId);
      face.classList.add('dragging');
      e.preventDefault();
    });
    face.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      // up and right both turn it up; travel is ~170px for the whole range
      const px = clamp(170 / Math.max(1, drag.n - 1), 7, 22);
      const d = (drag.y - e.clientY) + (e.clientX - drag.x) * 0.6;
      if (Math.abs(d) > 4) drag.moved = true;
      stepTo(drag.i + Math.round(d / px));
    });
    // a press that did not turn the knob is a tap; two quick taps reset it
    let lastTap = 0;
    const end = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const tapped = !drag.moved && e.type === 'pointerup';
      drag = null;
      face.classList.remove('dragging');
      if (!tapped) { lastTap = 0; return; }
      const now = performance.now();
      if (now - lastTap < 350 && opts.reset) { opts.reset(); paint(); lastTap = 0; }
      else lastTap = now;
    };
    face.addEventListener('pointerup', end);
    face.addEventListener('pointercancel', end);
    face.addEventListener('wheel', (e) => {
      e.preventDefault();
      const list = opts.values();
      stepTo(nearestIndex(list, opts.get()) + (e.deltaY < 0 ? 1 : -1));
    }, { passive: false });
    face.addEventListener('keydown', (e) => {
      const list = opts.values();
      const i = nearestIndex(list, opts.get());
      const delta = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 4, PageDown: -4 }[e.key];
      if (delta == null) return;
      e.preventDefault();
      stepTo(i + delta);
    });

    wrap.paint = paint;
    paint();
    return wrap;
  }

  // ---- ring visualizer -----------------------------------------------------
  // Step 0 at 12 o'clock, clockwise, in playback order: a lit lens is a step the
  // ring plays (rotation applied). Ring B, when a track uses one, sits inside.
  const RING_R = { a: 80, b: 54 };

  function buildRing(trackId, mini) {
    const s = svg('svg', { viewBox: '-100 -100 200 200', class: 'ring' + (mini ? ' ring-mini' : '') });
    s.appendChild(svg('circle', { class: 'ring-guide', r: RING_R.a }));
    const gB = svg('circle', { class: 'ring-guide ring-guide-b', r: RING_R.b });
    s.appendChild(gB);
    const ga = svg('g', { class: 'ring-a' });
    const gb = svg('g', { class: 'ring-b' });
    s.append(ga, gb);
    let center = null;
    if (!mini) {
      center = svg('text', { class: 'ring-center', x: 0, y: -2, 'text-anchor': 'middle' });
      const sub = svg('text', { class: 'ring-sub', x: 0, y: 18, 'text-anchor': 'middle' });
      s.append(center, sub);
      s._sub = sub;
    }
    s._a = ga; s._b = gb; s._guideB = gB; s._center = center; s._track = trackId;
    return s;
  }

  function lensesFor(group, seq, r, mini) {
    const n = seq.steps;
    if (group._n !== n) {
      group.innerHTML = '';
      const size = Math.min(mini ? 11 : 9, (2 * Math.PI * r / n) * 0.34);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 2 * Math.PI - Math.PI / 2;
        group.appendChild(svg('circle', {
          class: 'lens', cx: (r * Math.cos(a)).toFixed(2), cy: (r * Math.sin(a)).toFixed(2), r: size.toFixed(2)
        }));
      }
      group._n = n;
    }
    [...group.children].forEach((c, i) => {
      const rotated = ((i - seq.rotation) % n + n) % n;
      c.classList.toggle('hit', !!(seq.pulses > 0 && seq.pattern[rotated]));
      c.classList.remove('now');
    });
  }

  function paintRing(s) {
    const t = state.tracks[s._track];
    if (!t) return;
    const mini = s.classList.contains('ring-mini');
    lensesFor(s._a, t.seq, RING_R.a, mini);
    s._b.style.display = t.useB ? '' : 'none';
    s._guideB.style.display = t.useB ? '' : 'none';
    if (t.useB) lensesFor(s._b, t.seqB, RING_R.b, mini);
    if (s._center) {
      s._center.textContent = `E(${t.seq.pulses},${t.seq.steps})`;
      const shown = shownDistribution(t.seq);
      const d = shown === NEUTRAL_DISTRIBUTION ? 'euclidean' : 'dist ' + formatDistribution(shown);
      const rot = t.seq.rotation ? ` · rot ${t.seq.rotation}` : '';
      s._sub.textContent = d + rot;
    }
    const silent = t.seq.pulses + (t.useB ? t.seqB.pulses : 0) === 0;
    s.classList.toggle('silent', silent);
  }

  function onStep(trackId, step, info) {
    for (const s of [ui.cards[trackId] && ui.cards[trackId].ring, ui.minis[trackId]]) {
      if (!s) continue;
      for (const c of s.querySelectorAll('.lens.now')) c.classList.remove('now');
      const g = info.ring === 'b' ? s._b : s._a;
      const c = g.children[info.ringStep];
      if (c) c.classList.add('now');
    }
    if (info.hit) {
      const tab = ui.tabs[trackId];
      if (tab) { tab.classList.remove('blink'); void tab.offsetWidth; tab.classList.add('blink'); }
    }
  }

  function clearPlayheads() {
    document.querySelectorAll('.lens.now').forEach(c => c.classList.remove('now'));
  }

  // ---- track cards ---------------------------------------------------------
  function seqKnob(trackId, ring, key) {
    const seq = () => (ring === 'b' ? state.tracks[trackId].seqB : state.tracks[trackId].seq);
    const preset = () => {
      const g = genre();
      const src = g && g.tracks[trackId];
      return ring === 'b' ? src && src.b : src;
    };
    const fallback = { steps: 16, pulses: 0, rotation: 0, distribution: NEUTRAL_DISTRIBUTION };
    const values = {
      steps: () => range(1, 16),
      pulses: () => range(0, seq().steps),
      rotation: () => range(0, Math.max(0, seq().steps - 1)),
      distribution: () => seq().distributionDetents()
    }[key];
    return knob({
      label: key === 'distribution' ? 'distribution' : key,
      bold: key === 'pulses',
      bipolarAt: key === 'distribution' ? NEUTRAL_DISTRIBUTION : null,
      values,
      get: () => (key === 'distribution' ? shownDistribution(seq()) : seq()[key]),
      set: (v) => setSeq(trackId, ring, key, v),
      format: key === 'distribution' ? formatDistribution : null,
      reset: () => {
        const p = preset() || fallback;
        setSeq(trackId, ring, key, p[key] ?? fallback[key]);
      }
    });
  }

  function setSeq(trackId, ring, key, value) {
    const t = state.tracks[trackId];
    const s = ring === 'b' ? t.seqB : t.seq;
    const next = { steps: s.steps, pulses: s.pulses, rotation: s.rotation, distribution: s.distribution };
    next[key] = value;
    if (key === 'steps' || key === 'pulses') {
      // keep distribution on a real detent for the new (steps, pulses)
      const was = shownDistribution(s);
      s.updateParams(next.steps, next.pulses, next.rotation, t.probability, s.distribution);
      const d = s.distributionDetents();
      next.distribution = d[nearestIndex(d, was)];
    }
    s.updateParams(next.steps, next.pulses, next.rotation, t.probability, next.distribution);
    refreshTrack(trackId);
  }

  function buildCard(def) {
    const id = def.id;
    const card = el('article', 'card plate');
    card.dataset.track = id;
    card.id = 'track-' + id;

    const head = el('header', 'card-head');
    head.appendChild(el('h2', 'card-name', def.label));
    const mute = el('button', 'btn mute', 'mute');
    mute.type = 'button';
    mute.addEventListener('click', () => {
      const t = state.tracks[id];
      player.setMute(t, !t.muted);
      refreshTrack(id);
    });
    head.appendChild(mute);
    card.appendChild(head);

    const ring = buildRing(id, false);
    const ringWrap = el('div', 'ring-wrap');
    ringWrap.appendChild(ring);
    card.appendChild(ringWrap);

    const knobs = el('div', 'knobs');
    const kn = {};
    for (const key of ['steps', 'pulses', 'rotation', 'distribution']) {
      kn[key] = seqKnob(id, 'a', key);
      knobs.appendChild(kn[key]);
    }
    card.appendChild(knobs);

    let grid = null;
    if (!NO_GRID.has(id)) {
      grid = buildNoteGrid(def);
      card.appendChild(grid);
    }

    const adv = el('details', 'advanced');
    adv.appendChild(el('summary', null, 'advanced'));
    const advBody = el('div', 'advanced-body');

    const mix = el('div', 'knobs knobs-small');
    kn.probability = knob({
      label: 'probability', values: () => range(0, 100), get: () => state.tracks[id].probability,
      format: v => v + '%',
      set: (v) => {
        const t = state.tracks[id];
        t.probability = v;
        for (const s of [t.seq, t.seqB]) s.updateParams(s.steps, s.pulses, s.rotation, v, s.distribution);
      },
      reset: () => {
        const src = genre() && genre().tracks[id];
        const v = src && src.probability != null ? src.probability : 100;
        const t = state.tracks[id];
        t.probability = v;
        for (const s of [t.seq, t.seqB]) s.updateParams(s.steps, s.pulses, s.rotation, v, s.distribution);
      }
    });
    mix.appendChild(kn.probability);
    const baseVol = (window.TRACK_VOLUMES || {})[id] ?? -20;
    kn.level = knob({
      label: 'level', values: () => range(-40, 6), get: () => Math.round(state.tracks[id].volume),
      format: v => (v > 0 ? '+' : '') + v + ' dB',
      set: (v) => player.setVolume(state.tracks[id], v),
      reset: () => player.setVolume(state.tracks[id], baseVol)
    });
    mix.appendChild(kn.level);
    if (def.engine !== 'FaustKickVA') {
      for (const bus of ['reverb', 'delay']) {
        kn[bus] = knob({
          label: bus, values: () => range(0, 100),
          get: () => Math.round(state.tracks[id].sends[bus].gain.value * 100),
          format: v => v + '%',
          set: (v) => player.setSend(state.tracks[id], bus, v / 100),
          reset: () => player.setSend(state.tracks[id], bus, 0)
        });
        mix.appendChild(kn[bus]);
      }
    }
    advBody.appendChild(mix);

    // ring B: a second ring played after A, for patterns one ring cannot reach
    const ringB = el('div', 'ring-b-section');
    const bHead = el('div', 'section-head');
    bHead.appendChild(el('span', 'section-label', 'ring b'));
    const bToggle = el('button', 'btn', 'add');
    bToggle.type = 'button';
    bToggle.addEventListener('click', () => {
      const t = state.tracks[id];
      t.useB = !t.useB;
      if (t.useB && t.seqB.pulses === 0) t.seqB.updateParams(t.seq.steps, t.seq.pulses, t.seq.rotation, t.probability, t.seq.distribution);
      refreshTrack(id);
    });
    bHead.appendChild(bToggle);
    ringB.appendChild(bHead);
    ringB.appendChild(el('p', 'section-note', 'plays after ring a, so the loop is a then b. some grooves need two halves.'));
    const bKnobs = el('div', 'knobs knobs-small ring-b-knobs');
    const knB = {};
    for (const key of ['steps', 'pulses', 'rotation', 'distribution']) {
      knB[key] = seqKnob(id, 'b', key);
      bKnobs.appendChild(knB[key]);
    }
    ringB.appendChild(bKnobs);
    advBody.appendChild(ringB);

    // the synth itself
    const sound = el('div', 'sound-section');
    sound.appendChild(el('div', 'section-head')).appendChild(el('span', 'section-label', 'sound'));
    const soundCtl = {};
    for (const [path, spec] of Object.entries(def.params)) {
      const row = el('label', 'sound-row');
      row.appendChild(el('span', 'sound-name', (spec.label || path).toLowerCase()));
      let input, out = el('span', 'sound-value');
      if (spec.options) {
        input = el('select');
        for (const o of spec.options) { const opt = el('option', null, o); opt.value = o; input.appendChild(opt); }
        input.addEventListener('change', e => player.applyParam(state.tracks[id], path, e.target.value));
        out = null;
      } else {
        input = el('input');
        input.type = 'range';
        if (spec.kind === 'kitIndex') {
          input.min = spec.default < 0 ? -1 : 0; input.max = def.kit.length - 1; input.step = 1;
        } else {
          input.min = spec.min; input.max = spec.max; input.step = spec.step;
        }
        input.addEventListener('input', e => {
          const v = Number(e.target.value);
          player.applyParam(state.tracks[id], path, v);
          out.textContent = soundLabel(def, spec, v);
        });
      }
      row.appendChild(input);
      if (out) row.appendChild(out);
      soundCtl[path] = { input, out, spec };
      sound.appendChild(row);
    }
    advBody.appendChild(sound);
    adv.appendChild(advBody);
    card.appendChild(adv);

    ui.cards[id] = { card, ring, mute, kn, knB, bToggle, bKnobs, grid, soundCtl };
    return card;
  }

  function soundLabel(def, spec, v) {
    if (spec.kind === 'kitIndex') return v < 0 ? 'same' : (def.kit[v] ? def.kit[v].label : String(v));
    const n = Number(v);
    return Math.abs(n) >= 100 ? String(Math.round(n)) : String(Math.round(n * 1000) / 1000);
  }

  function noteLabel(trackId, i) {
    const t = state.tracks[trackId];
    if (!t) return '';
    const n = player.noteFor(t, i);
    return n.replace(/\d+$/, '');
  }

  function buildNoteGrid(def) {
    const id = def.id;
    const wrap = el('div', 'notes');
    const head = el('div', 'section-head');
    head.appendChild(el('span', 'section-label', def.engine === 'FaustKickVA' ? 'pitch' : 'notes'));
    if (def.octaveLock) head.appendChild(el('span', 'section-note', 'low octaves only'));
    wrap.appendChild(head);
    const grid = el('div', 'note-grid');
    grid.style.gridTemplateColumns = `repeat(${NOTE_COLS}, 1fr)`;
    // top row is the highest notes, like a keyboard stood on end
    for (let row = NOTE_ROWS - 1; row >= 0; row--) {
      for (let col = 0; col < NOTE_COLS; col++) {
        const i = row * NOTE_COLS + col;
        const b = el('button', 'note');
        b.type = 'button';
        b.dataset.index = i;
        b.addEventListener('click', () => {
          const t = state.tracks[id];
          if (def.engine === 'FaustKickVA') {
            // the kick plays one note: the grid picks it
            t.notes = new Set(t.notes.has(i) ? [] : [i]);
          } else if (t.notes.has(i)) t.notes.delete(i);
          else t.notes = new Set([...t.notes, i].sort((a, c) => a - c));
          paintNotes(id);
        });
        grid.appendChild(b);
      }
    }
    wrap.appendChild(grid);
    return wrap;
  }

  function paintNotes(id) {
    const c = ui.cards[id];
    if (!c || !c.grid) return;
    const t = state.tracks[id];
    c.grid.querySelectorAll('.note').forEach(b => {
      const i = Number(b.dataset.index);
      b.classList.toggle('on', t.notes.has(i));
      b.textContent = noteLabel(id, i);
    });
  }

  function refreshTrack(id) {
    const c = ui.cards[id];
    const t = state.tracks[id];
    if (!c || !t) return;
    paintRing(c.ring);
    if (ui.minis[id]) paintRing(ui.minis[id]);
    for (const k of Object.values(c.kn)) k.paint();
    for (const k of Object.values(c.knB)) k.paint();
    c.bToggle.textContent = t.useB ? 'remove' : 'add';
    c.bToggle.classList.toggle('on', t.useB);
    c.bKnobs.hidden = !t.useB;
    c.mute.classList.toggle('on', t.muted);
    c.card.classList.toggle('muted', t.muted);
    const silent = t.seq.pulses + (t.useB ? t.seqB.pulses : 0) === 0;
    if (ui.tabs[id]) {
      ui.tabs[id].classList.toggle('silent', silent);
      ui.tabs[id].classList.toggle('muted', t.muted);
    }
    for (const [path, ctl] of Object.entries(c.soundCtl)) {
      const v = t.params[path] ?? ctl.spec.default;
      ctl.input.value = v;
      if (ctl.out) ctl.out.textContent = soundLabel(t.def, ctl.spec, v);
    }
    paintNotes(id);
  }

  // ---- genres --------------------------------------------------------------
  function loadGenre(id, { vary = false } = {}) {
    const g = genres().find(x => x.id === id);
    if (!g) return;
    state.genreId = id;
    state.bpm = g.bpm;
    Tone.getTransport().bpm.value = g.bpm;
    player.setSwing(g.swing ?? NEUTRAL_SWING);

    for (const def of defs()) {
      const t = state.tracks[def.id];
      const src = g.tracks[def.id];
      t.probability = src && src.probability != null ? src.probability : 100;
      if (src) t.seq.updateParams(src.steps, src.pulses, src.rotation, t.probability, src.distribution);
      else t.seq.updateParams(16, 0, 0, t.probability, NEUTRAL_DISTRIBUTION);
      const b = src && src.b;
      t.useB = !!b;
      if (b) t.seqB.updateParams(b.steps, b.pulses, b.rotation, t.probability, b.distribution);
      else t.seqB.updateParams(t.seq.steps, 0, 0, t.probability, NEUTRAL_DISTRIBUTION);
      t.notes = new Set((g.notes && g.notes[def.id]) || (window.NOTE_SEEDS || {})[def.id] || []);
      t._i = 0;
      // the genre owns the sound: resolve every param so nothing leaks across genres
      const vals = player.resolveSynth(def.id, g);
      for (const [path, v] of Object.entries(vals)) player.applyParam(t, path, v);
    }

    state.variation = vary ? state.variation + 1 : 0;
    if (vary) applyVariation(g);

    for (const def of defs()) refreshTrack(def.id);
    paintTransport();
    paintGenres();
    try { history.replaceState(null, '', '#' + id); } catch (e) { /* file:// */ }
  }

  // Only the melodic voices move; the drums are the genre. A voice the genre
  // leaves silent stays silent.
  function applyVariation(g) {
    for (const def of defs()) {
      if (LOCKED.has(def.id)) continue;
      const src = g.tracks[def.id];
      if (!src || !src.pulses) continue;
      const t = state.tracks[def.id];
      const s = t.seq;
      const pulses = clamp(src.pulses + randInt(-1, 1), 1, Math.max(1, s.steps - 1));
      s.updateParams(s.steps, pulses, randInt(0, s.steps - 1), t.probability, NEUTRAL_DISTRIBUTION);
      const d = s.distributionDetents();
      const at = nearestIndex(d, src.distribution);
      s.updateParams(s.steps, pulses, s.rotation, t.probability, d[clamp(at + randInt(-2, 2), 0, d.length - 1)]);
      const count = Math.max(1, t.notes.size || 3);
      const pool = range(0, VARY_NOTE_SPAN - 1);
      const pick = [];
      while (pick.length < Math.min(count, pool.length)) pick.push(pool.splice(randInt(0, pool.length - 1), 1)[0]);
      t.notes = new Set(pick.sort((a, b) => a - b));
      t._i = 0;
    }
  }

  function buildGenres() {
    const host = document.getElementById('genres');
    for (const g of genres()) {
      const b = el('button', 'genre');
      b.type = 'button';
      b.dataset.genre = g.id;
      b.appendChild(el('span', 'genre-name', g.label.toLowerCase()));
      b.appendChild(el('span', 'genre-bpm', g.bpm + ''));
      b.addEventListener('click', () => {
        loadGenre(g.id, { vary: state.genreId === g.id });
        if (!state.playing) play();
      });
      host.appendChild(b);
    }
  }

  function paintGenres() {
    document.querySelectorAll('.genre').forEach(b => b.classList.toggle('on', b.dataset.genre === state.genreId));
    const g = genre();
    document.getElementById('nowGenre').textContent = g ? g.label.toLowerCase() : '—';
    const hint = document.getElementById('genreHint');
    hint.innerHTML = '';
    if (!g) return;
    if (state.variation) {
      hint.appendChild(document.createTextNode(`variation ${state.variation} · drums stay canonical, the melody moves. `));
      const back = el('button', 'link', 'back to original');
      back.type = 'button';
      back.addEventListener('click', () => loadGenre(g.id));
      hint.appendChild(back);
    } else {
      hint.textContent = 'tap a genre to load it. tap it again for a variation.';
    }
  }

  // ---- overview + tabs + deck ------------------------------------------------
  function buildOverview() {
    const host = document.getElementById('overview');
    for (const def of defs()) {
      const b = el('button', 'mini');
      b.type = 'button';
      b.setAttribute('aria-label', 'go to ' + def.label);
      const ring = buildRing(def.id, true);
      b.appendChild(ring);
      b.appendChild(el('span', 'mini-name', def.label));
      b.addEventListener('click', () => goToTrack(def.id, true));
      ui.minis[def.id] = ring;
      host.appendChild(b);
    }
  }

  function buildDeck() {
    const tabs = document.getElementById('tabs');
    const deck = document.getElementById('deck');
    for (const def of defs()) {
      const tab = el('button', 'tab', def.label);
      tab.type = 'button';
      tab.addEventListener('click', () => goToTrack(def.id, false));
      ui.tabs[def.id] = tab;
      tabs.appendChild(tab);
      deck.appendChild(buildCard(def));
    }
    let raf = 0;
    deck.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(markActiveTab);
    }, { passive: true });
    window.addEventListener('resize', markActiveTab);
    markActiveTab();
  }

  function markActiveTab() {
    const deck = document.getElementById('deck');
    const mid = deck.scrollLeft + deck.clientWidth / 2;
    let best = null, bestD = Infinity;
    for (const def of defs()) {
      const c = ui.cards[def.id].card;
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
      if (d < bestD) { bestD = d; best = def.id; }
    }
    for (const [id, tab] of Object.entries(ui.tabs)) tab.classList.toggle('on', id === best);
  }

  function goToTrack(id, scrollPage) {
    const deck = document.getElementById('deck');
    const c = ui.cards[id].card;
    if (deck.scrollWidth <= deck.clientWidth + 1) {
      // wide screens lay the deck out as a grid: just bring the card into view
      c.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    deck.scrollTo({ left: c.offsetLeft - (deck.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' });
    if (scrollPage) document.getElementById('tabs').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- transport -------------------------------------------------------------
  const tk = {};
  function buildTransport() {
    const host = document.getElementById('transportKnobs');
    tk.bpm = knob({
      label: 'bpm', values: () => range(60, 200), get: () => state.bpm,
      set: (v) => { state.bpm = v; Tone.getTransport().bpm.value = v; },
      reset: () => { const g = genre(); if (g) { state.bpm = g.bpm; Tone.getTransport().bpm.value = g.bpm; } }
    });
    tk.swing = knob({
      label: 'swing', values: () => range(SWING_MIN, SWING_MAX), get: () => Math.round(state.swing),
      bipolarAt: NEUTRAL_SWING,
      format: (v) => (v === NEUTRAL_SWING ? 'straight' : v + '%'),
      set: (v) => player.setSwing(v),
      reset: () => { const g = genre(); player.setSwing(g ? g.swing ?? NEUTRAL_SWING : NEUTRAL_SWING); }
    });
    host.append(tk.bpm, tk.swing);

    document.getElementById('playButton').addEventListener('click', () => (state.playing ? stop() : play()));
    document.addEventListener('keydown', (e) => {
      if (e.code !== 'Space' || e.target.closest('input, select, textarea, [role="slider"]')) return;
      e.preventDefault();
      state.playing ? stop() : play();
    });
  }

  function paintTransport() {
    tk.bpm && tk.bpm.paint();
    tk.swing && tk.swing.paint();
    const btn = document.getElementById('playButton');
    btn.classList.toggle('on', state.playing);
    btn.setAttribute('aria-label', state.playing ? 'stop' : 'play');
    btn.disabled = !state.ready;
    document.getElementById('nowStatus').textContent =
      !state.ready ? 'loading sounds…' : state.playing ? `${state.bpm} bpm · playing` : 'press play';
  }

  async function play() {
    if (!state.ready || state.playing) return;
    await unlockAudio();   // engine.js: iOS needs this inside the gesture
    await Tone.start();
    state.tick = 0;
    Tone.getTransport().start('+0.05');
    state.playing = true;
    paintTransport();
  }

  function stop() {
    Tone.getTransport().stop();
    state.playing = false;
    state.tick = 0;
    clearPlayheads();
    paintTransport();
  }

  // ---- key + export ----------------------------------------------------------
  function buildMore() {
    const rootSel = document.getElementById('rootSelect');
    for (const n of NOTE_NAMES) { const o = el('option', null, n); o.value = n; rootSel.appendChild(o); }
    const scaleSel = document.getElementById('scaleSelect');
    for (const name of Object.keys(window.SCALES)) { const o = el('option', null, name); o.value = name; scaleSel.appendChild(o); }
    rootSel.value = state.root;
    scaleSel.value = state.scale;
    const repaint = () => defs().forEach(d => paintNotes(d.id));
    rootSel.addEventListener('change', e => { state.root = e.target.value; repaint(); });
    scaleSel.addEventListener('change', e => { state.scale = e.target.value; repaint(); });

    document.getElementById('midiButton').addEventListener('click', () => {
      const bytes = window.exportMidi(state, player, { bpm: state.bpm, order: defs().map(d => d.id) });
      const blob = new Blob([bytes], { type: 'audio/midi' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `drum-circles-${state.genreId || 'pattern'}-${state.bpm}bpm.mid`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
  }

  // ---- boot ------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    setPlaybackAudioSession();   // engine.js: play through the iOS mute switch
    const sc = window.TUNED_SCALE;
    if (sc) { state.scale = sc.scale || state.scale; state.root = sc.root || state.root; }
    try {
      await player.buildAudio();   // the kick compiles its wasm here
    } catch (e) {
      console.error('audio build failed', e);
      document.getElementById('nowStatus').textContent = 'audio failed to load';
    }
    buildGenres();
    buildOverview();
    buildDeck();
    buildTransport();
    buildMore();
    player.startClock();
    const fromHash = decodeURIComponent((location.hash || '').slice(1));
    loadGenre(genres().some(g => g.id === fromHash) ? fromHash : DEFAULT_GENRE);
    try { await Tone.loaded(); } catch (e) { console.warn('some samples failed to load', e); }
    state.ready = Object.keys(state.tracks).length > 0;
    paintTransport();
  });
})();
