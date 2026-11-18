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

test("files a linked item under partners when staff mark it so", () => {
  const news = loadNews([{ title_en: "Joint project", type: "partner", url: "https://example.org/partner" }]);

  assert.equal(news[0].type, "partner");
});

test("treats a partner item without a link as Radda's own update", () => {
  const news = loadNews([{ title_en: "No link yet", type: "partner" }]);

  assert.equal(news[0].type, "update");
});

test("puts Radda's own newest update first on the home page", () => {
  const picks = load("homeNews.js", { "newsItems.json": [
    { title_en: "Own update" },
    { title_en: "Press one", url: "https://example.org/1" },
    { title_en: "Press two", url: "https://example.org/2" }
  ] });

  assert.deepEqual(picks.map((item) => item.en.title), ["Own update", "Press two", "Press one"]);
});

test("shows at most four news cards on the home page", () => {
  const items = [1, 2, 3, 4, 5, 6].map((n) => ({ title_en: "Press " + n, url: "https://example.org/" + n }));

  const picks = load("homeNews.js", { "newsItems.json": items });

  assert.equal(picks.length, 4);
  assert.equal(picks[0].en.title, "Press 6");
});

test("draws the longest bar of a chart at full width and the rest in proportion", () => {
  const impact = load("impact.js", { "impactFigures.json": {
    years: ["2020", "2021"], series: [{ id: "total", values: [50, 200] }], funding: []
  } });

  assert.deepEqual(impact.series[0].bars, [
    { year: "2020", value: 50, width: 25 },
    { year: "2021", value: 200, width: 100 }
  ]);
});

test("splits a year's income into foreign and local shares", () => {
  const impact = load("impact.js", { "impactFigures.json": {
    years: [], series: [], funding: [{ year: "1994", foreign: 75, local: 25 }, { year: "2022", foreign: 0, local: 0 }]
  } });

  assert.equal(impact.funding[0].foreignShare, 75);
  assert.equal(impact.funding[0].localShare, 25);
  assert.equal(impact.funding[1].localShare, 0);
});

test("shares out exactly one hundred squares, giving the spare ones to the largest remainders", () => {
  const impact = load("impact.js", { "impactFigures.json": {
    years: [], series: [], funding: [],
    mix: [{ id: "a", rows: [{ id: "x", value: 361 }, { id: "y", value: 135 }] }, { id: "b", rows: [{ id: "z", value: 504 }] }]
  } });

  assert.deepEqual(impact.mix.map((family) => family.rows.map((row) => row.squares)), [[36, 14], [50]]);
  assert.equal(impact.mix[0].squares + impact.mix[1].squares, 100);
});

test("places the target mark and the result bar on the same scale", () => {
  const impact = load("impact.js", { "impactFigures.json": {
    years: [], series: [], funding: [], targets: [{ id: "over", target: 100, achieved: 200 }, { id: "under", target: 200, achieved: 100 }]
  } });

  assert.deepEqual(impact.targets.map((row) => [row.percent, row.width, row.mark]), [[200, 100, 50], [50, 50, 100]]);
});

test("keeps the published figures consistent with the annual report totals", () => {
  const impact = load("impact.js", {});
  const total = impact.series.find((entry) => entry.id === "total");
  const mixRow = (id) => impact.mix.flatMap((family) => family.rows).find((row) => row.id === id).value;

  assert.equal(total.bars[total.bars.length - 1].value, impact.contacts);
  assert.equal(total.bars[0].value, impact.contacts_1994);
  assert.equal(impact.mixTotal, impact.contacts);
  assert.equal(impact.mix.reduce((squares, family) => squares + family.squares, 0), 100);
  assert.equal(impact.vaccineTotal, mixRow("child_vaccines") + mixRow("other_vaccines"));
  assert.equal(impact.staffTotal, impact.reach.find((f) => f.id === "staff").value);
  assert.equal(impact.wards.north.length + impact.wards.south.length, impact.reach.find((f) => f.id === "wards").value);
  for (const entry of impact.series) assert.equal(entry.bars.length, impact.years.length);
});

test("works out the change between two reports and keeps each row on its own scale", () => {
  const impact = load("impact.js", { "impactFigures.json": {
    years: [], series: [], funding: [],
    compare: { from: "A", to: "B", rows: [{ id: "up", before: 50, after: 100 }, { id: "down", before: 200, after: 150 }] }
  } });

  assert.deepEqual(impact.compare.rows.map((row) => [row.change, row.beforeWidth, row.afterWidth]), [[100, 50, 100], [-25, 100, 75]]);
});

test("keeps the two annual reports consistent where they overlap", () => {
  const impact = load("impact.js", {});
  const seriesValue = (id, year) => impact.series.find((entry) => entry.id === id).bars.find((bar) => bar.year === year).value;

  for (const row of impact.compare.rows.filter((r) => impact.series.some((entry) => entry.id === r.id))) {
    assert.equal(row.before, seriesValue(row.id, impact.compare.from), row.id + " in " + impact.compare.from);
    assert.equal(row.after, seriesValue(row.id, impact.compare.to), row.id + " in " + impact.compare.to);
  }
  assert.equal(impact.compare.rows.find((r) => r.id === "staff").after, impact.staffTotal);
  assert.equal(impact.compare.rows.find((r) => r.id === "satellite").after, impact.reach.find((f) => f.id === "satellite").value);
});

test("offers only annual report files that exist and are PDFs", () => {
  const impact = load("impact.js", {});

  assert.ok(impact.reports.length >= 1);
  for (const report of impact.reports) {
    const file = path.join(__dirname, "..", "src", report.file);
    assert.equal(require("node:fs").readFileSync(file).subarray(0, 4).toString("latin1"), "%PDF", report.file);
    assert.ok(report.sizeMb > 0 && report.pages > 0, report.file);
  }
});

// ---- Health tools: date arithmetic (src/assets/js/planner.js) ----
const planner = require(path.join(__dirname, "..", "src", "assets", "js", "planner.js"));
const careSchedule = require(path.join(DATA, "careSchedule.json"));
const day = (text) => planner.parseDay(text);
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

test("rejects text that is not a real calendar date", () => {
  assert.ok(Number.isNaN(day("2026-02-30")));
  assert.ok(Number.isNaN(day("17/11/2026")));
  assert.ok(Number.isNaN(day("")));
});

test("works out every vaccine date from the date of birth", () => {
  const dates = planner.vaccineDates(day("2026-01-01"), careSchedule.vaccines).map((visit) => iso(visit.date));

  assert.deepEqual(dates, ["2026-01-01", "2026-02-12", "2026-03-12", "2026-04-09", "2026-10-01", "2027-04-01"]);
});

test("keeps a month-end birthday inside the right month when adding months", () => {
  assert.equal(iso(planner.addMonths(day("2026-05-31"), 9)), "2027-02-28");
  assert.equal(iso(planner.addMonths(day("2027-05-31"), 9)), "2028-02-29");
});

test("marks the first date that has not passed as the next one", () => {
  const visits = planner.withStatus(planner.vaccineDates(day("2026-01-01"), careSchedule.vaccines), day("2026-03-12"));

  assert.deepEqual(visits.map((visit) => visit.status), ["past", "past", "today", "upcoming", "upcoming", "upcoming"]);
  assert.deepEqual(visits.filter((visit) => visit.next).map((visit) => visit.id), ["w10"]);
});

test("marks no date as next once every date has passed", () => {
  const visits = planner.withStatus(planner.vaccineDates(day("2024-01-01"), careSchedule.vaccines), day("2026-01-01"));

  assert.equal(visits.some((visit) => visit.next), false);
});

test("puts the due date 280 days after the last period and the first check-up by week 16", () => {
  const dates = planner.pregnancy(day("2026-08-01"), day("2026-11-17"), careSchedule.pregnancy);

  assert.equal(iso(dates.due), "2027-05-08");
  assert.equal(iso(dates.firstVisitBy), "2026-11-21");
  assert.equal(dates.weeks, 15);
});

test("explains why a date cannot be used", () => {
  const today = day("2026-11-17");

  assert.equal(planner.problemWith(NaN, today, 730), "empty");
  assert.equal(planner.problemWith(day("2026-11-18"), today, 730), "future");
  assert.equal(planner.problemWith(day("2024-11-01"), today, 730), "old");
  assert.equal(planner.problemWith(today, today, 730), "");
});

test("writes a calendar file with one all-day entry per date", () => {
  const file = planner.toCalendar([{ date: day("2026-12-31"), title: "Vaccines, second visit; bring the card" }], day("2026-11-17"));

  assert.match(file, /^BEGIN:VCALENDAR\r\n/);
  assert.match(file, /DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101\r\n/);
  assert.match(file, /SUMMARY:Vaccines\\, second visit\\; bring the card\r\n/);
  assert.equal(file.split("BEGIN:VEVENT").length - 1, 1);
});

test("has wording in both languages for every visit on the schedule", () => {
  for (const code of ["en", "bn"]) {
    const visits = require(path.join(DATA, "i18n", code + ".json")).tools.visits;
    for (const visit of careSchedule.vaccines) assert.ok(visits[visit.id] && visits[visit.id].age && visits[visit.id].what, code + " " + visit.id);
  }
});
