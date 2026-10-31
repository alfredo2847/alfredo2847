#!/usr/bin/env bash
# md.sh — atajos del pipeline de Motion Director.
#
#   md.sh setup                  instala lo que falte (numpy, edge-tts, Playwright) y comprueba
#   md.sh doctor                 solo comprueba dependencias
#   md.sh new <proyecto>         crea un proyecto desde la plantilla
#   md.sh voz <proyecto> [...]   locución + tiempos por palabra desde guion.txt (args extra → tts.py)
#   md.sh mivoz <proyecto> <audio>  usa tu propia grabación (Whisper)
#   md.sh check <proyecto> [n]   hoja de contactos build/contact.jpg (n fotogramas, 12 por defecto)
#   md.sh still <proyecto> t1,t2 fotogramas sueltos en build/stills/
#   md.sh preview <proyecto>     vídeo a media resolución con audio → build/preview.mp4
#   md.sh final <proyecto>       vídeo 1080x1920 con mezcla final → <proyecto>/final.mp4
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL="$(dirname "$HERE")"
cmd="${1:-help}"; shift || true

case "$cmd" in
  setup)
    if ! command -v ffmpeg >/dev/null; then
      if command -v brew >/dev/null; then brew install ffmpeg || true
      elif command -v apt-get >/dev/null; then sudo -n apt-get install -y ffmpeg 2>/dev/null || apt-get install -y ffmpeg || true; fi
    fi
    python3 -c "import numpy" 2>/dev/null || python3 -m pip install -q numpy 2>/dev/null || python3 -m pip install -q --user --break-system-packages numpy
    python3 -c "import edge_tts" 2>/dev/null || python3 -m pip install -q edge-tts 2>/dev/null || python3 -m pip install -q --user --break-system-packages edge-tts
    if ! node -e "require('playwright')" 2>/dev/null; then
      npm i -g playwright >/dev/null 2>&1 && npx -y playwright install chromium >/dev/null 2>&1 || true
    fi
    bash "$0" doctor ;;
  doctor)
    ok=1
    command -v ffmpeg >/dev/null && echo "✔ ffmpeg" || { echo "✖ ffmpeg (brew install ffmpeg / apt install ffmpeg)"; ok=0; }
    command -v node >/dev/null && echo "✔ node $(node -v)" || { echo "✖ node 18+"; ok=0; }
    node -e "require('playwright')" 2>/dev/null && echo "✔ playwright" || { echo "✖ playwright → npm i -g playwright && npx playwright install chromium"; ok=0; }
    python3 -c "import numpy" 2>/dev/null && echo "✔ numpy" || { echo "✖ numpy → pip install numpy"; ok=0; }
    python3 -c "import edge_tts" 2>/dev/null && echo "✔ edge-tts (voz)" || echo "· edge-tts no instalado (opcional, voz IA) → pip install edge-tts"
    python3 -c "import faster_whisper" 2>/dev/null && echo "✔ faster-whisper (tu voz)" || echo "· faster-whisper no instalado (opcional, para usar tu voz) → pip install faster-whisper"
    [ $ok = 1 ] && echo "Todo listo." || exit 1 ;;
  new)
    d="${1:?uso: md.sh new <proyecto>}"
    [ -e "$d/scene.html" ] && { echo "Ya existe $d/scene.html"; exit 1; }
    mkdir -p "$d"
    cp -r "$SKILL/template/." "$d/"
    cp "$HERE/motion.js" "$d/motion.js"
    echo "✔ Proyecto en $d  (edita guion.txt → md.sh voz → scene.html)" ;;
  voz)   d="${1:?proyecto}"; shift; python3 "$HERE/tts.py" "$d" "$@" ;;
  mivoz) python3 "$HERE/transcribe.py" "$@" ;;
  check) d="${1:?proyecto}"; cp "$HERE/motion.js" "$d/motion.js"; node "$HERE/render.js" "$d" --contact "${2:-12}" ;;
  still) d="${1:?proyecto}"; cp "$HERE/motion.js" "$d/motion.js"; node "$HERE/render.js" "$d" --still "${2:?tiempos}" ;;
  preview)
    d="${1:?proyecto}"; cp "$HERE/motion.js" "$d/motion.js"
    node "$HERE/render.js" "$d" --preview && python3 "$HERE/mix.py" "$d" --preview ;;
  final)
    d="${1:?proyecto}"; cp "$HERE/motion.js" "$d/motion.js"
    node "$HERE/render.js" "$d" && python3 "$HERE/mix.py" "$d" ;;
  *) sed -n '2,14p' "$0" ;;
esac
