# motion.js — API

Estructura obligatoria de `scene.html`:
```html
<link rel="stylesheet" href="fonts/fonts.css">
<div id="stage"><div id="world"> …tus <section class="scene"> … </div></div>
<script src="voice.js"></script>   <!-- antes de motion.js -->
<script src="motion.js"></script>
<script> M.setup({...}); …montaje… </script>
```
`#stage` = lienzo 1080x1920. `#world` = contenido (las transiciones `glitch/zoom/whip` lo transforman: no lo toques).
Encima se crean `#fx` (canvas de transiciones, grano, partículas) y `#captions`.

**Un transform por elemento.** Cada función que mueve algo escribe `style.transform` entero. Si un elemento necesita
cámara + entrada, anida: `.scene > .cam (M.camera) > .elemento (M.tf / M.reveal)`.

## Configuración
```js
M.setup({
  duration,          // por defecto: voz + tail
  tail: 1.2,         // segundos tras la última palabra
  fps: 30, width: 1080, height: 1920, background: '#0e0d0c',
  music: 'bed:pulse' | 'bed:drive' | 'bed:dark' | 'archivo.mp3' | null,
  bpm: 100, musicDb: -17, sfxDb: 0,
});
```

## Tiempo y voz
| | |
|---|---|
| `M.line(i)` | `{ text, start, end, words }` de la línea i de `guion.txt` (sin contar comentarios/pausas) |
| `M.lines()` | todas las líneas |
| `M.at('palabra', n=1, after=-1)` | inicio de la n-ésima vez que la voz dice la palabra (ignora tildes, mayúsculas y puntuación). Lanza error si no existe |
| `M.atEnd('palabra', n)` | fin de esa palabra |
| `M.wordsIn(a, b)` | palabras que empiezan entre a y b |

## Matemáticas
`M.p(t, a, b)` progreso 0..1 · `M.tw(t, t0, t1, desde, hasta, ease)` · `M.keys(t, [[t, valor, ease], …])` (valores número o array) ·
`M.spring(dt, { stiffness: 170, damping: 14 })` · `M.lerp`, `M.clamp` · `M.rand(seed)()` · `M.hash(n)` · `M.noise(x, seed)` (−1..1 suave).
Eases: `linear inQuad outQuad inOutQuad inCubic outCubic inOutCubic outQuart inOutQuart inExpo outExpo inOutExpo inBack outBack outElastic`.

## Escenas y elementos
```js
M.scene('#s3', t0, t1, (local, t, dur) => { … });   // visible solo en [t0, t1)
M.add((t) => { … });                                   // pista libre, se ejecuta cada fotograma
M.tf(el, { x, y, z, s, sx, sy, r, rx, ry, o, blur, bright, filter });
```

## Texto
```js
M.reveal('#titulo', {
  style: 'rise' | 'pop' | 'slam' | 'drop' | 'blur' | 'mask' | 'type' | 'flip' | 'fade',
  at: 2.1,              // inicio
  sync: true,           // cada palabra entra cuando la voz la dice (a partir de `at`)
  times: [t0, t1],      // o tiempos explícitos por palabra
  stagger: 0.08, dur: 0.5, mode: 'words' | 'chars',
  out: 5.0, outStyle: 'up' | 'down' | 'fade' | 'shrink' | 'blur' | 'cut', outDur: 0.3, outStagger: 0,
  sfx: 'pop', sfxDb: -4, // sonido por palabra (filtrado a ≥ 70 ms)
});
M.highlight('#palabra', { at, dur: 0.35, color, height: '100%' | '18%', out });  // barrido detrás del texto
M.counter('#n', { from: 0, to: 90, a, b, ease: 'outExpo', format: (v) => … });
```
Para un número con varios saltos usa `M.add` + `M.keys` (ver demo, escena S2).

## Cámara
```js
M.camera('#c4', {
  keys: [[t0, { s: 1, x: 0, y: 0, r: 0 }], [t1, { s: 1.08, y: -20 }, 'linear']],
  shakes: [t | { t, amp: 22, dur: 0.4 }],
  punch:  [t | { t, amt: 0.06, dur: 0.35 }],
  drift: 6,   // deriva orgánica en px
});
```

## Transiciones (centradas en t: corta la escena en ese mismo t)
```js
M.transition(t, 'pixels' | 'wipe' | 'flash' | 'iris' | 'bars' | 'glitch' | 'zoom' | 'whip', {
  dur, color, colors: [...], cell: 90, dir: 'up' | 'right', amt, x, y, n,
  sfx: false | 'nombre', sfxDb: -3,
});
```

## Sonido
`M.cue(t, 'whoosh' | 'swish' | 'pop' | 'click' | 'tick' | 'type' | 'hit' | 'boom' | 'bass' | 'riser' | 'glitch' | 'ding' | 'shimmer', db = 0)`
(`riser` termina en t; `whoosh/swish` tienen el pico en t; el resto empieza en t).

## Capas globales
```js
M.captions({ y: 1300, max: 3, size: 78, color: '#fff', active: '#ffd60a', bg: 'rgba(0,0,0,.85)',
             font, weight: 900, upper: true, ghost: 0.35, skip: [[a, b], …] });
M.particles({ n: 40, color, size: [3, 9], speed: 40, a, b, seed, glow: 18 });
M.grain(0.04);   // grueso y sutil; el fino se destroza al recomprimir
```

## Vista previa en vivo
Abre `scene.html` en Chrome: reproductor con barra, espacio = play/pausa, ←/→ = fotograma a fotograma, con la voz.
(Si el navegador bloquea `file://` para audio, `npx serve <proyecto>`.)

## Errores típicos
- `M.at: la voz no dice "x"` → la palabra no está o está escrita distinto en `guion.txt`; usa la forma que aparece en `voice.js`.
- Algo parpadea o no se mueve en el render pero sí en el navegador → estás usando CSS animations/transitions o tiempo real.
- Un elemento "salta" → dos funciones escriben su `transform`; anida un wrapper.
