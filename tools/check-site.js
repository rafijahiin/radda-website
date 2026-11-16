// Checks the built site in _site/: every internal link and anchor must resolve,
// no template placeholder may be left unfilled, and no forbidden dash may appear.
// Usage: node tools/check-site.js   (run after "npm run build"; exits 1 on any problem)
"use strict";
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "_site");
const problems = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(OUT);
const pages = files.filter((file) => file.endsWith(".html"));
const idsByFile = new Map(pages.map((file) => {
  const html = fs.readFileSync(file, "utf8");
  return [file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))];
}));

for (const file of pages) {
  const rel = path.relative(OUT, file);
  const html = fs.readFileSync(file, "utf8");

  // The settings handed to site.js are JSON, where "}}" is normal, so look outside scripts.
  const visible = html.replace(/<script[\s\S]*?<\/script>/g, "");
  for (const bad of ["undefined", "{{", "}}", "{%", "[object Object]"]) {
    if (visible.includes(bad)) problems.push(rel + ": contains " + JSON.stringify(bad));
  }
  // Em dash and en dash, written as character codes so this file stays free of them too.
  for (const dash of [String.fromCharCode(0x2014), String.fromCharCode(0x2013)]) {
    if (html.includes(dash)) problems.push(rel + ": contains a forbidden dash");
  }
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const repeated = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (repeated.length) problems.push(rel + ": duplicate ids " + [...new Set(repeated)].join(", "));

  for (const match of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
    const url = match[1].replace(/&amp;/g, "&");
    if (/^(https?:|mailto:|tel:|sms:|data:)/.test(url)) continue;
    if (url === "#") continue;                                  // filled in by site.js
    if (url.includes("assets/photos/")) continue;               // optional photos
    const [beforeHash, hash] = url.split("#");
    const target = beforeHash.split("?")[0];
    const resolved = target ? path.resolve(path.dirname(file), target) : file;
    if (!fs.existsSync(resolved)) { problems.push(rel + ": broken link " + url); continue; }
    if (hash && resolved.endsWith(".html") && !idsByFile.get(resolved).has(hash)) {
      problems.push(rel + ": missing anchor " + url);
    }
  }
}

for (const file of files.filter((f) => f.endsWith("search.json"))) {
  const entries = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const entry of entries) {
    if (!entry.t || !entry.u || !entry.k) problems.push(path.relative(OUT, file) + ": incomplete entry " + JSON.stringify(entry));
    if (/^https?:/.test(entry.u)) continue;
    const [target, hash] = entry.u.split("#");
    const resolved = path.resolve(path.dirname(file), target);
    if (!fs.existsSync(resolved)) problems.push(path.relative(OUT, file) + ": search link to missing page " + entry.u);
    else if (hash && !idsByFile.get(resolved).has(hash)) problems.push(path.relative(OUT, file) + ": search link to missing anchor " + entry.u);
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error("\n" + problems.length + " problem(s) found.");
  process.exit(1);
}
console.log("Site check passed: " + pages.length + " pages, all links, anchors and search entries resolve.");
