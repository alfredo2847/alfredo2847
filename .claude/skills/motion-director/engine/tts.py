#!/usr/bin/env python3
"""
tts.py — locución desde guion.txt con tiempos por palabra (Microsoft Edge TTS, gratis, necesita internet).

    python3 tts.py <proyecto> [--voice es-ES-AlvaroNeural] [--rate +6%] [--pitch +0Hz] [--gap 0.18] [--lead 0.25]
    python3 tts.py --voices es        lista voces disponibles (filtro por idioma)

guion.txt — una frase (un "beat") por línea:
    Tu fuente te cuesta setenta euros al año.
    [pausa 0.6]                      ← silencio explícito
                                     ← línea en blanco = pausa de 0.45 s
    # comentario                      ← se ignora
    {rate:+15%} Frase más rápida.    ← ajuste por línea (rate / pitch)

Genera en el proyecto:
    voz.wav     la locución completa
    voice.js    window.VOICE = { src, duration, lines:[{text,start,end,words}], words:[{w,start,end}] }

Voces recomendadas: es-ES-AlvaroNeural (hombre, España), es-ES-ElviraNeural (mujer, España),
es-MX-JorgeNeural / es-MX-DaliaNeural (México), en-US-AndrewNeural / en-US-AvaNeural (inglés).
"""
import sys, os, re, json, asyncio, subprocess
import numpy as np

SR = 48000


def _ssl_fix():
    # Detrás de un proxy corporativo: usa su CA si está definida.
    ca = os.environ.get('SSL_CERT_FILE') or os.environ.get('REQUESTS_CA_BUNDLE')
    if ca and os.path.exists(ca):
        import certifi
        certifi.where = lambda: ca


def opt(args, k, d):
    return args[args.index(k) + 1] if k in args else d


async def synth(text, voice, rate, pitch):
    import edge_tts
    c = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary='WordBoundary')
    audio, words = bytearray(), []
    async for ch in c.stream():
        if ch['type'] == 'audio':
            audio += ch['data']
        elif ch['type'] == 'WordBoundary':
            s = ch['offset'] / 1e7
            words.append({'w': ch['text'], 'start': s, 'end': s + ch['duration'] / 1e7})
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'pipe:0', '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                         input=bytes(audio), capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.float32), words


def attach_punct(text, words):
    """Edge devuelve palabras sin puntuación: la recuperamos del texto original (para cortes de subtítulos)."""
    toks = text.split()
    j = 0
    norm = lambda s: re.sub(r'[^\wñáéíóúü%€$]', '', s.lower())
    for w in words:
        for k in range(j, min(len(toks), j + 4)):
            if norm(toks[k]).startswith(norm(w['w'])) or norm(w['w']) in norm(toks[k]):
                tail = re.search(r'[.,;:!?…]+$', toks[k])
                if tail and k == j:
                    w['w'] += tail.group(0)
                j = k + 1
                break
    return words


def main():
    args = sys.argv[1:]
    _ssl_fix()
    if '--voices' in args:
        import edge_tts
        lang = opt(args, '--voices', '')
        for v in asyncio.run(edge_tts.list_voices()):
            if v['ShortName'].lower().startswith(lang.lower()):
                print(f"{v['ShortName']:32s} {v['Gender']}")
        return
    if not args:
        print(__doc__)
        sys.exit(1)
    proj = os.path.abspath(args[0])
    voice = opt(args, '--voice', 'es-ES-AlvaroNeural')
    rate = opt(args, '--rate', '+6%')
    pitch = opt(args, '--pitch', '+0Hz')
    gap = float(opt(args, '--gap', 0.18))
    lead = float(opt(args, '--lead', 0.25))

    src = open(os.path.join(proj, 'guion.txt'), encoding='utf-8').read().splitlines()
    pieces, lines, all_words = [np.zeros(int(lead * SR), np.float32)], [], []
    t = lead
    for raw in src:
        s = raw.strip()
        if s.startswith('#'):
            continue
        m = re.match(r'\[pausa\s+([\d.]+)\]', s)
        if not s or m:
            p = float(m.group(1)) if m else 0.45
            pieces.append(np.zeros(int(p * SR), np.float32))
            t += p
            continue
        r, pt = rate, pitch
        for k, v in re.findall(r'\{(rate|pitch):([^}]+)\}', s):
            r, pt = (v, pt) if k == 'rate' else (r, v)
        text = re.sub(r'\{[^}]*\}', '', s).strip()
        audio, words = asyncio.run(synth(text, voice, r, pt))
        # recorta el silencio final que añade el TTS
        nz = np.nonzero(np.abs(audio) > 0.01)[0]
        if len(nz):
            audio = audio[:min(len(audio), nz[-1] + int(0.06 * SR))]
        words = attach_punct(text, words)
        for w in words:
            w['start'] = round(w['start'] + t, 3)
            w['end'] = round(w['end'] + t, 3)
        lines.append({'i': len(lines), 'text': text, 'start': round(t, 3), 'end': round(t + len(audio) / SR, 3), 'words': words})
        all_words += words
        pieces += [audio, np.zeros(int(gap * SR), np.float32)]
        t += len(audio) / SR + gap
        print(f"  {lines[-1]['start']:6.2f}s  {text}")

    full = np.concatenate(pieces)
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from sfx import write_wav
    write_wav(os.path.join(proj, 'voz.wav'), full)
    data = {'src': 'voz.wav', 'voice': voice, 'duration': round(len(full) / SR, 3), 'lines': lines, 'words': all_words}
    with open(os.path.join(proj, 'voice.js'), 'w', encoding='utf-8') as f:
        f.write('// Generado por tts.py — no editar a mano\nwindow.VOICE = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n')
    print(f"✔ voz.wav + voice.js  ({data['duration']} s, {len(lines)} frases, {len(all_words)} palabras)")


if __name__ == '__main__':
    main()
