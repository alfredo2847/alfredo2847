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
const acc = (s) =>
  esc(s)
    .replace(/(\d+–\d+ €(\/año)?)/g, '<span class="nw">$1</span>')
    .replace(/\*(.+?)\*/g, '<span class="a">$1</span>');
const img = (n) => `img/${n}.jpg`;

// Rejilla de fotos: 1 foto, 2 en fila ('row') o en columna ('col'), 3 ('three': una grande y dos pequeñas).
function media(imgs, caps = [], layout) {
  const lay = layout || (imgs.length === 1 ? 'one' : imgs.length === 2 ? 'row' : 'three');
  return `<div class="media m-${lay}">${imgs
    .map((n, i) => `<figure><img src="${img(n)}">${caps[i] ? `<figcaption><b>0${i + 1}</b>${esc(caps[i])}</figcaption>` : ''}</figure>`)
    .join('')}</div>`;
}

function slideHTML(s, i, n) {
  const k = s.kicker ? `<div class="kicker">${esc(s.kicker)}</div>` : '';
  const h = s.h ? `<h1>${acc(s.h)}</h1>` : '';
  const b = s.body ? `<p class="body">${acc(s.body)}</p>` : '';
  const sub = s.sub ? `<p class="body">${acc(s.sub)}</p>` : '';
  const note = s.note ? `<p class="note">${esc(s.note)}</p>` : '';
  const swipe = `<div class="swipe">Desliza <span>→</span></div>`;
  let inner = '';
  switch (s.t) {
    case 'cover':
      inner = `<div class="txt">${k}<h1 class="xl">${acc(s.h)}</h1>${sub}</div>${
        s.vs
          ? `<div class="media m-row vs"><figure><img src="${img(s.imgs[0])}"><figcaption class="tag bad">Con filtro</figcaption></figure><figure><img src="${img(s.imgs[1])}"><figcaption class="tag good">VitalPet</figcaption></figure></div>`
          : media(s.imgs, [], 'col')
      }${i === 0 ? swipe : ''}`;
      break;
    case 'full':
      inner = `<div class="bg"><img src="${img(s.img)}" style="object-position:${s.pos || 'center 75%'}"></div><div class="fade"></div><div class="txt">${k}<h1 class="${s.swipe ? 'xl' : ''}">${acc(s.h)}</h1>${b}</div>${s.swipe ? swipe : ''}`;
      break;
    case 'media':
      inner = `<div class="txt">${k}${h}${b}</div>${media(s.imgs, s.caps, s.layout)}${note}`;
      break;
    case 'bigmedia':
      inner = `<div class="txt">${k}<div class="bigrow"><div class="big">${esc(s.big)}</div><h1 class="under">${acc(s.h)}</h1></div>${b}</div>${media(s.imgs, [], s.imgs.length === 1 ? 'one' : 'row')}${note}`;
      break;
    case 'steps':
      inner = `<div class="txt">${k}${h}</div><div class="steps">${s.items
        .map(([t, d], j) => `<div class="st"><div class="num">0${j + 1}</div><div><div class="stt">${esc(t)}</div><div class="std">${esc(d)}</div></div></div>`)
        .join('')}</div>${media(s.imgs)}`;
      break;
    case 'versus':
      inner = `<div class="txt">${k}${h}</div><div class="versus">${[s.left, s.right]
        .map(([im, name, price], j) => `<div class="vcol ${j ? 'good' : 'bad'}"><figure><img src="${img(im)}"></figure><div class="vname">${esc(name)}</div><div class="vprice">${esc(price)}</div></div>`)
        .join('')}</div>`;
      break;
    case 'cta':
      inner = `<div class="txt">${h}</div>${media(s.imgs, [], 'three')}
        <div class="ctabar"><div class="url">vital-pet.site</div><div class="ship">Envío gratis · Link en la bio</div></div>`;
      break;
  }
  return `<section class="slide ${s.dark ? 'dark' : ''} t-${s.t}">
    <div class="brand"><b>VITALPET</b><span>${i + 1}/${n}</span></div>${inner}</section>`;
}

const CSS = (f) => {
  const tk = f.h > 1500;
  return `
@import url(fonts/local.css);
*{box-sizing:border-box;margin:0;padding:0}
body{background:#777}
:root{--bg:#F4F1EC;--ink:#161616;--mute:#8C8A84;--line:#DCD7CE;--card:#FFFFFF}
.slide{width:${f.w}px;height:${f.h}px;position:relative;overflow:hidden;background:var(--bg);color:var(--ink);
  font-family:Inter,sans-serif;display:flex;flex-direction:column;gap:40px;
  padding:${tk ? '230px 96px 440px' : '120px 80px 110px'};}
.slide.dark{--bg:#161616;--ink:#F4F1EC;--mute:#8E8B85;--line:#3A3936;--card:#222220}
.brand{position:absolute;z-index:3;left:80px;right:80px;${tk ? 'top:110px' : 'bottom:48px'};display:flex;justify-content:space-between;
  font:600 24px Inter;letter-spacing:.32em;color:var(--mute)}
.brand span{letter-spacing:.08em}
.txt{position:relative;z-index:2;display:flex;flex-direction:column;gap:26px;flex:none}
.kicker{font:600 26px Inter;letter-spacing:.24em;text-transform:uppercase;color:var(--mute)}
h1{font-family:'Barlow Condensed';font-weight:800;text-transform:uppercase;font-size:112px;line-height:.93;letter-spacing:-.5px;padding-bottom:4px}
h1.xl{font-size:150px}
h1 .a{color:var(--mute)}
.nw{white-space:nowrap}
.t-full h1:not(.xl){font-size:132px}
.body{font:400 38px/1.36 Inter;opacity:.85;max-width:900px}
.note{font:400 23px/1.35 Inter;color:var(--mute);margin-top:-18px;flex:none}
.swipe{position:absolute;z-index:3;right:80px;${tk ? 'bottom:440px' : 'bottom:110px'};font:600 30px Inter;letter-spacing:.06em;
  background:#161616;color:#F4F1EC;padding:20px 34px;border-radius:999px;box-shadow:0 8px 30px rgba(0,0,0,.18)}
.swipe span{margin-left:8px}

/* Fotos */
.media{flex:1;min-height:0;display:grid;gap:20px}
.media figure{position:relative;border-radius:30px;overflow:hidden;background:#ddd;min-height:0}
.media img{width:100%;height:100%;object-fit:cover;display:block}
.m-one{grid-template:1fr/1fr}
.m-row{grid-template:1fr/1fr 1fr}
.m-col{grid-template:1fr 1fr/1fr}
.m-three{grid-template:1fr 1fr/1.35fr 1fr}
.m-three figure:first-child{grid-row:1/3}
figcaption{position:absolute;left:18px;bottom:18px;right:18px;font:600 28px/1.2 Inter;background:rgba(244,241,236,.94);color:#161616;
  padding:14px 20px;border-radius:18px;display:flex;gap:14px;align-items:baseline}
figcaption b{color:#8C8A84;font-weight:600}
.tag{right:auto;font:700 26px Inter;letter-spacing:.12em;text-transform:uppercase}
.tag.good{background:#161616;color:#F4F1EC}
.vs figure:first-child img{filter:saturate(.6)}

/* Foto a sangre */
.bg{position:absolute;inset:0;z-index:0}
.bg img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 75%}
.fade{position:absolute;inset:0;z-index:1;background:linear-gradient(to bottom,rgba(244,241,236,.97) 0%,rgba(244,241,236,.88) ${tk ? '34%' : '26%'},rgba(244,241,236,0) ${tk ? '50%' : '44%'})}

/* Número grande */
.bigrow{display:flex;align-items:flex-end;gap:28px;flex-wrap:wrap}
.big{font-family:'Barlow Condensed';font-weight:800;font-size:250px;line-height:.82;letter-spacing:-4px;text-transform:uppercase}
h1.under{font-size:84px;color:var(--mute);padding-bottom:14px}

/* Pasos */
.steps{display:flex;flex-direction:column;gap:16px;flex:none}
.st{display:flex;gap:26px;align-items:center;border:2px solid var(--line);border-radius:24px;padding:20px 26px;background:var(--card)}
.num{flex:none;width:72px;height:72px;border-radius:50%;border:2px solid var(--mute);display:grid;place-items:center;font:500 26px Inter;color:var(--mute)}
.stt{font:700 36px Inter;margin-bottom:2px}
.std{font:400 28px/1.3 Inter;opacity:.75}

/* Comparación */
.versus{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:20px}
.vcol{display:flex;flex-direction:column;border-radius:30px;overflow:hidden;background:var(--card);border:2px solid var(--line);min-height:0}
.vcol figure{flex:1;min-height:0}
.vcol img{width:100%;height:100%;object-fit:cover;display:block}
.vcol.bad img{filter:saturate(.6)}
.vname{font:700 26px Inter;letter-spacing:.14em;text-transform:uppercase;color:var(--mute);padding:26px 28px 0}
.vprice{font-family:'Barlow Condensed';font-weight:800;font-size:76px;line-height:1;padding:8px 28px 30px;text-transform:uppercase}
.vcol.good{background:#161616;border-color:#161616;color:#F4F1EC}

/* Cierre */
.ctabar{flex:none;display:flex;justify-content:space-between;align-items:center;background:#161616;color:#F4F1EC;border-radius:999px;padding:26px 44px}
.url{font-family:'Barlow Condensed';font-weight:800;font-size:56px;letter-spacing:.5px}
.ship{font:600 26px Inter;letter-spacing:.06em;opacity:.8}
`;
};

// Reduce el título hasta que las fotos tengan un mínimo de altura.
const FIT_JS = (minMedia) => `
for (const s of document.querySelectorAll('.slide')) {
  const h = s.querySelector('h1'); if (!h) continue;
  const m = s.querySelector('.media, .versus');
  let size = parseFloat(getComputedStyle(h).fontSize);
  const over = () => s.scrollHeight > s.clientHeight + 4 || (m && m.clientHeight < ${minMedia});
  while (over() && size > 64) { size -= 4; h.style.fontSize = size + 'px'; }
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
    await page.goto('file://' + file, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(FIT_JS(f.h > 1500 ? 560 : 430));
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
