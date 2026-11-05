"""Re-pixelate the About-page sprites into clean pixel art.

The sprites started as AI-generated "pixel-style" images (see sprite-guide.md):
roughly 1,000 slightly different colours per 64x64 frame, soft alpha edges, and
an AI pixel grid (~5px) that does not line up with the 64px output, so
nearest-neighbour downscaling (process_sprite.py) dropped or doubled source
pixels and broke outlines.

This script rebuilds each frame from its AI source with the same crop and
framing as process_sprite.py, but:
  * one shared palette per character (weighted k-means, ~32 colours, plus a few
    pinned accent colours) so colours are consistent across animation frames;
  * each output pixel takes the dominant palette colour of the whole source
    block it covers (with extra weight for outlines and rare accents such as
    eyes), instead of one arbitrary sample point;
  * hard alpha (fully opaque or fully transparent).
Four frames whose source images in this folder are not the versions that were
used (gliding f2/f3, dashing f0, attacking f2) are cleaned from their original
SVGs instead: palette-snapped and given hard alpha.

Usage (repo root):  python3 animation/repixel_sprites.py
Writes animation/<sprite>.png, the files FrierenLiquidText.tsx imports.
"""
import os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from svg_to_png import rasterize  # noqa: E402
from pathlib import Path  # noqa: E402

A = HERE + '/'

# ── process_sprite.py steps up to (not including) the final resample ─────────
CK_TOLERANCE, CK_SOFT_BAND, SPILL_AMOUNT, CROP_PADDING, INNER_TRIM = 110, 80, 0.85, 6, 3

def bg_color(arr):
    h, w = arr.shape[:2]; c = 20; s = []
    for ys in [slice(0, c), slice(h - c, h)]:
        for xs in [slice(0, c), slice(w - c, w)]:
            s.append(arr[ys, xs, :3].reshape(-1, 3))
    return tuple(np.median(np.vstack(s).astype(float), axis=0))

def chroma_key(arr, bg):
    r, g, b = [arr[:, :, i].astype(float) for i in range(3)]
    dist = np.sqrt((r - bg[0])**2 + (g - bg[1])**2 + (b - bg[2])**2)
    out = arr.copy(); out[dist < CK_TOLERANCE, 3] = 0
    soft = (dist >= CK_TOLERANCE) & (dist < CK_TOLERANCE + CK_SOFT_BAND)
    out[soft, 3] = (out[soft, 3] * ((dist[soft] - CK_TOLERANCE) / CK_SOFT_BAND)).astype(np.uint8)
    surv = out[:, :, 3] > 0
    ex = np.maximum(g - np.maximum(r, b), 0)
    out[:, :, 1] = np.where(surv, np.clip(g - ex * SPILL_AMOUNT, 0, 255), out[:, :, 1]).astype(np.uint8)
    return out

def quads(W, H, mode):
    if mode == '1x1': return [('f0', 0, 0, W, H)]
    if mode == '1x2': return [('f0', 0, 0, W, H//2), ('f1', 0, H//2, W, H)]
    if mode == '1x4': return [(f'f{i}', W*i//4, 0, W*(i+1)//4, H) for i in range(4)]
    if mode == '2x4': return [(f'f{i}', W*(i%4)//4, H*(i//4)//2, W*(i%4+1)//4, H*(i//4+1)//2) for i in range(8)]
    return [('f0', 0, 0, W//2, H//2), ('f1', W//2, 0, W, H//2), ('f2', 0, H//2, W//2, H), ('f3', W//2, H//2, W, H)]

def cropped_frames(path, mode):
    """Returns {name: cropped RGBA image} exactly as process_sprite.py had them before fit_to_square."""
    src = np.array(Image.open(path).convert('RGBA')); H, W = src.shape[:2]; bg = bg_color(src); out = {}
    for name, x0, y0, x1, y1 in quads(W, H, mode):
        q = src[y0+INNER_TRIM:y1-INNER_TRIM, x0+INNER_TRIM:x1-INNER_TRIM].copy()
        if name == 'f3':
            q[int((y1-y0)*.82):, int((x1-x0)*.82):] = [int(bg[0]), int(bg[1]), int(bg[2]), 255]
        im = Image.fromarray(chroma_key(q, bg), 'RGBA'); bb = im.getbbox()
        if not bb: continue
        out[name] = im.crop((max(0, bb[0]-CROP_PADDING), max(0, bb[1]-CROP_PADDING), min(im.width, bb[2]+CROP_PADDING), min(im.height, bb[3]+CROP_PADDING)))
    return out

def placement(img, size=64):
    w, h = img.size; s = min(size / w, size / h); nw, nh = int(w * s), int(h * s)
    return nw, nh, (size - nw) // 2, (size - nh) // 2

def nearest(img, size=64):
    nw, nh, px, py = placement(img, size)
    sq = Image.new('RGBA', (size, size), (0, 0, 0, 0)); sq.paste(img.resize((nw, nh), Image.NEAREST), (px, py)); return sq

# ── Palette + re-pixelation ──────────────────────────────────────────────────
def to_index(rgb, pal):
    d = ((rgb[..., None, :].astype(float) - pal[None, None, :, :])**2).sum(-1)
    return d.argmin(-1)

def build_palette_km(images, n, min_count=40, power=0.35, iters=30, seed=0, bits=5):
    """Weighted k-means palette. Colours are binned (5 bits/channel); each bin is
    weighted by count**power, so small but distinct accents (eyes, gems) keep
    their own palette entry instead of being swallowed by large areas."""
    px = np.concatenate([np.array(im)[..., :3][np.array(im)[..., 3] >= 128] for im in images]).astype(int)
    sh = 8 - bits
    keys = (px[:, 0] >> sh) * 65536 + (px[:, 1] >> sh) * 256 + (px[:, 2] >> sh)
    uniq, inv, cnt = np.unique(keys, return_inverse=True, return_counts=True)
    means = np.zeros((len(uniq), 3)); np.add.at(means, inv, px); means /= cnt[:, None]
    keep = cnt >= min_count; X = means[keep]; w = cnt[keep] ** power
    rng = np.random.default_rng(seed)
    C = [X[np.argmax(w)]]                                   # k-means++ init (weighted)
    for _ in range(n - 1):
        d = np.min(((X[:, None] - np.array(C)[None])**2).sum(-1), 1) * w
        C.append(X[rng.choice(len(X), p=d / d.sum())])
    C = np.array(C)
    for _ in range(iters):
        lab = ((X[:, None] - C[None])**2).sum(-1).argmin(1)
        for k in range(n):
            m = lab == k
            if m.any(): C[k] = (X[m] * w[m, None]).sum(0) / w[m].sum()
    return np.round(C)

def area_mode2(img, pal, size=64, outline_boost=1.6, rarity=0.5, rarity_cap=4.0, global_counts=None):
    """Like area_mode, but globally rare palette colours (eyes, gems, mouth) get
    extra weight so 1-2px features survive the downsample."""
    nw, nh, px, py = placement(img, size)
    a = np.array(img); W, H = img.size
    idx = to_index(a[..., :3], pal); opaque = a[..., 3] >= 128
    if global_counts is None: global_counts = np.bincount(idx[opaque], minlength=len(pal))
    freq = np.maximum(global_counts, 1) / global_counts.sum()
    w_rare = np.clip((np.median(freq) / freq) ** rarity, 1.0, rarity_cap)
    lum = pal @ np.array([.299, .587, .114])
    weight = w_rare * np.where(lum < 60, outline_boost, 1.0)
    out = np.zeros((size, size, 4), np.uint8)
    xs = np.linspace(0, W, nw + 1); ys = np.linspace(0, H, nh + 1)
    for j in range(nh):
        y0, y1 = int(round(ys[j])), max(int(round(ys[j+1])), int(round(ys[j])) + 1)
        for i in range(nw):
            x0, x1 = int(round(xs[i])), max(int(round(xs[i+1])), int(round(xs[i])) + 1)
            o = opaque[y0:y1, x0:x1]
            if o.mean() < 0.5: continue
            counts = np.bincount(idx[y0:y1, x0:x1][o], minlength=len(pal)) * weight
            out[py + j, px + i, :3] = pal[counts.argmax()]; out[py + j, px + i, 3] = 255
    return Image.fromarray(out, 'RGBA')

def global_counts(images, pal):
    c = np.zeros(len(pal), int)
    for im in images:
        a = np.array(im); m = a[..., 3] >= 128
        c += np.bincount(to_index(a[..., :3], pal)[m], minlength=len(pal))
    return c

def snap(img, pal):
    """Clean an existing 64px sprite: palette-snap colours, hard alpha."""
    a = np.array(img.convert('RGBA')); out = np.zeros_like(a)
    m = a[..., 3] >= 128
    out[..., :3] = pal[to_index(a[..., :3], pal)].astype(np.uint8); out[..., 3] = np.where(m, 255, 0)
    out[~m, :3] = 0
    return Image.fromarray(out, 'RGBA')

def cluster_pins(pixels, k, iters=20):
    """k-means centres of a selected pixel set (used to pin colours a region needs)."""
    X = pixels.astype(float)
    C = X[np.linspace(0, len(X) - 1, k).astype(int)][np.argsort(X[np.linspace(0, len(X) - 1, k).astype(int)].sum(1))]
    for _ in range(iters):
        lab = ((X[:, None] - C[None])**2).sum(-1).argmin(1)
        for j in range(k):
            if (lab == j).any(): C[j] = X[lab == j].mean(0)
    return np.round(C)

# ── Per-character settings ───────────────────────────────────────────────────
CHARS = {
  'frieren': dict(sources=[('Gemini_Generated_Image_Frieren_4f.png', '2x2', 'frieren_idle', ['f1', 'f3'])],
                  snap=['frieren_gliding_f2', 'frieren_gliding_f3', 'frieren_dashing_f0', 'frieren_attacking_f2'],  # cleaned from original SVGs
                  pins=[(111, 143, 137)],
                  auto_pins=[(lambda c: (c[..., 2] > 150) & (c[..., 1] > 140) & (c[..., 0] < c[..., 2] - 40), 2, ['frieren_attacking_f2'])]),
  'fern':    dict(sources=[('fern_walking_3.png', '2x4', 'fern_walk4', [f'f{i}' for i in range(8)]),
                           ('fern_pulling.png', '1x2', 'fern_pulling', ['f0', 'f1'])], snap=[], pins=[],
                  auto_pins=[(lambda c: (c.max(-1) < 110) & (c.max(-1) - c.min(-1) < 14), 3, None)]),
  'mimic':   dict(sources=[('mimic_close.png', '1x1', 'mimic_closed', ['f0']),
                           ('mimic_chomping.png', '2x2', 'mimic_chomping', ['f0', 'f1', 'f2', 'f3']),
                           ('mimic_chewing.png', '2x2', 'mimic_chewing', ['f0', 'f1', 'f2', 'f3'])], snap=[], pins=[]),
}


def original_sprite(name):
    """The untouched sprite, rasterised from its original SVG."""
    return rasterize(Path(A + name + '.svg'))


def main():
    for char, cfg in CHARS.items():
        crops = {}
        for src, mode, prefix, names in cfg['sources']:
            fr = cropped_frames(A + src, mode)
            for n in names:
                crops[f'{prefix}_{n}'] = fr[n]
        snaps = {n: original_sprite(n) for n in cfg['snap']}
        imgs = list(crops.values())
        pal = build_palette_km(imgs, 32, min_count=15, bits=4)
        if cfg['pins']:
            pal = np.vstack([pal, cfg['pins']])
        for sel, k, from_sprites in cfg.get('auto_pins', []):
            srcs = [np.array(snaps[n]) for n in from_sprites] if from_sprites else [np.array(im) for im in imgs]
            px = np.concatenate([a[..., :3][(a[..., 3] >= 128) & sel(a[..., :3].astype(int))] for a in srcs])
            pal = np.vstack([pal, cluster_pins(px, k)])
        gc = global_counts(imgs, pal)
        out = {n: area_mode2(im, pal, rarity=0.7, rarity_cap=6, global_counts=gc) for n, im in crops.items()}
        out.update({n: snap(im, pal) for n, im in snaps.items()})
        for n, im in out.items():
            im.save(A + n + '.png', optimize=True)
        print(f'{char}: {len(out)} sprites, {len(pal)}-colour palette')


if __name__ == '__main__':
    main()
