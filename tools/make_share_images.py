"""Draws the images used when a link to the site is shared, and the home-screen icons.

Usage:  python tools/make_share_images.py

Needs Google Chrome (or set CHROME_PATH) and the Pillow package. The wording comes
from src/_data/i18n, so run this again if the headline or the centre's name changes.
Output goes to src/assets/img/: share-en.jpg, share-bn.jpg, icon-180.png, icon-512.png.
"""
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "assets" / "img"
CARD_SIZE = (1200, 630)          # the size Facebook, WhatsApp and LinkedIn expect
ICON_SIZES = (180, 512)          # iPhone home screen, Android home screen
WINDOW_MARGIN = 200              # render in a larger window, then crop, so browser chrome never cuts the image
JPEG_QUALITY = 88
RENDER_WAIT_MS = 8000            # time allowed for web fonts to load

CHROME_CANDIDATES = [
    os.environ.get("CHROME_PATH", ""),
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
]

MARK = (
    '<circle cx="20" cy="14.5" r="4.6" fill="#fff"/>'
    '<path d="M11.5 37c0-8.6 3.6-15 8.5-15 2.400 0 4.400 1.300 5.800 3.400" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>'
    '<circle cx="30.5" cy="24.5" r="3.4" fill="#fff"/>'
    '<path d="M23.5 37c0-4.800 3.100-8.200 7-8.200s7 3.400 7 8.200" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>'
)

CARD_HTML = """<!DOCTYPE html>
<html lang="__LANG__"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500..800&family=Hind+Siliguri:wght@400;600;700&display=block" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #06306f; }
  .card { position: relative; width: 1200px; height: 630px; overflow: hidden; color: #fff; padding: 64px 72px;
    font-family: __FONT__;
    background: radial-gradient(60% 90% at 90% 10%, #1a76dd 0%, transparent 62%), linear-gradient(120deg, #06306f 0%, #0a5cb8 100%); }
  .rings { position: absolute; right: -150px; top: 50%; width: 720px; height: 720px; transform: translateY(-50%); }
  .brand { display: flex; align-items: center; gap: 20px; }
  .brand svg { width: 84px; height: 84px; }
  .brand b { display: block; font-size: 44px; line-height: 1.1; letter-spacing: __TRACK__; font-weight: __BOLD__; }
  .brand span { display: block; font-size: 21px; line-height: 1.3; color: #b9d4f6; font-weight: 600; margin-top: 4px; }
  h1 { position: absolute; left: 72px; bottom: 150px; width: 760px; font-size: __SIZE__; line-height: __LEAD__; letter-spacing: __HTRACK__; font-weight: __BOLD__; }
  h1 em { font-style: normal; box-shadow: inset 0 -0.13em 0 #ffb22e; }
  .foot { position: absolute; left: 72px; bottom: 64px; display: flex; align-items: center; gap: 14px; font-size: 25px; font-weight: 600; color: #dbe9fb; }
  .foot i { width: 12px; height: 12px; border-radius: 50%; background: #ffb22e; }
</style></head><body>
<div class="card">
  <svg class="rings" viewBox="0 0 600 600" fill="none" stroke="#fff">
    <circle cx="300" cy="300" r="110" fill="#fff" fill-opacity=".06" stroke-opacity=".3" stroke-width="1.5"/>
    <circle cx="300" cy="300" r="176" stroke-opacity=".32" stroke-width="3" stroke-dasharray="2 14" stroke-linecap="round"/>
    <circle cx="300" cy="300" r="240" stroke-opacity=".16" stroke-width="1.5"/>
    <circle cx="300" cy="300" r="298" stroke-opacity=".1" stroke-width="1.5"/>
    <circle cx="470" cy="130" r="17" fill="#ffb22e" stroke="none"/>
    <g transform="translate(180 176) scale(5)" stroke="none">__MARK__</g>
  </svg>
  <div class="brand">
    <svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="#fff" fill-opacity=".16"/>__MARK__</svg>
    <div><b>__NAME__</b><span>__SUB__</span></div>
  </div>
  <h1>__LINE1__<br>__LINE2__ <em>__LINE3__</em></h1>
  <div class="foot"><i></i>__KICKER__</div>
</div>
</body></html>
"""

ICON_HTML = """<!DOCTYPE html><html><head><meta charset="utf-8">
<style>* { margin: 0; } body { width: __S__px; height: __S__px; overflow: hidden; background: #0a5cb8; }
svg { display: block; width: __S__px; height: __S__px; }</style></head><body>
<svg viewBox="-6 -6 60 60"><rect x="-6" y="-6" width="60" height="60" fill="#0a5cb8"/>__MARK__</svg>
</body></html>
"""

STYLE = {
    "en": {"FONT": '"Archivo", Arial, sans-serif', "BOLD": "800", "SIZE": "72px", "LEAD": "1.04", "TRACK": ".04em", "HTRACK": "-.03em"},
    "bn": {"FONT": '"Hind Siliguri", "Nirmala UI", sans-serif', "BOLD": "700", "SIZE": "60px", "LEAD": "1.32", "TRACK": "0", "HTRACK": "0"},
}


def find_chrome():
    for candidate in CHROME_CANDIDATES:
        if candidate and Path(candidate).is_file():
            return candidate
    sys.exit("Google Chrome was not found. Set the CHROME_PATH environment variable to its location.")


def fill(template, values):
    for key, value in values.items():
        template = template.replace("__" + key + "__", value)
    return template


def render(chrome, html, size, target):
    """Opens the page in headless Chrome, screenshots it and crops it to the exact size."""
    width, height = size
    with tempfile.TemporaryDirectory() as work:
        page = Path(work) / "page.html"
        shot = Path(work) / "shot.png"
        page.write_text(html, encoding="utf-8")
        subprocess.run(
            [chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
             "--user-data-dir=" + str(Path(work) / "profile"),
             "--window-size=%d,%d" % (width + WINDOW_MARGIN, height + WINDOW_MARGIN),
             "--virtual-time-budget=%d" % RENDER_WAIT_MS, "--screenshot=" + str(shot), page.as_uri()],
            check=True, capture_output=True, timeout=120,
        )
        if not shot.is_file():
            sys.exit("Chrome did not produce a screenshot for " + target.name)
        with Image.open(shot) as image:
            cropped = image.convert("RGB").crop((0, 0, width, height))
            if target.suffix == ".jpg":
                cropped.save(target, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
            else:
                cropped.save(target, "PNG", optimize=True)
    print("wrote %s (%d KB)" % (target.relative_to(ROOT), target.stat().st_size // 1024))


def main():
    chrome = find_chrome()
    OUT.mkdir(parents=True, exist_ok=True)
    for code in ("en", "bn"):
        text = json.loads((ROOT / "src" / "_data" / "i18n" / (code + ".json")).read_text(encoding="utf-8"))
        values = dict(STYLE[code], LANG=code, MARK=MARK, NAME=text["meta"]["logo_name"], SUB=text["meta"]["logo_sub"],
                      LINE1=text["home"]["h1_a"], LINE2=text["home"]["h1_b"], LINE3=text["home"]["h1_em"],
                      KICKER=text["home"]["kicker"])
        render(chrome, fill(CARD_HTML, values), CARD_SIZE, OUT / ("share-%s.jpg" % code))
    for size in ICON_SIZES:
        render(chrome, fill(ICON_HTML, {"S": str(size), "MARK": MARK}), (size, size), OUT / ("icon-%d.png" % size))


if __name__ == "__main__":
    main()
