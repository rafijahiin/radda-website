/* Radda MCH-FP Centre: site behaviour (no dependencies) */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     SETTINGS: edit these if the clinic's details change.
     ------------------------------------------------------------------ */
  var CLINIC = {
    whatsapp: "8801335097710",      // international format, digits only
    timeZone: "Asia/Dhaka",
    // Opening hours by weekday, 0 = Sunday. Minutes from midnight. null = closed.
    hours: {
      0: [540, 1020], 1: [540, 1020], 2: [540, 1020], 3: [540, 1020], 4: [540, 1020],
      5: null,
      6: [540, 840]
    },
    // Government holidays the centre is closed, as "YYYY-MM-DD". Add each year's dates here.
    holidays: []
  };
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var REVEAL_CLEANUP_MS = 1600;
  var COUNT_DURATION_MS = 1400;
  var BOOKING_WINDOW_DAYS = 60;
  var PHONE_PATTERN = /^(?:88)?01[3-9]\d{8}$/;   // Bangladeshi mobile, with or without 88
  var LOOKAHEAD_DAYS = 14;
  var MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function pad(n) { return String(n).padStart(2, "0"); }
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header: shadow once the page scrolls */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* Mobile menu */
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("nav");
  if (btn && nav) {
    var setMenu = function (open) {
      nav.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    btn.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) { setMenu(false); btn.focus(); }
    });
  }

  /* Photos: each slot shows an illustration until its JPG exists and loads */
  each(document.querySelectorAll(".photo img"), function (img) {
    function show() { if (img.naturalWidth > 0) img.parentNode.classList.add("has-img"); }
    if (img.complete) show(); else img.addEventListener("load", show);
  });

  /* Footer year */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     Open / closed status, worked out in Dhaka time
     ------------------------------------------------------------------ */
  function dhakaNow() {
    var parts = {};
    new Intl.DateTimeFormat("en-GB", {
      timeZone: CLINIC.timeZone, weekday: "long", year: "numeric", month: "2-digit",
      day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    return {
      day: DAY_NAMES.indexOf(parts.weekday),
      minutes: Number(parts.hour) * 60 + Number(parts.minute),
      y: Number(parts.year), m: Number(parts.month), d: Number(parts.day)
    };
  }
  function clock(mins) {
    var h = Math.floor(mins / 60), m = mins % 60;
    return (h % 12 || 12) + (m ? ":" + pad(m) : "") + (h < 12 ? " AM" : " PM");
  }
  function dateAt(now, offset) { return new Date(Date.UTC(now.y, now.m - 1, now.d + offset)); }
  function isHoliday(date) {
    var key = date.getUTCFullYear() + "-" + pad(date.getUTCMonth() + 1) + "-" + pad(date.getUTCDate());
    return CLINIC.holidays.indexOf(key) !== -1;
  }
  function hoursOn(date) { return isHoliday(date) ? null : CLINIC.hours[date.getUTCDay()]; }
  function clinicStatus() {
    var now = dhakaNow();
    if (now.day < 0) return null;
    var todayDate = dateAt(now, 0);
    var holiday = isHoliday(todayDate);
    function status(open, title, detail) {
      return { open: open, day: now.day, holiday: holiday, title: title, detail: detail };
    }
    var today = hoursOn(todayDate);
    if (today && now.minutes >= today[0] && now.minutes < today[1]) {
      return status(true, "Open now", "Closes at " + clock(today[1]) + " today");
    }
    if (today && now.minutes < today[0]) {
      return status(false, "Closed now", "Opens today at " + clock(today[0]));
    }
    for (var i = 1; i <= LOOKAHEAD_DAYS; i++) {
      var nextDate = dateAt(now, i);
      var next = hoursOn(nextDate);
      if (!next) continue;
      var name = i === 1 ? "tomorrow" : DAY_NAMES[nextDate.getUTCDay()];
      // A week or more away: add the date so "Sunday" cannot be mistaken for the coming one.
      if (i >= 7) name += " " + nextDate.getUTCDate() + " " + MONTH_NAMES[nextDate.getUTCMonth()];
      return status(false, "Closed now", "Opens " + name + " at " + clock(next[0]));
    }
    return status(false, "Closed now", "Please call for opening times");
  }
  function paintStatus() {
    var s;
    try { s = clinicStatus(); } catch (err) { s = null; }   // older browsers keep the static hours text
    if (!s) return;
    each(document.querySelectorAll("[data-status]"), function (el) {
      el.hidden = false;
      el.classList.toggle("is-open", s.open);
      el.classList.toggle("is-closed", !s.open);
      var title = el.querySelector("[data-status-title]");
      var detail = el.querySelector("[data-status-detail]");
      if (title) title.textContent = s.title;
      if (detail) detail.textContent = s.detail;
    });
    each(document.querySelectorAll("table.hours tr[data-days]"), function (row) {
      var key = s.holiday ? "holiday" : String(s.day);
      var isToday = row.getAttribute("data-days").split(",").indexOf(key) !== -1;
      row.classList.toggle("today", isToday);
    });
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ------------------------------------------------------------------
     Scroll reveals and number count-up
     ------------------------------------------------------------------ */
  function countUp(el) {
    var target = Number(el.getAttribute("data-count"));
    if (!target || reduceMotion) return;
    var start = null;
    function frame(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / COUNT_DURATION_MS, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(frame);
    }
    el.textContent = "0";
    requestAnimationFrame(frame);
  }
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        el.classList.add("in");
        each(el.querySelectorAll("[data-count]"), countUp);
        // Drop the reveal styles afterwards so they never delay a hover effect.
        setTimeout(function () { el.removeAttribute("data-reveal"); el.classList.remove("in"); }, REVEAL_CLEANUP_MS);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    each(revealEls, function (el) { io.observe(el); });
  } else {
    each(revealEls, function (el) { el.removeAttribute("data-reveal"); });
  }

  /* Services page: highlight the section being read */
  var spyLinks = document.querySelectorAll(".svc-nav a");
  if (spyLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    each(spyLinks, function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var visible = [];
    var setActive = function (id) {
      each(spyLinks, function (a) { a.classList.remove("active"); a.removeAttribute("aria-current"); });
      var link = id ? byId[id] : null;
      if (!link) return;
      link.classList.add("active");
      link.setAttribute("aria-current", "true");
      var bar = link.parentNode;
      if (bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: link.offsetLeft - 16, behavior: reduceMotion ? "auto" : "smooth" });
    };
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var id = entry.target.id;
        visible = visible.filter(function (v) { return v !== id; });
        if (entry.isIntersecting) visible = visible.concat(id);
      });
      setActive(visible[visible.length - 1]);
    }, { rootMargin: "-30% 0px -60% 0px" });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ------------------------------------------------------------------
     Visit registration -> WhatsApp / SMS
     ------------------------------------------------------------------ */
  var form = document.getElementById("visit-form");
  if (!form) return;

  var dateIn = form.querySelector("#v-date");
  var errBox = document.getElementById("form-error");
  var preview = document.getElementById("preview");
  var smsLink = document.getElementById("sms-link");
  var waLink = document.getElementById("wa-link");
  var afternoon = form.querySelector('input[name="session"][value="Afternoon"]');
  var morning = form.querySelector('input[name="session"][value="Morning"]');

  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parse(v) { var p = v.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function pretty(v) {
    return parse(v).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  var today = new Date();
  dateIn.min = iso(today);
  var max = new Date(today); max.setDate(max.getDate() + BOOKING_WINDOW_DAYS);
  dateIn.max = iso(max);

  /* Pre-select a service passed in the URL, e.g. visit.html?service=child */
  var wanted = new URLSearchParams(location.search).get("service");
  if (wanted) {
    each(form.querySelectorAll('input[name="service"]'), function (input) {
      if (input.getAttribute("data-key") === wanted) input.checked = true;
    });
  }

  function showError(msg) {
    errBox.hidden = !msg;
    errBox.textContent = msg || "";
    if (msg) {
      errBox.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      errBox.focus({ preventScroll: true });
    }
  }

  /* A date counts only when it is complete and inside the booking window. Browsers fire
     "change" on half-typed dates (year 0020), which must not be judged. */
  function inWindow(v) { return /^\d{4}-\d{2}-\d{2}$/.test(v) && v >= dateIn.min && v <= dateIn.max; }
  function closedReason(v) {
    if (parse(v).getDay() === 5) return "The centre is closed on Fridays. Please choose another day.";
    if (CLINIC.holidays.indexOf(v) !== -1) return "The centre is closed on that day for a government holiday. Please choose another day.";
    return "";
  }
  function isSaturday(v) { return parse(v).getDay() === 6; }

  /* Fridays and listed holidays closed; Saturdays morning only (9:00 AM to 2:00 PM) */
  dateIn.addEventListener("change", function () {
    showError("");
    afternoon.disabled = false;
    if (!inWindow(dateIn.value)) return;
    var reason = closedReason(dateIn.value);
    if (reason) {
      showError(reason);
      dateIn.value = "";
      return;
    }
    if (isSaturday(dateIn.value)) {
      afternoon.disabled = true;
      if (afternoon.checked) morning.checked = true;
    }
  });

  function val(sel) { var el = form.querySelector(sel); return el ? el.value.trim() : ""; }

  function buildMessage() {
    var service = form.querySelector('input[name="service"]:checked');
    var session = form.querySelector('input[name="session"]:checked');
    var name = val("#v-name");
    var phone = val("#v-phone");

    if (!service) return { error: "Please choose the service you need." };
    if (!dateIn.value) return { error: "Please choose a preferred date.", field: dateIn };
    if (!inWindow(dateIn.value)) return { error: "Please choose a date between today and " + pretty(dateIn.max) + ".", field: dateIn };
    var reason = closedReason(dateIn.value);
    if (reason) return { error: reason, field: dateIn };
    if (!session) return { error: "Please choose morning or afternoon." };
    if (session.value === "Afternoon" && isSaturday(dateIn.value)) return { error: "On Saturdays the centre closes at 2 PM. Please choose the morning." };
    if (name.length < 2) return { error: "Please enter the patient's name.", field: form.querySelector("#v-name") };
    if (!PHONE_PATTERN.test(phone.replace(/\D/g, ""))) return { error: "Please enter a valid mobile number: 11 digits, starting with 01.", field: form.querySelector("#v-phone") };

    var lines = [
      "Visit request: Radda MCH-FP Centre",
      "",
      "Service: " + service.value,
      "Preferred date: " + pretty(dateIn.value),
      "Session: " + session.value,
      "Patient: " + name + (val("#v-age") ? " (age " + val("#v-age") + ")" : ""),
      "Visiting for: " + val("#v-for"),
      "Mobile: " + phone
    ];
    var note = val("#v-note");
    if (note) lines.push("Note: " + note);
    lines.push("", "Please confirm my visit. Thank you.");
    return { text: lines.join("\n") };
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    each(form.querySelectorAll("[aria-invalid]"), function (el) { el.removeAttribute("aria-invalid"); });
    var r = buildMessage();
    if (r.error) {
      if (r.field) r.field.setAttribute("aria-invalid", "true");
      showError(r.error);
      return;
    }
    showError("");
    var waUrl = "https://wa.me/" + CLINIC.whatsapp + "?text=" + encodeURIComponent(r.text);
    preview.hidden = false;
    preview.textContent = r.text;
    smsLink.hidden = false;
    smsLink.href = "sms:+" + CLINIC.whatsapp + "?body=" + encodeURIComponent(r.text);
    // A plain link as well: some in-app browsers silently block window.open.
    waLink.hidden = false;
    waLink.href = waUrl;
    window.open(waUrl, "_blank", "noopener");
  });
})();
