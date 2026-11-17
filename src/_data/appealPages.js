// The appeal page is built once per language while the appeal is switched on,
// and not at all when it is switched off (appealSettings.json, "published").
const langs = require("./langs.json");
const appeal = require("./appeal.js");

module.exports = appeal.published ? langs : [];
