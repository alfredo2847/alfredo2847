# Motion Director — skill de Claude Code

Convierte una idea en un vídeo vertical terminado: **guion → voz en off → storyboard → animación →
subtítulos → diseño sonoro → mezcla final** (MP4 1080x1920, -14 LUFS). Claude hace de director con
un sistema de reglas (`reference/`) y un motor de render propio (`engine/`). Tú pones la idea, el gusto y las notas.

## Instalar (para tenerla en todos tus repos)

**Opción A — tu cuenta de claude.ai (recomendada: vale para Claude Code en la web, el escritorio y el chat).**
claude.ai → Ajustes → Capacidades → Skills → *Subir skill* → elige `motion-director-skill.zip`.
Se sincroniza sola en cada sesión nueva, sea cual sea el repo. Para actualizarla, vuelve a subir el ZIP.
La primera vez en cada sesión, Claude ejecuta `md.sh setup` para instalar lo que falte.

**Opción B — Claude Code en tu ordenador (CLI):**

```bash
# copia la carpeta a tus skills personales
cp -r .claude/skills/motion-director ~/.claude/skills/
# o descomprime motion-director-skill.zip en ~/.claude/skills/

# dependencias
brew install ffmpeg node          # macOS  (Linux: apt install ffmpeg nodejs)
npm i -g playwright && npx playwright install chromium
pip install numpy edge-tts        # + faster-whisper si quieres usar tu propia voz
bash ~/.claude/skills/motion-director/engine/md.sh setup
```

## Usar

Pídeselo a Claude en lenguaje normal:

> Hazme un reel de 25 s para mi cafetería: el gancho es que tostamos el café cada mañana. Fotos en ./fotos. Voz de mujer, tono cercano.

Claude seguirá el flujo de `SKILL.md`: brief → guion → voz → storyboard → `scene.html` → revisión de fotogramas → render y mezcla → notas.
Después dale notas como a un editor: *"más energía"*, *"baja ese whoosh"*, *"aguanta el final un beat más"*.
Las notas de gusto general se guardan en `reference/notas-del-director.md` y se aplican en los siguientes vídeos.

## Comandos (por si quieres hacerlo a mano)

```bash
MD=~/.claude/skills/motion-director/engine/md.sh
bash $MD new mi-video              # proyecto desde plantilla (ya genera un vídeo con cualquier guion)
nano mi-video/guion.txt            # una frase por línea
bash $MD voz mi-video --voice es-ES-ElviraNeural
bash $MD check mi-video            # hoja de contactos build/contact.jpg
open mi-video/scene.html           # vista previa en vivo con la voz (espacio, ←/→)
bash $MD preview mi-video          # borrador rápido con audio
bash $MD final mi-video            # → mi-video/final.mp4
```

Ejemplo completo: `examples/vitalpet/` (guion, storyboard, escena de 9 planos). En el repo alfredo2847 está además el proyecto con fotos, voz y el vídeo resultante (`videos/vitalpet-demo/`).

Fuentes incluidas: Barlow Condensed, Inter y JetBrains Mono (SIL Open Font License).
Efectos y música sintetizados por código: sin derechos de terceros.
