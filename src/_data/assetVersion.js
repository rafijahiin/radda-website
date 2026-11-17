// A short fingerprint of the stylesheet and each script. It is added to their
// addresses (site.css?v=...), so a browser that kept an old copy fetches the
// new one as soon as either file changes, and not before.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ASSETS = path.join(__dirname, "..", "assets");
const FINGERPRINT_LENGTH = 8;

const fingerprint = (file) =>
  crypto.createHash("sha1").update(fs.readFileSync(path.join(ASSETS, file))).digest("hex").slice(0, FINGERPRINT_LENGTH);

module.exports = {
  css: fingerprint(path.join("css", "site.css")),
  js: fingerprint(path.join("js", "site.js")),
  planner: fingerprint(path.join("js", "planner.js"))
};
