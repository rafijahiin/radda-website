"""Turns the centre's small logo file into the crisp versions the site needs.

Usage:  python tools/prepare_logo.py <logo-file>

The only copy of the Radda logo available was an 80 pixel JPEG. This script does not
redraw it: it enlarges the original, smooths the jagged edges, and separates the ink
from the white background. If the centre supplies a larger or vector logo, run this
on that file instead (or simply replace the output files).

Output in src/assets/img/:
  logo-radda.png        ink on a clear background, for light areas
  logo-radda-white.png  white on a clear background, for dark areas
  icon-32.png, icon-180.png, icon-512.png   ink on white, for browser tabs and home screens
Needs the Pillow package.
"""
import sys
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "assets" / "img"
INK = (17, 16, 117)              # the logo's own blue, measured from the original
WORK_SIZE = 1600                 # enlarge to this before smoothing
SMOOTHING = 7                    # blur radius at work size; removes JPEG speckle and stair-steps
INK_THRESHOLD = 150              # darker than this (0 to 255) counts as ink
LOGO_SIZE = 256
ICON_SIZES = (32, 180, 512)
ICON_PADDING = 0.14              # clear space around the logo inside an icon


def ink_mask(path):
    """Returns a large, clean black-and-white picture of where the ink is."""
    with Image.open(path) as opened:
        grey = ImageOps.exif_transpose(opened).convert("L")
    side = max(grey.size)
    square = Image.new("L", (side, side), 255)
    square.paste(grey, ((side - grey.size[0]) // 2, (side - grey.size[1]) // 2))
    large = square.resize((WORK_SIZE, WORK_SIZE), Image.BICUBIC).filter(ImageFilter.GaussianBlur(SMOOTHING))
    mask = large.point(lambda value: 255 if value < INK_THRESHOLD else 0)
    return mask.filter(ImageFilter.GaussianBlur(1.2))       # soften the cut edge a touch


def coloured(mask, colour, size):
    layer = Image.new("RGBA", mask.size, colour + (0,))
    layer.putalpha(mask)
    return layer.resize((size, size), Image.LANCZOS)


def icon(mask, size):
    inner = round(size * (1 - 2 * ICON_PADDING))
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    canvas.alpha_composite(coloured(mask, INK, inner), ((size - inner) // 2, (size - inner) // 2))
    return canvas.convert("RGB")


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    mask = ink_mask(Path(sys.argv[1]))
    OUT.mkdir(parents=True, exist_ok=True)
    coloured(mask, INK, LOGO_SIZE).save(OUT / "logo-radda.png", optimize=True)
    coloured(mask, (255, 255, 255), LOGO_SIZE).save(OUT / "logo-radda-white.png", optimize=True)
    for size in ICON_SIZES:
        icon(mask, size).save(OUT / ("icon-%d.png" % size), optimize=True)
    for name in ["logo-radda.png", "logo-radda-white.png"] + ["icon-%d.png" % s for s in ICON_SIZES]:
        print("wrote", name, (OUT / name).stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
