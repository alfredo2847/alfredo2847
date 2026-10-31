/*!
 * motion.js — motor de animación determinista de Motion Director.
 *
 * Regla de oro: TODO lo que se ve en pantalla es función del tiempo `t`.
 * Nada de CSS animations, transitions, setTimeout ni Math.random():
 * el renderizador llama a M.seek(t) fotograma a fotograma y captura la página.
 *
 * API completa: reference/motion-api.md
 */
(function () {
  'use strict';

  const M = (window.M = {
    fps: 30, width: 1080, height: 1920, duration: 10,
    tracks: [], cues: [], audio: {}, t: 0, _ready: [],
  });

  /* ------------------------------------------------------------------ */
  /* Matemáticas                                                         */
  /* ------------------------------------------------------------------ */
  const clamp = (M.clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)));
  const lerp = (M.lerp = (a, b, p) =>
    Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], p)) : a + (b - a) * p);
  M.p = (t, a, b) => (b <= a ? (t >= a ? 1 : 0) : clamp((t - a) / (b - a)));

  const E = (M.ease = {
    linear: (x) => x,
    inQuad: (x) => x * x,
    outQuad: (x) => 1 - (1 - x) * (1 - x),
    inOutQuad: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
    inCubic: (x) => x * x * x,
    outCubic: (x) => 1 - Math.pow(1 - x, 3),
    inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outQuart: (x) => 1 - Math.pow(1 - x, 4),
    inOutQuart: (x) => (x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2),
    inExpo: (x) => (x === 0 ? 0 : Math.pow(2, 10 * x - 10)),
    outExpo: (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    inOutExpo: (x) =>
      x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2,
    outBack: (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
    inBack: (x, s = 1.70158) => (s + 1) * x * x * x - s * x * x,
    outElastic: (x) =>
      x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
  });
  const ez = (e) => (typeof e === 'function' ? e : E[e || 'outCubic'] || E.outCubic);

  /** Muelle físico. `dt` = segundos desde el inicio. Devuelve ~0→1 con rebote. */
  M.spring = (dt, { stiffness = 170, damping = 14, mass = 1 } = {}) => {
    if (dt <= 0) return 0;
    const w = Math.sqrt(stiffness / mass), z = damping / (2 * Math.sqrt(stiffness * mass));
    if (z >= 1) return 1 - Math.exp(-w * dt) * (1 + w * dt);
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt));
  };

  /** Interpola entre t0 y t1. */
  M.tw = (t, t0, t1, from, to, ease) => lerp(from, to, ez(ease)(M.p(t, t0, t1)));

  /** Fotogramas clave: [[t, valor, easeHaciaEsteKey?], ...] */
  M.keys = (t, ks) => {
    if (t <= ks[0][0]) return ks[0][1];
    for (let i = 1; i < ks.length; i++) {
      if (t <= ks[i][0]) {
        const [t0, v0] = ks[i - 1], [t1, v1, e] = ks[i];
        return lerp(v0, v1, ez(e || 'inOutCubic')(M.p(t, t0, t1)));
      }
    }
    return ks[ks.length - 1][1];
  };

  /** Aleatorio con semilla (determinista). */
  M.rand = (seed = 1) => {
    let a = seed >>> 0 || 1;
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let r = Math.imul(a ^ (a >>> 15), 1 | a);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  };
  M.hash = (n) => M.rand(Math.floor(n) * 2654435761 + 7)();
  /** Ruido suave 1D (para derivas orgánicas). */
  M.noise = (x, seed = 0) => {
    const i = Math.floor(x), f = x - i, s = f * f * (3 - 2 * f);
    return lerp(M.hash(i + seed * 9973) * 2 - 1, M.hash(i + 1 + seed * 9973) * 2 - 1, s);
  };

  /* ------------------------------------------------------------------ */
  /* DOM                                                                 */
  /* ------------------------------------------------------------------ */
  const $ = (M.$ = (s) => (typeof s === 'string' ? document.querySelector(s) : s));
  M.$$ = (s) => Array.from(document.querySelectorAll(s));

  /** Aplica transform/opacity/filter en una sola llamada. */
  M.tf = (el, o = {}) => {
    el = $(el);
    if (!el) return;
    const tr = [];
    if (o.x || o.y || o.z) tr.push(`translate3d(${o.x || 0}px,${o.y || 0}px,${o.z || 0}px)`);
    if (o.r) tr.push(`rotate(${o.r}deg)`);
    if (o.rx) tr.push(`rotateX(${o.rx}deg)`);
    if (o.ry) tr.push(`rotateY(${o.ry}deg)`);
    if (o.s != null || o.sx != null || o.sy != null) {
      const s = o.s == null ? 1 : o.s;
      tr.push(`scale(${o.sx == null ? s : o.sx},${o.sy == null ? s : o.sy})`);
    }
    el.style.transform = tr.join(' ');
    if (o.o != null) el.style.opacity = clamp(o.o);
    const f = [];
    if (o.blur) f.push(`blur(${o.blur}px)`);
    if (o.bright != null) f.push(`brightness(${o.bright})`);
    if (o.filter) f.push(o.filter);
    el.style.filter = f.join(' ');
  };

  /** Registra una función que se ejecuta en cada fotograma: fn(t). */
  M.add = (fn) => (M.tracks.push(fn), fn);

  /** Escena: el elemento solo existe entre a y b. fn(local, t, dur). */
  M.scene = (sel, a, b, fn) => {
    const el = $(sel);
    if (!el) throw new Error(`M.scene: no existe ${sel}`);
    M.add((t) => {
      const on = t >= a && t < b;
      el.style.display = on ? '' : 'none';
      if (on && fn) fn(t - a, t, b - a);
    });
    return el;
  };

  /* ------------------------------------------------------------------ */
  /* Configuración                                                       */
  /* ------------------------------------------------------------------ */
  M.setup = (o = {}) => {
    M.voice = window.VOICE || M.voice;
    Object.assign(M, {
      fps: o.fps || 30, width: o.width || 1080, height: o.height || 1920,
      duration: o.duration || (M.voice ? M.voice.duration + (o.tail ?? 1.2) : 10),
    });
    M.audio = {
      voice: o.voice === false ? null : (M.voice && M.voice.src) || o.voice || null,
      music: o.music || null, musicDb: o.musicDb ?? -17, bpm: o.bpm || 100,
      sfxDb: o.sfxDb ?? 0,
    };
    const stage = $('#stage');
    if (!stage) throw new Error('Falta <div id="stage"><div id="world">…</div></div>');
    Object.assign(stage.style, {
      width: M.width + 'px', height: M.height + 'px', position: 'relative', overflow: 'hidden',
      background: o.background || '#0b0b0f',
    });
    if (!$('#world')) throw new Error('Falta #world dentro de #stage');
    const fx = document.createElement('canvas');
    fx.id = 'fx'; fx.width = M.width; fx.height = M.height;
    Object.assign(fx.style, { position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50 });
    stage.appendChild(fx);
    M.fx = fx.getContext('2d');
    M.add(() => M.fx.clearRect(0, 0, M.width, M.height));
    return M;
  };

  /* ------------------------------------------------------------------ */
  /* Sonido: marcas de efectos (se mezclan después con mix.py)           */
  /* ------------------------------------------------------------------ */
  /** names: whoosh, swish, pop, click, tick, hit, boom, riser, glitch, ding, type, shimmer, bass */
  M.cue = (t, name, db = 0) => {
    if (t >= 0) M.cues.push({ t: +t.toFixed(3), name, db });
  };

  /* ------------------------------------------------------------------ */
  /* Voz                                                                 */
  /* ------------------------------------------------------------------ */
  M.voice = window.VOICE || null;
  const norm = (M.norm = (s) =>
    String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9ñ%€$]/g, ''));
  const words = () => (M.voice ? M.voice.words : []);

  /** Momento en que la voz dice `word` (n-ésima vez, o la primera después de `after`). */
  M.at = (word, n = 1, after = -1) => {
    const k = norm(word);
    let c = 0;
    for (const w of words()) {
      if (w.start > after && norm(w.w) === k && ++c === n) return w.start;
    }
    throw new Error(`M.at: la voz no dice "${word}" (vez ${n}) — revisa guion.txt / voice.js`);
  };
  M.atEnd = (word, n = 1, after = -1) => {
    const s = M.at(word, n, after);
    return words().find((w) => w.start === s).end;
  };
  M.line = (i) => {
    if (!M.voice) throw new Error('M.line: no hay voz (genera voice.js)');
    const l = M.voice.lines[i];
    if (!l) throw new Error(`M.line(${i}): solo hay ${M.voice.lines.length} frases`);
    return l;
  };
  M.lines = () => (M.voice ? M.voice.lines : []);
  M.wordsIn = (a, b) => words().filter((w) => w.start >= a && w.start < b);

  /* ------------------------------------------------------------------ */
  /* Texto cinético                                                      */
  /* ------------------------------------------------------------------ */
  /** Divide el texto en spans (una sola vez). mode: 'words' | 'chars' */
  M.split = (sel, mode = 'words') => {
    const el = $(sel);
    if (el.__parts && el.__mode === mode) return el.__parts;
    const parts = [];
    const walk = (node) => {
      for (const ch of Array.from(node.childNodes)) {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          const tokens = ch.textContent.split(/(\s+)/);
          for (const tok of tokens) {
            if (!tok) continue;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); continue; }
            const pieces = mode === 'chars' ? Array.from(tok) : [tok];
            const wrap = document.createElement('span');
            wrap.className = 'm-word';
            wrap.style.display = 'inline-block';
            wrap.style.whiteSpace = 'nowrap';
            for (const p of pieces) {
              const sp = document.createElement('span');
              sp.textContent = p;
              sp.style.display = 'inline-block';
              sp.className = mode === 'chars' ? 'm-char' : 'm-w';
              wrap.appendChild(sp);
              parts.push(sp);
            }
            frag.appendChild(wrap);
          }
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1 && !ch.classList.contains('m-word')) {
          walk(ch);
        }
      }
    };
    walk(el);
    el.__parts = parts; el.__mode = mode;
    return parts;
  };

  const STYLES = {
    rise: (q, e) => ({ y: (1 - E.outCubic(q)) * 70, o: E.outQuad(q), blur: (1 - q) * 10 }),
    pop: (q, e, dt) => { const s = M.spring(dt, { stiffness: 260, damping: 15 }); return { s: 0.3 + 0.7 * s, o: clamp(dt * 12) }; },
    slam: (q) => ({ s: lerp(2.6, 1, E.outExpo(q)), o: clamp(q * 4), blur: (1 - E.outExpo(q)) * 14 }),
    drop: (q, e, dt) => ({ y: (1 - M.spring(dt, { stiffness: 220, damping: 13 })) * -160, o: clamp(dt * 10) }),
    blur: (q) => ({ o: E.outQuad(q), blur: (1 - E.outCubic(q)) * 26, s: lerp(1.12, 1, E.outCubic(q)) }),
    mask: (q) => ({ y: (1 - E.outExpo(q)) * 110 + '%' }),
    type: (q) => ({ o: q > 0 ? 1 : 0 }),
    flip: (q) => ({ rx: (1 - E.outBack(q)) * 90, o: clamp(q * 3) }),
    fade: (q) => ({ o: E.inOutQuad(q) }),
  };
  const OUTS = {
    fade: (q) => ({ o: 1 - q }),
    up: (q) => ({ y: -E.inCubic(q) * 80, o: 1 - q, blur: q * 10 }),
    down: (q) => ({ y: E.inCubic(q) * 80, o: 1 - q }),
    shrink: (q) => ({ s: 1 - E.inBack(q) * 0.9, o: 1 - E.inQuad(q) }),
    blur: (q) => ({ o: 1 - q, blur: q * 24, s: 1 + q * 0.1 }),
    cut: (q) => ({ o: q > 0 ? 0 : 1 }),
  };

  /**
   * Revela un texto palabra a palabra (o letra a letra).
   * opts: at, stagger, dur, style, mode, out, outStyle, outDur,
   *       sync: true → cada palabra entra cuando la voz la dice (a partir de `at`)
   *       times: [t0, t1, ...] tiempos explícitos por pieza
   *       sfx: nombre de efecto por pieza (p.ej. 'pop' o 'type'), sfxDb
   */
  M.reveal = (sel, o = {}) => {
    const el = $(sel);
    const mode = o.mode || (o.style === 'type' ? 'chars' : 'words');
    const parts = M.split(el, mode);
    const style = STYLES[o.style || 'rise'];
    const dur = o.dur ?? (o.style === 'slam' ? 0.35 : 0.5);
    let times = o.times;
    if (!times && o.sync) {
      const vw = words().filter((w) => w.start >= (o.at ?? 0) - 0.05);
      let j = 0;
      times = parts.map((p) => {
        const k = norm(p.textContent);
        for (let i = j; i < Math.min(vw.length, j + 6); i++) {
          if (norm(vw[i].w) === k) { j = i + 1; return vw[i].start; }
        }
        return null; // palabra que no está en la voz
      });
      let last = o.at ?? 0;
      times = times.map((x) => (x == null ? (last += 0.06) : (last = x)));
    }
    if (!times) {
      const st = o.stagger ?? (mode === 'chars' ? (o.style === 'type' ? 0.035 : 0.025) : 0.08);
      times = parts.map((_, i) => (o.at ?? 0) + i * st);
    }
    if (o.style === 'mask') parts.forEach((p) => (p.parentNode.style.overflow = 'hidden', p.parentNode.style.verticalAlign = 'top'));
    if (o.sfx) {
      let prev = -1;
      times.forEach((t) => { if (t - prev > 0.07) { M.cue(t, o.sfx, o.sfxDb ?? -4); prev = t; } });
    }
    const out = OUTS[o.outStyle || 'up'], outDur = o.outDur ?? 0.3;
    M.add((t) => {
      parts.forEach((p, i) => {
        const t0 = times[i], dt = t - t0, q = M.p(t, t0, t0 + dur);
        let s = dt < 0 ? { o: 0 } : style(q, null, dt);
        if (o.out != null && t >= o.out) {
          const qo = M.p(t, o.out + (o.outStagger || 0) * i, o.out + (o.outStagger || 0) * i + outDur);
          const so = out(qo);
          s = { ...s, ...so, o: Math.min(s.o ?? 1, so.o ?? 1) };
        }
        if (typeof s.y === 'string') { p.style.transform = `translateY(${s.y})`; p.style.opacity = 1; return; }
        M.tf(p, s);
      });
    });
    return parts;
  };

  /** Contador numérico. */
  M.counter = (sel, { from = 0, to = 100, a = 0, b = 1, ease = 'outExpo', format } = {}) => {
    const el = $(sel);
    const f = format || ((v) => Math.round(v).toLocaleString('es-ES'));
    M.add((t) => (el.textContent = f(M.tw(t, a, b, from, to, ease))));
  };

  /** Subrayado/resaltado que barre de izquierda a derecha detrás del texto. */
  M.highlight = (sel, { at = 0, dur = 0.35, color = '#ff2d55', height = '100%', out } = {}) => {
    const el = $(sel);
    el.style.backgroundImage = `linear-gradient(${color},${color})`;
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundPosition = 'left bottom';
    el.style.webkitBoxDecorationBreak = el.style.boxDecorationBreak = 'clone';
    M.add((t) => {
      let w = E.outExpo(M.p(t, at, at + dur)) * 100;
      if (out != null) w *= 1 - E.inExpo(M.p(t, out, out + 0.25));
      el.style.backgroundSize = `${w}% ${height}`;
    });
  };

  /* ------------------------------------------------------------------ */
  /* Cámara                                                              */
  /* ------------------------------------------------------------------ */
  /**
   * Una cámara por elemento contenedor. keys: [[t, {s,x,y,r}, ease], ...]
   * shakes: [t | {t, amp, dur}], drift: amplitud de deriva orgánica (px).
   */
  M.camera = (sel, { keys, shakes = [], drift = 0, punch = [] } = {}) => {
    const el = $(sel);
    const sh = shakes.map((s) => (typeof s === 'number' ? { t: s } : s));
    const pu = punch.map((s) => (typeof s === 'number' ? { t: s } : s));
    M.add((t) => {
      const k = keys ? M.keys(t, keys.map(([tt, v, e]) => [tt, [v.s ?? 1, v.x ?? 0, v.y ?? 0, v.r ?? 0], e])) : [1, 0, 0, 0];
      let [s, x, y, r] = k;
      for (const q of sh) {
        const d = q.dur ?? 0.4, dt = t - q.t;
        if (dt >= 0 && dt < d) {
          const a = (q.amp ?? 22) * Math.pow(1 - dt / d, 2);
          x += M.noise(dt * 38, q.t * 7) * a; y += M.noise(dt * 41, q.t * 7 + 3) * a; r += M.noise(dt * 30, q.t + 5) * a * 0.04;
        }
      }
      for (const q of pu) {
        const d = q.dur ?? 0.35, dt = t - q.t;
        if (dt >= 0 && dt < d) s *= 1 + (q.amt ?? 0.06) * Math.sin(Math.PI * Math.min(1, dt / d)) * (1 - dt / d);
      }
      if (drift) { x += M.noise(t * 0.35, 11) * drift; y += M.noise(t * 0.3, 23) * drift; r += M.noise(t * 0.2, 31) * drift * 0.02; }
      el.style.transform = `translate3d(${x}px,${y}px,0) rotate(${r}deg) scale(${s})`;
    });
  };

  /* ------------------------------------------------------------------ */
  /* Transiciones (centradas en t: el corte de escena va en t)           */
  /* ------------------------------------------------------------------ */
  const TR = {
    pixels(t, c, o) {
      const cell = o.cell || 90, cols = Math.ceil(M.width / cell), rows = Math.ceil(M.height / cell);
      const d = o.dur / 2, pal = o.colors || ['#ff2d55', '#ffffff', '#111111', '#b3001b'];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const h = M.hash(i * 131 + j * 977 + o.seed);
        const tin = c - d + h * d * 0.8, tout = c + h * d * 0.8;
        if (t >= tin && t < tout + d * 0.2) {
          M.fx.fillStyle = pal[Math.floor(M.hash(i * 7 + j * 13 + Math.floor(t * 12)) * pal.length)];
          M.fx.fillRect(i * cell, j * cell, cell + 1, cell + 1);
        }
      }
    },
    wipe(t, c, o) {
      const q = M.p(t, c - o.dur / 2, c + o.dur / 2), W = M.width, H = M.height;
      const x0 = E.inOutExpo(clamp(q * 2)) , x1 = E.inOutExpo(clamp(q * 2 - 1));
      M.fx.fillStyle = o.color || '#ff2d55';
      if (o.dir === 'up') M.fx.fillRect(0, H * (1 - x0), W, H * (x0 - x1));
      else M.fx.fillRect(W * x1, 0, W * (x0 - x1), H);
    },
    flash(t, c, o) {
      const a = t < c ? 0 : 1 - E.outCubic(M.p(t, c, c + o.dur));
      if (a > 0) { M.fx.fillStyle = o.color || '#fff'; M.fx.globalAlpha = a * (o.amt ?? 0.9); M.fx.fillRect(0, 0, M.width, M.height); M.fx.globalAlpha = 1; }
    },
    iris(t, c, o) {
      const q = M.p(t, c - o.dur / 2, c + o.dur / 2), R = Math.hypot(M.width, M.height) / 2;
      const r = q < 0.5 ? E.inCubic(q * 2) * R : (1 - E.outCubic((q - 0.5) * 2)) * R;
      if (q > 0 && q < 1) { M.fx.fillStyle = o.color || '#000'; M.fx.beginPath(); M.fx.arc(o.x ?? M.width / 2, o.y ?? M.height / 2, r, 0, 7); M.fx.fill(); }
    },
    bars(t, c, o) {
      const n = o.n || 6, h = M.height / n;
      M.fx.fillStyle = o.color || '#111';
      for (let i = 0; i < n; i++) {
        const q = M.p(t, c - o.dur / 2 + i * 0.025, c + o.dur / 2 + i * 0.025);
        const a = E.inOutExpo(clamp(q * 2)), b = E.inOutExpo(clamp(q * 2 - 1));
        const dir = i % 2 ? 1 : -1, W = M.width;
        const x0 = dir > 0 ? W * b : W * (1 - a), w = W * (a - b);
        M.fx.fillRect(x0, i * h, w, h + 1);
      }
    },
  };
  const STAGE_TR = {
    glitch(t, c, o, world) {
      if (t < c - o.dur / 2 || t > c + o.dur / 2) return null;
      const f = Math.floor(t * M.fps), a = (o.amt ?? 1) * 26;
      const x = (M.hash(f * 3) * 2 - 1) * a, sk = (M.hash(f * 5) * 2 - 1) * 4 * (o.amt ?? 1);
      return { tr: `translateX(${x}px) skewX(${sk}deg)`, filter: `drop-shadow(${a * 0.4}px 0 0 rgba(255,0,70,.85)) drop-shadow(${-a * 0.4}px 0 0 rgba(0,240,255,.85)) contrast(1.3)` };
    },
    zoom(t, c, o) {
      const d = o.dur / 2;
      if (t < c - d || t > c + d) return null;
      const s = t < c ? lerp(1, 1.35, E.inExpo(M.p(t, c - d, c))) : lerp(0.82, 1, E.outExpo(M.p(t, c, c + d)));
      const bl = t < c ? E.inExpo(M.p(t, c - d, c)) * 18 : (1 - E.outExpo(M.p(t, c, c + d))) * 18;
      return { tr: `scale(${s})`, filter: `blur(${bl}px)` };
    },
    whip(t, c, o) {
      const d = o.dur / 2;
      if (t < c - d || t > c + d) return null;
      const dir = o.dir === 'right' ? -1 : 1;
      const x = t < c ? -E.inExpo(M.p(t, c - d, c)) * M.width * 0.5 * dir : (1 - E.outExpo(M.p(t, c, c + d))) * M.width * 0.5 * dir;
      return { tr: `translateX(${x}px)`, filter: `blur(${Math.abs(x) / 25}px)` };
    },
  };
  const TR_SFX = { pixels: ['glitch', -2], wipe: ['whoosh', -2], flash: ['hit', -3], iris: ['swish', -4], bars: ['whoosh', -3], glitch: ['glitch', -3], zoom: ['whoosh', 0], whip: ['swish', -1] };
  const stageTr = [];

  /** Transición centrada en t. type: pixels | wipe | flash | iris | bars | glitch | zoom | whip */
  M.transition = (t, type, o = {}) => {
    o = { dur: { flash: 0.35, glitch: 0.25, pixels: 0.55, zoom: 0.4, whip: 0.36 }[type] || 0.6, seed: M.cues.length * 17, ...o };
    if (o.sfx !== false) {
      const [n, db] = TR_SFX[type] || ['whoosh', -3];
      M.cue(type === 'flash' ? t : t - (type === 'zoom' || type === 'whip' ? 0.02 : 0), o.sfx || n, (o.sfxDb ?? db));
    }
    if (STAGE_TR[type]) stageTr.push([t, type, o]);
    else M.add((tt) => TR[type](tt, t, o));
  };
  // las transiciones de escenario se aplican a #world al final de cada fotograma
  const applyStageTr = (t) => {
    const w = $('#world');
    if (!w) return;
    let tr = '', fi = '';
    for (const [c, type, o] of stageTr) {
      const r = STAGE_TR[type](t, c, o, w);
      if (r) { tr += ' ' + r.tr; fi += ' ' + r.filter; }
    }
    w.style.transform = tr; w.style.filter = fi;
  };

  /* ------------------------------------------------------------------ */
  /* Subtítulos automáticos desde la voz                                 */
  /* ------------------------------------------------------------------ */
  /**
   * opts: y (px desde arriba), max (palabras por grupo), size, color, active,
   *       font, upper, bg (fondo tipo píldora, p.ej. 'rgba(0,0,0,.8)' — obligatorio sobre fondos claros),
   *       skip: [[a,b], ...] tramos donde NO mostrar (texto cinético ya lo dice)
   */
  M.captions = (o = {}) => {
    if (!M.voice) return;
    const box = document.createElement('div');
    box.id = 'captions';
    Object.assign(box.style, {
      position: 'absolute', left: '90px', right: '90px', top: (o.y ?? 1300) + 'px', zIndex: 40,
      textAlign: 'center', font: `${o.weight || 900} ${o.size || 78}px/${o.lh || 1.05} ${o.font || "'Inter', sans-serif"}`,
      color: o.color || '#fff', textTransform: o.upper === false ? 'none' : 'uppercase', letterSpacing: '-0.01em',
      textShadow: o.shadow || '0 6px 24px rgba(0,0,0,.55), 0 2px 0 rgba(0,0,0,.6)', pointerEvents: 'none',
    });
    $('#stage').appendChild(box);
    const max = o.max || 3, ws = words(), groups = [];
    let g = [];
    ws.forEach((w, i) => {
      g.push(w);
      const next = ws[i + 1];
      const brk = !next || g.length >= max || /[.,;:!?…]$/.test(w.w) || next.start - w.end > 0.3;
      if (brk) { groups.push(g); g = []; }
    });
    const skip = o.skip || [];
    const els = groups.map((gr, gi) => {
      const d = document.createElement('div');
      d.style.display = 'none';
      if (o.bg) Object.assign(d.style, { background: o.bg, padding: '.18em .35em .22em', borderRadius: '.28em', textShadow: 'none' });
      gr.forEach((w, k) => {
        const s = document.createElement('span');
        s.textContent = w.w.replace(/[.,;:]$/, '');
        s.style.display = 'inline-block';
        s.style.margin = '0 .12em';
        d.appendChild(s);
      });
      box.appendChild(d);
      const start = gr[0].start, next = groups[gi + 1];
      const end = Math.min(next ? next[0].start : gr[gr.length - 1].end + 0.5, gr[gr.length - 1].end + 0.6);
      return { d, gr, start, end };
    });
    M.add((t) => {
      const hidden = skip.some(([a, b]) => t >= a && t < b);
      for (const c of els) {
        const on = !hidden && t >= c.start && t < c.end;
        c.d.style.display = on ? (o.bg ? 'inline-block' : 'block') : 'none';
        if (!on) continue;
        const pop = M.spring(t - c.start, { stiffness: 320, damping: 18 });
        c.d.style.transform = `scale(${0.85 + 0.15 * pop})`;
        Array.from(c.d.children).forEach((s, k) => {
          const w = c.gr[k], active = t >= w.start && t < (c.gr[k + 1] ? c.gr[k + 1].start : c.end);
          s.style.color = active ? o.active || '#ffd60a' : '';
          s.style.opacity = t >= w.start - 0.02 ? 1 : o.ghost ?? 0.35;
          s.style.transform = active ? `scale(${1 + 0.08 * (1 - M.p(t, w.start, w.start + 0.15))})` : '';
        });
      }
    });
  };

  /* ------------------------------------------------------------------ */
  /* Textura                                                             */
  /* ------------------------------------------------------------------ */
  /** Grano de película animado, grueso (el fino se convierte en barro al recomprimir TikTok/IG). */
  M.grain = (amt = 0.045) => {
    const tiles = [];
    for (let k = 0; k < 6; k++) {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const x = c.getContext('2d'), im = x.createImageData(256, 256), r = M.rand(k + 99);
      for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
      x.putImageData(im, 0, 0);
      const big = document.createElement('canvas'); big.width = big.height = 512;
      const bx = big.getContext('2d'); bx.imageSmoothingEnabled = true; bx.drawImage(c, 0, 0, 512, 512); tiles.push(big);
    }
    M.add((t) => {
      const f = Math.floor(t * M.fps), pat = M.fx.createPattern(tiles[f % 6], 'repeat');
      M.fx.save(); M.fx.globalAlpha = amt; M.fx.globalCompositeOperation = 'overlay';
      M.fx.translate((f * 37) % 512, (f * 91) % 512); M.fx.fillStyle = pat; M.fx.fillRect(-512, -512, M.width + 1024, M.height + 1024);
      M.fx.restore();
    });
  };

  /** Partículas flotantes deterministas dibujadas en el canvas de efectos. */
  M.particles = ({ n = 40, color = '#ff2d55', size = [3, 9], speed = 40, a = 0, b = Infinity, seed = 3, glow = 18 } = {}) => {
    const r = M.rand(seed);
    const ps = Array.from({ length: n }, () => ({ x: r() * M.width, y: r() * M.height, s: lerp(size[0], size[1], r()), v: (0.4 + r()) * speed, ph: r() * 10 }));
    M.add((t) => {
      if (t < a || t >= b) return;
      const fade = Math.min(M.p(t, a, a + 0.5), 1 - M.p(t, b - 0.5, b));
      M.fx.save(); M.fx.fillStyle = color; M.fx.shadowColor = color; M.fx.shadowBlur = glow;
      for (const p of ps) {
        const y = (((p.y - t * p.v) % M.height) + M.height) % M.height, x = p.x + Math.sin(t * 0.8 + p.ph) * 20;
        M.fx.globalAlpha = fade * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2 + p.ph)));
        M.fx.fillRect(x, y, p.s, p.s);
      }
      M.fx.restore();
    });
  };

  /* ------------------------------------------------------------------ */
  /* Reproducción                                                        */
  /* ------------------------------------------------------------------ */
  M.seek = (t) => {
    M.t = t;
    for (const fn of M.tracks) fn(t);
    applyStageTr(t);
  };

  M.ready = new Promise((res) => {
    const go = async () => {
      await document.fonts.ready;
      await Promise.all(M.$$('img').map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
      M.seek(0);
      res(true);
      if (!window.__RENDER__) preview();
    };
    if (document.readyState === 'complete') setTimeout(go, 0);
    else window.addEventListener('load', go);
  });

  /* Reproductor de vista previa (solo al abrir scene.html en el navegador). */
  function preview() {
    const stage = $('#stage');
    document.body.style.cssText += ';margin:0;background:#111;display:flex;flex-direction:column;align-items:center;height:100vh;overflow:hidden';
    const holder = document.createElement('div');
    stage.parentNode.insertBefore(holder, stage); holder.appendChild(stage);
    const ui = document.createElement('div');
    ui.style.cssText = 'position:fixed;left:0;right:0;bottom:0;padding:10px 16px;background:#000c;color:#fff;font:13px system-ui;display:flex;gap:12px;align-items:center;z-index:9';
    ui.innerHTML = '<button id="mp">▶</button><input id="ms" type="range" min="0" step="0.001" style="flex:1"><span id="mt"></span>';
    document.body.appendChild(ui);
    const fit = () => {
      const k = Math.min((innerHeight - 60) / M.height, innerWidth / M.width);
      stage.style.transformOrigin = '0 0'; stage.style.transform = `scale(${k})`;
      holder.style.cssText = `width:${M.width * k}px;height:${M.height * k}px`;
    };
    fit(); addEventListener('resize', fit);
    const ms = $('#ms'), mt = $('#mt'), mp = $('#mp');
    ms.max = M.duration;
    const au = M.audio.voice ? new Audio(M.audio.voice) : null;
    let playing = false, t0 = 0, base = 0;
    const show = (t) => { M.seek(t); ms.value = t; mt.textContent = `${t.toFixed(2)}s / ${M.duration.toFixed(2)}s · f${Math.floor(t * M.fps)}`; };
    const loop = () => {
      if (!playing) return;
      let t = base + (performance.now() - t0) / 1000;
      if (t >= M.duration) { t = 0; base = 0; t0 = performance.now(); if (au) au.currentTime = 0; }
      show(t); requestAnimationFrame(loop);
    };
    const toggle = () => {
      playing = !playing; mp.textContent = playing ? '❚❚' : '▶';
      if (playing) { base = +ms.value; t0 = performance.now(); if (au) { au.currentTime = base; au.play().catch(() => {}); } loop(); }
      else if (au) au.pause();
    };
    mp.onclick = toggle;
    ms.oninput = () => { if (playing) toggle(); show(+ms.value); };
    addEventListener('keydown', (e) => {
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      if (e.code === 'ArrowRight') { if (playing) toggle(); show(Math.min(M.duration, +ms.value + 1 / M.fps)); }
      if (e.code === 'ArrowLeft') { if (playing) toggle(); show(Math.max(0, +ms.value - 1 / M.fps)); }
    });
    show(0);
  }
})();
