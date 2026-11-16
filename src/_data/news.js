// Turns the simple list that staff edit (newsItems.json) into what the pages use.
// It is forgiving on purpose, so a small slip in the editing screen never breaks the site:
//   - the newest entry (the last one in the file) comes first on the site
//   - if one language is left empty, the other language's text is shown instead
//   - an entry with no title in either language is skipped
//   - a missing or repeated web-address name is filled in automatically
const items = require("./newsItems.json");

const LOCALES = { en: "en-GB", bn: "bn-BD" };
const OWN_SOURCE = { en: "Radda", bn: "রাড্ডা" };
const MAX_SLUG_LENGTH = 60;

const clean = (value) => (typeof value === "string" ? value.trim() : "");
const slugify = (text) =>
  clean(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, MAX_SLUG_LENGTH);
const isoDate = (value) => {
  const text = clean(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
};

function dateLabel(item, code) {
  const written = clean(item["date_text_" + code]);
  if (written) return written;
  const iso = isoDate(item.date);
  if (!iso) return "";
  return new Intl.DateTimeFormat(LOCALES[code], { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(iso + "T00:00:00Z"));
}

function version(item, code, other, isPress) {
  const pick = (field) => clean(item[field + "_" + code]) || clean(item[field + "_" + other]);
  const body = pick("body") || pick("summary");
  return {
    source: pick("source") || (isPress ? "" : OWN_SOURCE[code]),
    date: dateLabel(item, code),
    title: pick("title"),
    summary: pick("summary"),
    body: body.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean)
  };
}

function uniqueId(wanted, taken) {
  let id = wanted;
  for (let n = 2; taken.has(id); n++) id = wanted + "-" + n;
  taken.add(id);
  return id;
}

const taken = new Set();
const news = (Array.isArray(items) ? items : [])
  .filter((item) => item && (clean(item.title_en) || clean(item.title_bn)))
  .map((item, index) => {
    const url = /^https?:\/\//.test(clean(item.url)) ? clean(item.url) : "";
    const isPress = Boolean(url) || item.type === "press";
    return {
      id: uniqueId(slugify(item.id) || slugify(item.title_en) || "update-" + (index + 1), taken),
      type: isPress ? "press" : "update",
      url,
      notice: item.notice === true,
      notice_until: isoDate(item.notice_until),
      en: version(item, "en", "bn", isPress),
      bn: version(item, "bn", "en", isPress)
    };
  });

module.exports = news.slice().reverse();
