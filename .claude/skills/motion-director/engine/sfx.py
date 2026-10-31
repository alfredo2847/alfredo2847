#!/usr/bin/env python3
"""
sfx.py — efectos de sonido y base musical sintetizados (solo numpy, sin samples externos).

    python3 sfx.py <carpeta>           exporta todos los efectos a WAV para escucharlos
    python3 sfx.py <carpeta> --bed 20  exporta también una base musical de 20 s

Cada efecto devuelve (señal_mono_float32, anchor_segundos). `anchor` es el instante
"de impacto" dentro del sample: mix.py lo alinea con el tiempo de la marca (cue).
Un whoosh se centra en el corte; un riser termina justo en la marca.
"""
import sys, os, wave
import numpy as np

SR = 48000


def _t(d):
    return np.arange(int(d * SR)) / SR


def _noise(n, seed):
    return np.random.default_rng(seed).standard_normal(n).astype(np.float32)


def _band(x, lo, hi, soft=0.25):
    """Filtro pasa-banda estático en frecuencia (bordes suaves en escala log)."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR) + 1e-6
    lf = np.log2(f)
    m = np.ones_like(f)
    if lo:
        m *= 1 / (1 + np.exp(-(lf - np.log2(lo)) / soft))
    if hi:
        m *= 1 / (1 + np.exp((lf - np.log2(hi)) / soft))
    return np.fft.irfft(X * m, len(x)).astype(np.float32)


def _sweep(x, fc, q=0.6):
    """Pasa-banda variable en el tiempo (STFT overlap-add). fc: array de Hz por muestra."""
    n, N, H = len(x), 2048, 512
    win = np.hanning(N).astype(np.float32)
    out = np.zeros(n + N, np.float32)
    norm = np.zeros(n + N, np.float32)
    f = np.fft.rfftfreq(N, 1 / SR) + 1e-6
    lf = np.log2(f)
    xp = np.concatenate([x, np.zeros(N, np.float32)])
    for s in range(0, n, H):
        c = fc[min(s + N // 2, n - 1)]
        m = np.exp(-0.5 * ((lf - np.log2(c)) / q) ** 2)
        seg = np.fft.irfft(np.fft.rfft(xp[s:s + N] * win) * m, N) * win
        out[s:s + N] += seg
        norm[s:s + N] += win ** 2
    return (out / np.maximum(norm, 1e-3))[:n]


def _norm(x, peak=0.9):
    return (x / (np.max(np.abs(x)) + 1e-9) * peak).astype(np.float32)


def _env(d, a, peak_at):
    t = _t(d)
    up = np.clip(t / max(peak_at, 1e-3), 0, 1) ** a
    down = np.clip(1 - (t - peak_at) / max(d - peak_at, 1e-3), 0, 1) ** 1.6
    return np.where(t < peak_at, up, down).astype(np.float32)


def _sine_glide(d, f0, f1, curve=8.0):
    t = _t(d)
    f = f1 + (f0 - f1) * np.exp(-t * curve)
    return np.sin(2 * np.pi * np.cumsum(f) / SR).astype(np.float32)


def whoosh(seed=0, d=0.9):
    n = int(d * SR)
    t = _t(d)
    pk = d * 0.55
    fc = np.where(t < pk, 350 * (2600 / 350) ** (t / pk), 2600 * (500 / 2600) ** ((t - pk) / (d - pk)))
    return _norm(_sweep(_noise(n, seed), fc, 0.5) * _env(d, 2.2, pk)), pk


def swish(seed=0, d=0.38):
    n = int(d * SR)
    t = _t(d)
    pk = d * 0.6
    fc = 1400 * (6500 / 1400) ** np.clip(t / pk, 0, 1)
    return _norm(_sweep(_noise(n, seed + 5), fc, 0.45) * _env(d, 2.5, pk)), pk


def pop(seed=0):
    d = 0.14
    t = _t(d)
    x = _sine_glide(d, 1100 + seed % 5 * 60, 320, 30) * np.exp(-t * 38)
    x[:120] += _noise(120, seed) * 0.3 * np.linspace(1, 0, 120)
    return _norm(x), 0.0


def click(seed=0):
    d = 0.035
    x = _band(_noise(int(d * SR), seed + 11), 2000, 9000) * np.exp(-_t(d) * 180)
    return _norm(x), 0.0


def tick(seed=0):
    d = 0.05
    return _norm(np.sin(2 * np.pi * 2400 * _t(d)) * np.exp(-_t(d) * 120)), 0.0


def type_(seed=0):
    d = 0.06
    t = _t(d)
    r = np.random.default_rng(seed)
    x = _band(_noise(len(t), seed + 3), 1800 + r.random() * 1200, 6000) * np.exp(-t * 160)
    x += np.sin(2 * np.pi * (140 + r.random() * 40) * t) * np.exp(-t * 90) * 0.5
    return _norm(x), 0.0


def hit(seed=0):
    d = 1.3
    t = _t(d)
    sub = _sine_glide(d, 95, 42, 9) * np.exp(-t * 3.2)
    tr = _band(_noise(len(t), seed + 7), 80, 3500) * np.exp(-t * 28)
    x = np.tanh((sub * 1.2 + tr * 0.8) * 1.6)
    return _norm(x), 0.0


def boom(seed=0):
    d = 2.6
    t = _t(d)
    sub = _sine_glide(d, 70, 30, 4) * np.exp(-t * 1.5)
    rum = _band(_noise(len(t), seed + 9), 30, 400) * np.exp(-t * 2.2)
    tr = _band(_noise(len(t), seed + 1), 200, 5000) * np.exp(-t * 35)
    return _norm(np.tanh((sub + rum * 0.7 + tr * 0.5) * 1.8)), 0.0


def bass(seed=0):
    d = 0.9
    t = _t(d)
    return _norm(np.tanh(_sine_glide(d, 75, 48, 12) * np.exp(-t * 4) * 2.2)), 0.0


def riser(seed=0, d=2.0):
    n = int(d * SR)
    t = _t(d)
    fc = 300 * (9000 / 300) ** (t / d)
    x = _sweep(_noise(n, seed + 2), fc, 0.55) * 0.8
    x += np.sin(2 * np.pi * np.cumsum(180 * (6.0 ** (t / d))) / SR) * 0.25
    env = (t / d) ** 2.4
    env[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))
    return _norm(x * env), d


def glitch(seed=0):
    d = 0.32
    n = int(d * SR)
    r = np.random.default_rng(seed + 21)
    x = np.zeros(n, np.float32)
    s = 0
    while s < n:
        L = int(r.uniform(0.012, 0.045) * SR)
        e = min(n, s + L)
        tt = np.arange(e - s) / SR
        kind = r.integers(3)
        if kind == 0:
            seg = np.sign(np.sin(2 * np.pi * r.uniform(150, 2500) * tt))
        elif kind == 1:
            seg = np.round(_noise(e - s, int(r.integers(1e6))) * 3) / 3
        else:
            seg = np.zeros(e - s)
        x[s:e] = seg * r.uniform(0.3, 1)
        s = e
    return _norm(_band(x, 120, 9000) * np.exp(-_t(d) * 4)), 0.0


def ding(seed=0):
    d = 1.6
    t = _t(d)
    f = 1318.5
    x = sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * dk)
            for k, a, dk in [(1, 1, 3), (2.76, 0.5, 5), (5.4, 0.25, 8), (0.5, 0.3, 2.5)])
    return _norm(x), 0.0


def shimmer(seed=0):
    d = 1.3
    t = _t(d)
    r = np.random.default_rng(seed + 4)
    x = sum(np.sin(2 * np.pi * r.uniform(2500, 7000) * t + r.uniform(0, 6)) *
            (0.5 + 0.5 * np.sin(2 * np.pi * r.uniform(8, 18) * t)) for _ in range(9))
    return _norm(x * _env(d, 0.6, 0.12)), 0.1


SFX = {
    'whoosh': whoosh, 'swish': swish, 'pop': pop, 'click': click, 'tick': tick, 'type': type_,
    'hit': hit, 'boom': boom, 'bass': bass, 'riser': riser, 'glitch': glitch, 'ding': ding, 'shimmer': shimmer,
}

# Nivel base (dB de pico respecto al RMS de la voz). Medido (RMS en 100 ms): un whoosh queda
# ~12 dB por debajo de la voz y un hit ~6 dB: se sienten sin tapar. Ajusta por marca con M.cue(t, nombre, ±dB).
LEVELS = {
    'whoosh': 5, 'swish': 3, 'pop': 2, 'click': 0, 'tick': -6, 'type': -9,
    'hit': 0, 'boom': 0, 'bass': -2, 'riser': -4, 'glitch': -3, 'ding': -2, 'shimmer': -1,
}


def make(name, seed=0):
    if name not in SFX:
        raise SystemExit(f"Efecto desconocido '{name}'. Disponibles: {', '.join(SFX)}")
    return SFX[name](seed)


# ---------------------------------------------------------------------------
# Base musical procedural
# ---------------------------------------------------------------------------
PROG = {  # acordes por compás (frecuencias de la fundamental en Hz) — La menor: Am F C G
    'minor': [(110.0, [0, 3, 7]), (87.31, [0, 4, 7]), (130.81, [0, 4, 7]), (98.0, [0, 4, 7])],
    'major': [(130.81, [0, 4, 7]), (98.0, [0, 4, 7]), (110.0, [0, 3, 7]), (87.31, [0, 4, 7])],
}


def bed(duration, bpm=100, style='pulse', mood='minor', seed=0):
    """style: pulse (bombo + hats + bajo + pad) | dark (pad + drone, sin batería) | drive (más enérgico)"""
    n = int(duration * SR)
    t = np.arange(n) / SR
    beat = 60 / bpm
    bar = beat * 4
    prog = PROG.get(mood, PROG['minor'])
    out = np.zeros(n, np.float32)
    pad = np.zeros(n, np.float32)
    bassl = np.zeros(n, np.float32)
    nb = int(np.ceil(duration / bar)) + 1
    for b in range(nb):
        root, iv = prog[b % len(prog)]
        s, e = int(b * bar * SR), min(n, int((b + 1) * bar * SR) + int(0.3 * SR))
        if s >= n:
            break
        tt = np.arange(e - s) / SR
        fade = np.minimum(1, np.minimum(tt / 0.25, (tt[-1] - tt + 1e-3) / 0.3))
        for k in iv:
            f = root * 2 * 2 ** (k / 12)
            for det in (-0.12, 0.0, 0.11):
                ph = np.random.default_rng(seed + b * 7 + k).uniform()
                pad[s:e] += (2 * ((f * (1 + det / 100 * 3) * tt + ph) % 1) - 1) * fade * 0.12
        bf = root / 2 if root > 100 else root
        bassl[s:e] += np.tanh(np.sin(2 * np.pi * bf * tt) * 1.5) * fade * 0.5
    pad = _band(pad, 120, 1400 if style != 'dark' else 800)
    pad *= 0.8 + 0.2 * np.sin(2 * np.pi * t / (bar * 2))
    out += pad * (1.0 if style != 'drive' else 0.7)
    if style == 'dark':
        out += _band(_noise(n, seed + 77), 40, 220) * 0.08
        out += bassl * 0.35 * (0.6 + 0.4 * np.sin(2 * np.pi * t / bar))
    else:
        # bajo en corcheas con sidechain del bombo
        side = 1 - 0.75 * np.exp(-((t % beat) / 0.09))
        out += bassl * (0.55 if style == 'pulse' else 0.75) * side
        out *= 0.6 + 0.4 * side
        kd = int(0.45 * SR)
        kt = np.arange(kd) / SR
        kick = np.tanh(_sine_glide(0.45, 150, 45, 22) * np.exp(-kt * 9) * 2.5)
        hat = _band(_noise(int(0.06 * SR), seed + 5), 7000, None) * np.exp(-np.arange(int(0.06 * SR)) / SR * 70)
        nbeats = int(duration / beat) + 1
        for i in range(nbeats):
            s = int(i * beat * SR)
            if i >= 4 or style == 'drive':
                e = min(n, s + kd)
                out[s:e] += kick[:e - s] * 0.9
            h = int((i + 0.5) * beat * SR)
            if h < n and (i >= 8 or style == 'drive'):
                e = min(n, h + len(hat))
                out[h:e] += hat[:e - h] * 0.25
    return _norm(out, 0.8)


def write_wav(path, x, sr=SR):
    x = np.asarray(x, np.float32)
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(x.shape[1])
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    d = sys.argv[1]
    os.makedirs(d, exist_ok=True)
    for k in SFX:
        x, a = make(k)
        write_wav(os.path.join(d, f'{k}.wav'), x)
        print(f'{k:8s} {len(x) / SR:5.2f}s  anchor {a:.2f}s')
    if '--bed' in sys.argv:
        dur = float(sys.argv[sys.argv.index('--bed') + 1])
        for st in ('pulse', 'dark', 'drive'):
            write_wav(os.path.join(d, f'bed-{st}.wav'), bed(dur, style=st))
            print(f'bed-{st}.wav')
