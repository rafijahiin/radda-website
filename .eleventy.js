// Build settings for the Radda website (Eleventy).
// Content lives in src/_data, page templates in src/*.njk, output goes to _site/.
const icons = require("./src/_data/icons.json");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // {% icon "phone" %} prints an inline SVG icon from src/_data/icons.json.
  eleventyConfig.addShortcode("icon", function (name, strokeWidth) {
    if (!icons[name]) throw new Error('Unknown icon "' + name + '". Add it to src/_data/icons.json.');
    const cls = name === "arrow" ? ' class="arrow"' : "";
    return '<svg' + cls + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (strokeWidth || 2) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icons[name] + "</svg>";
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk"
  };
};
