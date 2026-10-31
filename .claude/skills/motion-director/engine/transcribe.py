#!/usr/bin/env python3
"""
transcribe.py — usa TU propia voz grabada: la transcribe con Whisper y saca tiempos por palabra.

    pip install faster-whisper
    python3 transcribe.py <proyecto> mi-voz.m4a [--model small] [--lang es]

Genera voz.wav (48 kHz) y voice.js con la misma estructura que tts.py,
así la escena se sincroniza igual con M.at('palabra').
Cada "frase" (line) es un segmento de Whisper; revisa voice.js si quieres partirlas distinto.
"""
import sys, os, json, subprocess
import numpy as np


def main():
    a = sys.argv[1:]
    if len(a) < 2:
        print(__doc__)
        sys.exit(1)
    proj, src = os.path.abspath(a[0]), a[1]
    model = a[a.index('--model') + 1] if '--model' in a else 'small'
    lang = a[a.index('--lang') + 1] if '--lang' in a else 'es'
    out = os.path.join(proj, 'voz.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ac', '2', '-ar', '48000', out], check=True)
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', out, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'],
                         capture_output=True, check=True).stdout
    audio = np.frombuffer(pcm, np.float32)
    from faster_whisper import WhisperModel
    m = WhisperModel(model, device='cpu', compute_type='int8')
    segs, _ = m.transcribe(audio, language=lang, word_timestamps=True, vad_filter=True)
    lines, words = [], []
    for s in segs:
        ws = [{'w': w.word.strip(), 'start': round(w.start, 3), 'end': round(w.end, 3)} for w in (s.words or []) if w.word.strip()]
        if not ws:
            continue
        lines.append({'i': len(lines), 'text': s.text.strip(), 'start': ws[0]['start'], 'end': ws[-1]['end'], 'words': ws})
        words += ws
        print(f"  {ws[0]['start']:6.2f}s  {s.text.strip()}")
    data = {'src': 'voz.wav', 'duration': round(len(audio) / 16000, 3), 'lines': lines, 'words': words}
    with open(os.path.join(proj, 'voice.js'), 'w', encoding='utf-8') as f:
        f.write('// Generado por transcribe.py\nwindow.VOICE = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n')
    print(f'✔ voz.wav + voice.js  ({len(lines)} frases, {len(words)} palabras)')


if __name__ == '__main__':
    main()
