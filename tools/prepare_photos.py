"""Crops and compresses photos for the site's photo spaces.

Usage:  python tools/prepare_photos.py <folder-with-originals>

Edit PHOTOS and PORTRAITS below to choose which original goes in which space. Each entry gives the
original file name (or the start of it), the shape of the space as width:height, and
where the important part of the picture is (0 to 1 across, 0 to 1 down), so the crop
keeps faces in frame. Output goes to src/assets/photos/ at web size, under MAX_KB.
Needs the Pillow package. Only use photos the centre owns, with consent from the
people shown.
"""
import io
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "assets" / "photos"
LONG_SIDE = 1600
MAX_KB = 380
START_QUALITY = 84
MIN_QUALITY = 60

PHOTOS = {
    #  slot              original starts with           shape     focus (across, down)
    "hero":            ("13_gallery_A-Family_Planning", (4, 3),   (0.45, 0.35)),
    "maternal":        ("02_gallery_A-Antenatal",       (3, 2),   (0.5, 0.4)),
    "child":           ("11_gallery_A-COVID_19",        (3, 2),   (0.5, 0.45)),
    "family-planning": ("12_gallery_A-Family_Planning", (3, 2),   (0.5, 0.4)),
    "about":           ("09_gallery_A-COVID_19",        (5, 4),   (0.45, 0.5)),
    "centre":          ("08_gallery_A-COVID_19",        (5, 4),   (0.55, 0.5)),
    "support":         ("22_news_IMG_1906",             (5, 4),   (0.35, 0.5)),
}

# Trustee portraits: small squares, cropped from the top so the face stays in frame.
PORTRAIT_SIDE = 240
PORTRAITS = {
    "trustee-mahbubur-rahman":        "Mr_Mahbubur_Rahman",
    "trustee-tahrunnesa-abdullah":    "Mrs_Tahrunnesa_Abdullah",
    "trustee-asm-quasem":             "Eng_A_S_M_Quasem",
    "trustee-abdul-muyeed-chowdhury": "Mr_Abdul_Muyeed_Chowdhury",
    "trustee-abdul-kader-azad":       "Mr_Abdul_Kader_Azad",
    "trustee-abdul-karim":            "Dr_Md_Abdul_Karim",
}
PORTRAIT_FOCUS = (0.5, 0.15)


def find_original(folder, prefix):
    matches = sorted(p for p in folder.iterdir() if p.name.startswith(prefix))
    if len(matches) != 1:
        sys.exit('Expected exactly one file starting with "%s" in %s, found %d.' % (prefix, folder, len(matches)))
    return matches[0]


def encode(image):
    """Lowers the JPEG quality step by step until the file is small enough."""
    for quality in range(START_QUALITY, MIN_QUALITY - 1, -4):
        buffer = io.BytesIO()
        image.save(buffer, "JPEG", quality=quality, optimize=True, progressive=True)
        if buffer.tell() <= MAX_KB * 1024:
            break
    return buffer.getvalue(), quality


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    folder = Path(sys.argv[1])
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = [(slot, prefix, shape, focus, LONG_SIDE) for slot, (prefix, shape, focus) in PHOTOS.items()]
    jobs += [(slot, prefix, (1, 1), PORTRAIT_FOCUS, PORTRAIT_SIDE) for slot, prefix in PORTRAITS.items()]
    for slot, prefix, shape, focus, long_side in jobs:
        original = find_original(folder, prefix)
        with Image.open(original) as opened:
            upright = ImageOps.exif_transpose(opened).convert("RGB")
        width = long_side if shape[0] >= shape[1] else round(long_side * shape[0] / shape[1])
        height = round(width * shape[1] / shape[0])
        fitted = ImageOps.fit(upright, (width, height), method=Image.LANCZOS, centering=focus)
        data, quality = encode(fitted)
        (OUT / (slot + ".jpg")).write_bytes(data)     # written without the camera's hidden details (EXIF)
        print("%-36s %dx%d  %3d KB  quality %d  from %s" % (slot + ".jpg", width, height, len(data) // 1024, quality, original.name))


if __name__ == "__main__":
    main()
