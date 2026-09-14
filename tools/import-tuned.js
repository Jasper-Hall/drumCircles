// Rewrite public/presets.js from a tuning-desk export (the JSON the desk's
// copy/download buttons produce). Usage: node tools/import-tuned.js tools/tuned-YYYY-MM-DD.json
const fs = require('fs');
const path = require('path');
const src = process.argv[2];
if (!src) { console.error('usage: node tools/import-tuned.js <export.json>'); process.exit(1); }
const j = JSON.parse(fs.readFileSync(src, 'utf8'));
const out = path.join(__dirname, '..', 'public', 'presets.js');
const existing = fs.readFileSync(out, 'utf8');
const header = existing.slice(0, existing.indexOf('window.GENRE_PRESETS'));
const date = path.basename(src).replace(/^tuned-|\.json$/g, '');
const body = [
  header.replace(/dialled by ear on\n\/\/ the tuning desk, [\d-]+/, 'dialled by ear on\n// the tuning desk, ' + date),
  'window.GENRE_PRESETS = ' + JSON.stringify(j.presets, null, 2) + ';',
  '',
  '// RHYTHM 001\'s example rhythms, tuned on the desk like a genre: one track each,',
  '// the rest silent. `kind: \'example\'` keeps them out of the app\'s genre list.',
  'window.EXAMPLE_PRESETS = ' + JSON.stringify(j.examples || [], null, 2) + ';',
  '',
  '// Synth params shared by every genre; a genre\'s own `synth` block overrides these.',
  'window.SYNTH_DEFAULTS = ' + JSON.stringify(j.synthDefaults || {}, null, 2) + ';',
  '',
  '// Scale-degree indices seeded into each melodic track\'s note grid.',
  'window.NOTE_SEEDS = ' + JSON.stringify(j.noteSeeds || {}, null, 2) + ';',
  '',
  'window.TUNED_SCALE = ' + JSON.stringify({ scale: j.scale, root: j.root }) + ';',
  '',
].join('\n');
fs.writeFileSync(out, body);
console.log('wrote', out, j.presets.length, 'genres, dialled', date);
