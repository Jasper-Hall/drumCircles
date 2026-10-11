/* player.js -- the voices and the clock, shared by the app (index.html) and the
 * tuning desk (tune.html).
 *
 * Lifted out of tune.js so the app plays a preset exactly the way the desk
 * played it while it was being dialled: same engines, same parameter routing,
 * same note choice, same per-ring clock and swing. Anything that changes how a
 * preset SOUNDS belongs here, never in one page's own script.
 *
 * createPlayer(state, hooks) works on a state object the page owns:
 *   state.scale, state.root   key the note grid is read in
 *   state.swing               bipolar MPC swing (engine.js)
 *   state.tracks              filled by buildAudio(): id -> track
 *   state.tick                sixteenths since play
 * hooks.onStep(trackId, step, when) fires (via Tone.Draw) as each step plays.
 *
 * Plain globals, no modules, to keep the no-build-step deal.
 */
window.createPlayer = function createPlayer(state, hooks = {}) {
  const defs = () => window.SYNTH_DEFS || [];
  const volumes = () => window.TRACK_VOLUMES || {};

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

  // Shared FX buses. Every Tone track gets a reverb and a delay send, both at
  // zero: presets were dialled dry, so nothing arrives soaked. The kick is a
  // native node outside Tone's graph and stays dry.
  let fx = null;
  function buildFx() {
    const reverb = new Tone.Reverb({ decay: 3, wet: 1 }).toDestination();
    const delay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.35, wet: 1 }).toDestination();
    fx = { reverb, delay };
    return fx;
  }

  async function buildAudio() {
    const raw = nativeContext();
    if (!fx) buildFx();
    for (const def of defs()) {
      const opts = JSON.parse(JSON.stringify(def.options));
      let synth, kick = null, samplers = null;
      const channel = new Tone.Channel({ volume: volumes()[def.id] ?? -20, pan: 0 }).toDestination();
      const sends = {
        reverb: new Tone.Gain(0).connect(fx.reverb),
        delay: new Tone.Gain(0).connect(fx.delay)
      };
      channel.connect(sends.reverb);
      channel.connect(sends.delay);

      if (def.engine === 'FaustKickVA') {
        // The MutaxKick VA engine as an AudioWorklet on the native context Tone
        // is running on -- same clock, so transport times line up. A native node
        // cannot be connected into Tone's wrapped graph, so the kick gets its own
        // native gain straight to the destination, mirrored from `channel`.
        kick = await window.createFaustKick(raw);
        for (const [k, v] of Object.entries(opts)) kick.set(k, v);
        const gain = raw.createGain();
        gain.gain.value = Tone.dbToGain(volumes()[def.id] ?? -20);
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
        downbeatSemis: 0,        // added on the ring's first step (perc sampler)
        downbeatSampler: null,   // another kit sampler for the ring's first step, or null
        channel,
        sends,
        volume: volumes()[def.id] ?? -20,
        muted: false,
        // Ring A always plays. Ring B, when enabled, plays after it: the cycle
        // is A's steps then B's steps. Probability is one number per track.
        seq: new EuclideanSequencer(16, 0, 0, 100, NEUTRAL_DISTRIBUTION),
        seqB: new EuclideanSequencer(16, 0, 0, 100, NEUTRAL_DISTRIBUTION),
        useB: false,
        probability: 100,
        notes: new Set((window.NOTE_SEEDS || {})[def.id] || []),
        params: {}
      };
    }
  }

  // Write a dotted path ('envelope.decay') into a live Tone node. Tone exposes
  // most of these as Signal/Param objects with a .value, and plain fields
  // otherwise, so both have to be handled.
  function applyParam(track, path, value) {
    track.params[path] = value;
    if (track.kick) { track.kick.set(path, value); return; }
    if (track.samplers) {
      if (path === 'sample') {
        const entry = track.def.kit[Math.max(0, Math.min(track.def.kit.length - 1, Math.round(value)))];
        if (!entry || track.samplers[entry.id] === track.synth) return;
        track.synth.disconnect();
        track.synth = track.samplers[entry.id];
        track.synth.connect(track.channel);
        track.kitIndex = track.def.kit.indexOf(entry);
        if (track.downbeatSampler && track.downbeatSampler !== track.synth) track.downbeatSampler.connect(track.channel);
        return;
      }
      if (path === 'pitch') { track.pitchSemis = Number(value); return; }
      if (path === 'downbeatPitch') { track.downbeatSemis = Number(value); return; }
      if (path === 'downbeatSample') {
        const i = Math.round(Number(value));
        const entry = i >= 0 ? track.def.kit[Math.min(track.def.kit.length - 1, i)] : null;
        const smp = entry ? track.samplers[entry.id] : null;
        if (track.downbeatSampler && track.downbeatSampler !== track.synth) track.downbeatSampler.disconnect();
        track.downbeatSampler = smp;
        if (smp && smp !== track.synth) smp.connect(track.channel);
        return;
      }
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

  // Synth params resolve, later wins: SYNTH_DEFS spec default < SYNTH_DEFAULTS
  // (global, presets.js) < genre.synth[track] < `overrides` (a page's own edits).
  // Every param is resolved on every genre switch so nothing leaks between genres.
  function resolveSynth(trackId, genre, overrides) {
    const def = defs().find(d => d.id === trackId);
    const out = {};
    for (const [path, spec] of Object.entries(def.params)) {
      let v = spec.default;
      const glob = (window.SYNTH_DEFAULTS || {})[trackId];
      if (glob && glob[path] != null) v = glob[path];
      const shipped = genre && genre.synth && genre.synth[trackId];
      if (shipped && shipped[path] != null) v = shipped[path];
      if (overrides && overrides[path] != null) v = overrides[path];
      out[path] = v;
    }
    return out;
  }

  // Volume and mute live on the Tone channel; the kick's native gain mirrors it.
  function setVolume(track, db) {
    track.volume = db;
    track.channel.volume.value = db;
    if (track.kick) track.kick.outGain.gain.value = track.muted ? 0 : Tone.dbToGain(db);
  }
  function setMute(track, muted) {
    track.muted = muted;
    track.channel.mute = muted;
    if (track.kick) track.kick.outGain.gain.value = muted ? 0 : Tone.dbToGain(track.volume);
  }
  function setSend(track, bus, amount) {
    if (track.sends && track.sends[bus]) track.sends[bus].gain.value = amount;
  }

  // The pitch a grid cell plays. Cell i is scale degree i, climbing octaves.
  function noteFor(track, index) {
    const scale = window.SCALES[state.scale];
    const baseMidi = Tone.Frequency(state.root + '0').toMidi();
    let octave = Math.floor(index / scale.length);
    const degree = index % scale.length;
    // Kick and bass are locked to the bottom octaves: the grid cannot pitch them up.
    if (track.def.octaveLock) {
      octave = Math.min(track.def.octaveLock.max, Math.max(track.def.octaveLock.min, octave));
    } else {
      octave += 3;
    }
    return Tone.Frequency(baseMidi + scale[degree] + octave * 12, 'midi').toNote();
  }

  // Which grid note the next hit of a melodic track plays. Hits walk the chosen
  // notes in grid order; the walk starts one in, exactly as the desk always has.
  function nextNoteIndex(track) {
    const notes = [...track.notes];
    if (!notes.length) return null;
    track._i = ((track._i || 0) + 1) % notes.length;
    return notes[track._i];
  }

  function trigger(track, time, downbeat = false) {
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
      const voice = (downbeat && track.downbeatSampler) || s;
      voice.triggerAttackRelease(Tone.Frequency('C3').transpose(track.pitchSemis + (downbeat ? track.downbeatSemis || 0 : 0)).toNote(), '8n', time);
      return;
    }
    if (track.def.engine === 'NoiseSynth') { s.triggerAttackRelease('16n', time); return; }
    if (!track.def.melodic) {
      const n = notes.length ? noteFor(track, notes[0]) : (track.def.engine === 'MetalSynth' ? 'C4' : 'C1');
      s.triggerAttackRelease(n, '16n', time);
      return;
    }
    if (track.samplers) {
      // melodic sampler: the grid repitches the sample around C3; the ring's first
      // step may use another sample and/or a semitone offset (the gankogui's low bell)
      const voice = (downbeat && track.downbeatSampler) || s;
      const semis = track.pitchSemis + (downbeat ? track.downbeatSemis || 0 : 0);
      const idx = nextNoteIndex(track);
      if (idx == null) { voice.triggerAttackRelease(Tone.Frequency('C3').transpose(semis).toNote(), '8n', time); return; }
      const midi = Tone.Frequency(noteFor(track, idx)).toMidi() - 48 + 60 + semis; // grid octave 3 -> C3
      voice.triggerAttackRelease(Tone.Frequency(midi, 'midi').toNote(), '8n', time);
      return;
    }
    const idx = nextNoteIndex(track);
    if (idx == null) return;
    s.triggerAttackRelease(noteFor(track, idx), '16n', time);
  }

  function setSwing(pct) {
    // Bipolar MPC-style swing (engine.js): 50 straight, above late, below early.
    // Applied per event in the clock; Tone's own positive-only swing stays off.
    Tone.getTransport().swing = 0;
    state.swing = Math.min(SWING_MAX, Math.max(SWING_MIN, Number(pct) || NEUTRAL_SWING));
    return state.swing;
  }

  // Which ring a track is on at this step of its A+B cycle, and the step within it.
  function ringAt(t, step) {
    const nA = t.seq.steps;
    const nB = t.useB ? t.seqB.steps : 0;
    const p = step % (nA + nB);
    return p < nA ? { seq: t.seq, step: p, ring: 'a' } : { seq: t.seqB, step: p - nA, ring: 'b' };
  }

  // The transport ticks every sixteenth; each track keeps its own step counter
  // and its own position in beats, and every step that falls inside the tick's
  // window is scheduled at its exact time. A step is a sixteenth or, on a ring
  // whose length is a multiple of three, a triplet eighth (engine.js stepBeats),
  // so 12 steps fill a bar in 12/8. Swing shifts the off-beat step of each
  // pair (sixteenths) or triplet (triplet eighths) -- see engine.js.
  function startClock() {
    Tone.getTransport().scheduleRepeat((time) => {
      const tick = state.tick;
      const beatSec = Tone.Time('4n').toSeconds();
      const from = tick / 4, to = (tick + 1) / 4;
      for (const id of Object.keys(state.tracks)) {
        const t = state.tracks[id];
        if (tick === 0 || t._pos == null) { t._pos = { step: 0, beat: 0 }; }
        const pos = t._pos;
        while (pos.beat < to - 1e-9) {
          const r = ringAt(t, pos.step);
          const dur = stepBeats(r.seq.steps);
          let when = time + (pos.beat - from) * beatSec;
          when += swingOffsetSeconds(r.step, state.swing, dur * beatSec, swingGroupSize(dur));
          const hit = r.seq.pulses > 0 && r.seq.getStep(r.step);
          if (hit) trigger(t, when, r.step === 0);
          if (hooks.onStep) {
            const step = pos.step, ring = r.ring, ringStep = r.step;
            Tone.getDraw().schedule(() => hooks.onStep(id, step, { ring, ringStep, hit }), when);
          }
          pos.step += 1;
          pos.beat += dur;
        }
      }
      state.tick += 1;
    }, '16n');
  }

  // The track's A(+B) cycle as playback reads it, rotation applied, looped until
  // it fills whole bars (a 4-step kick shows four times, a 12/8 ring once, an
  // 8+16 cycle in full). Each cell carries the beat it starts on, so bar lines
  // land where the bars do even when triplet and sixteenth rings mix.
  function renderBar(t) {
    const cycle = t.seq.steps + (t.useB ? t.seqB.steps : 0);
    const bits = [], beats = [];
    let beat = 0;
    for (let step = 0; cycle > 0 && (step < cycle || beat < 4 - 1e-9); step++) {
      const r = ringAt(t, step);
      const rotated = ((r.step - r.seq.rotation) % r.seq.steps + r.seq.steps) % r.seq.steps;
      bits.push(r.seq.pattern && r.seq.pattern[rotated] ? 1 : 0);
      beats.push(beat);
      beat += stepBeats(r.seq.steps);
    }
    bits.beats = beats;
    return bits;
  }

  return {
    nativeContext, buildAudio, applyParam, resolveSynth, setVolume, setMute, setSend,
    noteFor, trigger, setSwing, ringAt, startClock, renderBar,
    get fx() { return fx; }
  };
};
