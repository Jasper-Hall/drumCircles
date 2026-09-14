// Print public/presets.js as the JSON the desk exports (genres, examples, synth
// defaults, note seeds, scale) — what the film reads as presets.json.
// Usage: node tools/presets-json.js > ../../Rheome/rheome-video/apps/video/src/rhythm001/presets.json
const fs = require('fs');
const path = require('path');
const window = {};
new Function('window', fs.readFileSync(path.join(__dirname, '..', 'public', 'presets.js'), 'utf8'))(window);
process.stdout.write(JSON.stringify({
  presets: window.GENRE_PRESETS, examples: window.EXAMPLE_PRESETS || [],
  synthDefaults: window.SYNTH_DEFAULTS || {}, noteSeeds: window.NOTE_SEEDS || {},
  scale: (window.TUNED_SCALE || {}).scale, root: (window.TUNED_SCALE || {}).root,
}, null, 2) + '\n');
