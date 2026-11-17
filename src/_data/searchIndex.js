// Builds the search index for each language from the same data the pages use,
// so search never goes out of date. Each entry: t = title, x = extra text,
// u = link (relative to the language root, or a full address), k = kind.
const langs = require("./langs.json");
const news = require("./news.js");
const site = require("./site.js");
const appeal = require("./appeal.js");

const join = (parts) => parts.filter(Boolean).join(" ");

function entriesFor(code) {
  const t = require("./i18n/" + code + ".json");
  const pages = ["home", "services", "about", "news", "visit"].map((key) => ({
    t: t.nav[key], x: t.pages[key].desc, u: t.pages[key].file, k: "page"
  }));
  const services = t.services.list.map((svc) => ({
    t: svc.title,
    x: join([svc.label, svc.body, (svc.items || []).join(" "), svc.id === "child" ? t.services.vaccines.callout : ""]),
    u: "services.html#" + svc.id,
    k: "service"
  }));
  const vaccines = t.services.vaccines.rows.map((row) => ({
    t: row[0], x: join([row[1], t.services.vaccines.head[0]]), u: "services.html#child", k: "vaccine"
  }));
  const places = t.about.places.map((place) => ({
    t: place.title, x: join([place.label, place.body]), u: "about.html#reach", k: "place"
  }));
  const locations = t.visit.locations.map((loc) => ({
    t: loc.title, x: loc.body, u: "visit.html#locations", k: "place"
  }));
  const info = [
    { t: t.visit.hours_title, x: join([t.meta.hours_short, t.footer.closed]), u: "visit.html#contact", k: "info" },
    { t: t.visit.phone_label, x: join([site.phone_display, site.email]), u: "visit.html#contact", k: "info" },
    { t: t.visit.form_title, x: join([t.visit.form_intro, t.visit.options.map((o) => o.label).join(" ")]), u: "visit.html#register", k: "info" },
    { t: t.about.trustees_title, x: site.trustees.map((p) => p.name).join(" "), u: "about.html#trustees", k: "info" },
    { t: t.visit.support_title, x: t.visit.support_body.join(" "), u: "visit.html#support", k: "info" },
    { t: t.visit.urgent_title, x: join([t.visit.urgent_before, "999", t.visit.urgent_after]), u: "visit.html#contact", k: "info" }
  ];
  const stories = news.map((item) => ({
    t: item[code].title, x: join([item[code].summary, item[code].source]), u: item.url || "news/" + item.id + ".html", k: "news"
  }));
  const appealEntries = appeal.published
    ? [{ t: t.rebuild.nav, x: join([t.rebuild.lead, t.rebuild.give_contact]), u: "rebuild.html", k: "page" }]
    : [];
  return [].concat(services, vaccines, info, places, locations, appealEntries, stories, pages);
}

module.exports = Object.fromEntries(langs.map((lang) => [lang.code, entriesFor(lang.code)]));
