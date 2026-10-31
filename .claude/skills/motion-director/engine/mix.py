#!/usr/bin/env python3
"""
mix.py — mezcla final: voz + efectos (cues de la escena) + música con ducking, normalizada a -14 LUFS.

    python3 mix.py <proyecto>             → build/mix.wav y <proyecto>/final.mp4
    python3 mix.py <proyecto> --preview   → mezcla sobre build/video-preview.mp4 → build/preview.mp4
    python3 mix.py <proyecto> --stems     → además exporta build/stem-voz|sfx|musica.wav

Lee build/cues.json (lo escribe render.js). La música se define en M.setup({ music, musicDb, bpm }):
  music: 'musica.mp3'           archivo dentro del proyecto
         'bed:pulse' | 'bed:dark' | 'bed:drive'   base sintetizada (sin derechos de autor)
         null                    sin música
"""
import sys, os, json, subprocess
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sfx as S  # noqa: E402

SR = S.SR
db = lambda x: 10 ** (x / 20)


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def place(buf, x, start):
    s = int(round(start * SR))
    if s < 0:
        x, s = x[-s:], 0
    e = min(len(buf), s + len(x))
    if e > s:
        buf[s:e] += x[:e - s]


def envelope(x, hop=0.01):
    h = int(hop * SR)
    m = x.mean(1) if x.ndim == 2 else x
    k = len(m) // h
    return np.sqrt((m[:k * h].reshape(k, h) ** 2).mean(1) + 1e-12)


def smooth(g, att, rel, hop=0.01):
    a, r = np.exp(-hop / att), np.exp(-hop / rel)
    out = np.empty_like(g)
    y = g[0]
    for i, v in enumerate(g):
        c = a if v > y else r  # entra la voz: ducking rápido; se va: la música vuelve despacio
        y = c * y + (1 - c) * v
        out[i] = y
    return out


def loudnorm(src, dst, I=-14, TP=-1.5, LRA=11):
    p = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', f'loudnorm=I={I}:TP={TP}:LRA={LRA}:print_format=json',
                        '-f', 'null', '-'], capture_output=True, text=True).stderr
    j = json.loads(p[p.rindex('{'):p.rindex('}') + 1])
    af = (f"loudnorm=I={I}:TP={TP}:LRA={LRA}:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
          f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', af, '-ar', str(SR), dst], check=True)
    return float(j['input_i'])


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)
    proj = os.path.abspath(args[0])
    preview = '--preview' in args
    build = os.path.join(proj, 'build')
    meta = json.load(open(os.path.join(build, 'cues.json')))
    A = meta.get('audio', {})
    dur = meta['duration']
    n = int(dur * SR)

    # --- Voz --------------------------------------------------------------
    voice = np.zeros((n, 2), np.float32)
    if A.get('voice'):
        vp = os.path.join(proj, A['voice'])
        if os.path.exists(vp):
            v = load(vp)
            env = envelope(v)
            act = env[env > env.max() * 0.05]
            rms = np.sqrt((act ** 2).mean()) if len(act) else 1
            v *= db(-20) / rms  # voz a ~-20 dBFS RMS: referencia de toda la mezcla
            # EQ ligera de "presencia": corta graves < 80 Hz
            v = np.stack([S._band(v[:, 0], 80, None, 0.15), S._band(v[:, 1], 80, None, 0.15)], 1)
            place(voice, v, 0)
        else:
            print(f'⚠ No encuentro la voz {vp}; mezclo sin voz')
    venv = envelope(voice)
    vact = (venv > db(-42)).astype(np.float32)
    duck = smooth(vact, 0.06, 0.4)  # 0 = sin voz, 1 = hablando
    tt = np.arange(len(duck)) * 0.01
    duck_s = np.interp(np.arange(n) / SR, tt, duck).astype(np.float32)

    # --- Efectos ----------------------------------------------------------
    fx = np.zeros((n, 2), np.float32)
    cache = {}
    for i, c in enumerate(meta.get('cues', [])):
        name = c['name']
        seed = i if name in ('type', 'click', 'pop', 'glitch', 'whoosh', 'swish') else 0
        key = (name, seed)
        if key not in cache:
            cache[key] = S.make(name, seed)
        x, anchor = cache[key]
        g = db(S.LEVELS.get(name, -15) + c.get('db', 0) + A.get('sfxDb', 0) - 20)
        s = int(round((c['t'] - anchor) * SR))
        vd = duck_s[min(max(s, 0), n - 1)]
        g *= db(-3 * vd)  # con voz encima, los efectos bajan 3 dB
        pan = {'whoosh': 0.35, 'swish': 0.3}.get(name, 0.12) * (1 if i % 2 else -1)
        st = np.stack([x * (1 - pan), x * (1 + pan)], 1) * g
        place(fx, st, c['t'] - anchor)

    # --- Música -----------------------------------------------------------
    music = np.zeros((n, 2), np.float32)
    m = A.get('music')
    if m:
        if m.startswith('bed:'):
            b = S.bed(dur + 0.5, bpm=A.get('bpm', 100), style=m[4:] or 'pulse')
            mus = np.stack([b, b], 1)
        else:
            mus = load(os.path.join(proj, m))
        if len(mus) < n:
            mus = np.tile(mus, (int(np.ceil(n / len(mus))), 1))
        mus = mus[:n]
        mus *= db(-20) / (np.sqrt((mus ** 2).mean()) + 1e-9)
        base = A.get('musicDb', -17)
        gain = db(base + 7) * (1 - duck_s) + db(base) * duck_s  # ducking bajo la voz
        fade = np.minimum(1, np.minimum(np.arange(n) / (0.3 * SR), (n - np.arange(n)) / (1.5 * SR)))
        music = mus * (gain * fade)[:, None]

    mix = voice + fx + music
    tail = int(0.08 * SR)
    mix[-tail:] *= np.linspace(1, 0, tail)[:, None]
    mix = np.tanh(mix * 1.1) / 1.1  # limitador suave
    raw = os.path.join(build, 'mix-raw.wav')
    S.write_wav(raw, mix)
    out = os.path.join(build, 'mix.wav')
    li = loudnorm(raw, out)
    print(f'✔ {out}  (entrada {li:.1f} LUFS → -14 LUFS)')
    if '--stems' in args:
        for k, x in (('voz', voice), ('sfx', fx), ('musica', music)):
            S.write_wav(os.path.join(build, f'stem-{k}.wav'), x)

    video = os.path.join(build, 'video-preview.mp4' if preview else 'video.mp4')
    if os.path.exists(video):
        final = os.path.join(build, 'preview.mp4') if preview else os.path.join(proj, 'final.mp4')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-i', out, '-map', '0:v', '-map', '1:a',
                        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', final],
                       check=True)
        print(f'✔ {final}')
    else:
        print(f'(no hay {video}: ejecuta render.js primero para obtener el MP4)')


if __name__ == '__main__':
    main()
