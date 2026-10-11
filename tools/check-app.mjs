// Headless check of the app: boots it at phone and desktop sizes, presses play,
// confirms the clock runs and audio comes out, and writes screenshots.
//   node tools/check-app.mjs [--url http://127.0.0.1:4173/] [--out out/check]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) =>
  a.startsWith('--') ? [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true] : []).filter(Boolean));
const URL_ = args.url || 'http://127.0.0.1:4173/';
const OUT = args.out || 'out/check';
const CHROME = args.chrome || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'] });
let failed = false;
for (const [name, vp] of Object.entries({
  phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 }
})) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('requestfailed', r => errors.push('requestfailed: ' + r.url()));
  await page.setViewport(vp);
  await page.goto(URL_ + (args.hash ? '#' + args.hash : ''), { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__app && window.__app.ready, { timeout: 20000 });
  await page.screenshot({ path: `${OUT}/${name}-landing.png` });
  // meters on the kick's native gain and on Tone's destination
  await page.evaluate(() => {
    const raw = window.__app.tracks.kick.kick.node.context;
    const an = raw.createAnalyser(); an.fftSize = 2048;
    window.__app.tracks.kick.kick.outGain.connect(an);
    const tAn = new Tone.Analyser('waveform', 2048);
    Tone.getDestination().connect(tAn);
    window.__meters = { kick: an, tone: tAn, peaks: { kick: 0, tone: 0 } };
    setInterval(() => {
      const buf = new Float32Array(2048); an.getFloatTimeDomainData(buf);
      const pk = buf.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
      const tw = tAn.getValue(); const tp = tw.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
      window.__meters.peaks.kick = Math.max(window.__meters.peaks.kick, pk);
      window.__meters.peaks.tone = Math.max(window.__meters.peaks.tone, tp);
    }, 20);
  });
  await page.click('#playButton');
  await sleep(2500);
  const r = await page.evaluate(() => ({
    genre: window.__app.genreId, tick: window.__app.tick, playing: window.__app.playing,
    peaks: window.__meters.peaks, nowLenses: document.querySelectorAll('.lens.now').length,
    scrollW: document.documentElement.scrollWidth, vw: window.innerWidth
  }));
  await page.screenshot({ path: `${OUT}/${name}-playing.png` });
  // the deck: scroll to the first card and capture it
  await page.evaluate(() => document.getElementById('tabs').scrollIntoView({ block: 'start' }));
  await sleep(300);
  await page.screenshot({ path: `${OUT}/${name}-deck.png` });
  console.log(name, JSON.stringify(r));
  if (r.scrollW > r.vw + 1) { console.log('  horizontal page overflow'); failed = true; }
  if (!(r.tick > 0 && r.peaks.kick > 0.01 && r.peaks.tone > 0.001)) { console.log('  no audio / clock'); failed = true; }
  if (errors.length) { console.log('  ' + errors.join('\n  ')); failed = true; }
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
