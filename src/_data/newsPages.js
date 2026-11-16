// One article page per language for every news item written by Radda itself
// (items with a "url" link out to another site and get no page of their own).
const langs = require("./langs.json");
const news = require("./news.js");

module.exports = langs.flatMap((lang) =>
  news.filter((item) => !item.url).map((item) => ({ lang, item }))
);
