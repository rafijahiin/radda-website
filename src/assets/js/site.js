/* Radda MCH-FP Centre: site behaviour (no dependencies).
   Settings and all wording arrive from the build in window.RADDA, so nothing
   here needs editing when hours, holidays, phone numbers or text change:
   edit src/_data/site.json and src/_data/i18n/*.json instead. */
(function () {
  "use strict";

  var cfg = window.RADDA;
  if (!cfg) return;
  var CLINIC = cfg.clinic;
  var T = cfg.t;
  var IS_BANGLA = cfg.lang === "bn";

  var REVEAL_CLEANUP_MS = 1600;
  var LOOKAHEAD_DAYS = 14;
  var MAX_RESULTS = 8;
  var SNIPPET_LENGTH = 110;
  var DONE_LABEL_MS = 2000;
  var SLIDE_INTERVAL_MS = 7000;
  var SWIPE_MIN_PX = 40;
  var COUNT_MS = 1400;
  var COUNT_SAFETY_MS = 250;
  var PICTOGRAM_MS = 900;
  var PHONE_PATTERN = /^(?:88)?01[3-9]\d{8}$/;   // Bangladeshi mobile, with or without 88
  var BANGLA_DIGITS = "০১২৩৪৫৬৭৮৯";

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function fill(template, values) {
    return template.replace(/\{(\w+)\}/g, function (match, name) { return name in values ? values[name] : match; });
  }
  /* Numbers are shown in Bangla digits on the Bangla pages. */
  function num(value) {
    var text = String(value);
    return IS_BANGLA ? text.replace(/\d/g, function (d) { return BANGLA_DIGITS.charAt(d); }) : text;
  }
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header: shadow once the page scrolls */
  var header = document.querySelector(".site-header");
  if (header) {
    // The small logo joins the menu row once the cyan band above it has scrolled away.
    var band = document.querySelector(".brand-band");
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > (band ? band.offsetTop + band.offsetHeight : 8));
    };
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
      btn.setAttribute("aria-label", open ? T.menu_close : T.menu_open);
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
  if (yr) yr.textContent = num(new Date().getFullYear());

  /* ------------------------------------------------------------------
     Open / closed status, worked out in Dhaka time
     ------------------------------------------------------------------ */
  var EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function dhakaNow() {
    var parts = {};
    new Intl.DateTimeFormat("en-GB", {
      timeZone: CLINIC.timeZone, weekday: "long", year: "numeric", month: "2-digit",
      day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    return {
      day: EN_DAYS.indexOf(parts.weekday),
      minutes: Number(parts.hour) * 60 + Number(parts.minute),
      y: Number(parts.year), m: Number(parts.month), d: Number(parts.day)
    };
  }
  function banglaPeriod(hour) {
    if (hour < 12) return "সকাল";
    if (hour < 15) return "দুপুর";
    if (hour < 18) return "বিকেল";
    if (hour < 20) return "সন্ধ্যা";
    return "রাত";
  }
  function clock(mins) {
    var h = Math.floor(mins / 60), m = mins % 60, h12 = h % 12 || 12;
    if (IS_BANGLA) return banglaPeriod(h) + " " + num(h12) + (m ? ":" + num(pad(m)) : "") + "টা";
    return h12 + (m ? ":" + pad(m) : "") + (h < 12 ? " AM" : " PM");
  }
  function dateAt(now, offset) { return new Date(Date.UTC(now.y, now.m - 1, now.d + offset)); }
  function dateKey(date) { return date.getUTCFullYear() + "-" + pad(date.getUTCMonth() + 1) + "-" + pad(date.getUTCDate()); }
  function isHoliday(date) { return CLINIC.holidays.indexOf(dateKey(date)) !== -1; }
  function hoursOn(date) { return isHoliday(date) ? null : CLINIC.hours[date.getUTCDay()]; }
  function clinicStatus() {
    var now = dhakaNow();
    if (now.day < 0) return null;
    var todayDate = dateAt(now, 0);
    var holiday = isHoliday(todayDate);
    function status(open, detail) {
      return { open: open, day: now.day, holiday: holiday, today: dateKey(todayDate), title: open ? T.status.open : T.status.closed, detail: detail };
    }
    var today = hoursOn(todayDate);
    if (today && now.minutes >= today[0] && now.minutes < today[1]) {
      return status(true, fill(T.status.closes, { time: clock(today[1]) }));
    }
    if (today && now.minutes < today[0]) {
      return status(false, fill(T.status.opens_today, { time: clock(today[0]) }));
    }
    for (var i = 1; i <= LOOKAHEAD_DAYS; i++) {
      var nextDate = dateAt(now, i);
      var next = hoursOn(nextDate);
      if (!next) continue;
      if (i === 1) return status(false, fill(T.status.opens_tomorrow, { time: clock(next[0]) }));
      var day = T.days[nextDate.getUTCDay()];
      // A week or more away: add the date so the day cannot be mistaken for the coming one.
      if (i >= 7) day += " " + num(nextDate.getUTCDate()) + " " + T.months[nextDate.getUTCMonth()];
      return status(false, fill(T.status.opens_day, { day: day, time: clock(next[0]) }));
    }
    return status(false, T.status.call);
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
    var key = s.holiday ? "holiday" : String(s.day);
    each(document.querySelectorAll("table.hours tr[data-days]"), function (row) {
      row.classList.toggle("today", row.getAttribute("data-days").split(",").indexOf(key) !== -1);
    });
    /* Notices carry an optional last day (data-until="YYYY-MM-DD") and hide themselves after it. */
    each(document.querySelectorAll("[data-until]"), function (el) {
      el.hidden = s.today > el.getAttribute("data-until");
    });
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ------------------------------------------------------------------
     Scroll reveals
     ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        el.classList.add("in");
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
     Hero carousel. The slides lie on top of each other and cross-fade, so
     nothing scrolls sideways. Buttons, dots, a swipe, the arrow keys and a
     timer change the slide. The timer waits while the pointer or the
     keyboard is on the carousel and while the tab is in the background.
     ------------------------------------------------------------------ */
  var carousel = document.querySelector("[data-carousel]");
  if (carousel) {
    var slides = carousel.querySelectorAll(".slide");
    var dots = carousel.querySelectorAll("[data-slide-to]");
    var toggle = carousel.querySelector("[data-carousel-toggle]");
    var controls = carousel.querySelector(".carousel-controls");
    var currentSlide = 0;
    var playing = true;
    var resting = false;        // the pointer or the keyboard focus is on the carousel
    var slideTimer = null;
    var touchStartX = null;

    var schedule = function () {
      clearTimeout(slideTimer);
      var running = playing && !resting && !document.hidden;
      carousel.classList.toggle("is-playing", running);
      if (running) slideTimer = setTimeout(function () { showSlide(currentSlide + 1); }, SLIDE_INTERVAL_MS);
    };
    var showSlide = function (index) {
      currentSlide = (index + slides.length) % slides.length;
      each(slides, function (slide, i) {
        slide.classList.toggle("is-active", i === currentSlide);
        slide.inert = i !== currentSlide;
      });
      each(dots, function (dot, i) { dot.setAttribute("aria-current", i === currentSlide ? "true" : "false"); });
      var nextPhoto = slides[(currentSlide + 1) % slides.length].querySelector("img");
      if (nextPhoto) nextPhoto.loading = "eager";   // fetch the next photo before it is needed
      schedule();
    };
    var rest = function (isResting) { resting = isResting; schedule(); };
    var paintToggle = function () {
      toggle.setAttribute("aria-pressed", playing ? "true" : "false");
      toggle.setAttribute("aria-label", toggle.getAttribute(playing ? "data-label-pause" : "data-label-play"));
    };

    if (slides.length < 2) {
      if (controls) controls.hidden = true;
    } else {
      carousel.style.setProperty("--slide-ms", SLIDE_INTERVAL_MS + "ms");
      carousel.querySelector("[data-carousel-prev]").addEventListener("click", function () { showSlide(currentSlide - 1); });
      carousel.querySelector("[data-carousel-next]").addEventListener("click", function () { showSlide(currentSlide + 1); });
      each(dots, function (dot, i) { dot.addEventListener("click", function () { showSlide(i); }); });
      toggle.addEventListener("click", function () { playing = !playing; paintToggle(); schedule(); });
      carousel.addEventListener("mouseenter", function () { rest(true); });
      carousel.addEventListener("mouseleave", function () { rest(false); });
      carousel.addEventListener("focusin", function () { rest(true); });
      carousel.addEventListener("focusout", function (event) { if (!carousel.contains(event.relatedTarget)) rest(false); });
      carousel.addEventListener("keydown", function (event) {
        if (event.key === "ArrowLeft") showSlide(currentSlide - 1);
        if (event.key === "ArrowRight") showSlide(currentSlide + 1);
      });
      carousel.addEventListener("touchstart", function (event) { touchStartX = event.touches[0].clientX; }, { passive: true });
      carousel.addEventListener("touchend", function (event) {
        if (touchStartX === null) return;
        var moved = event.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(moved) >= SWIPE_MIN_PX) showSlide(currentSlide + (moved < 0 ? 1 : -1));
      });
      document.addEventListener("visibilitychange", schedule);
      paintToggle();
      showSlide(0);
    }
  }

  /* ------------------------------------------------------------------
     Motion in the charts and figures
     ------------------------------------------------------------------ */
  /* Rows, pins and figures appear in order: each one is told its place in the queue. */
  each(document.querySelectorAll(".bars, .pairs, .targets, .wards"), function (list) {
    each(list.children, function (child, i) { child.style.setProperty("--i", i); });
  });
  each(document.querySelectorAll(".pictogram"), function (group) {
    var gap = PICTOGRAM_MS / Math.max(1, group.children.length);
    each(group.children, function (figure, i) { figure.style.animationDelay = Math.round(i * gap) + "ms"; });
  });

  /* A number marked data-count runs up from zero the first time it is seen, and
     ends on exactly the text the page was built with. */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window && window.requestAnimationFrame) {
    var wholeNumber = new Intl.NumberFormat(cfg.locale, { maximumFractionDigits: 0 });
    var runCounter = function (el) {
      var target = Number(el.getAttribute("data-count"));
      var finalText = el.textContent;
      var startedAt = null;
      var done = false;
      var step = function (now) {
        if (startedAt === null) startedAt = now;
        var progress = Math.min(1, (now - startedAt) / COUNT_MS);
        var eased = 1 - Math.pow(1 - progress, 3);     // quick at first, settling at the end
        if (progress >= 1 || done) { el.textContent = finalText; return; }
        el.textContent = wholeNumber.format(Math.round(target * eased));
        window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
      // Whatever happens to the animation (a background tab, a print), the true number is restored.
      setTimeout(function () { done = true; el.textContent = finalText; }, COUNT_MS + COUNT_SAFETY_MS);
    };
    var counterWatch = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        counterWatch.unobserve(entry.target);
        runCounter(entry.target);
      });
    }, { threshold: 0.4 });
    each(counters, function (el) { if (isFinite(Number(el.getAttribute("data-count")))) counterWatch.observe(el); });
  }

  /* Impact page: one chart at a time, chosen with the buttons. Without this
     script every chart simply shows, one under the other. */
  var chartTabs = document.querySelectorAll("[data-chart-tab]");
  var charts = document.querySelectorAll("[data-chart]");
  var showChart = function (wanted) {
    each(chartTabs, function (tab) { tab.setAttribute("aria-pressed", tab.getAttribute("data-chart-tab") === wanted ? "true" : "false"); });
    each(charts, function (chart) { chart.hidden = chart.getAttribute("data-chart") !== wanted; });
  };
  if (chartTabs.length && charts.length) {
    each(chartTabs, function (tab) {
      tab.addEventListener("click", function () {
        var wanted = tab.getAttribute("data-chart-tab");
        showChart(wanted);
        each(charts, function (chart) {     // let the bars of the chosen chart fill again
          chart.classList.remove("replay");
          if (chart.getAttribute("data-chart") === wanted) { void chart.offsetWidth; chart.classList.add("replay"); }
        });
      });
    });
    showChart(chartTabs[0].getAttribute("data-chart-tab"));
  }

  /* ------------------------------------------------------------------
     Health tools: vaccine dates and pregnancy dates. The arithmetic is in
     planner.js; this part reads the form and draws the answer. Nothing
     the visitor types is sent anywhere.
     ------------------------------------------------------------------ */
  var plannerData = document.getElementById("planner-data");
  var planner = window.RaddaPlanner;
  if (plannerData && planner) {
    var plan = JSON.parse(plannerData.textContent);
    var words = plan.text;
    var pageLocale = document.documentElement.lang === "bn" ? "bn-BD" : "en-GB";
    var longDate = new Intl.DateTimeFormat(pageLocale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    var showDate = function (ms) { return longDate.format(new Date(ms)); };
    var localNumber = function (n) { return new Intl.NumberFormat(pageLocale).format(n); };
    var fill = function (text, values) {
      return text.replace(/\{(\w+)\}/g, function (whole, name) { return name in values ? values[name] : whole; });
    };
    var el = function (tag, className, text) {
      var node = document.createElement(tag);
      if (className) node.className = className;
      if (text) node.textContent = text;
      return node;
    };
    var todayUtc = function () {
      var now = new Date();   // the visitor's own calendar day, held as a UTC day number
      return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    };
    var actions = function (waText, events, fileName) {
      var row = el("div", "plan-actions");
      var wa = el("a", "btn btn-wa", words.wa);
      wa.href = "https://wa.me/" + CLINIC.whatsapp + "?text=" + encodeURIComponent(waText);
      wa.target = "_blank"; wa.rel = "noopener";
      row.appendChild(wa);
      if (events.length && window.Blob && window.URL) {
        var save = el("a", "btn btn-outline", words.calendar);
        save.href = URL.createObjectURL(new Blob([planner.toCalendar(events, todayUtc())], { type: "text/calendar" }));
        save.download = fileName;
        row.appendChild(save);
      }
      var print = el("button", "btn btn-outline", words.print);
      print.type = "button";
      print.addEventListener("click", function () { window.print(); });
      row.appendChild(print);
      return row;
    };

    var drawVaccines = function (birth, today, box) {
      var visits = planner.withStatus(planner.vaccineDates(birth, plan.schedule.vaccines), today);
      var list = el("ol", "plan-list");
      var next = null;
      visits.forEach(function (visit) {
        var label = plan.visits[visit.id];
        var item = el("li", visit.next ? "next" : visit.status === "past" ? "past" : "");
        var when = el("div", "plan-when");
        when.appendChild(el("b", "", showDate(visit.date)));
        when.appendChild(el("span", "", label.age));
        var what = el("div", "plan-what", label.what);
        what.appendChild(el("em", "", visit.status === "today" ? words.today : visit.next ? words.next : visit.status === "past" ? words.past : words.upcoming));
        item.appendChild(when); item.appendChild(what);
        list.appendChild(item);
        if (visit.next) next = { what: label.what, when: showDate(visit.date) };
      });
      box.appendChild(list);
      box.appendChild(el("p", "note", next ? words.missed_hint : words.all_done));
      var upcoming = visits.filter(function (visit) { return visit.status !== "past"; }).map(function (visit) {
        return { date: visit.date, title: fill(words.ics_vaccine, { what: plan.visits[visit.id].what }) };
      });
      box.appendChild(actions(next ? fill(words.wa_vaccine, next) : words.wa_vaccine_check, upcoming, "radda-vaccine-dates.ics"));
    };

    var drawPregnancy = function (lastPeriod, today, box) {
      var dates = planner.pregnancy(lastPeriod, today, plan.schedule.pregnancy);
      box.appendChild(el("h3", "", words.due));
      box.appendChild(el("p", "tool-big", showDate(dates.due)));
      box.appendChild(el("p", "", fill(words.week, { n: localNumber(dates.weeks) })));
      var firstStillAhead = dates.firstVisitBy >= today;
      box.appendChild(el("p", "", firstStillAhead ? fill(words.first_visit, { when: showDate(dates.firstVisitBy) }) : words.first_visit_passed));
      box.appendChild(el("p", "note", words.four));
      var events = [{ date: dates.due, title: words.ics_due }];
      if (firstStillAhead) events.unshift({ date: dates.firstVisitBy, title: words.ics_first });
      box.appendChild(actions(fill(words.wa_pregnancy, { when: showDate(dates.due) }), events, "radda-pregnancy-dates.ics"));
    };

    var tools = {
      vaccine: { oldest: plan.schedule.child_oldest_days, tooOld: words.err_birth_old, draw: drawVaccines },
      pregnancy: { oldest: plan.schedule.pregnancy.oldest_days, tooOld: words.err_lmp_old, draw: drawPregnancy }
    };
    each(document.querySelectorAll("[data-planner]"), function (form) {
      var kind = form.getAttribute("data-planner");
      var tool = tools[kind];
      var input = form.querySelector("input[type=date]");
      var error = form.querySelector(".tool-error");
      var box = document.querySelector('[data-planner-result="' + kind + '"]');
      if (!tool || !input || !error || !box) return;
      var todayIso = new Date(todayUtc()).toISOString().slice(0, 10);
      input.max = todayIso;
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var today = todayUtc();
        var day = planner.parseDay(input.value);
        var problem = planner.problemWith(day, today, tool.oldest);
        var message = problem === "empty" ? words.err_empty : problem === "future" ? words.err_future : problem === "old" ? tool.tooOld : "";
        error.textContent = message;
        error.hidden = !message;
        box.textContent = "";
        box.hidden = Boolean(message);
        if (!message) tool.draw(day, today, box);
      });
    });
  }

  /* (Kept above the visit form on purpose: that section ends the script early on pages without the form.) */

  /* News page: filter by type */
  var filters = document.querySelectorAll("[data-filter]");
  each(filters, function (button) {
    button.addEventListener("click", function () {
      var wanted = button.getAttribute("data-filter");
      each(filters, function (b) { b.setAttribute("aria-pressed", b === button ? "true" : "false"); });
      each(document.querySelectorAll(".news-item[data-type]"), function (item) {
        item.hidden = wanted !== "all" && item.getAttribute("data-type") !== wanted;
      });
    });
  });

  /* ------------------------------------------------------------------
     Search: a small index built with the site, searched in the browser
     ------------------------------------------------------------------ */
  var searchEl = document.getElementById("search");
  if (searchEl) {
    var searchInput = document.getElementById("search-input");
    var searchList = document.getElementById("search-results");
    var searchHint = document.getElementById("search-hint");
    var hintText = searchHint.textContent;
    var searchIndex = null;
    var lastFocus = null;

    var loadIndex = function () {
      if (searchIndex) return Promise.resolve(searchIndex);
      return fetch(cfg.up + "search.json")
        .then(function (response) { if (!response.ok) throw new Error("search index: " + response.status); return response.json(); })
        .catch(function () { return []; })
        .then(function (entries) { searchIndex = entries; return entries; });
    };
    var findMatches = function (query) {
      var tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
      if (!tokens.length) return [];
      return searchIndex.map(function (entry) {
        var title = entry.t.toLowerCase(), text = (entry.x || "").toLowerCase(), score = 0;
        for (var i = 0; i < tokens.length; i++) {
          if (title.indexOf(tokens[i]) === 0) score += 5;
          else if (title.indexOf(tokens[i]) !== -1) score += 3;
          else if (text.indexOf(tokens[i]) !== -1) score += 1;
          else return null;                    // every word must appear somewhere
        }
        return { entry: entry, score: score, first: tokens[0] };
      }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).slice(0, MAX_RESULTS);
    };
    var snippet = function (text, word) {
      if (!text) return "";
      var at = Math.max(text.toLowerCase().indexOf(word) - 30, 0);
      var cut = text.slice(at, at + SNIPPET_LENGTH);
      return (at > 0 ? "... " : "") + cut + (at + SNIPPET_LENGTH < text.length ? " ..." : "");
    };
    var renderResults = function () {
      var query = searchInput.value.trim();
      searchList.textContent = "";
      if (!query) { searchHint.textContent = hintText; searchHint.hidden = false; return; }
      var matches = findMatches(query);
      searchHint.hidden = matches.length > 0;
      if (!matches.length) { searchHint.textContent = fill(T.search.empty, { phone: cfg.phone }); return; }
      matches.forEach(function (match) {
        var external = /^https?:/.test(match.entry.u);
        var link = document.createElement("a");
        link.href = external ? match.entry.u : cfg.up + match.entry.u;
        if (external) { link.target = "_blank"; link.rel = "noopener"; }
        var kind = document.createElement("span");
        kind.className = "kind";
        kind.textContent = T.search.kinds[match.entry.k] || "";
        var title = document.createElement("strong");
        title.textContent = match.entry.t;
        var text = document.createElement("small");
        text.textContent = snippet(match.entry.x, match.first);
        link.appendChild(kind); link.appendChild(title); link.appendChild(text);
        var row = document.createElement("li");
        row.appendChild(link);
        searchList.appendChild(row);
      });
    };
    var closeSearch = function () {
      searchEl.hidden = true;
      document.documentElement.classList.remove("search-open");
      if (lastFocus) lastFocus.focus();
    };
    var openSearch = function () {
      lastFocus = document.activeElement;
      searchEl.hidden = false;
      document.documentElement.classList.add("search-open");
      searchInput.focus();
      searchInput.select();
      loadIndex().then(renderResults);
    };
    each(document.querySelectorAll("[data-search-open]"), function (b) { b.addEventListener("click", openSearch); });
    each(document.querySelectorAll("[data-search-close]"), function (b) { b.addEventListener("click", closeSearch); });
    searchEl.addEventListener("click", function (e) {
      if (e.target === searchEl || e.target.closest(".search-results a")) closeSearch();
    });
    searchInput.addEventListener("input", function () { loadIndex().then(renderResults); });
    document.addEventListener("keydown", function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if (searchEl.hidden) {
        if (e.key === "/" && !typing) { e.preventDefault(); openSearch(); }
        return;
      }
      if (e.key === "Escape") { closeSearch(); return; }
      if (e.key !== "Tab") return;
      // Keep Tab inside the search box while it is open.
      var stops = searchEl.querySelectorAll("input, button, a[href]");
      var first = stops[0], last = stops[stops.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ------------------------------------------------------------------
     Copy and share buttons (appeal page)
     ------------------------------------------------------------------ */
  var canCopy = Boolean(navigator.clipboard && navigator.clipboard.writeText);
  function flashDone(button) {
    var label = button.textContent;
    button.textContent = button.getAttribute("data-done") || label;
    setTimeout(function () { button.textContent = label; }, DONE_LABEL_MS);
  }
  each(document.querySelectorAll("[data-copy]"), function (button) {
    if (!canCopy) { button.hidden = true; return; }      // the number stays on the page to copy by hand
    button.addEventListener("click", function () {
      navigator.clipboard.writeText(button.getAttribute("data-copy")).then(function () { flashDone(button); }, function () { button.hidden = true; });
    });
  });
  each(document.querySelectorAll("[data-share]"), function (button) {
    if (!navigator.share && !canCopy) { button.hidden = true; return; }
    button.addEventListener("click", function () {
      var page = { title: document.title, url: location.href.split("#")[0] };
      if (navigator.share) {
        navigator.share(page).catch(function () { /* the reader closed the share sheet: nothing to do */ });
        return;
      }
      navigator.clipboard.writeText(page.url).then(function () { flashDone(button); }, function () { button.hidden = true; });
    });
  });

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
  var afternoon = form.querySelector('input[data-session="afternoon"]');
  var morning = form.querySelector('input[data-session="morning"]');

  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parse(v) { var p = v.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function pretty(v) {
    return parse(v).toLocaleDateString(cfg.locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  var today = new Date();
  dateIn.min = iso(today);
  var max = new Date(today); max.setDate(max.getDate() + CLINIC.bookingWindowDays);
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
    if (parse(v).getDay() === 5) return T.form.err_friday;
    if (CLINIC.holidays.indexOf(v) !== -1) return T.form.err_holiday;
    return "";
  }
  function isSaturday(v) { return parse(v).getDay() === 6; }

  /* Fridays and listed holidays closed; Saturdays morning only */
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
    var F = T.form;

    if (!service) return { error: F.err_service };
    if (!dateIn.value) return { error: F.err_date, field: dateIn };
    if (!inWindow(dateIn.value)) return { error: fill(F.err_window, { date: pretty(dateIn.max) }), field: dateIn };
    var reason = closedReason(dateIn.value);
    if (reason) return { error: reason, field: dateIn };
    if (!session) return { error: F.err_session };
    if (session === afternoon && isSaturday(dateIn.value)) return { error: F.err_saturday };
    if (name.length < 2) return { error: F.err_name, field: form.querySelector("#v-name") };
    if (!PHONE_PATTERN.test(phone.replace(/\D/g, ""))) return { error: F.err_phone, field: form.querySelector("#v-phone") };

    var age = val("#v-age");
    var lines = [
      F.msg_title,
      "",
      F.msg_service + ": " + service.value,
      F.msg_date + ": " + pretty(dateIn.value),
      F.msg_session + ": " + session.value,
      F.msg_patient + ": " + name + (age ? " (" + F.msg_age + " " + age + ")" : ""),
      F.msg_for + ": " + val("#v-for"),
      F.msg_mobile + ": " + phone
    ];
    var note = val("#v-note");
    if (note) lines.push(F.msg_note + ": " + note);
    lines.push("", F.msg_confirm);
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
