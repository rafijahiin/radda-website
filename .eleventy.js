// Build settings for the Radda website (Eleventy).
// Content lives in src/_data, page templates in src/*.njk, output goes to _site/.
const fs = require("fs");
const path = require("path");
const icons = require("./src/_data/icons.json");

const PHOTO_DIR = path.join(__dirname, "src", "assets", "photos");
const BANGLA_DIGITS = "০১২৩৪৫৬৭৮৯";
const escapeHtml = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const photoExists = (name) =>
  /^[a-z0-9-]+$/.test(String(name)) && fs.existsSync(path.join(PHOTO_DIR, String(name) + ".jpg"));

module.exports = function (eleventyConfig) {
  // {% if "hero" | hasPhoto %} lets a page leave out a photo area until the photo exists.
  eleventyConfig.addFilter("hasPhoto", photoExists);

  // {{ 525845 | num("bn-BD") }} writes a number the way that language groups its digits;
  // {{ 201.31 | num("en-GB", 2) }} keeps two decimal places.
  eleventyConfig.addFilter("num", function (value, locale, decimals) {
    const places = Number(decimals) || 0;
    return new Intl.NumberFormat(locale || "en-GB", { minimumFractionDigits: places, maximumFractionDigits: places }).format(value);
  });

  // {{ "2021-22" | digits("bn") }} swaps in Bangla digits on the Bangla site and changes nothing else.
  eleventyConfig.addFilter("digits", function (text, code) {
    return code === "bn" ? String(text).replace(/[0-9]/g, (d) => BANGLA_DIGITS[d]) : String(text);
  });

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // {% icon "phone" %} prints an inline SVG icon from src/_data/icons.json.
  eleventyConfig.addShortcode("icon", function (name, strokeWidth) {
    if (!icons[name]) throw new Error('Unknown icon "' + name + '". Add it to src/_data/icons.json.');
    const cls = name === "arrow" ? ' class="arrow"' : "";
    return '<svg' + cls + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (strokeWidth || 2) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icons[name] + "</svg>";
  });

  // {% photo root, "hero", "Alt text" %} prints the photo only if src/assets/photos/hero.jpg exists.
  // Until then nothing is printed and the browser asks for nothing.
  eleventyConfig.addShortcode("photo", function (root, name, alt, loading) {
    const file = String(name);
    if (!photoExists(file)) return "";
    return '<img src="' + root + "assets/photos/" + file + '.jpg" alt="' + escapeHtml(alt || "") + '"' +
      (loading === "eager" ? "" : ' loading="lazy"') + ">";
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk"
  };
};
