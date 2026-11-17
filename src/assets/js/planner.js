/* Date arithmetic for the health tools page (vaccine dates and pregnancy dates).
   It has no knowledge of the page, so the same file runs in the browser and in the
   tests (npm test). Every date is a whole day counted in UTC, which keeps daylight
   saving and the visitor's time zone from moving a date by one day. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.RaddaPlanner = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var DAY_MS = 24 * 60 * 60 * 1000;
  var DAYS_IN_WEEK = 7;

  /* "2026-11-17" -> that day as a number, or NaN if it is not a real calendar date. */
  function parseDay(text) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text || "").trim());
    if (!match) return NaN;
    var year = Number(match[1]), month = Number(match[2]) - 1, day = Number(match[3]);
    var ms = Date.UTC(year, month, day);
    var check = new Date(ms);
    return check.getUTCFullYear() === year && check.getUTCMonth() === month && check.getUTCDate() === day ? ms : NaN;
  }

  function addDays(ms, days) { return ms + days * DAY_MS; }

  /* Adds calendar months. 31 May + 9 months is 28 (or 29) February, not 3 March. */
  function addMonths(ms, months) {
    var from = new Date(ms);
    var target = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + months, 1));
    var lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    return Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(from.getUTCDate(), lastDay));
  }

  function daysBetween(from, to) { return Math.round((to - from) / DAY_MS); }

  /* The date of every visit on the schedule for a child born on "birth".
     Each visit is counted in days or in calendar months after birth. */
  function vaccineDates(birth, visits) {
    return visits.map(function (visit) {
      return { id: visit.id, date: visit.months ? addMonths(birth, visit.months) : addDays(birth, visit.days || 0) };
    });
  }

  /* Marks each date as past, today or upcoming, and the first one not yet past as "next". */
  function withStatus(items, today) {
    var nextFound = false;
    return items.map(function (item) {
      var status = item.date < today ? "past" : item.date === today ? "today" : "upcoming";
      var isNext = !nextFound && status !== "past";
      if (isNext) nextFound = true;
      return { id: item.id, date: item.date, status: status, next: isNext };
    });
  }

  /* Dates worked out from the first day of the last period. */
  function pregnancy(lastPeriod, today, rules) {
    var days = daysBetween(lastPeriod, today);
    return {
      due: addDays(lastPeriod, rules.term_days),
      weeks: Math.floor(days / DAYS_IN_WEEK),
      firstVisitBy: addDays(lastPeriod, rules.first_visit_weeks * DAYS_IN_WEEK)
    };
  }

  /* Why a date cannot be used, or "" when it can: "empty", "future" or "old". */
  function problemWith(day, today, oldestDaysAgo) {
    if (isNaN(day)) return "empty";
    if (day > today) return "future";
    if (daysBetween(day, today) > oldestDaysAgo) return "old";
    return "";
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function compactDay(ms) {
    var d = new Date(ms);
    return String(d.getUTCFullYear()) + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate());
  }
  function escapeIcs(text) { return String(text).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1"); }

  /* A calendar file (.ics) with one all-day entry per event: { date, title }. */
  function toCalendar(events, madeAt) {
    var stamp = compactDay(madeAt) + "T000000Z";
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Radda MCH-FP Centre//Health tools//EN"];
    events.forEach(function (event, index) {
      lines.push("BEGIN:VEVENT", "UID:" + compactDay(event.date) + "-" + index + "@radda-health-tools", "DTSTAMP:" + stamp,
        "DTSTART;VALUE=DATE:" + compactDay(event.date), "DTEND;VALUE=DATE:" + compactDay(addDays(event.date, 1)),
        "SUMMARY:" + escapeIcs(event.title), "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    return lines.join("\r\n") + "\r\n";
  }

  return {
    parseDay: parseDay, addDays: addDays, addMonths: addMonths, daysBetween: daysBetween,
    vaccineDates: vaccineDates, withStatus: withStatus, pregnancy: pregnancy, problemWith: problemWith, toCalendar: toCalendar
  };
});
