/* synths.js -- the six-track roster for the preset-driven rebuild, as data.
 *
 * Transcribed verbatim from Groovebox.setupSynths() in groovebox.js: same Tone
 * constructor options, same editable-parameter specs (min/max/step/default,
 * dotted paths into the options object). The `smpl` sampler track is dropped --
 * it duplicates what the kick/snare/hat engines already do.
 *
 * Naming: tracks are named for the instrument they represent rather than the
 * Tone class behind them, which is how a player thinks about them. `id` is the
 * new name; `legacyId` is the key still used inside groovebox.js, kept so preset
 * data and saved state can be matched up across the rebuild.
 *
 * ORDER MATTERS: kick, snare, hat, then the melodic voices. This is the order
 * the mobile UI swipes through.
 *
 * KNOWN DUPLICATION: groovebox.js still constructs its seven tracks inline and
 * does not read this file. That is deliberate for now -- the live app keeps
 * working untouched while the tuning page runs against the new roster. The
 * mobile rewrite must delete the inline copy and make this the only source.
 */
window.SYNTH_DEFS = [
  {
    id: 'kick', legacyId: 'membrane', label: 'kick', engine: 'MembraneSynth',
    melodic: false,
    // A kick synth: constrain it to the bottom of the range so the note grid
    // cannot pitch it up into a tom or a bloop.
    octaveLock: { min: 0, max: 1 },
    options: {
      pitchDecay: 0.05, octaves: 10, oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4, attackCurve: 'exponential' },
      frequency: 30
    },
    params: {
      'frequency':        { min: 20,    max: 200,  step: 1,     default: 30,    label: 'Pitch' },
      'pitchDecay':       { min: 0.001, max: 0.5,  step: 0.001, default: 0.05,  label: 'Pitch Decay' },
      'octaves':          { min: 1,     max: 12,   step: 1,     default: 10,    label: 'Octave Range' },
      'envelope.attack':  { min: 0.001, max: 0.1,  step: 0.001, default: 0.001, label: 'Attack' },
      'envelope.decay':   { min: 0.001, max: 1,    step: 0.001, default: 0.4,   label: 'Decay' },
      'envelope.sustain': { min: 0.001, max: 1,    step: 0.001, default: 0.01,  label: 'Sustain' },
      'envelope.release': { min: 0.001, max: 1,    step: 0.001, default: 0.4,   label: 'Release' }
    }
  },
  {
    id: 'snare', legacyId: 'noise', label: 'snare', engine: 'NoiseSynth',
    melodic: false,
    options: { noise: { type: 'white' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0 } },
    params: {
      'noise.type':       { options: ['white', 'pink', 'brown'], default: 'white', label: 'Colour' },
      'envelope.attack':  { min: 0.001, max: 1, step: 0.001, default: 0.005, label: 'Attack' },
      'envelope.decay':   { min: 0.001, max: 1, step: 0.001, default: 0.1,   label: 'Decay' },
      'envelope.sustain': { min: 0,     max: 1, step: 0.01,  default: 0,     label: 'Sustain' }
    }
  },
  {
    id: 'hat', legacyId: 'metal', label: 'hat', engine: 'MetalSynth',
    melodic: false,
    options: {
      frequency: 200, envelope: { attack: 0.001, decay: 1.4, release: 0.2 },
      harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5
    },
    params: {
      'frequency':        { min: 50,    max: 1000, step: 1,     default: 200,   label: 'Pitch' },
      'harmonicity':      { min: 0.1,   max: 10,   step: 0.1,   default: 5.1,   label: 'Harmonicity' },
      'modulationIndex':  { min: 1,     max: 100,  step: 1,     default: 32,    label: 'Mod Index' },
      'resonance':        { min: 100,   max: 8000, step: 100,   default: 4000,  label: 'Resonance' },
      'octaves':          { min: 0.5,   max: 4,    step: 0.1,   default: 1.5,   label: 'Octaves' },
      'envelope.attack':  { min: 0.001, max: 1,    step: 0.001, default: 0.001, label: 'Attack' },
      'envelope.decay':   { min: 0.001, max: 2,    step: 0.001, default: 1.4,   label: 'Decay' },
      'envelope.release': { min: 0.001, max: 2,    step: 0.001, default: 0.2,   label: 'Release' }
    }
  },
  {
    id: 'pluck', legacyId: 'pluck', label: 'pluck', engine: 'PluckSynth',
    melodic: true,
    options: { attackNoise: 1, dampening: 4000, resonance: 0.7 },
    params: {
      'attackNoise': { min: 0.1, max: 20,   step: 0.1,  default: 1,    label: 'Attack Noise' },
      'dampening':   { min: 100, max: 8000, step: 100,  default: 4000, label: 'Dampening' },
      'resonance':   { min: 0.1, max: 0.9,  step: 0.01, default: 0.7,  label: 'Resonance' }
    }
  },
  {
    id: 'fm', legacyId: 'fm', label: 'fm', engine: 'FMSynth',
    melodic: true,
    options: {
      harmonicity: 3, modulationIndex: 10, oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 }
    },
    params: {
      'harmonicity':                { min: 0.1,   max: 10, step: 0.1,   default: 3,    label: 'Harmonicity' },
      'modulationIndex':            { min: 0.1,   max: 40, step: 0.1,   default: 10,   label: 'Mod Index' },
      'envelope.attack':            { min: 0.001, max: 2,  step: 0.001, default: 0.01, label: 'Attack' },
      'envelope.decay':             { min: 0.001, max: 2,  step: 0.001, default: 0.2,  label: 'Decay' },
      'envelope.sustain':           { min: 0,     max: 1,  step: 0.01,  default: 0.2,  label: 'Sustain' },
      'envelope.release':           { min: 0.001, max: 4,  step: 0.001, default: 0.2,  label: 'Release' },
      'modulationEnvelope.attack':  { min: 0.001, max: 2,  step: 0.001, default: 0.5,  label: 'Mod Attack' },
      'modulationEnvelope.decay':   { min: 0.001, max: 2,  step: 0.001, default: 0,    label: 'Mod Decay' },
      'modulationEnvelope.sustain': { min: 0,     max: 1,  step: 0.01,  default: 1,    label: 'Mod Sustain' },
      'modulationEnvelope.release': { min: 0.001, max: 4,  step: 0.001, default: 0.5,  label: 'Mod Release' }
    }
  },
  {
    id: 'poly', legacyId: 'poly', label: 'poly', engine: 'PolySynth',
    melodic: true, maxPolyphony: 8,
    options: {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 24 },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.8 }
    },
    params: {
      'oscillator.type':    { options: ['fatsawtooth', 'fatsquare', 'fattriangle', 'sawtooth', 'square', 'triangle', 'sine'], default: 'fatsawtooth', label: 'Wave' },
      'oscillator.spread':  { min: 0,     max: 100, step: 1,     default: 24,   label: 'Spread' },
      'envelope.attack':    { min: 0.001, max: 2,   step: 0.001, default: 0.05, label: 'Attack' },
      'envelope.decay':     { min: 0.001, max: 2,   step: 0.001, default: 0.3,  label: 'Decay' },
      'envelope.sustain':   { min: 0,     max: 1,   step: 0.01,  default: 0.4,  label: 'Sustain' },
      'envelope.release':   { min: 0.001, max: 4,   step: 0.001, default: 0.8,  label: 'Release' }
    }
  }
];

/* Mixer volume per track, transcribed from setupSynths()'s Tone.Channel setup. */
window.TRACK_VOLUMES = { kick: -20, snare: -20, hat: -20, pluck: -20, fm: -20, poly: -23 };

/* Scales, transcribed from Groovebox's constructor. */
window.SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10]
};
