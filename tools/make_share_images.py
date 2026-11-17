"""Draws the images shown when a link to the site is shared (Facebook, WhatsApp, etc.).

Usage:  python tools/make_share_images.py

Needs Google Chrome (or set CHROME_PATH) and the Pillow package. The wording comes
from src/_data/i18n and the logo from src/assets/img/logo-radda-white.png, so run
this again if the headline, the centre's name or the logo changes.
Output goes to src/assets/img/: share-en.jpg and share-bn.jpg.
"""
import base64
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "assets" / "img"
LOGO = OUT / "logo-radda-white.png"
CARD_SIZE = (1200, 630)          # the size Facebook, WhatsApp and LinkedIn expect
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

CARD_HTML = """<!DOCTYPE html>
<html lang="__LANG__"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500..800&family=Hind+Siliguri:wght@400;600;700&display=block" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #0a3f7f; }
  .card { position: relative; width: 1200px; height: 630px; overflow: hidden; color: #fff; padding: 64px 72px; font-family: __FONT__; background: #0a3f7f; }
  .disc { position: absolute; right: 64px; top: 50%; width: 320px; height: 320px; margin-top: -160px; border-radius: 50%; background: #0a5cb8; display: grid; place-items: center; }
  .disc img { width: 230px; height: 230px; }
  .brand { display: flex; align-items: center; gap: 18px; }
  .brand img { width: 84px; height: 84px; }
  .brand b { display: block; font-size: 44px; line-height: 1.1; letter-spacing: __TRACK__; font-weight: __BOLD__; }
  .brand span { display: block; font-size: 21px; line-height: 1.3; color: #b9d4f6; font-weight: 600; margin-top: 4px; }
  h1 { position: absolute; left: 72px; bottom: 150px; width: 700px; font-size: __SIZE__; line-height: __LEAD__; letter-spacing: __HTRACK__; font-weight: __BOLD__; }
  h1 em { font-style: normal; box-shadow: inset 0 -0.09em 0 #ffb22e; }
  .foot { position: absolute; left: 72px; bottom: 64px; display: flex; align-items: center; gap: 14px; font-size: 25px; font-weight: 600; color: #dbe9fb; }
  .foot i { width: 28px; height: 4px; background: #ffb22e; }
</style></head><body>
<div class="card">
  <div class="disc"><img src="__LOGO__" alt=""></div>
  <div class="brand">
    <img src="__LOGO__" alt="">
    <div><b>__NAME__</b><span>__SUB__</span></div>
  </div>
  <h1>__LINE1__<br>__LINE2__ <em>__LINE3__</em></h1>
  <div class="foot"><i></i>__KICKER__</div>
</div>
</body></html>
"""

STYLE = {
    "en": {"FONT": '"Archivo", Arial, sans-serif', "BOLD": "700", "SIZE": "64px", "LEAD": "1.06", "TRACK": ".04em", "HTRACK": "-.025em"},
    "bn": {"FONT": '"Hind Siliguri", "Nirmala UI", sans-serif', "BOLD": "600", "SIZE": "56px", "LEAD": "1.34", "TRACK": "0", "HTRACK": "0"},
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
            image.convert("RGB").crop((0, 0, width, height)).save(target, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
    print("wrote %s (%d KB)" % (target.relative_to(ROOT), target.stat().st_size // 1024))


def main():
    if not LOGO.is_file():
        sys.exit("Missing %s. Run tools/prepare_logo.py first." % LOGO.relative_to(ROOT))
    chrome = find_chrome()
    logo = "data:image/png;base64," + base64.b64encode(LOGO.read_bytes()).decode("ascii")
    for code in ("en", "bn"):
        text = json.loads((ROOT / "src" / "_data" / "i18n" / (code + ".json")).read_text(encoding="utf-8"))
        values = dict(STYLE[code], LANG=code, LOGO=logo, NAME=text["meta"]["logo_name"], SUB=text["meta"]["logo_sub"],
                      LINE1=text["home"]["h1_a"], LINE2=text["home"]["h1_b"], LINE3=text["home"]["h1_em"],
                      KICKER=text["home"]["kicker"])
        render(chrome, fill(CARD_HTML, values), CARD_SIZE, OUT / ("share-%s.jpg" % code))


if __name__ == "__main__":
    main()
