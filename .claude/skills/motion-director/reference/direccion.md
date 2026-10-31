# Dirección — el criterio

Lo que separa un vídeo "hecho con IA" de uno dirigido. Léelo antes del storyboard.

## Ritmo
- **Gancho en < 1,5 s.** La primera imagen ya está en movimiento en el fotograma 0 (nada de fundido desde negro).
- Un plano cada **1,5–3 s**. Más de 3,5 s en el mismo encuadre necesita un cambio interno (zoom, nuevo elemento, cambio de color).
- **Corta 1–2 fotogramas antes** de que empiece la frase (`M.line(i).start - 0.05`). Cortar tarde se siente torpe.
- Los golpes visuales caen **exactamente** en la sílaba tónica de la palabra clave (`M.at('palabra')`).
- Interrupción de patrón cada 3–5 s: alterna fondo oscuro ↔ claro, foto ↔ tipografía, plano lleno ↔ vacío.
- Deja respirar: tras un golpe fuerte, el siguiente plano es más tranquilo. Energía en ondas, no plana.

## Tipografía
- Titulares: condensada y pesada (`Barlow Condensed 800`, mayúsculas, interlineado 0,86). Cuerpo/UI: `Inter`.
  Etiquetas técnicas: `JetBrains Mono` en mayúsculas con tracking (kicker).
- Tamaños en 1080x1920: titular 140–320 px · secundario 90–140 px · kicker 40–50 px · **nunca < 40 px**.
- **Máximo ~5 palabras grandes** a la vez. Si la frase es larga, solo la parte clave va grande.
- Una palabra clave por plano lleva el **color de acento**, o un `M.highlight`. Solo una.
- Jerarquía por tamaño y color, no por cantidad de efectos.

## Composición (9:16)
- **Zonas seguras**: arriba 220 px (estado/usuario), abajo 420 px (descripción, botones), derecha 140 px (iconos).
  Lo importante vive en el rectángulo central 80→940 x 220→1500.
- Subtítulos: y ≈ 1250–1350, centrados.
- Asimetría intencionada: no todo centrado. Alinea a una retícula de 80 px de margen.
- Una idea visual por plano. Si necesitas explicar dos cosas, son dos planos.

## Color
- Paleta corta: **fondo + tinta + acento + apoyo**. El acento solo para lo que importa (precio, palabra clave, CTA).
- Alterna planos oscuros y claros para crear ritmo; el flash blanco o el iris marcan el cambio.
- Fotos de producto en fondo claro → escenas claras alrededor; fotos oscuras/técnicas → escenas oscuras.
- Texto sobre foto: viñeta (`.vign`), oscurecer la foto (`brightness(.35)`) o píldora detrás. Contraste ≥ 4.5:1.

## Movimiento
- Texto: `ease outExpo/outCubic` (rápido al entrar, se posa). Objetos: `M.spring` (peso físico).
- Entradas escalonadas 50–90 ms por palabra; sincronizadas a la voz (`sync: true`) cuando el texto es lo que se dice.
- Nada estático > 1,5 s: empuje lento de cámara 1.00 → 1.08, deriva (`drift: 6`) o paralaje.
- **Shake** solo en impactos reales (máx. 1 cada 3 s, 2–4 por vídeo). **Punch** (escala +6 %) para números y golpes suaves.
- Salidas más rápidas que entradas (0,2–0,3 s). Muchas veces no hace falta salida: corta.

## Transiciones (cada una trae su sonido)
| Tipo | Cuándo |
|---|---|
| corte seco | por defecto entre planos del mismo bloque; lo más profesional |
| `whip` | continuidad lateral, listas, "y además…" |
| `zoom` | entrar en un detalle, revelar un número |
| `flash` | el giro / la revelación de la solución (oscuro → claro) |
| `pixels` | gancho o cierre con energía, estética digital |
| `glitch` | problema, error, tensión (máx. 1–2 por vídeo) |
| `bars` / `wipe` | cambio de capítulo, color de marca |
| `iris` | foco en un elemento, cambio a plano íntimo |
No repitas la misma transición dos veces seguidas. 4–6 transiciones "con efecto" en 30 s; el resto, cortes.

## Texto cinético vs subtítulos
- Nunca las dos cosas diciendo lo mismo a la vez: `M.captions({ skip: [[a, b], …] })` en los tramos con texto cinético.
- Subtítulos: 1–3 palabras por grupo, palabra activa en acento, **píldora oscura (`bg`) sobre fondos claros o fotos con detalle**.

## Cierre
- Marca + promesa/CTA, quieto ≥ 1,2 s (`tail`). El último sonido es un impacto suave o un ding, no un whoosh.

## Anti-slop (lo que delata un vídeo genérico)
- Todo moviéndose a la vez · todo centrado · degradados morados/azules sin motivo · emojis como recurso visual.
- Demasiado texto · la misma entrada para todo · la misma transición en cada corte · un efecto de sonido en cada palabra.
- Formas abstractas en vez de las fotos/producto reales del usuario · paleta de 6 colores · sombras difusas en todo.
- "Cinematic" sin intención: cada movimiento debe responder a "¿qué dice la voz ahora?".

## Control de calidad (antes de entregar)
Revisa `build/contact.jpg` (18 fotogramas) y stills en cada corte (`t ± 0.1`):
- [ ] Ningún texto ni elemento clave fuera de la zona segura ni cortado por el borde.
- [ ] Todo se lee en 1 segundo a tamaño móvil (míralo pequeño). Contraste suficiente.
- [ ] Ningún fotograma vacío/negro fuera de una transición (< 3 fotogramas).
- [ ] Sin solapes accidentales de texto con texto o con subtítulos.
- [ ] Cada golpe visual coincide con su palabra (abre `scene.html` en el navegador y escucha con la voz).
- [ ] El final aguanta quieto ≥ 1,2 s.
- [ ] Audio: voz clara por encima de todo, -14 LUFS, sin picos > -1 dBTP (lo garantiza `mix.py`).
