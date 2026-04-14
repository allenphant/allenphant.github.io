"""
process_sprite.py
-----------------
Process an AI-generated 2×2 sprite sheet (green-screen background):
  - Detects actual background color from corners
  - Removes background with Euclidean-distance chroma key (catches AA edge pixels)
  - Applies green spill removal to surviving edge pixels
  - Crops with padding, resizes maintaining aspect ratio, pads to square
  - Exports 4 individual PNGs + 1 horizontal sprite sheet
  - Optionally exports SVG versions (vector, scales losslessly)

Usage:
  python process_sprite.py <input.png> [output_size]
  Default: Gemini_Generated_Image_Frieren_4f.png, 64
"""

import sys, os, subprocess

def install(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])

try:
    from PIL import Image, ImageFilter
    import numpy as np
except ImportError:
    install("pillow"); install("numpy")
    from PIL import Image, ImageFilter
    import numpy as np

# ── Config ────────────────────────────────────────────────────────────────────
INPUT        = sys.argv[1] if len(sys.argv) > 1 else "Gemini_Generated_Image_Frieren_4f.png"
OUTPUT_SIZE  = int(sys.argv[2]) if len(sys.argv) > 2 else 64
OUT_DIR      = os.path.dirname(os.path.abspath(INPUT)) or "."
# Output prefix: pass as 3rd arg, or auto-derive from input filename (strip Gemini prefix/suffix noise)
if len(sys.argv) > 3:
    PREFIX = sys.argv[3]
else:
    base = os.path.splitext(os.path.basename(INPUT))[0]  # e.g. Gemini_Generated_Image_Frieren_gliding_4f
    # Extract meaningful part: lowercase words after "Frieren" (or fallback to full base)
    import re
    m = re.search(r'[Ff]rieren[_\s]*(.*?)(?:_4f|_2f)?$', base)
    suffix = m.group(1).strip('_ ').lower() if m and m.group(1).strip('_ ') else 'sprite'
    PREFIX = f'frieren_{suffix}' if suffix else 'frieren_sprite'
print(f"  Output prefix: {PREFIX}")
# Grid mode: '2x2' (default) or '1x1' (single frame, whole image)
GRID_MODE = sys.argv[4] if len(sys.argv) > 4 else '2x2'
print(f"  Grid mode: {GRID_MODE}")
EXPORT_SVG      = True   # export .svg (permanent output)
EXPORT_PREVIEW  = True   # also save *_preview.png for human frame selection (delete after choosing)

# Chroma key parameters
CK_TOLERANCE = 110           # pixels within this Euclidean distance of bg → fully transparent
CK_SOFT_BAND = 80            # +this range → partial alpha (anti-aliasing recovery)
SPILL_AMOUNT = 0.85          # how aggressively to suppress green spill on surviving pixels
CROP_PADDING = 6             # px padding added around tight bbox before scaling
INNER_TRIM   = 3             # px to trim from each quadrant's inner edges (removes grid-line artefacts)

# ── Helpers ───────────────────────────────────────────────────────────────────

def sample_background_color(arr: np.ndarray) -> tuple[float, float, float]:
    """Sample actual background color from image corners (avoids character area)."""
    h, w = arr.shape[:2]
    corner_size = 20
    samples = []
    for y_range in [slice(0, corner_size), slice(h - corner_size, h)]:
        for x_range in [slice(0, corner_size), slice(w - corner_size, w)]:
            patch = arr[y_range, x_range, :3].reshape(-1, 3)
            samples.append(patch)
    all_samples = np.vstack(samples).astype(float)
    # Use median to be robust against partial character overlap at corners
    return tuple(np.median(all_samples, axis=0))


def chroma_key(arr: np.ndarray, bg_rgb: tuple, tolerance: float, soft_band: float, spill: float) -> np.ndarray:
    """
    Distance-based chroma key removal with soft edges and spill correction.
    Works on any background color, not just pure green.
    """
    r = arr[:,:,0].astype(float)
    g = arr[:,:,1].astype(float)
    b = arr[:,:,2].astype(float)
    bg_r, bg_g, bg_b = bg_rgb

    # Euclidean distance from background color
    dist = np.sqrt((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2)

    out = arr.copy()

    # Hard remove: definitely background
    hard = dist < tolerance
    out[hard, 3] = 0

    # Soft remove: anti-aliasing edge pixels
    soft_mask = (dist >= tolerance) & (dist < tolerance + soft_band)
    if np.any(soft_mask):
        # Linear falloff: 0 alpha at dist=tolerance, full at dist=tolerance+soft_band
        soft_t = (dist[soft_mask] - tolerance) / soft_band
        out[soft_mask, 3] = (out[soft_mask, 3] * soft_t).astype(np.uint8)

    # Green spill removal: subtract excess green from pixels that survived
    # Excess green = how much the green channel exceeds max(r, b)
    surviving = out[:,:,3] > 0
    green_excess = np.maximum(g - np.maximum(r, b), 0)
    new_g = np.clip(g - green_excess * spill, 0, 255)
    out[:,:,1] = np.where(surviving, new_g, out[:,:,1]).astype(np.uint8)

    return out


def fit_to_square(img: Image.Image, size: int) -> Image.Image:
    """Resize keeping aspect ratio, then pad with transparency to exactly size×size."""
    w, h = img.size
    scale = min(size / w, size / h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    resized = img.resize((new_w, new_h), Image.NEAREST)

    square = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    paste_x = (size - new_w) // 2
    paste_y = (size - new_h) // 2
    square.paste(resized, (paste_x, paste_y))
    return square


def png_to_svg(img: Image.Image, out_path: str) -> None:
    """
    Convert pixel art PNG to SVG.
    Each row is run-length encoded into <rect> elements — scales to any DPI.
    Uses shape-rendering="crispEdges" so browsers render it pixel-perfect.
    """
    w, h = img.size
    arr = np.array(img.convert("RGBA"))

    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg"',
        f'     width="{w}" height="{h}" viewBox="0 0 {w} {h}"',
        f'     shape-rendering="crispEdges" image-rendering="pixelated">',
    ]

    for y in range(h):
        x = 0
        row = arr[y]
        while x < w:
            a = int(row[x, 3])
            if a < 10:
                x += 1
                continue
            r, g, b = int(row[x, 0]), int(row[x, 1]), int(row[x, 2])
            # Extend run of visually same color
            x_end = x + 1
            while x_end < w:
                r2, g2, b2, a2 = int(row[x_end, 0]), int(row[x_end, 1]), int(row[x_end, 2]), int(row[x_end, 3])
                if a2 < 10 or abs(r2-r)+abs(g2-g)+abs(b2-b) > 12:
                    break
                x_end += 1
            run_w = x_end - x
            fill   = f'#{r:02x}{g:02x}{b:02x}'
            opacity = '' if a >= 255 else f' opacity="{a/255:.2f}"'
            lines.append(f'  <rect x="{x}" y="{y}" width="{run_w}" height="1" fill="{fill}"{opacity}/>')
            x = x_end

    lines.append('</svg>')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))


# ── Main ─────────────────────────────────────────────────────────────────────

src_path = os.path.abspath(INPUT)
print(f"Loading {src_path}...")
src = Image.open(src_path).convert("RGBA")
W, H = src.size
print(f"  Size: {W}×{H}")

# Sample actual background color BEFORE splitting quadrants
src_arr = np.array(src)
bg_color = sample_background_color(src_arr)
print(f"  Background color (sampled): R={bg_color[0]:.0f} G={bg_color[1]:.0f} B={bg_color[2]:.0f}")

# Grid split
if GRID_MODE == '1x1':
    quadrants = [('f0', 0, 0, W, H)]
elif GRID_MODE == '1x2':
    # Two frames stacked vertically (top / bottom)
    quadrants = [
        ('f0', 0, 0,    W, H//2),
        ('f1', 0, H//2, W, H   ),
    ]
elif GRID_MODE == '1x4':
    # Four frames in a horizontal row (left → right)
    quadrants = [
        ('f0', 0,      0, W//4,   H),
        ('f1', W//4,   0, W//2,   H),
        ('f2', W//2,   0, W*3//4, H),
        ('f3', W*3//4, 0, W,      H),
    ]
elif GRID_MODE == '2x4':
    # Eight frames: 2 rows × 4 columns
    quadrants = [
        ('f0', 0,      0,    W//4,   H//2),
        ('f1', W//4,   0,    W//2,   H//2),
        ('f2', W//2,   0,    W*3//4, H//2),
        ('f3', W*3//4, 0,    W,      H//2),
        ('f4', 0,      H//2, W//4,   H   ),
        ('f5', W//4,   H//2, W//2,   H   ),
        ('f6', W//2,   H//2, W*3//4, H   ),
        ('f7', W*3//4, H//2, W,      H   ),
    ]
else:
    # 2×2 quadrant split order: TL, TR, BL, BR = frames 0,1,2,3
    quadrants = [
        ('f0', 0,    0,    W//2, H//2),
        ('f1', W//2, 0,    W,    H//2),
        ('f2', 0,    H//2, W//2, H   ),
        ('f3', W//2, H//2, W,    H   ),  # Gemini watermark is here
    ]

frames_out = []

for name, x0, y0, x1, y1 in quadrants:
    print(f"\n  Processing {name}...")
    # Trim all edges to remove grid-line and outer-border artefacts
    tx0 = x0 + INNER_TRIM
    ty0 = y0 + INNER_TRIM
    tx1 = x1 - INNER_TRIM
    ty1 = y1 - INNER_TRIM
    quad_arr = src_arr[ty0:ty1, tx0:tx1].copy()

    # Erase watermark zone in f3 BEFORE chroma key (bottom-right 12% × 12%)
    if name == 'f3':
        wm_x = int((x1-x0) * 0.82)
        wm_y = int((y1-y0) * 0.82)
        quad_arr[wm_y:, wm_x:] = [int(bg_color[0]), int(bg_color[1]), int(bg_color[2]), 255]  # fill with sampled bg color
        print(f"    Watermark zone cleared ({wm_x},{wm_y})→corner")

    # Chroma key with distance-based soft edges
    cleaned_arr = chroma_key(quad_arr, bg_color, CK_TOLERANCE, CK_SOFT_BAND, SPILL_AMOUNT)
    quad_img = Image.fromarray(cleaned_arr, 'RGBA')

    # Tight bbox crop + padding
    bbox = quad_img.getbbox()
    if not bbox:
        print(f"    WARNING: {name} is entirely transparent after chroma key!")
        continue
    x0b, y0b, x1b, y1b = bbox
    x0b = max(0, x0b - CROP_PADDING)
    y0b = max(0, y0b - CROP_PADDING)
    x1b = min(quad_img.width,  x1b + CROP_PADDING)
    y1b = min(quad_img.height, y1b + CROP_PADDING)
    cropped = quad_img.crop((x0b, y0b, x1b, y1b))
    print(f"    Content bbox (with {CROP_PADDING}px pad): ({x0b},{y0b})→({x1b},{y1b}) = {x1b-x0b}×{y1b-y0b}")

    # Fit to square (preserves aspect ratio, no cropping)
    frame = fit_to_square(cropped, OUTPUT_SIZE)
    frames_out.append(frame)

    # Save preview PNG (for human frame selection only — delete after choosing)
    if EXPORT_PREVIEW:
        preview_path = os.path.join(OUT_DIR, f'{PREFIX}_{name}_preview.png')
        frame.save(preview_path)
        print(f"    Preview: {preview_path}")

    # Save SVG
    if EXPORT_SVG:
        svg_path = os.path.join(OUT_DIR, f'{PREFIX}_{name}.svg')
        png_to_svg(frame, svg_path)
        svg_size_kb = os.path.getsize(svg_path) // 1024
        print(f"    Saved {svg_path}  ({svg_size_kb} KB)")

# ── Horizontal sprite sheet ───────────────────────────────────────────────────
n = len(frames_out)
sheet = Image.new('RGBA', (OUTPUT_SIZE * n, OUTPUT_SIZE), (0, 0, 0, 0))
for i, f in enumerate(frames_out):
    sheet.paste(f, (i * OUTPUT_SIZE, 0))

print(f"\nSprite sheet SVG only ({OUTPUT_SIZE*n}×{OUTPUT_SIZE}):")
if EXPORT_SVG:
    sheet_svg = os.path.join(OUT_DIR, f'{PREFIX}_sheet.svg')
    png_to_svg(sheet, sheet_svg)
    print(f"SVG sheet:   {sheet_svg}  ({os.path.getsize(sheet_svg)//1024} KB)")

print("\nDone!")
