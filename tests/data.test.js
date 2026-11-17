// Tests for the rules that turn staff-edited files into site data.
// Run with: npm test
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const DATA = path.join(__dirname, "..", "src", "_data");
const file = (name) => require.resolve(path.join(DATA, name));

// The data modules read each other (the clinic description reads site.js), so all of
// them are forgotten between tests; otherwise one test's stand-in files leak into the next.
function forgetDataModules() {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(DATA) && key.endsWith(".js")) delete require.cache[key];
  }
}

// Loads a data module with stand-in contents for the JSON files it reads.
function load(moduleName, stubs) {
  for (const name of Object.keys(stubs)) {
    require.cache[file(name)] = { id: file(name), filename: file(name), loaded: true, exports: stubs[name] };
  }
  forgetDataModules();
  try {
    return require(file(moduleName));
  } finally {
    for (const name of Object.keys(stubs)) delete require.cache[file(name)];
    forgetDataModules();
  }
}

const loadNews = (items) => load("news.js", { "newsItems.json": items });
const goodContact = { phone: "+880 1335-097710", whatsapp: "8801335097710", email: "info@raddacentre.org", facebook_url: "https://www.facebook.com/bd.radda" };
const loadSite = (overrides) => load("site.js", {
  "contact.json": goodContact, "holidays.json": [], "trustees.json": [], ...overrides
});

test("shows the newest entry first", () => {
  const news = loadNews([{ title_en: "Older" }, { title_en: "Newer" }]);

  assert.deepEqual(news.map((item) => item.en.title), ["Newer", "Older"]);
});

test("falls back to the other language when one is left empty", () => {
  const news = loadNews([{ title_bn: "শুধু বাংলা", summary_bn: "সারাংশ" }]);

  assert.equal(news[0].en.title, "শুধু বাংলা");
  assert.equal(news[0].en.summary, "সারাংশ");
});

test("skips an entry that has no title in either language", () => {
  const news = loadNews([{ summary_en: "No title here" }, { title_en: "Has a title" }]);

  assert.equal(news.length, 1);
});

test("treats an entry with a link as press coverage without its own page", () => {
  const news = loadNews([{ title_en: "Coverage", type: "update", url: "https://example.org/story" }]);

  assert.equal(news[0].type, "press");
  assert.equal(news[0].url, "https://example.org/story");
});

test("ignores a link that is not a web address", () => {
  const news = loadNews([{ title_en: "Typo", url: "javascript:alert(1)" }]);

  assert.equal(news[0].url, "");
  assert.equal(news[0].type, "update");
});

test("builds a web-address name from the English title when none is given", () => {
  const news = loadNews([{ title_en: "Eid Holiday Hours 2027!" }]);

  assert.equal(news[0].id, "eid-holiday-hours-2027");
});

test("keeps web-address names unique", () => {
  const news = loadNews([{ id: "same", title_en: "One" }, { id: "same", title_en: "Two" }]);

  assert.equal(new Set(news.map((item) => item.id)).size, 2);
});

test("names a Bangla-only entry even though its title has no English letters", () => {
  const news = loadNews([{ title_bn: "ঈদের ছুটি" }]);

  assert.match(news[0].id, /^update-\d+$/);
});

test("splits the full text into paragraphs on empty lines", () => {
  const news = loadNews([{ title_en: "Story", body_en: "First.\n\nSecond.\n\n\nThird." }]);

  assert.deepEqual(news[0].en.body, ["First.", "Second.", "Third."]);
});

test("uses the summary as the full text when the full text is empty", () => {
  const news = loadNews([{ title_en: "Story", summary_en: "Short version." }]);

  assert.deepEqual(news[0].en.body, ["Short version."]);
});

test("writes the date in each language", () => {
  const news = loadNews([{ title_en: "Story", date: "2026-11-16" }]);

  assert.equal(news[0].en.date, "16 November 2026");
  assert.match(news[0].bn.date, /১৬ নভেম্বর,? ২০২৬/);
});

test("prefers the date in words over the calendar date", () => {
  const news = loadNews([{ title_en: "Story", date: "2026-10-01", date_text_en: "October 2026" }]);

  assert.equal(news[0].en.date, "October 2026");
});

test("credits Radda as the source of its own updates", () => {
  const news = loadNews([{ title_en: "Our update" }]);

  assert.equal(news[0].en.source, "Radda");
  assert.equal(news[0].bn.source, "রাড্ডা");
});

test("only shows a notice when the box is ticked, and trims the end date", () => {
  const news = loadNews([{ title_en: "A", notice: "yes" }, { title_en: "B", notice: true, notice_until: "2027-01-31T00:00:00" }]);

  assert.equal(news[0].notice, true);
  assert.equal(news[0].notice_until, "2027-01-31");
  assert.equal(news[1].notice, false);
});

test("builds the dialling number and falls back to the phone for WhatsApp", () => {
  const site = loadSite({ "contact.json": { ...goodContact, whatsapp: "" } });

  assert.equal(site.phone_tel, "+8801335097710");
  assert.equal(site.clinic.whatsapp, "8801335097710");
  assert.equal(site.facebook_label, "facebook.com/bd.radda");
});

test("stops the build when the phone number is missing", () => {
  assert.throws(() => loadSite({ "contact.json": { ...goodContact, phone: "" } }), /phone number/);
});

test("stops the build when the email address is malformed", () => {
  assert.throws(() => loadSite({ "contact.json": { ...goodContact, email: "not-an-email" } }), /email/);
});

test("keeps only well-formed holiday dates", () => {
  const site = loadSite({ "holidays.json": [{ date: "2027-03-26", name: "Independence Day" }, { date: "soon" }, {}, { date: "2027-12-16T00:00:00" }] });

  assert.deepEqual(site.clinic.holidays, ["2027-03-26", "2027-12-16"]);
});

test("keeps the opening hours that staff cannot edit", () => {
  const site = loadSite({});

  assert.deepEqual(site.clinic.hours[0], [540, 1020]);
  assert.equal(site.clinic.hours[5], null);
});

test("works out trustee initials and tolerates an unknown role", () => {
  const site = loadSite({ "trustees.json": [{ name: "Dr. Md. Abdul Karim", role: "member" }, { name: "Mr. A. S. M. Quasem", role: "boss" }, { name: " " }] });

  assert.deepEqual(site.trustees.map((person) => person.initials), ["AK", "AQ"]);
  assert.equal(site.trustees[1].role, "member");
});

test("groups weekdays with the same hours for search engines", () => {
  const schema = load("clinicSchema.js", { "contact.json": goodContact, "holidays.json": [], "trustees.json": [] });

  const hours = schema.en.openingHoursSpecification;
  assert.deepEqual(hours[0], { "@type": "OpeningHoursSpecification", dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"], opens: "09:00", closes: "17:00" });
  assert.deepEqual(hours[1].dayOfWeek, ["Saturday"]);
  assert.equal(hours[1].closes, "14:00");
  assert.equal(hours.some((entry) => entry.dayOfWeek.includes("Friday")), false);
});

test("tells search engines about holidays and uses each language's own name", () => {
  const schema = load("clinicSchema.js", { "contact.json": goodContact, "holidays.json": [{ date: "2027-03-26" }], "trustees.json": [] });

  assert.equal(schema.en.specialOpeningHoursSpecification[0].validFrom, "2027-03-26");
  assert.equal(schema.en.telephone, "+8801335097710");
  assert.notEqual(schema.en.name, schema.bn.name);
  assert.match(schema.bn.url, /\/bn\/$/);
});

const noChannels = { published: true, bank_account_name: "", bank_name: "", bank_branch: "", bank_account_number: "", bank_routing_number: "", bkash_number: "", bkash_kind: "merchant", nagad_number: "" };
const loadAppeal = (overrides) => load("appeal.js", { "appealSettings.json": { ...noChannels, ...overrides } });

test("shows no giving channels until the centre fills them in", () => {
  const appeal = loadAppeal({});

  assert.equal(appeal.hasChannels, false);
  assert.equal(appeal.bank, null);
  assert.deepEqual(appeal.mobile, []);
});

test("hides half-filled bank details", () => {
  const appeal = loadAppeal({ bank_account_number: "1234567890", bank_name: "Example Bank" });

  assert.equal(appeal.bank, null);
});

test("shows bank details once name, bank and number are all present", () => {
  const appeal = loadAppeal({ bank_account_name: " Radda MCH-FP Centre ", bank_name: "Example Bank", bank_account_number: "1234567890" });

  assert.equal(appeal.bank.account_name, "Radda MCH-FP Centre");
  assert.equal(appeal.hasChannels, true);
});

test("ignores a mobile banking number that is too short and tidies a good one", () => {
  const appeal = loadAppeal({ bkash_number: "0171", nagad_number: "01712-345678" });

  assert.deepEqual(appeal.mobile, [{ service: "nagad", number: "01712345678", kind: "" }]);
});

test("publishes the appeal only when the switch is truly on", () => {
  assert.equal(loadAppeal({ published: "yes" }).published, false);
  assert.equal(load("appealPages.js", { "appealSettings.json": { ...noChannels, published: false } }).length, 0);
  assert.equal(load("appealPages.js", { "appealSettings.json": noChannels }).length, 2);
});

test("shows a trustee portrait only when the named file exists", () => {
  const site = loadSite({ "trustees.json": [
    { name: "Mr. Mahbubur Rahman", photo: "/assets/photos/Trustee-Mahbubur-Rahman.jpg" },
    { name: "Someone Else", photo: "no-such-file.jpg" },
    { name: "Third Person", photo: "../../secret.txt" }
  ] });

  assert.deepEqual(site.trustees.map((person) => person.photo), ["trustee-mahbubur-rahman.jpg", "", ""]);
});
