/* Radda MCH-FP Centre — site behaviour (no dependencies) */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     SETTINGS — edit these if the clinic's details change.
     ------------------------------------------------------------------ */
  var CLINIC = {
    whatsapp: "8801335097710",      // international format, digits only
    phoneDisplay: "+880 1335-097710"
  };

  /* Mobile menu */
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* Photos: if an image file has not been added yet, show the blue frame */
  Array.prototype.forEach.call(document.querySelectorAll(".photo img"), function (img) {
    function fail() { img.parentNode.classList.add("no-img"); }
    if (img.complete && img.naturalWidth === 0) fail();
    img.addEventListener("error", fail);
  });

  /* Footer year */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     Visit registration -> WhatsApp / SMS
     ------------------------------------------------------------------ */
  var form = document.getElementById("visit-form");
  if (!form) return;

  var dateIn = form.querySelector("#v-date");
  var errBox = document.getElementById("form-error");
  var preview = document.getElementById("preview");
  var smsLink = document.getElementById("sms-link");
  var afternoon = form.querySelector('input[name="session"][value="Afternoon"]');

  function pad(n) { return String(n).padStart(2, "0"); }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parse(v) { var p = v.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function pretty(v) {
    return parse(v).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  var today = new Date();
  dateIn.min = iso(today);
  var max = new Date(today); max.setDate(max.getDate() + 60);
  dateIn.max = iso(max);

  /* Pre-select a service passed in the URL, e.g. visit.html?service=child */
  var qs = new URLSearchParams(location.search).get("service");
  if (qs) {
    var pre = form.querySelector('input[name="service"][data-key="' + qs + '"]');
    if (pre) pre.checked = true;
  }

  /* Fridays closed; Saturdays morning only (9:00 AM – 2:00 PM) */
  dateIn.addEventListener("change", function () {
    showError("");
    if (!dateIn.value) return;
    var day = parse(dateIn.value).getDay();
    if (day === 5) {
      showError("The centre is closed on Fridays. Please choose another day.");
      dateIn.value = "";
      return;
    }
    var sat = day === 6;
    afternoon.disabled = sat;
    if (sat && afternoon.checked) {
      afternoon.checked = false;
      form.querySelector('input[name="session"][value="Morning"]').checked = true;
    }
  });

  function showError(msg) {
    errBox.hidden = !msg;
    errBox.textContent = msg || "";
    if (msg) errBox.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function val(sel) { var el = form.querySelector(sel); return el ? el.value.trim() : ""; }

  function buildMessage() {
    var service = form.querySelector('input[name="service"]:checked');
    var session = form.querySelector('input[name="session"]:checked');
    var name = val("#v-name");
    var phone = val("#v-phone");

    if (!service) return { error: "Please choose the service you need." };
    if (!dateIn.value) return { error: "Please choose a preferred date." };
    if (!session) return { error: "Please choose morning or afternoon." };
    if (name.length < 2) return { error: "Please enter the patient's name." };
    if (phone.replace(/\D/g, "").length < 11) return { error: "Please enter a valid mobile number (11 digits)." };

    var lines = [
      "Visit request — Radda MCH-FP Centre",
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
    var r = buildMessage();
    if (r.error) { showError(r.error); return; }
    showError("");
    preview.hidden = false;
    preview.textContent = r.text;
    smsLink.hidden = false;
    smsLink.href = "sms:+" + CLINIC.whatsapp + "?body=" + encodeURIComponent(r.text);
    window.open("https://wa.me/" + CLINIC.whatsapp + "?text=" + encodeURIComponent(r.text), "_blank", "noopener");
  });
})();
