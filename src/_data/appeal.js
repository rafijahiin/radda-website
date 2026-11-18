// The "Donate" appeal, as the pages use it. Staff edit appealSettings.json
// through the editing screen. A giving channel only appears on the page once its
// details are complete, so a half-filled form never shows a partial account number.
const settings = require("./appealSettings.json");

const MOBILE_KINDS = ["merchant", "personal"];
const MIN_MOBILE_DIGITS = 11;

const clean = (value) => (typeof value === "string" ? value.trim() : "");
const digits = (value) => clean(String(value == null ? "" : value)).replace(/\D/g, "");

const accountNumber = clean(settings.bank_account_number);
const bank = accountNumber && clean(settings.bank_name) && clean(settings.bank_account_name)
  ? {
      account_name: clean(settings.bank_account_name),
      bank_name: clean(settings.bank_name),
      branch: clean(settings.bank_branch),
      account_number: accountNumber,
      routing_number: clean(settings.bank_routing_number)
    }
  : null;

const mobileNumber = (value) => (digits(value).length >= MIN_MOBILE_DIGITS ? digits(value) : "");
const mobile = [
  { service: "bkash", number: mobileNumber(settings.bkash_number), kind: MOBILE_KINDS.includes(settings.bkash_kind) ? settings.bkash_kind : "" },
  { service: "nagad", number: mobileNumber(settings.nagad_number), kind: "" }
].filter((channel) => channel.number);

module.exports = {
  published: settings.published === true,
  bank,
  mobile,
  hasChannels: Boolean(bank) || mobile.length > 0
};
