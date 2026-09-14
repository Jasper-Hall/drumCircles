// Render a genre preset -- or any explicit rhythm -- to a WAV through the REAL
// engines, by driving the tuning desk in headless Chrome and tapping its master.
// The recording is a record, not an illustration: what the video plays is what
// the site plays.
//
//   node tools/render-preset.mjs --genre house --bars 2 --out out/house.wav
//   node tools/render-preset.mjs --genre house --tracks kick,snare,hat --out out/house-drums.wav
//   node tools/render-preset.mjs --bpm 120 --track hat --seq 16,7,0,50 --out out/e7-16.wav
//   node tools/render-preset.mjs --bpm 120 --track fm --seq 16,7,0,50 --notes 14 \
//        --synth '{"modulationIndex":0.1,"envelope.attack":0.001}' --out out/beep.wav
//   node tools/render-preset.mjs --all --bars 2 --out out/presets
//   node tools/render-preset.mjs --genre dancehall --bars 4 --automate fill.json --out out/hook.wav
//     (fill.json: [{"at": 4.8, "track": "snare", "params": {"pulses": 3, "distribution": 80}}, …])
//
// Needs the desk served locally (python3 -m http.server 4173 in the repo root).
// Everything is deterministic as long as probability is 100 on every track.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) =>
  a.startsWith('--') ? [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true] : []).filter(Boolean));
const URL = args.url || 'http://127.0.0.1:4173/tune.html';
const CHROME = args.chrome || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const bars = Number(args.bars || 2);
const lead = Number(args.lead || 1);     // bars of silent pre-roll so the first hit is clean
const tail = Number(args.tail || 0.5);   // seconds kept after the last bar (decays)

function wav(channels, sampleRate) {
  const n = channels[0].length, ch = channels.length;
  const buf = Buffer.alloc(44 + n * ch * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * ch * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(ch, 22);
  buf.writeUInt32LE(sampleRate, 24); buf.writeUInt32LE(sampleRate * ch * 2, 28); buf.writeUInt16LE(ch * 2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * ch * 2, 40);
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) {
    const v = Math.max(-1, Math.min(1, channels[c][i]));
    buf.writeInt16LE(Math.round(v * 32767), o); o += 2;
  }
  return buf;
}

async function renderOne(page, job) {
  const res = await page.evaluate(async (job) => {
    const T = window.__tune;
    const set = (id, v) => { const e = document.getElementById(id); if (!e) return; e.value = v; e.dispatchEvent(new Event('input')); e.dispatchEvent(new Event('change')); };

    if (job.genre) document.querySelector('[data-genre="' + job.genre + '"]').click();
    if (job.bpm) { Tone.getTransport().bpm.value = job.bpm; }
    if (job.swing != null) set('swingControl', job.swing);
    // explicit rhythm on one track, everything else silent
    if (job.seq) {
      for (const id of Object.keys(T.tracks)) if (id !== job.track) set('num-' + id + '-a-pulses', 0);
      const [n, k, rot, dist] = job.seq;
      set('num-' + job.track + '-a-steps', n); set('num-' + job.track + '-a-pulses', k);
      set('num-' + job.track + '-a-rotation', rot); set('num-' + job.track + '-a-distribution', dist);
    }
    if (job.tracks) for (const id of Object.keys(T.tracks)) if (!job.tracks.includes(id)) set('num-' + id + '-a-pulses', 0);
    // engine overrides on the explicit track (ids as the desk names its synth controls)
    if (job.synth) for (const [p, v] of Object.entries(job.synth)) set('syn-' + job.track + '-' + p.replace(/\./g, '_'), v);
    // a fixed note for a melodic track, so a beep stays one pitch (grid index: 7 per octave from the root)
    if (job.notes) T.tracks[job.track].notes = new Set(job.notes);
    for (const id of Object.keys(T.tracks)) set('rng-' + id + '-prob', 100);   // determinism

    // Tap the master: Tone's Destination output is a wrapped GainNode whose native
    // node we can reach; the kick already sits on a native gain of its own.
    const raw = Tone.getContext().rawContext._nativeAudioContext || Tone.getContext().rawContext;
    const masterNative = Tone.getDestination().output.output._nativeAudioNode;
    // An AudioWorklet tap: `currentTime` inside process() is the exact time of
    // the block, unlike ScriptProcessorNode's playbackTime, which Chrome reports
    // two buffers late.
    const src = `class Tap extends AudioWorkletProcessor {
      constructor() { super(); this.buf = []; this.t0 = null; this.n = 0; }
      process(inputs) {
        const inp = inputs[0]; if (!inp || !inp[0]) return true;
        if (this.t0 === null) this.t0 = currentTime;
        this.buf.push(Float32Array.from(inp[0]), Float32Array.from(inp[1] || inp[0]));
        this.n += inp[0].length;
        if (this.n >= 8192) { this.port.postMessage({ t: this.t0, l: this.buf.filter((_, i) => i % 2 === 0), r: this.buf.filter((_, i) => i % 2 === 1) }); this.buf = []; this.t0 = null; this.n = 0; }
        return true;
      }
    }
    registerProcessor('tap', Tap);`;
    await raw.audioWorklet.addModule(URL.createObjectURL(new Blob([src], { type: 'application/javascript' })));
    const tap = new AudioWorkletNode(raw, 'tap', { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 2, channelCountMode: 'explicit', channelInterpretation: 'speakers' });
    const chunks = [];
    tap.port.onmessage = (e) => {
      const cat = (arrs) => { const out = new Float32Array(arrs.reduce((n, a) => n + a.length, 0)); let o = 0; for (const a of arrs) { out.set(a, o); o += a.length; } return Array.from(out); };
      chunks.push({ t: e.data.t, l: cat(e.data.l), r: cat(e.data.r) });
    };
    masterNative.connect(tap);
    for (const t of Object.values(T.tracks)) if (t.kick && t.kick.outGain) t.kick.outGain.connect(tap);
    const sink = raw.createGain(); sink.gain.value = 0; tap.connect(sink); sink.connect(raw.destination);

    // Sanity: record every scheduled hit so the caller can see where the first
    // one lands relative to the trimmed start (should be 0 ms, or the swing offset).
    const hits = [];
    for (const t of Object.values(T.tracks)) {
      if (t.kick) { const o = t.kick.trigger.bind(t.kick); t.kick.trigger = (time, f) => { hits.push(time); return o(time, f); }; }
      else if (t.synth) { const o = t.synth.triggerAttackRelease.bind(t.synth); t.synth.triggerAttackRelease = (...a) => { const time = a[2]; if (typeof time === 'number') hits.push(time); return o(...a); }; }
    }

    const bpm = Tone.getTransport().bpm.value;
    const barSec = 60 / bpm * 4;
    const t0 = raw.currentTime + 0.5;
    const start = t0 + job.lead * barSec;       // first hit of bar 1
    const end = start + job.bars * barSec;
    T.tick = 0;
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
    // Knob moves during the take: each event sets a track's ring-A params at `at`
    // seconds after bar 1 begins, through the desk's own controls, so the take is
    // what a hand on the desk would have made. Tone fires the callback a lookahead
    // early; the change lands on the next sixteenth the clock schedules.
    for (const ev of job.automate || []) {
      Tone.getTransport().schedule(() => {
        for (const [k, v] of Object.entries(ev.params || {})) set('num-' + ev.track + '-a-' + k, v);
      }, job.lead * barSec + ev.at);
    }
    Tone.getTransport().start(t0);
    await new Promise(r => setTimeout(r, (end + job.tail - raw.currentTime) * 1000 + 500));
    Tone.getTransport().stop();
    masterNative.disconnect(tap);
    for (const t of Object.values(T.tracks)) if (t.kick && t.kick.outGain) { try { t.kick.outGain.disconnect(tap); } catch {} }
    tap.disconnect();

    // stitch and trim to [start, end + tail]
    const sr = raw.sampleRate;
    const L = [], R = [];
    for (const c of chunks) {
      const c0 = c.t, c1 = c.t + c.l.length / sr;
      if (c1 <= start || c0 >= end + job.tail) continue;
      const i0 = Math.max(0, Math.round((start - c0) * sr));
      const i1 = Math.min(c.l.length, Math.round((end + job.tail - c0) * sr));
      for (let i = i0; i < i1; i++) { L.push(c.l[i]); R.push(c.r[i]); }
    }
    // Tone lays the grid out in ticks; the nearest hit to `start` shows how far
    // our wall-clock arithmetic is from its grid (sub-ms in practice).
    const nearest = hits.reduce((b, h) => (Math.abs(h - start) < Math.abs(b - start) ? h : b), hits[0] ?? start);
    const inWindow = hits.filter(h => h >= nearest - 0.0005).sort((a, b) => a - b);
    return { sr, L, R, bpm, barSec, bars: job.bars, loopSamples: Math.round(job.bars * barSec * sr),
      firstHitMs: inWindow.length ? Number(((inWindow[0] - start) * 1000).toFixed(2)) : null, hitCount: inWindow.filter(h => h < end).length };
  }, job);
  return res;
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox', '--disable-features=AudioServiceOutOfProcess'] });
const page = await browser.newPage();
page.on('pageerror', e => console.error('page error:', e.message));
await page.goto(URL, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.__tune && Object.keys(window.__tune.tracks).length > 0);
await new Promise(r => setTimeout(r, 800));

const jobs = [];
if (args.all) {
  const ids = await page.evaluate(() => window.GENRE_PRESETS.map(g => g.id));
  for (const id of ids) jobs.push({ genre: id, out: path.join(args.out || 'out/presets', id + '.wav') });
} else {
  jobs.push({
    genre: args.genre, bpm: args.bpm ? Number(args.bpm) : null, swing: args.swing != null ? Number(args.swing) : null,
    track: args.track || 'hat', seq: args.seq ? args.seq.split(',').map(Number) : null,
    tracks: args.tracks ? args.tracks.split(',') : null,
    synth: args.synth ? JSON.parse(args.synth) : null,
    notes: args.notes ? String(args.notes).split(',').map(Number) : null,
    automate: args.automate ? JSON.parse(fs.existsSync(String(args.automate)) ? fs.readFileSync(String(args.automate), 'utf8') : String(args.automate)) : null,
    out: args.out || 'out/render.wav'
  });
}
const manifest = [];
for (const job of jobs) {
  const r = await renderOne(page, { ...job, bars, lead, tail });
  fs.mkdirSync(path.dirname(job.out), { recursive: true });
  let peak = 0; for (const v of r.L) if (Math.abs(v) > peak) peak = Math.abs(v);
  // --norm 0.5: scale the take so its peak lands at 0.5 (quiet engines such as a bare FM sine)
  if (args.norm && peak > 0) { const g = Number(args.norm) / peak; for (let i = 0; i < r.L.length; i++) { r.L[i] *= g; r.R[i] *= g; } peak = Number(args.norm); }
  fs.writeFileSync(job.out, wav([r.L, r.R], r.sr));
  const rec = { out: job.out, genre: job.genre || null, seq: job.seq || null, bpm: r.bpm, bars: r.bars, barSec: r.barSec, loopSamples: r.loopSamples, sampleRate: r.sr, peak: Number(peak.toFixed(3)), firstHitMs: r.firstHitMs, hits: r.hitCount };
  manifest.push(rec);
  console.log(JSON.stringify(rec));
}
if (args.all) fs.writeFileSync(path.join(args.out || 'out/presets', 'manifest.json'), JSON.stringify(manifest, null, 2));
await browser.close();
