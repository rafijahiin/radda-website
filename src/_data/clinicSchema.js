// Describes the centre to search engines (schema.org "MedicalClinic"), one version
// per language. Google can use this to show opening hours, phone and location in
// search results. Everything is taken from the same settings the pages use.
const site = require("./site.js");
const langs = require("./langs.json");

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const FOUNDED = "1974";

const pad = (n) => String(n).padStart(2, "0");
const clock = (minutes) => pad(Math.floor(minutes / 60)) + ":" + pad(minutes % 60);

// Groups weekdays that share the same hours: Sunday to Thursday become one entry.
function openingHours(hours) {
  const groups = new Map();
  DAY_NAMES.forEach((day, index) => {
    const span = hours[String(index)];
    if (!Array.isArray(span)) return;                  // closed that day
    const key = span.join("-");
    groups.set(key, { span, days: [...((groups.get(key) || {}).days || []), day] });
  });
  return [...groups.values()].map(({ span, days }) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: days,
    opens: clock(span[0]),
    closes: clock(span[1])
  }));
}

// A holiday is a day whose opening and closing time are both midnight.
const closedDays = (dates) => dates.map((date) => ({
  "@type": "OpeningHoursSpecification",
  validFrom: date,
  validThrough: date,
  opens: "00:00",
  closes: "00:00"
}));

function describe(lang) {
  const t = require("./i18n/" + lang.code + ".json");
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "@id": site.url + "#clinic",
    name: t.meta.org,
    description: t.pages.home.desc,
    url: site.url + lang.dir,
    logo: site.url + "assets/img/icon-512.png",
    image: site.url + "assets/img/share-" + lang.code + ".jpg",
    telephone: site.phone_tel,
    email: site.email,
    foundingDate: FOUNDED,
    address: { "@type": "PostalAddress", addressLocality: t.footer.address, addressCountry: "BD" },
    openingHoursSpecification: openingHours(site.clinic.hours),
    specialOpeningHoursSpecification: closedDays(site.clinic.holidays),
    availableLanguage: langs.map((item) => item.code),
    sameAs: [site.facebook_url]
  };
}

module.exports = Object.fromEntries(langs.map((lang) => [lang.code, describe(lang)]));
module.exports.openingHours = openingHours;
