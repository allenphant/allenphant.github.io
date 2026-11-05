"""Rasterize the pixel-art sprite SVGs to native-resolution PNGs.

The sprite SVGs are 64x64 grids made only of axis-aligned <rect> elements
(one per run of same-coloured pixels, optionally with `opacity`). Shipped as
SVG they weigh 45-130 KB each because every pixel is a text element; as PNG
the same pixels are a few KB. The About page canvas draws sprites scaled with
image smoothing disabled, so a 64x64 PNG renders identically.

Usage (from the repo root):
    python3 animation/svg_to_png.py animation/frieren_idle_f1.svg [...]
Writes <name>.png next to each input.
"""
import re
import sys
from pathlib import Path

from PIL import Image

RECT = re.compile(r"<rect\b([^>]*)/?>")
ATTR = re.compile(r'([a-zA-Z-]+)="([^"]*)"')
VIEWBOX = re.compile(r'viewBox="0 0 (\d+) (\d+)"')


def parse_color(value: str) -> tuple[int, int, int]:
    value = value.strip()
    if value.startswith("#") and len(value) == 7:
        return tuple(int(value[i:i + 2], 16) for i in (1, 3, 5))  # type: ignore[return-value]
    if value.startswith("#") and len(value) == 4:
        return tuple(int(c * 2, 16) for c in value[1:])  # type: ignore[return-value]
    raise ValueError(f"unsupported fill colour: {value!r}")


def rasterize(svg_path: Path) -> Image.Image:
    """Rasterize a pixel-art SVG to an RGBA image (in memory)."""
    text = svg_path.read_text()
    vb = VIEWBOX.search(text)
    if not vb:
        raise ValueError(f"{svg_path}: no '0 0 W H' viewBox")
    width, height = int(vb.group(1)), int(vb.group(2))
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))

    for match in RECT.finditer(text):
        attrs = dict(ATTR.findall(match.group(1)))
        x, y = int(float(attrs["x"])), int(float(attrs["y"]))
        w, h = int(float(attrs["width"])), int(float(attrs["height"]))
        r, g, b = parse_color(attrs["fill"])
        alpha = float(attrs.get("opacity", "1")) * float(attrs.get("fill-opacity", "1"))
        # Paint in document order with source-over compositing, like a browser.
        layer = Image.new("RGBA", (w, h), (r, g, b, round(alpha * 255)))
        img.alpha_composite(layer, (x, y))
    return img


def convert(svg_path: Path) -> Path:
    out = svg_path.with_suffix(".png")
    rasterize(svg_path).save(out, optimize=True)
    return out


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    for arg in sys.argv[1:]:
        src = Path(arg)
        out = convert(src)
        print(f"{src} ({src.stat().st_size} B) -> {out} ({out.stat().st_size} B)")
