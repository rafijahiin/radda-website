// Puts together everything the pages need to know about the centre.
//   siteBase.json  technical settings (web address, map links, opening hours)
//   contact.json   phone, WhatsApp, email, Facebook        (edited by staff)
//   holidays.json  government holidays                     (edited by staff)
//   trustees.json  Board of Trustees                       (edited by staff)
// Staff-edited values are tidied here, and the build stops with a clear message
// if something essential is missing, so a broken edit never reaches the live site.
const fs = require("fs");
const path = require("path");
const base = require("./siteBase.json");
const contact = require("./contact.json");
const holidays = require("./holidays.json");
const trustees = require("./trustees.json");

const ROLES = ["chair", "treasurer", "member"];
const PHOTO_DIR = path.join(__dirname, "..", "assets", "photos");
const TITLES = ["mr", "mrs", "ms", "miss", "dr", "md", "prof", "professor", "engr", "advocate", "barrister"];

const clean = (value) => (typeof value === "string" ? value.trim() : "");
const digits = (value) => clean(String(value == null ? "" : value)).replace(/\D/g, "");
const fail = (message) => { throw new Error("Site settings: " + message); };

// "Dr. Md. Abdul Karim" -> "AK": first and last word of the name, ignoring titles.
function initials(name) {
  const words = name.split(/[\s-]+/).filter((word) => word && !TITLES.includes(word.replace(/\./g, "").toLowerCase()));
  if (!words.length) return "";
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : [words[0]];
  return letters.map((word) => word.charAt(0).toUpperCase()).join("");
}

// A portrait is shown only if the named file really is in the photos folder,
// so a typing slip leaves the initials in place instead of a broken picture.
function portrait(value) {
  const file = clean(value).split(/[\\/]/).pop().toLowerCase();
  return /^[a-z0-9-]+\.jpg$/.test(file) && fs.existsSync(path.join(PHOTO_DIR, file)) ? file : "";
}

const phone = clean(contact.phone);
if (digits(phone).length < 10) fail('the phone number in contact.json looks wrong: "' + phone + '"');
const email = clean(contact.email);
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail('the email in contact.json looks wrong: "' + email + '"');
const facebookUrl = clean(contact.facebook_url);
if (!/^https:\/\//.test(facebookUrl)) fail("the Facebook link in contact.json must start with https://");

const holidayDates = (Array.isArray(holidays) ? holidays : [])
  .map((entry) => clean(entry && entry.date).slice(0, 10))
  .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date));

const board = (Array.isArray(trustees) ? trustees : [])
  .filter((person) => person && clean(person.name))
  .map((person) => ({
    name: clean(person.name),
    name_bn: clean(person.name_bn),
    initials: initials(clean(person.name)),
    photo: portrait(person.photo),
    role: ROLES.includes(person.role) ? person.role : "member"
  }));

module.exports = {
  ...base,
  phone_display: phone,
  phone_tel: "+" + digits(phone),
  email,
  facebook_url: facebookUrl,
  facebook_label: facebookUrl.replace(/^https:\/\/(www\.)?/, "").replace(/\/+$/, ""),
  clinic: {
    ...base.clinic,
    whatsapp: digits(contact.whatsapp) || digits(phone),
    holidays: holidayDates
  },
  trustees: board
};
