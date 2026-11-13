// Copies the shared header and footer from index.html into the other pages and
// marks the current page in the nav. Usage: node sync-partials.js <site-dir>
"use strict";
const fs = require("fs");
const path = require("path");

const siteDir = process.argv[2];
if (!siteDir) { console.error("Usage: node sync-partials.js <site-dir>"); process.exit(1); }

const PAGES = { "index.html": "home", "services.html": "services", "about.html": "about", "visit.html": "visit" };
const block = (name) => new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`);

const read = (file) => fs.readFileSync(path.join(siteDir, file), "utf8");
const source = read("index.html");
const partials = {};
for (const name of ["header", "footer"]) {
  const match = source.match(block(name));
  if (!match) throw new Error(`index.html has no ${name} block`);
  partials[name] = match[0].replace(/ aria-current="page"/g, "");
}

for (const [file, key] of Object.entries(PAGES)) {
  let html = read(file);
  for (const name of ["header", "footer"]) {
    if (!block(name).test(html)) throw new Error(`${file} has no ${name} block`);
    html = html.replace(block(name), () => partials[name]);
  }
  const marker = `data-nav="${key}"`;
  if (!html.includes(marker)) throw new Error(`${file}: nav link ${key} not found`);
  html = html.replace(marker, `${marker} aria-current="page"`);
  fs.writeFileSync(path.join(siteDir, file), html);
  console.log("synced", file);
}
