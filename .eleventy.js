// Build settings for the Radda website (Eleventy).
// Content lives in src/_data, page templates in src/*.njk, output goes to _site/.
const fs = require("fs");
const path = require("path");
const icons = require("./src/_data/icons.json");

const PHOTO_DIR = path.join(__dirname, "src", "assets", "photos");
const escapeHtml = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // {% icon "phone" %} prints an inline SVG icon from src/_data/icons.json.
  eleventyConfig.addShortcode("icon", function (name, strokeWidth) {
    if (!icons[name]) throw new Error('Unknown icon "' + name + '". Add it to src/_data/icons.json.');
    const cls = name === "arrow" ? ' class="arrow"' : "";
    return '<svg' + cls + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (strokeWidth || 2) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icons[name] + "</svg>";
  });

  // {% photo root, "hero", "Alt text" %} prints the photo only if src/assets/photos/hero.jpg exists.
  // Until then the slot shows its illustration and the browser asks for nothing.
  eleventyConfig.addShortcode("photo", function (root, name, alt, loading) {
    const file = String(name);
    if (!/^[a-z0-9-]+$/.test(file) || !fs.existsSync(path.join(PHOTO_DIR, file + ".jpg"))) return "";
    return '<img src="' + root + "assets/photos/" + file + '.jpg" alt="' + escapeHtml(alt || "") + '"' +
      (loading === "eager" ? "" : ' loading="lazy"') + ">";
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk"
  };
};
