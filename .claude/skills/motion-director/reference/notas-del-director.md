# Notas del director

Memoria de gusto. Cada vez que el usuario da una nota de **gusto general** (no de un vídeo concreto),
añádela aquí con fecha y cómo se aplica. Léelo al empezar cada vídeo. Lo más reciente arriba.

## 2026-10-31 — aprendidas al construir la demo de VitalPet
- **Subtítulos sobre fondo claro**: amarillo sobre crema no se lee. Siempre `bg` (píldora oscura) en `M.captions` si algún plano con subtítulos es claro o es una foto con detalle.
- **Grano**: el grano fino a 0,06 disparó el MP4 a 200 MB y TikTok lo convierte en barro. Grano grueso, ≤ 0,045, y bitrate limitado (lo hace `render.js`).
- **Niveles de efectos**: con niveles "prudentes" los efectos quedaban 25 dB bajo la voz: no se oían. Calibrado: whoosh/pop ≈ -12/-14 dB, hit ≈ -6 dB respecto a la voz.
- **Fotograma vacío tras glitch**: si el texto del plano entra sincronizado con la voz y la voz tarda 0,15 s, el plano empieza en negro. El primer elemento de cada plano debe estar visible desde el corte (entra en `T[i]`, no en la primera palabra).
- **Listas de 3 en vertical**: con tarjetas de 400 px la tercera cae en la zona de la descripción de TikTok. Tarjetas de 360 px empezando en y=340.
- **Pausas tras la marca**: "VitalPet." con punto deja ~1,4 s de silencio en la voz; está bien en el cierre (la música lo llena), evítalo a mitad del vídeo (usa coma).
