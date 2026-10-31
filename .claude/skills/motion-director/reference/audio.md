# Audio — voz, efectos, música, mezcla

El 50 % de la sensación de "calidad" es sonido. La mezcla la hace `mix.py`; tú decides qué suena y cuándo.

## Voz
- Edge TTS (gratis, necesita internet). Voces: `es-ES-AlvaroNeural`, `es-ES-ElviraNeural`, `es-MX-JorgeNeural`,
  `es-MX-DaliaNeural`, `en-US-AndrewNeural`, `en-US-AvaNeural`. Lista: `python3 engine/tts.py --voices es`.
- Anuncio/redes: `--rate +6%` a `+12%`. Explainer calmado: `+0%`. Por línea: `{rate:+15%} Frase.`
- Puntuación = pausas. Punto → pausa clara; coma → breve; `[pausa 0.6]` → exacta.
- Si la voz pronuncia mal una marca, escríbela como suena en `guion.txt` (y usa ese texto en `M.at`).
- Voz propia: grábala en un sitio sin eco, `bash md.sh mivoz <proyecto> voz.m4a`.

## Efectos: qué sonido para qué movimiento
| Movimiento | Sonido |
|---|---|
| texto/objeto que cruza la pantalla, whip, zoom | `whoosh` (largo) / `swish` (corto) |
| algo aparece con muelle, tarjeta, etiqueta | `pop` |
| palabra que golpea (`slam`), revelación, logo | `hit` (fuerte) / `bass` (suave) / `boom` (solo 1 por vídeo) |
| número que sube hasta un clímax | `riser` (termina en la marca) + `hit` |
| UI: toque, interruptor, selección | `click` / `tick` |
| tecleo (`style: 'type'`) | `type` (lo pone `M.reveal({ sfx: 'type' })`) |
| error, tensión, transición digital | `glitch` |
| acierto, check, precio cero, "listo" | `ding` |
| agua, limpieza, magia, brillo | `shimmer` |

Reglas:
- **No sonorices todo.** Como mucho un efecto cada 0,25 s; un impacto fuerte cada ~3 s.
- El sonido va **en el fotograma del movimiento**, nunca después. Un whoosh se centra en el corte (el motor ya lo alinea por su "anchor").
- Varía: el motor cambia la semilla de whoosh/pop/click/type por marca para que no suenen idénticos.

## Niveles (los aplica mix.py)
- Voz normalizada a ~-20 dBFS RMS: es la referencia. EQ: corta < 80 Hz.
- Efectos (medido en RMS 100 ms): whoosh/pop ≈ 12–14 dB por debajo de la voz, hit ≈ 6 dB por debajo.
  Mientras hay voz, los efectos bajan 3 dB más. Ajusta por marca: `M.cue(t, 'hit', -4)`; global: `M.setup({ sfxDb: -3 })`.
- Música: `musicDb` (por defecto -17) bajo la voz, +7 dB en los huecos sin voz (ducking: ataque 60 ms, salida 400 ms).
  Fade-in 0,3 s, fade-out 1,5 s.
- Máster: limitador suave + loudnorm de dos pasadas a **-14 LUFS, -1,5 dBTP** (estándar TikTok/Reels/YouTube).

## Música
- `M.setup({ music: 'bed:pulse', bpm: 104 })` — base sintetizada sin derechos: `pulse` (bombo a partir del compás 2, hats desde el 3),
  `drive` (enérgica desde el principio), `dark` (pad + drone, sin batería, para tono serio/premium).
- O un archivo propio: `music: 'musica.mp3'` en la carpeta del proyecto (que tenga licencia).
- bpm orientativo: 90–100 explicativo, 100–110 anuncio, 115–128 energético.
- Para que los cortes caigan a tempo: `const beat = 60 / bpm` y redondea cortes a múltiplos de `beat` si no hay voz.

## Comprobar
```
python3 engine/mix.py <proyecto> --stems      # build/stem-voz|sfx|musica.wav
ffmpeg -i build/mix.wav -af ebur128=peak=true -f null -   # loudness integrada y picos
```
