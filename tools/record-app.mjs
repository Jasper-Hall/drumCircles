// A screen recording of the live app for the RHYTHM 001 outro: one track's
// ring and knobs, close up, the mouse actually dragging the knobs. Needs the
// repo served on :4173 and ffmpeg on PATH.
//   node tools/record-app.mjs --track membrane --out out/app-outro.webm
import puppeteer from 'puppeteer-core';
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) =>
  a.startsWith('--') ? [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true] : []).filter(Boolean));
const trackId = args.track || 'membrane';
const CHROME = args.chrome || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DPR = 2;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox', '--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: DPR });
page.on('pageerror', e => console.error('page error:', e.message));
await page.goto(args.url || 'http://127.0.0.1:4173/index.html', { waitUntil: 'networkidle0' });
await page.waitForSelector('.track');
await sleep(500);

// the chosen track's card, in CSS px; the recording is a 9:16 crop around its ring and outer knobs
const card = await page.evaluate((id) => {
  const c = [...document.querySelectorAll('.track')].find(t => t.querySelector('h3')?.textContent.trim() === id);
  const r = c.getBoundingClientRect();
  document.getElementById('playButton').click();
  document.body.style.userSelect = 'none';
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}, trackId);
const cropW = Math.round(card.w + 90), cropH = Math.round(cropW * 16 / 9);
const crop = { x: Math.round(card.x - 45), y: Math.round(card.y - 4), width: cropW, height: cropH };
await sleep(300);

// a knob's surface centre in viewport pixels (zoom applied)
const knobAt = async (label) => page.evaluate((id, label) => {
  const card = [...document.querySelectorAll('.track')].find(t => t.querySelector('h3')?.textContent.trim() === id);
  const k = [...card.querySelectorAll('.knob-container')].find(c => c.querySelector('.knob-label').textContent.trim().toLowerCase() === label);
  const r = k.querySelector('.knob-surface').getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}, trackId, label);

// drag a knob: down, move `dy` px upward over `ms`, up — the app's own drag handler does the rest
const turn = async (label, dy, ms) => {
  const p = await knobAt(label);
  await page.mouse.move(p.x, p.y); await page.mouse.down();
  const steps = Math.max(8, Math.round(ms / 33));
  for (let i = 1; i <= steps; i++) { await page.mouse.move(p.x, p.y - dy * i / steps); await sleep(ms / steps); }
  await page.mouse.up();
};

const rec = await page.screencast({ path: args.out || 'out/app-outro.webm', crop, scale: 1080 / cropW });
console.log('crop', crop);
await sleep(800);
// the app's knobs move one step per 2 px of drag (distribution: per detent)
await turn('pulses', 10, 1600);     // 0 → 5
await sleep(1600);
await turn('rotation', 6, 1000);    // 0 → 3
await sleep(1400);
await turn('pulses', 4, 800);       // 5 → 7
await sleep(1600);
await turn('distribution', -36, 1400);
await sleep(2000);
await rec.stop();
await browser.close();
console.log('wrote', args.out || 'out/app-outro.webm');
