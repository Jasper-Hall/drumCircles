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
 * ORDER MATTERS: kick, snare, hat, perc, bass, then the melodic voices. This is
 * the order the mobile UI swipes through.
 *
 * ENGINES: 'FaustKickVA' is the MutaxKick virtual-analog engine compiled to
 * wasm (faust-kick.js). 'Sampler' is a Tone.Sampler over a `kit`, with the
 * sample chosen by index from a slider. 'MonoSynth' and the rest are Tone.
 *
 * KNOWN DUPLICATION: groovebox.js still constructs its seven tracks inline and
 * does not read this file. That is deliberate for now -- the live app keeps
 * working untouched while the tuning page runs against the new roster. The
 * mobile rewrite must delete the inline copy and make this the only source.
 */
window.SYNTH_DEFS = [
  {
    id: 'kick', legacyId: 'membrane', label: 'kick', engine: 'FaustKickVA',
    melodic: false,
    // A kick synth: the note grid only ever chooses a fundamental in the bottom
    // two octaves (C1 = 32.7 Hz .. B2 = 123 Hz), inside the engine's 20-200 Hz.
    octaveLock: { min: 1, max: 2 },
    // The MutaxKick virtual-analog engine (public/engines/kick-va). Names, ranges
    // and defaults are the plugin's own, from mutaxkick_body.dsp.
    options: {
      freq: 60, timbreX: 0.4, timbreY: 0.6, punchDepth: 50, punchLength: 100,
      contour: 0.5, sustain: 1000, release: 1000, bodyTone: 0.5, level: 0.8
    },
    params: {
      'freq':        { min: 20,  max: 200,  step: 0.1,   default: 60,   label: 'Pitch' },
      'punchDepth':  { min: 0,   max: 100,  step: 0.1,   default: 50,   label: 'Punch' },
      'punchLength': { min: 10,  max: 800,  step: 1,     default: 100,  label: 'Punch Length' },
      'timbreX':     { min: 0,   max: 1,    step: 0.001, default: 0.4,  label: 'Wave (tri>saw>sq>pulse)' },
      'timbreY':     { min: 0,   max: 1,    step: 0.001, default: 0.6,  label: 'Pulse Width' },
      'bodyTone':    { min: 0,   max: 1,    step: 0.001, default: 0.5,  label: 'Body Tone' },
      'contour':     { min: 0,   max: 1,    step: 0.001, default: 0.5,  label: 'Filter Contour' },
      'sustain':     { min: 10,  max: 2000, step: 1,     default: 1000, label: 'Sustain ms' },
      'release':     { min: 10,  max: 2000, step: 1,     default: 1000, label: 'Release ms' },
      'level':       { min: 0,   max: 1,    step: 0.001, default: 0.8,  label: 'Level' }
    }
  },
  {
    id: 'snare', legacyId: 'noise', label: 'snare', engine: 'Sampler',
    melodic: false,
    // PLACEHOLDERS from lux_s9 until Jasper picks the real ones. Order is the
    // slider order; `sample` selects by index so it lives with the other
    // synthesis params rather than as a separate dropdown.
    kit: [
      { id: 'snare_01', label: 'hypr 01', file: 'public/samples/snares/snare_01.m4a' },
      { id: 'snare_02', label: 'hypr 04', file: 'public/samples/snares/snare_02.m4a' },
      { id: 'snare_03', label: 'hypr 07', file: 'public/samples/snares/snare_03.m4a' },
      { id: 'snare_04', label: 'hypr 11', file: 'public/samples/snares/snare_04.m4a' },
      { id: 'snare_05', label: 'gbholna', file: 'public/samples/snares/snare_05.m4a' },
      { id: 'snare_06', label: 'vestiluted', file: 'public/samples/snares/snare_06.m4a' }
    ],
    options: { attack: 0, release: 0.4 },
    params: {
      'sample':  { kind: 'kitIndex', default: 0, label: 'Sample' },
      'attack':  { min: 0, max: 0.2, step: 0.001, default: 0,   label: 'Attack' },
      'release': { min: 0.02, max: 2, step: 0.01, default: 0.4, label: 'Release' },
      'pitch':   { min: -12, max: 12, step: 1, default: 0, label: 'Pitch (st)' }
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
    id: 'perc', legacyId: 'smpl', label: 'perc', engine: 'Sampler',
    melodic: true,
    // The old sampler track, back for congas / rims / blocks in the genres that
    // want them. Melodic: the note grid repitches the sample up the scale.
    // PLACEHOLDERS from lux_s9 until Jasper picks real congas.
    kit: [
      { id: 'perc_01', label: '38ksud 06',     file: 'public/samples/percs/perc_01.m4a' },
      { id: 'perc_02', label: '38ksud 21',     file: 'public/samples/percs/perc_02.m4a' },
      { id: 'perc_03', label: 'gbholna 02',    file: 'public/samples/percs/perc_03.m4a' },
      { id: 'perc_04', label: 'gbholna 09',    file: 'public/samples/percs/perc_04.m4a' },
      { id: 'perc_05', label: 'vestiluted 03', file: 'public/samples/percs/perc_05.m4a' },
      { id: 'perc_06', label: 'vestiluted 10', file: 'public/samples/percs/perc_06.m4a' },
      { id: 'perc_07', label: 'vestiluted 15', file: 'public/samples/percs/perc_07.m4a' },
      { id: 'perc_08', label: 'granvocal 17',  file: 'public/samples/percs/perc_08.m4a' },
      // RHYTHM 001's named rhythms: an agogo for the Ewe bell, a clap for Venda, a clave for Cuba
      { id: 'agogo', label: 'agogo (Ewe)',     file: 'public/samples/percs/rhythm001_agogo.wav' },
      { id: 'bell',  label: 'bell (Ewe)',      file: 'public/samples/percs/rhythm001_bell.wav' },
      { id: 'clap',  label: 'clap (Venda)',    file: 'public/samples/percs/rhythm001_clap.wav' },
      { id: 'clave', label: 'clave (Cuba)',    file: 'public/samples/percs/rhythm001_clave.wav' }
    ],
    options: { attack: 0, release: 0.3 },
    params: {
      'sample':  { kind: 'kitIndex', default: 0, label: 'Sample' },
      'attack':  { min: 0, max: 0.2, step: 0.001, default: 0,   label: 'Attack' },
      'release': { min: 0.02, max: 2, step: 0.01, default: 0.3, label: 'Release' },
      'pitch':   { min: -12, max: 12, step: 1, default: 0, label: 'Pitch (st)' }
    }
  },
  {
    id: 'bass', legacyId: null, label: 'bass', engine: 'MonoSynth',
    melodic: true,
    // Super simple: one oscillator into a lowpass with a short envelope. Locked
    // to the bottom two octaves so the grid cannot turn it into a lead.
    octaveLock: { min: 1, max: 2 },
    options: {
      oscillator: { type: 'sawtooth' },
      filter: { type: 'lowpass', Q: 2, rolloff: -24 },
      filterEnvelope: { attack: 0.005, decay: 0.15, sustain: 0.2, release: 0.2, baseFrequency: 80, octaves: 2.5 },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0.6, release: 0.15 }
    },
    params: {
      'oscillator.type':            { options: ['sawtooth', 'square', 'triangle', 'sine'], default: 'sawtooth', label: 'Wave' },
      'filterEnvelope.baseFrequency': { min: 40, max: 800, step: 1, default: 80, label: 'Cutoff' },
      'filterEnvelope.octaves':     { min: 0, max: 5, step: 0.1, default: 2.5, label: 'Env Amount' },
      'filterEnvelope.decay':       { min: 0.01, max: 1, step: 0.01, default: 0.15, label: 'Env Decay' },
      'filter.Q':                   { min: 0, max: 10, step: 0.1, default: 2, label: 'Resonance' },
      'envelope.decay':             { min: 0.01, max: 1, step: 0.01, default: 0.2, label: 'Decay' },
      'envelope.sustain':           { min: 0, max: 1, step: 0.01, default: 0.6, label: 'Sustain' },
      'envelope.release':           { min: 0.01, max: 1, step: 0.01, default: 0.15, label: 'Release' }
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

/* Mixer volume per track. The Tone-synth values are transcribed from
 * setupSynths(); kick/snare/perc/bass are new and set by ear on the desk. */
window.TRACK_VOLUMES = { kick: -8, snare: -12, hat: -20, perc: -14, bass: -14, pluck: -20, fm: -20, poly: -23 };

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
