// Generates the Radda photo-slot illustrations. Usage: node make-art.js <output-dir>
"use strict";
const fs = require("fs");
const path = require("path");

const outDir = process.argv[2];
if (!outDir) { console.error("Usage: node make-art.js <output-dir>"); process.exit(1); }

const BLUE = "#0a5cb8", NAVY = "#061a38", SUN = "#ffb22e", B300 = "#7fb2ee", B200 = "#b9d4f6", WHITE = "#ffffff", GREEN = "#0b7a4b";

// A figure in the language of the Radda mark: a head above an arched body.
const arch = (x, base, w, h, fill) =>
  `<path d="M${x - w / 2} ${base}V${base - h + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V${base}z" fill="${fill}"/>`;
const fig = (x, base, w, h, fill) => {
  const r = Math.round(w * 0.31);
  return arch(x, base, w, h, fill) + `<circle cx="${x}" cy="${base - h - r - Math.round(w * 0.07)}" r="${r}" fill="${fill}"/>`;
};
const badge = (x, y, r, disc, cross) => {
  const a = r * 0.3, b = r * 0.62;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${disc}"/>` +
    `<rect x="${x - a}" y="${y - b}" width="${a * 2}" height="${b * 2}" rx="${a * 0.5}" fill="${cross}"/>` +
    `<rect x="${x - b}" y="${y - a}" width="${b * 2}" height="${a * 2}" rx="${a * 0.5}" fill="${cross}"/>`;
};
const plus = (x, y, s, fill, o = 1) =>
  `<g fill="${fill}" opacity="${o}"><rect x="${x - s / 6}" y="${y - s / 2}" width="${s / 3}" height="${s}" rx="${s / 6}"/><rect x="${x - s / 2}" y="${y - s / 6}" width="${s}" height="${s / 3}" rx="${s / 6}"/></g>`;
const heart = (x, y, k, fill) =>
  `<path transform="translate(${x} ${y}) scale(${k})" d="M0 -6C-10 -20 -30 -8 -18 10L0 26 18 10C30 -8 10 -20 0 -6z" fill="${fill}"/>`;
const stage = (bg, disc, ring) =>
  `<rect width="600" height="400" fill="${bg}"/><circle cx="300" cy="255" r="192" fill="${disc}"/>` +
  `<circle cx="300" cy="255" r="236" fill="none" stroke="${ring}" stroke-width="3" stroke-dasharray="2 14" stroke-linecap="round"/>`;
const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">${body}</svg>\n`;

const art = {
  "art-hero.svg": svg(480, 600,
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a8ff0"/><stop offset="1" stop-color="#0a4fa3"/></linearGradient></defs>` +
    `<rect width="480" height="600" fill="url(#g)"/>` +
    `<circle cx="240" cy="270" r="230" fill="#fff" opacity=".08"/><circle cx="240" cy="270" r="150" fill="#fff" opacity=".08"/>` +
    `<circle cx="240" cy="270" r="268" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-dasharray="2 14" stroke-linecap="round"/>` +
    fig(212, 600, 204, 372, WHITE) + fig(338, 600, 130, 196, SUN) +
    plus(84, 150, 30, WHITE, .75) + plus(414, 236, 20, WHITE, .6) + `<circle cx="398" cy="120" r="9" fill="${SUN}"/><circle cx="70" cy="330" r="6" fill="#fff" opacity=".7"/>`),

  "art-maternal.svg": svg(600, 400,
    stage("#fff0d1", "#ffe3ad", "#f1c166") +
    fig(245, 400, 132, 236, BLUE) + `<circle cx="306" cy="304" r="46" fill="${BLUE}"/>` + heart(300, 298, .8, WHITE) +
    fig(428, 400, 124, 264, NAVY) + badge(428, 226, 21, WHITE, BLUE) +
    `<path d="M392 214Q394 300 362 302" fill="none" stroke="${SUN}" stroke-width="7" stroke-linecap="round"/><circle cx="356" cy="302" r="11" fill="${SUN}" stroke="#fff" stroke-width="3"/>` +
    plus(92, 104, 26, BLUE, .4) + plus(532, 86, 18, NAVY, .3) + `<circle cx="120" cy="300" r="7" fill="${BLUE}" opacity=".35"/>`),

  "art-child.svg": svg(600, 400,
    stage("#dceafb", "#c5dcf8", "#96bff0") +
    fig(214, 400, 132, 264, BLUE) + badge(214, 232, 22, WHITE, BLUE) +
    fig(374, 400, 100, 142, SUN) +
    `<g transform="translate(302 196) rotate(38)"><rect x="-28" y="-9" width="52" height="18" rx="5" fill="#fff" stroke="${NAVY}" stroke-width="4"/><path d="M-28 0h-18M-46 -10v20M24 0h24" fill="none" stroke="${NAVY}" stroke-width="4" stroke-linecap="round"/><path d="M-10 -9v8M4 -9v8" stroke="${NAVY}" stroke-width="3"/></g>` +
    `<g transform="translate(478 128)"><path d="M0 -40L32 -27V4C32 26 16 39 0 46C-16 39 -32 26 -32 4V-27z" fill="#fff"/><path d="M-13 3l9 10 18 -20" fill="none" stroke="${GREEN}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>` +
    plus(92, 110, 26, BLUE, .4) + `<circle cx="536" cy="290" r="8" fill="${SUN}"/><circle cx="110" cy="290" r="6" fill="${NAVY}" opacity=".25"/>`),

  "art-family-planning.svg": svg(600, 400,
    stage("#def3e8", "#c4e8d4", "#8fcfae") +
    fig(222, 400, 126, 240, BLUE) + fig(356, 400, 126, 262, NAVY) +
    `<path d="M430 66h104a24 24 0 0 1 24 24v30a24 24 0 0 1-24 24h-62l-26 26 4-26h-20a24 24 0 0 1-24-24V90a24 24 0 0 1 24-24z" fill="#fff"/>` +
    `<circle cx="452" cy="105" r="8" fill="${BLUE}"/><circle cx="482" cy="105" r="8" fill="${BLUE}"/><circle cx="512" cy="105" r="8" fill="${SUN}"/>` +
    `<path d="M70 120h64a22 22 0 0 1 22 22v20a22 22 0 0 1-22 22h-8l4 22-24-22H70a22 22 0 0 1-22-22v-20a22 22 0 0 1 22-22z" fill="#fff"/>` + heart(102, 150, .62, SUN) +
    plus(540, 300, 22, GREEN, .35) + `<circle cx="84" cy="300" r="7" fill="${BLUE}" opacity=".35"/>`),

  "art-about.svg": svg(600, 400,
    stage("#dceafb", "#c5dcf8", "#96bff0") +
    fig(96, 400, 96, 190, B300) + fig(202, 400, 118, 264, NAVY) + badge(202, 236, 20, WHITE, BLUE) +
    fig(320, 400, 118, 228, BLUE) + fig(434, 400, 106, 252, WHITE) + fig(530, 400, 84, 150, SUN) +
    plus(540, 96, 24, BLUE, .4) + `<circle cx="60" cy="120" r="8" fill="${SUN}"/>`),

  "art-centre.svg": svg(600, 400,
    `<rect width="600" height="400" fill="#eaf2fc"/><circle cx="498" cy="92" r="36" fill="${SUN}"/>` +
    `<circle cx="300" cy="230" r="226" fill="none" stroke="#96bff0" stroke-width="3" stroke-dasharray="2 14" stroke-linecap="round"/>` +
    `<rect y="350" width="600" height="50" fill="#c5dcf8"/>` +
    `<circle cx="52" cy="292" r="42" fill="#8fd0ad"/><rect x="48" y="318" width="8" height="34" fill="#4f9a76"/>` +
    `<circle cx="560" cy="286" r="46" fill="#8fd0ad"/><rect x="556" y="318" width="8" height="34" fill="#4f9a76"/>` +
    `<rect x="92" y="222" width="86" height="128" fill="#d3e4f9"/><rect x="422" y="222" width="86" height="128" fill="#d3e4f9"/>` +
    arch(135, 310, 38, 60, B300) + arch(465, 310, 38, 60, B300) +
    `<rect x="170" y="150" width="260" height="200" fill="#fff"/><rect x="156" y="130" width="288" height="28" rx="7" fill="${BLUE}"/>` +
    `<rect x="293" y="112" width="14" height="20" fill="${BLUE}"/>` + badge(300, 84, 36, BLUE, WHITE) +
    arch(300, 350, 68, 112, NAVY) + arch(216, 268, 48, 78, B200) + arch(384, 268, 48, 78, B200) +
    `<rect x="192" y="292" width="48" height="8" rx="4" fill="${B300}"/><rect x="360" y="292" width="48" height="8" rx="4" fill="${B300}"/>` +
    fig(478, 400, 52, 98, BLUE) + fig(522, 400, 36, 56, SUN)),

  "art-support.svg": svg(600, 400,
    stage("#fff0d1", "#ffe3ad", "#f1c166") +
    fig(212, 400, 128, 264, NAVY) + badge(212, 230, 21, WHITE, BLUE) +
    fig(372, 400, 134, 240, BLUE) +
    `<rect x="312" y="258" width="92" height="44" rx="22" fill="${SUN}" transform="rotate(16 330 270)"/><circle cx="326" cy="252" r="23" fill="${SUN}" stroke="${BLUE}" stroke-width="4"/>` +
    heart(292, 74, 1.15, "#ff8f3c") +
    plus(96, 110, 26, BLUE, .4) + `<circle cx="528" cy="300" r="8" fill="${BLUE}" opacity=".35"/><circle cx="516" cy="104" r="6" fill="${NAVY}" opacity=".3"/>`)
};

for (const [name, body] of Object.entries(art)) {
  fs.writeFileSync(path.join(outDir, name), body);
  console.log("wrote", name, body.length, "bytes");
}
