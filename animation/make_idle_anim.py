"""
make_idle_anim.py
-----------------
Takes a single cleaned character PNG (transparent bg) and generates
a 4-frame hover animation by applying subtle vertical bob offsets.

Outputs:
  frieren_idle_sheet.png  — 4 frames horizontal (256×64 or configured size)
  frieren_idle_f0..f3.png — individual frames for inspection

Usage:
  python make_idle_anim.py [input.png] [frame_w] [frame_h]
  Default: frieren_single_clean.png, 64, 64
"""

import sys, os, subprocess

def install(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])

try:
    from PIL import Image
    import numpy as np
except ImportError:
    install("pillow"); install("numpy")
    from PIL import Image
    import numpy as np

# ── Config ────────────────────────────────────────────────────────────────────
INPUT   = sys.argv[1] if len(sys.argv) > 1 else "frieren_single_clean.png"
FRAME_W = int(sys.argv[2]) if len(sys.argv) > 2 else 64
FRAME_H = int(sys.argv[3]) if len(sys.argv) > 3 else 64
OUT_DIR = os.path.dirname(os.path.abspath(INPUT))

# Bob offsets per frame (pixels, positive = down)
# Loop: 0 → -2 → -4 → -2 → (back to 0)
# Smooth 4-frame hover cycle
BOB_Y = [0, -2, -4, -2]

# Optional: slight hair-tip horizontal sway (last 20% of height)
SWAY_X = [0, 1, 0, -1]

# ── Load source ───────────────────────────────────────────────────────────────
src_path = os.path.join(OUT_DIR, INPUT)
print(f"Loading {src_path}...")
src = Image.open(src_path).convert("RGBA")
sw, sh = src.size
print(f"  Source: {sw}×{sh}")

# ── Generate frames ────────────────────────────────────────────────────────────
frames = []
for i, (dy, dx) in enumerate(zip(BOB_Y, SWAY_X)):
    # Create a blank frame canvas (same size as source)
    canvas = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))

    # Paste source with bob offset
    canvas.paste(src, (dx, dy))

    # Optionally add hair sway: take bottom 20% of image, shift slightly
    # (This gives a gentle cape/hair flutter feel)
    hair_zone_y = int(sh * 0.0)   # top 30% — where Frieren's twintails are
    hair_zone_h = int(sh * 0.30)

    if dx != 0 and hair_zone_h > 0:
        hair_strip = src.crop((0, hair_zone_y, sw, hair_zone_y + hair_zone_h))
        canvas.paste(hair_strip, (dx * 2, hair_zone_y + dy))   # exaggerate hair sway

    # Scale to output frame size with NEAREST (pixel-crisp)
    frame = canvas.resize((FRAME_W, FRAME_H), Image.NEAREST)
    frames.append(frame)

    out_f = os.path.join(OUT_DIR, f"frieren_idle_f{i}.png")
    frame.save(out_f)
    print(f"  Frame {i} (bob={dy:+d}px, sway={dx:+d}px) → {out_f}")

# ── Assemble horizontal sprite sheet ─────────────────────────────────────────
sheet_w = FRAME_W * len(frames)
sheet   = Image.new("RGBA", (sheet_w, FRAME_H), (0, 0, 0, 0))
for i, frame in enumerate(frames):
    sheet.paste(frame, (i * FRAME_W, 0))

sheet_path = os.path.join(OUT_DIR, "frieren_idle_sheet.png")
sheet.save(sheet_path)
print(f"\nSpritesheet saved: {sheet_path}")
print(f"  Size: {sheet_w}×{FRAME_H}  ({len(frames)} frames × {FRAME_W}px)")
print("\nDone! Each frame has a +0 / -2 / -4 / -2 px vertical bob.")
print("Open frieren_idle_f0..f3.png to inspect each frame individually.")
