/* midi.js -- the current loop as a Standard MIDI File.
 *
 * One MIDI track per sounding instrument, in app order. Drums (kick, snare,
 * hat) go out on channel 10 with General MIDI notes so they land on a drum
 * rack; everything melodic goes out on its own channel at the pitch the grid
 * plays. Swing is written into the note times, the same offsets the clock uses.
 * Probability is not: every hit the pattern contains is exported, so the file
 * is the rhythm, not one roll of the dice.
 *
 * Length: long enough for every track's cycle to come back round to "one"
 * together, capped at 16 bars (and 4 bars if the cycles never meet sooner).
 */
(() => {
  'use strict';

  const PPQ = 96;
  const GM_DRUMS = { kick: 36, snare: 38, hat: 42 };

  // Variable-length quantity, as SMF wants delta times.
  function vlq(n) {
    const out = [n & 0x7f];
    while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80);
    return out;
  }
  const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  const u16 = (n) => [(n >>> 8) & 255, n & 255];
  const text = (s) => [...new TextEncoder().encode(s)];

  function chunk(type, bytes) {
    return [...text(type), ...u32(bytes.length), ...bytes];
  }

  // events: [{ tick, bytes }] in any order -> an MTrk body with end-of-track.
  function trackBody(name, events) {
    const sorted = events.slice().sort((a, b) => a.tick - b.tick || a.order - b.order);
    const body = [0, 0xff, 0x03, ...vlq(text(name).length), ...text(name)];
    let last = 0;
    for (const e of sorted) {
      body.push(...vlq(Math.max(0, e.tick - last)), ...e.bytes);
      last = Math.max(last, e.tick);
    }
    body.push(0, 0xff, 0x2f, 0);
    return body;
  }

  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const lcm = (a, b) => a / gcd(a, b) * b;

  // A track's cycle length in twelfths of a beat (a sixteenth is 3, a triplet
  // eighth is 4), so mixed rings stay in integers.
  function cycleTwelfths(t) {
    const ring = (s) => s.steps * stepBeats(s.steps) * 12;
    return Math.round(ring(t.seq) + (t.useB ? ring(t.seqB) : 0));
  }

  window.exportMidi = function exportMidi(state, player, { bpm, order }) {
    const live = order.map(id => [id, state.tracks[id]]).filter(([, t]) => t && !t.muted && t.seq.pulses + (t.useB ? t.seqB.pulses : 0) > 0);
    const BAR = 48;  // twelfths in a 4/4 bar
    let span = BAR;
    for (const [, t] of live) span = lcm(span, cycleTwelfths(t));
    if (span > BAR * 16) span = BAR * 4;
    const totalBeats = span / 12;

    const tracks = [];
    // conductor: tempo + 4/4
    const usPerQ = Math.round(60000000 / bpm);
    tracks.push(trackBody('drum-circles', [
      { tick: 0, order: 0, bytes: [0xff, 0x51, 0x03, (usPerQ >> 16) & 255, (usPerQ >> 8) & 255, usPerQ & 255] },
      { tick: 0, order: 1, bytes: [0xff, 0x58, 0x04, 4, 2, 24, 8] }
    ]));

    const melodicChannels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15];
    let m = 0;
    for (const [id, t] of live) {
      const isDrum = id in GM_DRUMS;
      const ch = isDrum ? 9 : melodicChannels[m++ % melodicChannels.length];
      const notes = [...t.notes];
      let walk = 0;   // same note walk as playback: starts one in
      const events = [];
      let beat = 0, step = 0, guard = 0;
      while (beat < totalBeats - 1e-9 && guard++ < 4096) {
        const r = player.ringAt(t, step);
        const dur = stepBeats(r.seq.steps);
        const rotated = ((r.step - r.seq.rotation) % r.seq.steps + r.seq.steps) % r.seq.steps;
        if (r.seq.pulses > 0 && r.seq.pattern[rotated]) {
          // swing offset in beats, then ticks
          const swingBeats = swingOffsetSeconds(r.step, state.swing, dur, swingGroupSize(dur));
          const on = Math.max(0, Math.round((beat + swingBeats) * PPQ));
          const len = Math.max(1, Math.round(dur * PPQ * (isDrum ? 0.5 : 0.9)));
          let pitch;
          if (isDrum) pitch = GM_DRUMS[id];
          else if (notes.length) {
            walk = (walk + 1) % notes.length;
            pitch = Tone.Frequency(player.noteFor(t, notes[walk])).toMidi();
          } else pitch = 60;
          events.push({ tick: on, order: 1, bytes: [0x90 | ch, pitch, 100] });
          events.push({ tick: on + len, order: 0, bytes: [0x80 | ch, pitch, 0] });
        }
        step += 1;
        beat += dur;
      }
      tracks.push(trackBody(t.def.label, events));
    }

    const bytes = [
      ...chunk('MThd', [...u16(1), ...u16(tracks.length), ...u16(PPQ)]),
      ...tracks.flatMap(body => chunk('MTrk', body))
    ];
    return new Uint8Array(bytes);
  };
})();
