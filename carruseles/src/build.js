// Genera los carruseles en PNG para Instagram (1080x1350) y TikTok (1080x1920).
// Uso: node build.js   (requiere playwright con Chromium)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const carruseles = require('./contenido');

const OUT = path.join(__dirname, '..');
const FORMATOS = {
  instagram: { w: 1080, h: 1350 },
  tiktok: { w: 1080, h: 1920 },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const acc = (s) => esc(s).replace(/\*(.+?)\*/g, '<span class="a">$1</span>');

const ICON = {
  drop: '<path d="M12 3c3.5 4.2 6 7.6 6 10.6A6 6 0 0 1 6 13.6C6 10.6 8.5 7.2 12 3z"/>',
  filter: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/>',
  cycle: '<path d="M19 12a7 7 0 1 1-2.05-4.95"/><path d="M19 4v4h-4"/>',
  paw: '<circle cx="7" cy="9" r="1.8"/><circle cx="11" cy="6" r="1.8"/><circle cx="15.5" cy="7" r="1.8"/><circle cx="18" cy="11" r="1.8"/><path d="M8.5 17.5c0-2.6 2-5 4.3-5s3.7 1.9 3.7 4c0 2-1.6 3-3.2 2.4-1.2-.4-1.8-.4-2.8 0-1.2.5-2 .1-2-1.4z"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  battery: '<rect x="3" y="7.5" width="16" height="9" rx="2"/><path d="M21 10.5v3"/><path d="M6.5 10.5v3M9.5 10.5v3M12.5 10.5v3"/>',
  bowl: '<path d="M3.5 11h17a8.5 7 0 0 1-17 0z"/><path d="M8 7.5c.6-.8.6-1.7 0-2.5M12 7.5c.6-.8.6-1.7 0-2.5M16 7.5c.6-.8.6-1.7 0-2.5"/>',
  mute: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M16 9.5l4.5 5M20.5 9.5l-4.5 5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
};
const icon = (n, cls = '') =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;

const DIAGRAM = `
<svg class="diagram" viewBox="0 0 800 520" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <defs><marker id="ar" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1l7 4-7 4" stroke="#161616" stroke-width="1.6" fill="none"/></marker></defs>
  <rect x="40" y="40" width="250" height="300" rx="26" fill="#E7EEF0" stroke="#161616" stroke-width="3"/>
  <rect x="58" y="150" width="214" height="172" rx="14" fill="#A9C4CD"/>
  <text x="165" y="100" text-anchor="middle" class="dl">AGUA LIMPIA</text>
  <rect x="510" y="40" width="250" height="300" rx="26" fill="#EEEBE5" stroke="#161616" stroke-width="3"/>
  <rect x="528" y="220" width="214" height="102" rx="14" fill="#C9C3B8"/>
  <text x="635" y="100" text-anchor="middle" class="dl">AGUA USADA</text>
  <path d="M290 410h220l-22 70H312z" fill="#FFFFFF" stroke="#161616" stroke-width="3"/>
  <path d="M300 418h200" stroke="#A9C4CD" stroke-width="12"/>
  <text x="400" y="512" text-anchor="middle" class="dl sm">CUENCO</text>
  <path d="M200 350 C 210 400, 250 420, 290 425" stroke="#161616" stroke-width="3" marker-end="url(#ar)"/>
  <text x="150" y="420" text-anchor="middle" class="dl sm">RENUEVA</text>
  <path d="M510 425 C 560 420, 600 400, 610 350" stroke="#161616" stroke-width="3" marker-end="url(#ar)"/>
  <text x="660" y="420" text-anchor="middle" class="dl sm">RETIRA</text>
</svg>`;

function slideHTML(s, i, n) {
  const k = s.kicker ? `<div class="kicker">${esc(s.kicker)}</div>` : '';
  const h = s.h ? `<h1>${acc(s.h)}</h1>` : '';
  const b = s.body ? `<p class="body">${acc(s.body)}</p>` : '';
  const note = s.note ? `<p class="note">${esc(s.note)}</p>` : '';
  let inner = '';
  switch (s.t) {
    case 'hook':
      inner = `<div class="fit center">${k}<h1 class="xl">${acc(s.h)}</h1></div><div class="swipe">Desliza <span>→</span></div>`;
      break;
    case 'text':
      inner = `<div class="fit center">${k}${h}${b}</div>`;
      break;
    case 'big':
      inner = `<div class="fit center">${k}<div class="big">${esc(s.big)}</div><h1 class="under">${acc(s.h)}</h1>${b}</div>`;
      break;
    case 'flow':
      inner = `<div class="fit center">${k}${h}<div class="flow">${s.items
        .map(([ic, l], j) => `<div class="fi"><div class="circle">${icon(ic)}</div><div class="fl">${esc(l)}</div></div>${j < s.items.length - 1 ? '<div class="farr">→</div>' : ''}`)
        .join('')}</div>${b}</div>`;
      break;
    case 'steps':
      inner = `<div class="fit center">${k}${h}<div class="steps">${s.items
        .map(([t, d], j) => `<div class="st"><div class="num">0${j + 1}</div><div><div class="stt">${esc(t)}</div><div class="std">${esc(d)}</div></div></div>`)
        .join('')}</div></div>`;
      break;
    case 'step':
      inner = `<div class="fit center"><div class="stepn">${esc(s.n)}</div>${h}${b}</div>`;
      break;
    case 'list':
      inner = `<div class="fit center">${k}${h}<ul class="list ${s.mark}">${s.items
        .map((t) => `<li>${icon(s.mark)}<span>${esc(t)}</span></li>`)
        .join('')}</ul></div>`;
      break;
    case 'compare':
      inner = `<div class="fit center">${k}${h}<div class="cmp"><div class="ch l">${esc(s.left)}</div><div class="ch r">${esc(s.right)}</div>${s.rows
        .map(([a, c]) => `<div class="cc l">${icon('x')}<span>${esc(a)}</span></div><div class="cc r">${icon('check')}<span>${esc(c)}</span></div>`)
        .join('')}</div>${note}</div>`;
      break;
    case 'specs':
      inner = `<div class="fit center">${k}${h}<div class="specs">${s.items
        .map(([ic, v, l]) => `<div class="sp">${icon(ic)}<div class="spv">${esc(v)}</div><div class="spl">${esc(l)}</div></div>`)
        .join('')}</div>${note}</div>`;
      break;
    case 'diagram':
      inner = `<div class="fit center">${k}${h}${DIAGRAM}${b}</div>`;
      break;
    case 'photo':
      inner = `<div class="fit top">${k}${h}${b}</div><div class="ph"><img src="img/${s.img}"></div>`;
      break;
    case 'cta':
      inner = `<div class="fit top">${h}${s.sub ? `<p class="body">${esc(s.sub)}</p>` : ''}</div><div class="ph"><img src="img/${s.img}"></div>
        <div class="ctabar"><div class="url">vital-pet.site</div><div class="ship">Envío gratis · Link en la bio</div></div>`;
      break;
  }
  return `<section class="slide ${s.dark ? 'dark' : ''} t-${s.t}">
    <div class="brand"><b>VITALPET</b><span>${i + 1}/${n}</span></div>${inner}</section>`;
}

const CSS = (f) => `
@import url(fonts/local.css);
*{box-sizing:border-box;margin:0;padding:0}
body{background:#777}
:root{--bg:#F4F1EC;--ink:#161616;--mute:#8C8A84;--line:#DCD7CE;--card:#FFFFFF}
.slide{width:${f.w}px;height:${f.h}px;position:relative;overflow:hidden;background:var(--bg);color:var(--ink);
  font-family:Inter,sans-serif;display:flex;flex-direction:column;
  padding:${f.h > 1500 ? '250px 150px 470px 96px' : '150px 96px 120px'};}
.slide.dark{--bg:#161616;--ink:#F4F1EC;--mute:#8E8B85;--line:#3A3936;--card:#222220}
.brand{position:absolute;left:96px;right:96px;${f.h > 1500 ? 'top:110px' : 'bottom:56px'};display:flex;justify-content:space-between;
  font:600 24px Inter;letter-spacing:.32em;color:var(--mute)}
.brand span{letter-spacing:.08em}
.fit{display:flex;flex-direction:column;gap:34px;min-height:0}
.fit.center{flex:1;justify-content:center}
.kicker{font:600 26px Inter;letter-spacing:.24em;text-transform:uppercase;color:var(--mute)}
h1{font-family:'Barlow Condensed';font-weight:800;text-transform:uppercase;font-size:118px;line-height:.93;letter-spacing:-.5px}
h1.xl{font-size:150px}
h1 .a,.body .a{color:var(--mute)}
.body{font:400 40px/1.38 Inter;color:var(--ink);opacity:.82;max-width:880px}
.note{font:400 24px/1.4 Inter;color:var(--mute)}
.swipe{position:absolute;right:96px;${f.h > 1500 ? 'bottom:470px;right:150px' : 'bottom:120px'};font:600 30px Inter;letter-spacing:.06em;
  background:var(--ink);color:var(--bg);padding:20px 34px;border-radius:999px}
.swipe span{margin-left:8px}
.t-hook .fit.center{justify-content:center;padding-bottom:90px}
.big{font-family:'Barlow Condensed';font-weight:800;font-size:300px;line-height:.85;letter-spacing:-4px}
h1.under{font-size:96px;color:var(--mute);margin-top:-10px}
.flow{display:flex;align-items:flex-start;justify-content:space-between;margin:20px 0}
.fi{display:flex;flex-direction:column;align-items:center;gap:18px;width:170px}
.circle{width:150px;height:150px;border-radius:50%;background:var(--card);border:2px solid var(--line);display:grid;place-items:center}
.circle .ic{width:66px;height:66px}
.fl{font:600 26px/1.2 Inter;text-align:center;color:var(--mute)}
.farr{font:400 44px Inter;color:var(--mute);margin-top:48px}
.steps{display:flex;flex-direction:column;gap:30px;margin-top:10px}
.st{display:flex;gap:34px;align-items:center;border:2px solid var(--line);border-radius:28px;padding:30px 34px}
.num{flex:none;width:96px;height:96px;border-radius:50%;border:2px solid var(--mute);display:grid;place-items:center;font:500 30px Inter;color:var(--mute)}
.stt{font:700 44px Inter;margin-bottom:6px}
.std{font:400 32px/1.35 Inter;opacity:.75}
.stepn{font-family:'Barlow Condensed';font-weight:800;font-size:340px;line-height:.8;color:var(--mute);letter-spacing:-6px}
.t-step h1{font-size:170px}
.list{list-style:none;display:flex;flex-direction:column;gap:24px;margin-top:6px}
.list li{display:flex;align-items:center;gap:26px;font:500 42px/1.25 Inter;border-bottom:2px solid var(--line);padding-bottom:24px}
.list .ic{flex:none;width:58px;height:58px;padding:10px;border-radius:50%;background:var(--ink);color:var(--bg);stroke-width:2.4}
.list.x .ic{background:transparent;color:var(--mute);border:2px solid var(--mute)}
.cmp{display:grid;grid-template-columns:1fr 1fr;border:2px solid var(--line);border-radius:28px;overflow:hidden;margin-top:6px}
.ch{font:700 30px Inter;letter-spacing:.14em;text-transform:uppercase;padding:28px 30px}
.ch.l{color:var(--mute)}
.ch.r{background:#161616;color:#F4F1EC}
.cc{display:flex;gap:16px;align-items:flex-start;font:500 32px/1.3 Inter;padding:26px 30px;border-top:2px solid var(--line)}
.cc.l{color:var(--mute)}
.cc.r{background:#161616;color:#F4F1EC;border-top-color:#333}
.cc .ic{flex:none;width:38px;height:38px;margin-top:2px;stroke-width:2.4}
.specs{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:6px}
.sp{background:var(--card);border:2px solid var(--line);border-radius:26px;padding:30px 30px 28px}
.sp .ic{width:52px;height:52px;color:var(--mute);margin-bottom:14px}
.spv{font-family:'Barlow Condensed';font-weight:800;font-size:72px;line-height:1;text-transform:uppercase}
.spl{font:500 28px Inter;color:var(--mute);margin-top:6px}
.diagram{width:100%;height:auto;margin:10px 0}
.diagram .dl{font:700 25px Inter;letter-spacing:.08em;fill:#161616;stroke:none}
.diagram .sm{font-size:24px}
.fit.top{flex:none;gap:26px;margin-bottom:44px}
.t-photo h1,.t-cta h1{font-size:104px}
.ph{flex:1;min-height:0;border-radius:32px;overflow:hidden;background:#ddd}
.ph img{width:100%;height:100%;object-fit:cover;display:block}
.t-cta .ph img{object-position:center 60%}
.ctabar{display:flex;justify-content:space-between;align-items:center;margin-top:34px;background:#161616;color:#F4F1EC;border-radius:999px;padding:28px 44px}
.dark .ctabar{background:#F4F1EC;color:#161616}
.url{font-family:'Barlow Condensed';font-weight:800;font-size:56px;letter-spacing:.5px}
.ship{font:600 26px Inter;letter-spacing:.06em;opacity:.8}
`;

// Reduce el título hasta que todo quepa en la diapositiva.
const FIT_JS = `
for (const s of document.querySelectorAll('.slide')) {
  const h = s.querySelector('h1'); if (!h) continue;
  let size = parseFloat(getComputedStyle(h).fontSize);
  const ph = s.querySelector('.ph');
  const over = () => s.scrollHeight > s.clientHeight + 1 || [...s.querySelectorAll('.fit.center')].some(f => f.scrollHeight > f.clientHeight + 1)
    || (ph && ph.clientHeight < ${'${MINPH}'} && size > 92);
  while (over() && size > 56) { size -= 4; h.style.fontSize = size + 'px'; }
}`;

(async () => {
  const browser = await chromium.launch();
  for (const [fmt, f] of Object.entries(FORMATOS)) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS(f)}</style></head><body>${carruseles
      .map((c) => c.slides.map((s, i) => slideHTML(s, i, c.slides.length)).join(''))
      .join('')}</body></html>`;
    const file = path.join(__dirname, `_${fmt}.html`);
    fs.writeFileSync(file, html);
    const page = await browser.newPage({ viewport: { width: f.w, height: f.h } });
    await page.goto('file://' + file);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(FIT_JS.replace('${MINPH}', f.h > 1500 ? '600' : '440'));
    const slides = await page.$$('.slide');
    let k = 0;
    for (const c of carruseles) {
      const dir = path.join(OUT, fmt, c.id);
      fs.mkdirSync(dir, { recursive: true });
      for (let i = 0; i < c.slides.length; i++) {
        await slides[k++].screenshot({ path: path.join(dir, `${String(i + 1).padStart(2, '0')}.png`) });
      }
    }
    await page.close();
    if (!process.env.KEEP) fs.unlinkSync(file);
  }
  await browser.close();
  console.log('Listo');
})();
