# Storyboard — plantilla

Escríbelo en `<proyecto>/storyboard.md` antes de tocar `scene.html`. Una fila por línea de `guion.txt`.

```md
# <Título> — <plataforma>, <duración aprox.>, <voz>

Paleta: fondo #… · tinta #… · acento #… (solo palabra clave/CTA) · apoyo #…
Tipos: Barlow Condensed 800 (titulares) · Inter (UI/subtítulos) · JetBrains Mono (kickers)
Música: bed:pulse 104 bpm, -19 dB · Ritmo claro/oscuro: O O R O C O C O C   (O oscuro, C claro, R color)

| # | Voz (línea) | Palabra clave | En pantalla | Visual | Movimiento | Entrada | Sonido |
|---|---|---|---|---|---|---|---|
| 1 | Tu fuente te está costando dinero. | dinero | TU FUENTE TE ESTÁ COSTANDO / DINERO. | foto fuente con filtro, B/N oscura | push 1.18→1, palabras sync, DINERO slam | (inicio, ya en movimiento) | hit + shake en "dinero" |
| 2 | … | … | … | … | … | pixels | … |
```

Preguntas para cada fila:
1. ¿Qué **una** cosa debe entender el espectador en este plano?
2. ¿Qué palabra golpea y cómo (slam, contador, highlight, objeto que entra)?
3. ¿El plano anterior era oscuro/lleno/rápido? Entonces este, claro/vacío/tranquilo.
4. ¿Texto cinético o subtítulos? (nunca ambos con las mismas palabras)
5. ¿Qué suena y por qué? Si no hay movimiento que lo justifique, no suena.

Ejemplo real completo: `examples/vitalpet/storyboard.md`.
