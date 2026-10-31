#!/usr/bin/env node
/**
 * render.js — renderiza scene.html fotograma a fotograma con Chromium (Playwright) + ffmpeg.
 *
 *   node render.js <proyecto>                 → <proyecto>/build/video.mp4 (1080x1920)
 *   node render.js <proyecto> --preview       → mitad de resolución, más rápido
 *   node render.js <proyecto> --still 1.2,4,7 → PNGs en <proyecto>/build/stills/ para revisar
 *   node render.js <proyecto> --from 3 --to 8 → solo un tramo
 *   node render.js <proyecto> --contact 12    → hoja de contactos (12 fotogramas en una imagen)
 *
 * Siempre escribe <proyecto>/build/cues.json (efectos de sonido + config de audio) para mix.py.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

let chromium;
try { ({ chromium } = require('playwright')); }
catch { console.error('Falta Playwright: npm i -g playwright && npx playwright install chromium'); process.exit(1); }

const args = process.argv.slice(2);
const proj = path.resolve(args[0] && !args[0].startsWith('--') ? args[0] : '.');
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const preview = !!opt('preview', false);
const scene = path.join(proj, opt('scene', 'scene.html'));
const build = path.join(proj, 'build');
fs.mkdirSync(build, { recursive: true });
if (!fs.existsSync(scene)) { console.error('No existe ' + scene); process.exit(1); }

(async () => {
  const launch = {};
  if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(launch);
  const page0 = await browser.newPage();
  await page0.addInitScript(() => { window.__RENDER__ = true; });
  let failed = false;
  page0.on('pageerror', (e) => { failed = true; console.error('✖ Error en la escena:', e.message); });
  page0.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('[escena]', m.text()); });
  await page0.goto('file://' + scene);
  const meta = await page0.evaluate(async () => {
    await M.ready;
    return { fps: M.fps, width: M.width, height: M.height, duration: M.duration, cues: M.cues, audio: M.audio };
  }).catch((e) => { console.error('✖', e.message); process.exit(1); });
  if (failed) process.exit(1);
  await page0.close();

  const k = preview ? 0.5 : 1;
  const page = await browser.newPage({ viewport: { width: meta.width, height: meta.height }, deviceScaleFactor: k });
  await page.addInitScript(() => { window.__RENDER__ = true; });
  page.on('pageerror', (e) => { console.error('✖ Error en la escena:', e.message); process.exit(1); });
  await page.goto('file://' + scene);
  await page.addStyleTag({ content: 'html,body{margin:0;padding:0;overflow:hidden;background:#000}' });
  await page.evaluate(() => M.ready);
  const stage = await page.$('#stage');
  const clip = { x: 0, y: 0, width: meta.width, height: meta.height };

  fs.writeFileSync(path.join(build, 'cues.json'), JSON.stringify(meta, null, 2));
  const shot = async (t, type = 'jpeg') => {
    await page.evaluate((t) => M.seek(t), t);
    return page.screenshot({ type, quality: type === 'jpeg' ? 92 : undefined, clip, caret: 'initial' });
  };

  // --- Fotogramas sueltos para revisión ---------------------------------
  const still = opt('still', null);
  if (still) {
    const dir = path.join(build, 'stills'); fs.mkdirSync(dir, { recursive: true });
    for (const s of String(still).split(',')) {
      const t = parseFloat(s), f = path.join(dir, `t${t.toFixed(2)}.png`);
      fs.writeFileSync(f, await shot(t, 'png'));
      console.log(f);
    }
    await browser.close(); return;
  }

  // --- Hoja de contactos -------------------------------------------------
  const contact = opt('contact', null);
  if (contact) {
    const n = parseInt(contact === true ? 12 : contact, 10), dir = path.join(build, 'contact');
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < n; i++) {
      const t = ((i + 0.5) / n) * meta.duration;
      fs.writeFileSync(path.join(dir, `${String(i).padStart(3, '0')}.jpg`), await shot(t));
    }
    const out = path.join(build, 'contact.jpg'), cols = Math.min(6, n);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(dir, '%03d.jpg'), '-vf',
      `scale=270:-1,drawtext=text='%{n}':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6,tile=${cols}x${Math.ceil(n / cols)}:padding=6`, '-frames:v', '1', out]);
    console.log(out + `  (fotograma i = t ${(meta.duration / n).toFixed(2)}·(i+0.5) s)`);
    await browser.close(); return;
  }

  // --- Vídeo -------------------------------------------------------------
  const from = parseFloat(opt('from', 0)), to = Math.min(parseFloat(opt('to', meta.duration)), meta.duration);
  const n0 = Math.round(from * meta.fps), n1 = Math.round(to * meta.fps);
  const out = path.resolve(opt('out', path.join(build, preview ? 'video-preview.mp4' : 'video.mp4')));
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(meta.fps), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', preview ? 'veryfast' : 'medium', '-crf', preview ? '24' : '19',
    '-maxrate', preview ? '4M' : '14M', '-bufsize', preview ? '8M' : '28M', '-r', String(meta.fps),
    '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const write = (buf) => new Promise((res) => (ff.stdin.write(buf) ? res() : ff.stdin.once('drain', res)));
  const t0 = Date.now();
  for (let f = n0; f < n1; f++) {
    await write(await shot(f / meta.fps));
    if ((f - n0) % meta.fps === 0 || f === n1 - 1) {
      const done = f - n0 + 1, tot = n1 - n0, el = (Date.now() - t0) / 1000;
      process.stdout.write(`\r  render ${done}/${tot} fotogramas · ${(done / el).toFixed(1)} fps · quedan ~${Math.round((tot - done) / (done / el))} s   `);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  console.log(`\n✔ ${out}  (${meta.duration.toFixed(2)} s, ${meta.cues.length} efectos de sonido)`);
})();
