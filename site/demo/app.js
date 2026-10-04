/* JobFold prototype 2027: routing, themes, Money Timeline filters and source drawer, visit capture, change-order money in
   integer cents, customer approval with signature, report steps, Money Finder review, dispatch moves, team, billing,
   first run, closeout and command bar, plus the final-pass screens: approval frame, bundle approval, seal check and money letter.
   Synthetic data only; no network requests. */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var root = document.documentElement;
  var SVG = "http://www.w3.org/2000/svg";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text !== undefined && text !== null) { n.textContent = text; }
    return n;
  }
  function glyph(id, cls) {
    var s = document.createElementNS(SVG, "svg");
    s.setAttribute("class", "i" + (cls ? " " + cls : ""));
    s.setAttribute("aria-hidden", "true");
    var u = document.createElementNS(SVG, "use");
    u.setAttribute("href", "#" + id);
    s.appendChild(u);
    return s;
  }
  function typing(e) {
    var t = e.target;
    return !!(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)));
  }

  /* ---------- money: integer cents, half-up rounding once per line (DESIGN.md F-09) ---------- */
  function halfUp(num, den) { return Math.floor((2 * num + den) / (2 * den)); }
  function euro(cents) {
    var e = Math.floor(cents / 100), c = cents % 100;
    return String(e).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + (c < 10 ? "0" : "") + c + " €";
  }

  /* ---------- toast, missing features, generic controls ---------- */
  var toastEl = $("#toast"), toastTimer = 0;
  function toast(text, linkText, href) {
    toastEl.textContent = "";
    toastEl.appendChild(el("span", "", text));
    if (linkText) { var a = el("a", "", linkText); a.href = href; toastEl.appendChild(a); }
    toastEl.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toastEl.hidden = true; }, 5200);
  }
  document.addEventListener("click", function (e) {
    var miss = e.target.closest("[data-missing]");
    if (miss) { e.preventDefault(); toast("„" + miss.getAttribute("data-missing") + "“ ist im Prototyp nicht enthalten."); return; }
    var t = e.target.closest("[data-toast]");
    if (t) {
      toast(t.getAttribute("data-toast"));
      var d = t.closest("details.menu");
      if (d) { d.open = false; }
    }
    var r = e.target.closest('.seg [role="radio"]');
    if (r && !r.hasAttribute("data-contract")) {
      $$('[role="radio"]', r.parentElement).forEach(function (x) { x.setAttribute("aria-checked", String(x === r)); });
    }
    var sw = e.target.closest(".switch");
    if (sw) {
      var on = sw.getAttribute("aria-checked") !== "true";
      sw.setAttribute("aria-checked", String(on));
      var sec = sw.getAttribute("data-sec");
      if (sec) { $$('[data-part="' + sec + '"]').forEach(function (p) { p.hidden = !on; }); }
    }
    $$("details.menu[open]").forEach(function (m) { if (!m.contains(e.target)) { m.open = false; } });
  });
  document.addEventListener("keydown", function (e) {
    var r = e.target.closest && e.target.closest('.seg [role="radio"]');
    if (!r || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) { return; }
    var all = $$('[role="radio"]', r.parentElement), i = all.indexOf(r) + (e.key === "ArrowRight" ? 1 : -1);
    var next = all[(i + all.length) % all.length];
    e.preventDefault(); next.focus(); next.click();
  });

  /* ---------- themes ---------- */
  var themeBtn = $("#themeToggle"), outdoorBtn = $("#outdoorToggle");
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    themeBtn.setAttribute("aria-pressed", String(t === "dark"));
    outdoorBtn.setAttribute("aria-pressed", String(t === "outdoor"));
  }
  themeBtn.addEventListener("click", function () { setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"); });
  outdoorBtn.addEventListener("click", function () { setTheme(root.getAttribute("data-theme") === "outdoor" ? "light" : "outdoor"); });

  /* ---------- confirm dialog ---------- */
  var confirmDlg = $("#confirmDlg"), confirmCb = null;
  function openConfirm(title, text, okLabel, cb, plain) {
    $("#cfTitle").textContent = title;
    $("#cfText").textContent = text;
    $("#cfOk").textContent = okLabel;
    $("#cfOk").className = plain ? "btn btn-primary" : "btn btn-primary btn-danger-solid";
    confirmCb = cb;
    confirmDlg.showModal();
  }
  $("#cfCancel").addEventListener("click", function () { confirmDlg.close(); });
  $("#cfOk").addEventListener("click", function () {
    confirmDlg.close();
    if (confirmCb) { var cb = confirmCb; confirmCb = null; cb(); }
  });

  /* ================= 7.1 Money Timeline ================= */
  var SRC = {
    co31: { kind: "Nachtrag NT-2026-0031", when: "Heute, 09:05, gesendet von Tim Berger",
      quote: "Kellerfenster innen und außen putzen, 6 Stück, Samstag 10.10.2026.",
      facts: [["Netto", "67,50 €"], ["MwSt. 19 %", "12,83 €"], ["Brutto", "80,33 €"], ["Freigabe", "Link mit E-Mail-Code und Unterschrift, ergibt Klasse A"], ["Gültig bis", "13.10.2026"], ["Quelle", "Sprachnotiz von Anna K., 08:31"]],
      link: ["Kundenansicht öffnen", "#approve"], tech: [["Version", "1"], ["Prüfsumme", "sha256 7f3a…c91e"], ["Nummer", "vom Server vergeben"]] },
    voice31: { kind: "Sprachnotiz", when: "Heute, 08:31, Anna K. im Einsatz",
      quote: "„Frau Beispiel fragt, ob wir am Samstag auch die sechs Kellerfenster putzen können, innen und außen.“",
      facts: [["Länge", "0:14"], ["Text", "auf dem Handy erkannt, von Anna K. nicht geändert"], ["Zusatzwunsch", "Regel und Prüfung, bestätigt von Tim Berger"], ["Ergebnis", "bepreist in NT-2026-0031"]],
      link: ["Nachtrag öffnen", "#change"], tech: [["Prüfung", "JF-RADAR-1, Band Prüfen"], ["Audio", "Original gespeichert, 0,2 MB"]] },
    photos29: { kind: "6 Fotos", when: "Heute, 08:20 bis 08:38, Anna K.", photos: ["ph-1", "ph-2", "ph-3", "ph-4", "ph-5", "ph-6"],
      facts: [["Eingangstür", "vorher und nachher"], ["Kellergang", "vorher und nachher"], ["Kellerfenster", "2 Fotos für den Nachtrag"], ["Hochgeladen", "alle 6, Originale unverändert"]],
      link: null, tech: [["Speicher", "je Foto ein Original und eine verkleinerte Kopie"]] },
    visit29: { kind: "Einsatz", when: "Heute, 08:14 bis 08:41, Anna K.",
      facts: [["Angekommen", "08:14, getippt"], ["Gegangen", "08:41, getippt"], ["Checkliste", "8 von 8, alle mit Nachweis"], ["Vor dem Gehen", "2 Lücken geschlossen"], ["Wert", "180,00 € vereinbart"]],
      link: ["Einsatzmodus ansehen", "#visit"], tech: [["Ort", "nur beim Tippen geprüft, keine Ortung dazwischen"]] },
    wa22: { kind: "WhatsApp-Nachricht", when: "Di 22.09., 10:12, Frau Beispiel",
      quote: "„Danke, das Treppenhaus sieht wieder gut aus.“",
      facts: [["Kanal", "WhatsApp Business"], ["Zusatzwunsch", "keiner erkannt"], ["Bewertung", "guter Moment für eine Bitte um Bewertung, nicht gesendet"]],
      link: null, tech: [["Prüfung", "JF-REVIEW-1, Band Prüfen"]] },
    visit22: { kind: "Einsatz", when: "Di 22.09., 08:10 bis 08:39, Anna K.",
      facts: [["Checkliste", "8 von 8, alle mit Nachweis"], ["Fotos", "2"], ["Mangel", "Handlauf 2. OG lose, an die Hausverwaltung gemeldet"]],
      link: null, tech: [] },
    stamp27: { kind: "Freigabe, Klasse C", when: "Do 17.09., 17:48, Frau Beispiel per WhatsApp",
      quote: "„Ja, machen Sie das bitte nach dem Umzug.“",
      facts: [["Nachtrag", "NT-2026-0027, Sonderreinigung nach Umzug, 3. OG"], ["Netto", "85,50 €"], ["Erfasst von", "Tim Berger, Antwort als Quelle gespeichert"], ["Klasse C", "Chat-Antwort, ohne Code und Unterschrift"]],
      link: null, tech: [["Prüfung", "JF-APPROVAL-1 schlug „Freigabe?“ vor; erfasst hat eine Person"]] },
    goodwill15: { kind: "Kulanz", when: "Di 15.09., Jana P.",
      facts: [["Leistung", "Briefkastenschild ersetzt"], ["Wert", "18,00 €"], ["Berechnung", "keine; zählt nicht als Extra"]], link: null, tech: [] },
    visit15: { kind: "Einsatz", when: "Di 15.09., 08:20 bis 08:47, Jana P.", unknown: "Kellergang fegen: als erledigt getippt, Vorher-Nachher-Foto fehlt.",
      facts: [["Checkliste", "7 von 8 mit Nachweis"], ["Grund", "nicht angegeben"]], link: ["Im Bericht ansehen", "#report"], tech: [] },
    lost19: { kind: "Nachtrag NT-2026-0019", when: "Sa 12.09., abgelaufen",
      quote: "Graffiti am Hoftor entfernen.",
      facts: [["Netto", "45,00 €"], ["Gesendet", "29.08. per Freigabelink"], ["Antwort", "keine in 14 Tagen"], ["Zählt als", "Extra verloren"]], link: null, tech: [] },
    stamp24: { kind: "Freigabe, Klasse A", when: "Di 08.09., 14:02, Frau Beispiel",
      facts: [["Nachtrag", "NT-2026-0024, Sperrmüll im Hof abtransportieren"], ["Netto", "160,00 €"], ["Nachweis", "Link, E-Mail-Code und Unterschrift"], ["PDF", "gespeichert"], ["Prüfsiegel", "M4TX-7HD8, mit Zeitstempel vom 09.09."]],
      link: ["Siegel prüfen", "#seal", "M4TX-7HD8"], tech: [["Code an", "f•••@beispiel-verwaltung.example"], ["Prüfsumme", "sha256 21bd…04af"]] }
  };
  var rail = $("#rail"), drawer = $("#drawer");
  var narrowDrawer = window.matchMedia("(max-width: 1280px)");
  function fillFacts(dl, rows) {
    dl.textContent = "";
    rows.forEach(function (r) { dl.appendChild(el("dt", "", r[0])); dl.appendChild(el("dd", "", r[1])); });
  }
  function fillDrawer(key) {
    var d = SRC[key];
    if (!d) { return; }
    $("#dwKind").textContent = d.kind;
    $("#dwWhen").textContent = d.when;
    var src = $("#dwSrc");
    src.textContent = "";
    if (d.quote) { src.appendChild(el("blockquote", "", d.quote)); }
    if (d.unknown) { src.appendChild(el("p", "unknown-block", d.unknown)); }
    if (d.photos) {
      var g = el("div", "ph-grid");
      d.photos.forEach(function (c) { g.appendChild(el("span", "ph " + c)); });
      src.appendChild(g);
    }
    fillFacts($("#dwFacts"), d.facts);
    var link = $("#dwLink");
    link.textContent = "";
    if (d.link) { var a = el("a", "", d.link[0]); a.href = d.link[1]; if (d.link[2]) { a.setAttribute("data-seal", d.link[2]); } link.appendChild(a); }
    fillFacts($("#dwTech"), d.tech);
    $(".tech", drawer).hidden = !d.tech.length;
  }
  function openDrawer() { if (narrowDrawer.matches) { drawer.classList.add("is-open"); } }
  function closeDrawer() { drawer.classList.remove("is-open"); }
  $("#drawerClose").addEventListener("click", closeDrawer);
  function selectItem(li, open) {
    $$(".tl-item", rail).forEach(function (x) { x.classList.toggle("is-selected", x === li); });
    fillDrawer(li.getAttribute("data-src"));
    if (open) { openDrawer(); }
  }
  rail.addEventListener("click", function (e) {
    if (e.target.closest("a")) { return; }
    var li = e.target.closest(".tl-item");
    if (li) { selectItem(li, true); }
  });
  rail.addEventListener("keydown", function (e) {
    var li = e.target.closest(".tl-item");
    if (!li) { return; }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectItem(li, true); return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      var items = $$(".tl-item", rail).filter(function (x) { return !x.hidden; });
      var next = items[items.indexOf(li) + (e.key === "ArrowDown" ? 1 : -1)];
      if (next) { next.focus(); selectItem(next, false); }
    }
  });
  var FILTER_LABEL = { agreed: "Nur Einsätze, vereinbarte Leistung", approved: "Nur freigegebene Extras", open: "Nur offene Extras", lost: "Nur verlorene Extras" };
  function applyFilter(f) {
    $$(".tl-item", rail).forEach(function (li) { li.hidden = !!f && li.getAttribute("data-money") !== f; });
    $$(".tick-day", rail).forEach(function (d) {
      var n = d.nextElementSibling, any = false;
      while (n && !n.classList.contains("tick-day")) { if (!n.hidden) { any = true; } n = n.nextElementSibling; }
      d.hidden = !!f && !any && !d.classList.contains("is-now");
    });
    $("#tlState").textContent = f ? FILTER_LABEL[f] : "Alle Einträge";
    $("#tlClear").hidden = !f;
  }
  $$(".fig").forEach(function (b) {
    b.addEventListener("click", function () {
      var on = b.getAttribute("aria-pressed") !== "true";
      $$(".fig").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", String(on));
      applyFilter(on ? b.getAttribute("data-filter") : null);
    });
  });
  $("#tlClear").addEventListener("click", function () {
    $$(".fig").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
    applyFilter(null);
  });
  var infoBtn = $("#moneyInfoBtn"), info = $("#moneyInfo");
  infoBtn.addEventListener("click", function () {
    var open = info.hidden;
    info.hidden = !open;
    infoBtn.setAttribute("aria-expanded", String(open));
  });
  $$(".filter-row .fchip").forEach(function (b) {
    b.addEventListener("click", function () { $$(".filter-row .fchip").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); });
  });

  /* ================= 7.2 Visit mode ================= */
  var checklist = $("#checklist");
  function updateVisit() {
    var items = $$(".ci", checklist);
    var done = items.filter(function (b) { return b.getAttribute("aria-pressed") === "true"; }).length;
    $("#vCount").textContent = done + " von " + items.length + " erledigt";
    $$("#vProgress span").forEach(function (s, i) { s.classList.toggle("is-done", i < done); });
  }
  checklist.addEventListener("click", function (e) {
    var b = e.target.closest(".ci");
    if (!b) { return; }
    var on = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", String(on));
    b.classList.toggle("is-done", on);
    $(".ci-state use", b).setAttribute("href", on ? (b.classList.contains("needs-ev") ? "#st-noev" : "#st-done") : "#st-open");
    updateVisit();
  });
  $("#tbPhoto").addEventListener("click", function () { toast("Foto gespeichert, auf diesem Handy. Es wird hochgeladen, sobald Netz da ist."); });
  $("#tbNote").addEventListener("click", function () { toast("Notiz tippen oder diktieren. Gespeichert wird sofort auf diesem Handy."); });
  var talk = $("#tbTalk"), recStart = 0;
  function startRec() {
    if (talk.classList.contains("is-rec")) { return; }
    recStart = Date.now();
    talk.classList.add("is-rec");
    talk.setAttribute("aria-pressed", "true");
    $("span", talk).textContent = "Aufnahme";
  }
  function stopRec() {
    if (!talk.classList.contains("is-rec")) { return; }
    talk.classList.remove("is-rec");
    talk.setAttribute("aria-pressed", "false");
    $("span", talk).textContent = "Sprechen";
    var s = Math.max(1, Math.round((Date.now() - recStart) / 1000));
    toast("Sprachnotiz gespeichert, 0:" + (s < 10 ? "0" : "") + s + ". Der Text wird auf diesem Handy erkannt.");
  }
  talk.addEventListener("pointerdown", function (e) { e.preventDefault(); startRec(); });
  ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { talk.addEventListener(ev, stopRec); });
  talk.addEventListener("keydown", function (e) { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); startRec(); } });
  talk.addEventListener("keyup", function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); stopRec(); } });

  /* ================= 7.3 Radar chip to priced change order ================= */
  var DATES = {
    h: { name: "Zuschlag Sonn- und Feiertag +50 %", why: "Regel „Sonn- und Feiertag“: 03.10.2026 ist Tag der Deutschen Einheit, Feiertag in allen Ländern", bp: 5000 },
    s: { name: "Zuschlag Samstag +25 %", why: "Regel „Samstag“, berechnet aus dem Termin Sa 10.10.2026", bp: 2500 },
    w: { name: "Kein Zuschlag", why: "Mo 12.10.2026 ist ein Werktag; keine Regel greift", bp: 0 }
  };
  var VALID = { "14": "13.10.2026", "7": "06.10.2026", "30": "29.10.2026" };
  var UNIT_CENTS = 900, VAT_BP = 1900;
  var FRAME = { budget: 40000, max: 15000, used: 0, mode: "active", bookings: [] };
  var co = { qty: 6, unknown: false, date: "s", sent: false, net: 6750 };
  function frameFits(net) { return FRAME.mode === "active" && net <= FRAME.max && FRAME.used + net <= FRAME.budget; }
  function frameWhy(net) {
    if (FRAME.mode === "draft") { return "Rahmen noch nicht vom Kunden freigegeben"; }
    if (FRAME.mode === "spent") { return "Rahmen im Oktober ausgeschöpft"; }
    if (net > FRAME.max) { return "Über dem Rahmen: höchstens " + euro(FRAME.max) + " je Nachtrag"; }
    return "Über dem Rahmen: im Oktober noch " + euro(FRAME.budget - FRAME.used);
  }
  function setCell(cell, text, unknown) {
    cell.textContent = "";
    if (unknown) { cell.appendChild(el("span", "unknown", text)); } else { cell.textContent = text; }
  }
  function methodValue() { var r = $('input[name="coMethod"]:checked'); return r ? r.value : "A"; }
  function syncSend() {
    var m = methodValue();
    $("#sendLabel").textContent = m === "F" ? "Im Rahmen ausführen" : "Nachtrag senden";
    $("#msgPreview").hidden = m === "F";
    $("#frameNote").hidden = m !== "F";
  }
  function refreshMethod() {
    if (co.sent) { return; }
    var row = $("#rowFrame"), inp = $("input", row), chip = $("#frameChip"), txt = $("#frameChipText");
    var net = co.unknown ? null : co.net;
    var fits = net !== null && frameFits(net);
    inp.disabled = !fits;
    row.classList.toggle("is-off", !fits);
    chip.classList.toggle("is-off", !fits);
    if (net === null) { txt.textContent = "Rahmen: Menge fehlt, kein Betrag"; }
    else if (fits) { txt.textContent = "Im Rahmen, noch " + euro(FRAME.budget - FRAME.used - net) + " im Oktober"; }
    else { txt.textContent = frameWhy(net); }
    $("#frameSmall").textContent = fits ? "Freigaberahmen R-2026-004, Klasse A, danach noch " + euro(FRAME.budget - FRAME.used - net) + " im Oktober" : txt.textContent;
    if (!fits && inp.checked) { $('input[name="coMethod"][value="A"]').checked = true; }
    if (fits && !$('input[name="coMethod"]:checked')) { inp.checked = true; }
    syncSend();
  }
  function recalc() {
    var d = DATES[co.date], send = $("#sendCo");
    $("#qty").textContent = co.unknown ? "?" : String(co.qty);
    $("#stepper").classList.toggle("is-unknown", co.unknown);
    $("#qtyUnknown").setAttribute("aria-pressed", String(co.unknown));
    $("#qtyUnknown").textContent = co.unknown ? "Menge eingeben" : "Menge unbekannt";
    $("#l2name").textContent = d.name;
    $("#l2why").textContent = d.why;
    if (co.unknown) {
      setCell($("#l1net"), "Menge fehlt", true);
      setCell($("#l2base"), d.bp ? (d.bp / 100) + " % von ?" : "–");
      setCell($("#l2net"), d.bp ? "offen" : euro(0), !!d.bp);
      ["#tNet", "#tVat", "#tGross"].forEach(function (s) { setCell($(s), "unvollständig", true); });
      $("#calcNote").textContent = "Ohne Menge rechnet JobFold keinen Betrag aus. Eine fehlende Menge ist nie 1.";
      $("#sendAmt").textContent = "Betrag fehlt";
      $("#msgText").textContent = "Nachtrag von Muster Gebäudeservice: Kellerfenster putzen, Betrag fehlt. Hier prüfen und freigeben: jobfold.eu/r/…";
      co.net = null;
      send.disabled = true;
      $("#sendBlock").hidden = false;
      refreshMethod();
      return;
    }
    var net1 = halfUp(co.qty * 1000 * UNIT_CENTS, 1000);   /* quantity in thousandths × unit price in cents */
    var vat1 = halfUp(net1 * VAT_BP, 10000);
    var net2 = d.bp ? halfUp(net1 * d.bp, 10000) : 0;
    var vat2 = d.bp ? halfUp(net2 * VAT_BP, 10000) : 0;
    var net = net1 + net2, vat = vat1 + vat2, gross = net + vat;
    co.net = net;
    setCell($("#l1net"), euro(net1));
    setCell($("#l2base"), d.bp ? (d.bp / 100) + " % von " + euro(net1) : "–");
    setCell($("#l2net"), euro(net2));
    setCell($("#tNet"), euro(net));
    setCell($("#tVat"), euro(vat));
    setCell($("#tGross"), euro(gross));
    $("#calcNote").textContent = "MwSt. je Position gerundet: " + euro(vat1) + (d.bp ? " und " + euro(vat2) : "");
    $("#sendAmt").textContent = euro(gross);
    $("#msgText").textContent = "Nachtrag von Muster Gebäudeservice: Kellerfenster putzen, " + euro(gross) + " brutto. Hier prüfen und freigeben: jobfold.eu/r/…";
    send.disabled = co.sent;
    $("#sendBlock").hidden = true;
    refreshMethod();
  }
  $$("#stepper button").forEach(function (b) {
    b.addEventListener("click", function () {
      if (co.unknown) { co.unknown = false; }
      co.qty = Math.max(1, Math.min(99, co.qty + Number(b.getAttribute("data-step"))));
      recalc();
    });
  });
  $("#qtyUnknown").addEventListener("click", function () { co.unknown = !co.unknown; recalc(); });
  $("#coDate").addEventListener("change", function () { co.date = this.value; recalc(); });
  $$('input[name="coMethod"]').forEach(function (r) { r.addEventListener("change", syncSend); });
  $$("[data-contract]").forEach(function (b) {
    b.addEventListener("click", function () {
      $$("[data-contract]").forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); });
      $("#vobNotice").hidden = b.getAttribute("data-contract") !== "vob";
    });
  });
  function sendChange() {
    var b = $("#sendCo");
    if (b.disabled) { return; }
    var m = methodValue();
    if (m === "F") {
      FRAME.used += co.net;
      FRAME.bookings.push({ no: "NT-2026-0031", what: "Kellerfenster innen und außen putzen, 6 Stück", net: co.net });
      $("#coState").textContent = "im Rahmen gebucht als NT-2026-0031, Klasse A";
      $("#frameChipText").textContent = "Gebucht, im Oktober noch " + euro(FRAME.budget - FRAME.used);
      toast("Im Rahmen gebucht: NT-2026-0031, " + euro(co.net) + " netto. Im Oktober noch " + euro(FRAME.budget - FRAME.used) + ". Es wurde keine Nachricht gesendet.", "Rahmen ansehen", "#frame");
    } else {
      $("#coState").textContent = "gesendet als NT-2026-0031";
      toast("Gesendet: NT-2026-0031 an Frau Beispiel. Der Link gilt bis " + VALID[$("#coValid").value] + ".", "Kundenansicht öffnen", "#approve");
    }
    co.sent = true;
    b.disabled = true;
    $("#sendLabel").textContent = m === "F" ? "Gebucht" : "Gesendet";
  }
  $("#sendCo").addEventListener("click", sendChange);

  /* ================= 7.4 Customer approval page ================= */
  $$("[data-choice]").forEach(function (b) {
    b.addEventListener("click", function () {
      var choice = b.getAttribute("data-choice");
      $$("[data-choice]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      $("#rcpApprove").hidden = choice !== "approve";
      $("#rcpAsk").hidden = choice !== "ask";
      $("#rcpDecline").hidden = choice !== "decline";
      var first = choice === "approve" ? $("#apName") : choice === "ask" ? $("#askText") : $("#rcpDecline textarea");
      first.focus();
    });
  });
  var scopeBtn = $("#scopeBtn");
  scopeBtn.addEventListener("click", function () {
    var open = $("#scopeList").hidden;
    $("#scopeList").hidden = !open;
    scopeBtn.setAttribute("aria-expanded", String(open));
    scopeBtn.textContent = open ? "ausblenden" : "anzeigen";
  });
  var pad = $("#sigPad"), ctx = pad.getContext("2d"), drawing = false, strokes = 0, last = null;
  function setupPad() {
    var dpr = window.devicePixelRatio || 1;
    pad.width = Math.round(320 * dpr);
    pad.height = Math.round(160 * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    strokes = 0;
  }
  function padPoint(e) {
    var r = pad.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (320 / r.width), y: (e.clientY - r.top) * (160 / r.height) };
  }
  pad.addEventListener("pointerdown", function (e) {
    drawing = true;
    last = padPoint(e);
    pad.setPointerCapture(e.pointerId);
    ctx.strokeStyle = getComputedStyle(root).getPropertyValue("--ink").trim() || "#182326";
  });
  pad.addEventListener("pointermove", function (e) {
    if (!drawing) { return; }
    var p = padPoint(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
    strokes += 1;
    validateApprove();
  });
  ["pointerup", "pointercancel"].forEach(function (ev) { pad.addEventListener(ev, function () { drawing = false; }); });
  $("#sigClear").addEventListener("click", function () { ctx.clearRect(0, 0, 320, 160); strokes = 0; validateApprove(); });
  var sigType = $("#sigType");
  sigType.addEventListener("click", function () {
    var typed = sigType.getAttribute("aria-expanded") !== "true";
    sigType.setAttribute("aria-expanded", String(typed));
    $("#sigTypedWrap").hidden = !typed;
    pad.hidden = typed;
    $("#sigClear").hidden = typed;
    sigType.textContent = typed ? "Stattdessen zeichnen" : "Name tippen statt zeichnen";
    if (typed) { $("#sigTyped").focus(); }
    validateApprove();
  });
  function sigOk() {
    return sigType.getAttribute("aria-expanded") === "true" ? $("#sigTyped").value.trim().length > 1 : strokes > 3;
  }
  function validateApprove() {
    var ok = $("#apName").value.trim().length > 1 && /^\d{6}$/.test($("#apCode").value) && sigOk() && $("#apCheck").checked;
    $("#apSubmit").disabled = !ok;
  }
  $("#apCode").addEventListener("input", function () {
    var v = this.value.replace(/\D/g, "").slice(0, 6);
    if (v !== this.value) { this.value = v; }
    validateApprove();
  });
  ["#apName", "#sigTyped"].forEach(function (s) { $(s).addEventListener("input", validateApprove); });
  $("#apCheck").addEventListener("change", validateApprove);
  function finishRcp(kind) {
    ["#rcpApprove", "#rcpAsk", "#rcpDecline"].forEach(function (s) { $(s).hidden = true; });
    $(".rcp-choice").hidden = true;
    var done = $("#rcpDone"), stamp = $("#doneStamp");
    done.className = "rcp-done" + (kind === "ask" ? " is-ask" : kind === "decline" ? " is-decline" : "");
    stamp.className = "stamp stamp-lg" + (kind === "ask" ? " is-wait" : kind === "decline" ? " is-stop" : "");
    $("#doneSeal").hidden = kind !== "approve";
    if (kind === "approve") {
      stamp.firstChild.textContent = "Freigegeben";
      $("#doneSmall").textContent = "Klasse A, 14:02";
      $("#doneTitle").textContent = "Danke, Ihre Freigabe ist gespeichert.";
      $("#doneText").textContent = "Freigegeben von " + $("#apName").value.trim() + " am 29.09.2026 um 14:02. Muster Gebäudeservice wurde benachrichtigt.";
      $("#donePdf").hidden = false;
    } else if (kind === "ask") {
      stamp.firstChild.textContent = "Rückfrage";
      $("#doneSmall").textContent = "29.09.2026, 14:02";
      $("#doneTitle").textContent = "Danke, Ihre Rückfrage ist angekommen.";
      $("#doneText").textContent = "Muster Gebäudeservice meldet sich bei Ihnen. Der Nachtrag bleibt bis 13.10.2026 offen.";
      $("#donePdf").hidden = true;
    } else {
      stamp.firstChild.textContent = "Abgelehnt";
      $("#doneSmall").textContent = "29.09.2026, 14:02";
      $("#doneTitle").textContent = "Sie haben den Nachtrag abgelehnt.";
      $("#doneText").textContent = "Muster Gebäudeservice wurde benachrichtigt. Die Leistung wird nicht ausgeführt.";
      $("#donePdf").hidden = true;
    }
    done.hidden = false;
    done.focus();
  }
  $("#rcpApprove").addEventListener("submit", function (e) { e.preventDefault(); if (!$("#apSubmit").disabled) { finishRcp("approve"); } });
  $("#rcpAsk").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!$("#askText").value.trim()) { $("#askText").focus(); toast("Bitte schreiben Sie Ihre Frage."); return; }
    finishRcp("ask");
  });
  $("#rcpDecline").addEventListener("submit", function (e) { e.preventDefault(); finishRcp("decline"); });

  /* ================= 7.5 Proof-of-service report ================= */
  var repLayout = $("#repLayout"), repStep = 1;
  var STEP_NEXT = { 1: "Weiter zur Vorschau", 2: "Weiter zum Senden" };
  function setRepStep(n) {
    repStep = n;
    repLayout.setAttribute("data-step", String(n));
    $$(".step").forEach(function (b) {
      var s = Number(b.getAttribute("data-step"));
      if (s === n) { b.setAttribute("aria-current", "step"); } else { b.removeAttribute("aria-current"); }
      b.classList.toggle("is-done", s < n);
    });
    $("#repBack").hidden = n === 1;
    $("#repNext").hidden = n === 3;
    if (STEP_NEXT[n]) { $("#repNext").textContent = STEP_NEXT[n]; }
  }
  $$(".step").forEach(function (b) { b.addEventListener("click", function () { setRepStep(Number(b.getAttribute("data-step"))); }); });
  $("#repNext").addEventListener("click", function () { setRepStep(Math.min(3, repStep + 1)); });
  $("#repBack").addEventListener("click", function () { setRepStep(Math.max(1, repStep - 1)); });
  var RSRC = {
    v01: ["Einsatz Di 01.09., Anna K.", "8 von 8 Punkten mit Nachweis, 3 Fotos.", false],
    v08: ["Einsatz Di 08.09., Anna K.", "8 von 8 Punkten mit Nachweis, 4 Fotos.", false],
    v15: ["Einsatz Di 15.09., Jana P.", "Kellergang fegen: als erledigt getippt, Vorher-Nachher-Foto fehlt. Grund: nicht angegeben.", true],
    v22: ["Einsatz Di 22.09., Anna K.", "8 von 8 Punkten mit Nachweis, 2 Fotos, Mangel gemeldet: Handlauf 2. OG lose.", false],
    v29: ["Einsatz Di 29.09., Anna K.", "8 von 8 Punkten mit Nachweis, 6 Fotos. Zwei Lücken vor dem Gehen geschlossen.", false],
    x24: ["Nachtrag NT-2026-0024", "Freigegeben am 08.09. um 14:02 mit Link, E-Mail-Code und Unterschrift (Klasse A). 160,00 € netto.", false],
    x27: ["Nachtrag NT-2026-0027", "Freigegeben am 17.09. um 17:48 per WhatsApp-Antwort (Klasse C). 85,50 € netto.", false]
  };
  $$(".a4 [data-rsrc]").forEach(function (tr) {
    tr.tabIndex = 0;
    function pick() {
      $$(".a4 .is-picked").forEach(function (x) { x.classList.remove("is-picked"); });
      tr.classList.add("is-picked");
      var d = RSRC[tr.getAttribute("data-rsrc")], body = $("#rsBody");
      $("#rsKind").textContent = d[0];
      body.textContent = "";
      body.appendChild(el("p", "", d[1]));
      body.className = d[2] ? "unknown-block" : "src-plain";
      $("#rsNote").hidden = !d[2];
      $("#rsAction").hidden = !d[2];
    }
    tr.addEventListener("click", pick);
    tr.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
  });
  $("#repSend").addEventListener("submit", function (e) { e.preventDefault(); toast("Bericht gesendet an Frau Beispiel. Version 1 ist eingefroren."); });

  /* ================= 7.6 Money Finder ================= */
  var findings = $("#findings"), mfRows = $$("tbody tr", findings), mfActive = 0;
  var DECISION = { a: ["Nachtrag-Entwurf", "c-ok", "st-extra"], g: ["Kulanz", "c-run", "st-goodwill"], d: ["Kein Extra", "c-muted", "st-na"] };
  function renderActs(tr) {
    var cell = $(".acts", tr), dec = tr.getAttribute("data-decision");
    cell.textContent = "";
    if (dec) {
      var wrap = el("span", "decided"), chip = el("span", "state-chip " + DECISION[dec][1]);
      chip.appendChild(glyph(DECISION[dec][2], "i-16"));
      chip.appendChild(document.createTextNode(DECISION[dec][0]));
      var undo = el("button", "link-btn small", "Rückgängig");
      undo.type = "button";
      undo.addEventListener("click", function () { tr.removeAttribute("data-decision"); renderActs(tr); updateDecided(); });
      wrap.appendChild(chip);
      wrap.appendChild(undo);
      cell.appendChild(wrap);
      return;
    }
    [["a", "Nachtrag"], ["g", "Kulanz"], ["d", "Kein Extra"]].forEach(function (p) {
      var b = el("button", "btn btn-secondary", p[1]);
      b.type = "button";
      b.addEventListener("click", function () { decide(tr, p[0]); });
      cell.appendChild(b);
    });
  }
  function updateDecided() {
    var decided = mfRows.filter(function (r) { return r.getAttribute("data-decision"); });
    var drafts = decided.filter(function (r) { return r.getAttribute("data-decision") === "a"; });
    var cents = drafts.reduce(function (s, r) { return s + (Number(r.getAttribute("data-cents")) || 0); }, 0);
    var unknown = drafts.some(function (r) { return !r.getAttribute("data-cents"); });
    var txt = decided.length + " von " + mfRows.length + " entschieden";
    if (drafts.length) {
      txt += ", " + drafts.length + " Nachtrag-" + (drafts.length === 1 ? "Entwurf" : "Entwürfe") + " über " + (unknown ? "mindestens " : "") + euro(cents);
    }
    $("#mfDecided").textContent = txt;
  }
  function setActive(i) {
    mfActive = i;
    mfRows.forEach(function (r, j) { r.classList.toggle("is-active", j === i); r.tabIndex = j === i ? 0 : -1; });
  }
  function decide(tr, key) {
    tr.setAttribute("data-decision", key);
    renderActs(tr);
    updateDecided();
    if (key === "a" && !tr.getAttribute("data-cents")) { toast("Entwurf angelegt mit „Menge fehlt“. Senden geht erst, wenn du die Fläche einträgst."); }
    setActive(Math.min(mfRows.length - 1, mfRows.indexOf(tr) + 1));
  }
  mfRows.forEach(function (tr, i) {
    renderActs(tr);
    tr.addEventListener("click", function (e) { if (!e.target.closest("button")) { setActive(i); } });
  });
  setActive(0);
  updateDecided();
  function streamFinder() {
    var prog = $("#mfProgress"), read = $("#mfRead"), found = $("#mfFound");
    if (reduceMotion) { return; }
    var at = [40, 95, 150, 210, 290, 360, 430, 505, 580], total = 600, dur = 2600, t0 = 0;
    mfRows.forEach(function (r) { r.hidden = true; });
    function tick(now) {
      if (!t0) { t0 = now; }
      var n = Math.min(total, Math.round((now - t0) / dur * total)), shown = 0;
      prog.value = n;
      read.textContent = String(n);
      mfRows.forEach(function (r, i) { var vis = n >= at[i]; r.hidden = !vis; if (vis) { shown += 1; } });
      found.textContent = String(shown);
      if (n < total) { window.requestAnimationFrame(tick); }
    }
    window.requestAnimationFrame(tick);
  }

  /* ================= 7.7 Today and dispatch board ================= */
  var board = $("#board"), picked = null;
  function rowTime(row) {
    var m = 7 * 60 + (row - 2) * 30, h = Math.floor(m / 60);
    return (h < 10 ? "0" : "") + h + ":" + (m % 60 === 0 ? "00" : "30");
  }
  function placeVisit(v, start) {
    v.className = v.className.replace(/\br-\d+\b/, "r-" + start);
    v.setAttribute("data-start", String(start));
    $(".vt", v).textContent = rowTime(start) + "–" + rowTime(start + Number(v.getAttribute("data-len")));
  }
  function checkConflicts() {
    var visits = $$(".visit", board), msgs = [];
    visits.forEach(function (v) { v.classList.remove("is-conflict", "half-l", "half-r"); });
    visits.forEach(function (a, i) {
      visits.forEach(function (b, j) {
        if (j <= i || a.getAttribute("data-person") !== b.getAttribute("data-person")) { return; }
        var as = Number(a.getAttribute("data-start")), ae = as + Number(a.getAttribute("data-len"));
        var bs = Number(b.getAttribute("data-start")), be = bs + Number(b.getAttribute("data-len"));
        if (as < be && bs < ae) {
          a.classList.add("is-conflict", "half-l");
          b.classList.add("is-conflict", "half-r");
          msgs.push(a.getAttribute("data-person") + ", " + rowTime(Math.max(as, bs)) + "–" + rowTime(Math.min(ae, be)));
        }
      });
    });
    var st = $("#boardStatus");
    st.textContent = msgs.length ? "Doppelt belegt: " + msgs.join("; ") + ". Wähle einen geplanten Einsatz und verschiebe ihn." : "Keine Doppelbelegung.";
    st.classList.toggle("is-ok", !msgs.length);
  }
  function pickVisit(v) {
    $$(".visit", board).forEach(function (x) { x.setAttribute("aria-pressed", String(x === v)); });
    picked = v;
    var movable = v.classList.contains("v-plan");
    $("#moveBar").hidden = false;
    $("#moveWhat").textContent = $("strong", v).textContent + ", " + $(".vt", v).textContent + ", " + v.getAttribute("data-person") + (movable ? "" : ": bereits erfasst, bleibt wie erfasst");
    $("#moveUp").hidden = !movable;
    $("#moveDown").hidden = !movable;
  }
  function moveVisit(delta) {
    if (!picked || !picked.classList.contains("v-plan")) { return; }
    var s = Number(picked.getAttribute("data-start")) + delta, len = Number(picked.getAttribute("data-len"));
    if (s < 2 || s + len > 20) { return; }
    placeVisit(picked, s);
    checkConflicts();
    pickVisit(picked);
  }
  $$(".visit", board).forEach(function (v) {
    v.setAttribute("aria-pressed", "false");
    v.appendChild(el("span", "visually-hidden", ", " + v.getAttribute("data-person")));
  });
  board.addEventListener("click", function (e) { var v = e.target.closest(".visit"); if (v) { pickVisit(v); } });
  $("#moveUp").addEventListener("click", function () { moveVisit(-1); });
  $("#moveDown").addEventListener("click", function () { moveVisit(1); });

  /* ================= 7.9 Team, roles and devices ================= */
  var teamTabs = $$('#s-team [role="tab"]');
  function selectTab(t) {
    teamTabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute("aria-selected", String(on));
      x.tabIndex = on ? 0 : -1;
      $("#" + x.getAttribute("aria-controls")).hidden = !on;
    });
  }
  teamTabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t); });
    t.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) { return; }
      e.preventDefault();
      var n = teamTabs[(i + d + teamTabs.length) % teamTabs.length];
      n.focus();
      selectTab(n);
    });
  });
  var invitePanel = $("#invitePanel"), inviteOpen = $("#inviteOpen"), teamLayout = $(".team-layout");
  function setInvite(open) {
    invitePanel.hidden = !open;
    inviteOpen.setAttribute("aria-expanded", String(open));
    teamLayout.classList.toggle("is-closed", !open);
    if (open) { $("#invWho").focus(); }
  }
  inviteOpen.addEventListener("click", function () { setInvite(invitePanel.hidden); });
  $("#inviteClose").addEventListener("click", function () { setInvite(false); inviteOpen.focus(); });
  var SEAT = { E: [700, "nur in Monaten mit mindestens einem Einsatz"], L: [1500, "fester Büro-Platz, Objektleitung plant und sendet"], B: [1500, "fester Büro-Platz"], A: [1500, "fester Büro-Platz"] };
  $("#invRole").addEventListener("change", function () {
    var s = SEAT[this.value], cost = $("#seatCost");
    cost.textContent = "";
    cost.appendChild(el("strong", "", euro(s[0]) + " pro Monat"));
    cost.appendChild(document.createTextNode(", " + s[1]));
    $("#seatSum").textContent = (s[0] === 700 ? "Monatssumme in einem Monat mit Einsatz: " : "Neue Monatssumme: ") + euro(9900 + s[0]) + " statt 99,00 €";
  });
  $("#inviteForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var who = $("#invWho").value.trim();
    $("#invErr").hidden = !!who;
    $("#invWho").setAttribute("aria-invalid", String(!who));
    if (!who) { $("#invWho").focus(); return; }
    toast("Einladung an " + who + " gesendet.");
    $("#invWho").value = "";
  });
  $$("[data-signout]").forEach(function (b) {
    b.addEventListener("click", function () {
      var who = b.getAttribute("data-signout"), n = Number(b.getAttribute("data-unsynced"));
      openConfirm("Gerät von " + who + " abmelden?",
        n ? n + " Aufnahmen sind nur auf diesem Gerät. Nach dem Abmelden kann es nicht mehr synchronisieren; diese Aufnahmen lassen sich dann nicht wiederherstellen. Lass das Gerät zuerst synchronisieren."
          : "Das Gerät kann danach nicht mehr synchronisieren. Alle Aufnahmen sind bereits auf dem Server.",
        "Gerät abmelden",
        function () {
          b.closest("li").classList.add("is-off");
          b.disabled = true;
          b.textContent = "Abgemeldet";
          toast(who + ": Gerät abgemeldet. Die nächste Synchronisierung wird abgelehnt.");
        });
    });
  });

  /* ================= 7.10 Billing ================= */
  var toBiz = $("#toBusiness");
  toBiz.addEventListener("click", function () {
    var open = $("#bizPreview").hidden;
    $("#bizPreview").hidden = !open;
    toBiz.setAttribute("aria-expanded", String(open));
    toBiz.textContent = open ? "Schließen" : "Ansehen";
  });
  $("#cancelBtn").addEventListener("click", function () {
    openConfirm("Tarif kündigen?",
      "Die Kündigung gilt zum 30.09.2026; der September wird am 01.10. noch berechnet. Danach bleiben Lesezugriff und der vollständige Export bis 29.12.2026 verfügbar. Vorher wird nichts gelöscht.",
      "Zum 30.09.2026 kündigen",
      function () { toast("Kündigung zum 30.09.2026 vorgemerkt. Lesezugriff und Export bis 29.12.2026."); });
  });

  /* ================= 7.12 First run ================= */
  var PACKS = {
    clean: ["Treppenhausreinigung", ["Treppen und Podeste nass wischen", "Handläufe und Geländer abwischen", "Eingangstür innen und außen", "Kellergang fegen, Foto vorher und nachher", "Mülltonnenplatz kontrollieren"]],
    care: ["Hausmeisterdienst", ["Rundgang Außenanlagen", "Beleuchtung im Treppenhaus prüfen", "Mülltonnen zur Abholung bereitstellen", "Heizungsraum ansehen, Foto", "Mängel an die Hausverwaltung melden"]],
    winter: ["Winterdienst", ["Gehwege räumen", "Streuen mit abstumpfendem Mittel", "Uhrzeit und Wetter erfassen", "Foto nach dem Räumen", "Streugut-Vorrat prüfen"]],
    shk: ["Heizungswartung", ["Brenner prüfen und reinigen", "Abgaswerte messen, Wert eintragen", "Anlagendruck prüfen, Wert eintragen", "Foto vom Typenschild", "Wartungsprotokoll vom Kunden bestätigen lassen"]],
    elec: ["E-Check", ["Verteilung ansehen, Foto", "Isolationswiderstand messen, Wert eintragen", "Fehlerstrom-Schutzschalter prüfen, Wert eintragen", "Prüfplakette setzen", "Mängel dokumentieren"]],
    paint: ["Malerarbeiten Treppenhaus", ["Abdecken und abkleben, Foto vorher", "Untergrund prüfen", "Grundieren", "Zweimal streichen", "Foto nachher, Abnahme mit dem Kunden"]],
    roof: ["Dachinspektion", ["Dachfläche ansehen, Fotos", "Rinnen und Fallrohre prüfen", "Anschlüsse und Durchdringungen prüfen", "Schäden mit Foto markieren", "Bericht an die Eigentümer"]],
    pv: ["PV-Wartung", ["Module ansehen, Fotos", "Fehlerspeicher des Wechselrichters auslesen", "Strangspannungen messen, Werte eintragen", "Befestigung prüfen", "Ertrag der letzten 12 Monate notieren"]],
    inspect: ["Prüfdienst", ["Prüfobjekt erkennen, Foto vom Typenschild", "Prüfung nach Checkliste", "Messwerte eintragen", "Prüfplakette setzen", "Prüfbericht erzeugen"]]
  };
  var obStep = 1, OB_MAX = 5;
  function setOb(n) {
    obStep = n;
    $$(".ob-step").forEach(function (s) { s.hidden = Number(s.getAttribute("data-ob")) !== n; });
    $$("#obSteps li").forEach(function (li, i) {
      li.classList.toggle("is-on", i + 1 === n);
      li.classList.toggle("is-done", i + 1 < n);
      if (i + 1 === n) { li.setAttribute("aria-current", "step"); } else { li.removeAttribute("aria-current"); }
    });
    $("#obCount").textContent = "Schritt " + n + " von " + OB_MAX;
    $("#obBack").hidden = n === 1;
    $("#obLater").hidden = n < 3;
    $("#obNext").textContent = n === OB_MAX ? "Fertig, zum ersten Auftrag" : "Weiter";
  }
  function obForward() { if (obStep === OB_MAX) { foldGo("#timeline"); } else { setOb(obStep + 1); } }
  $("#obNext").addEventListener("click", obForward);
  $("#obLater").addEventListener("click", obForward);
  $("#obBack").addEventListener("click", function () { setOb(Math.max(1, obStep - 1)); });
  function renderPack() {
    var input = $('input[name="pack"]:checked'), p = PACKS[input ? input.value : "clean"], list = $("#pvList");
    $("#pvTitle").textContent = p[0];
    list.textContent = "";
    p[1].forEach(function (t) { var li = el("li"); li.appendChild(glyph("st-open", "i-16")); li.appendChild(document.createTextNode(t)); list.appendChild(li); });
  }
  $$('input[name="pack"]').forEach(function (r) { r.addEventListener("change", renderPack); });
  $("#obName").addEventListener("input", function () { $("#pvName").textContent = this.value.trim() || "Dein Betrieb"; });
  $$('input[name="mode"]').forEach(function (r) { r.addEventListener("change", function () { $("#pvMode").textContent = "Prüfungen: " + this.value; }); });
  function countPrices() {
    var inputs = $$(".price-in"), set = 0;
    inputs.forEach(function (i) {
      var v = i.value.trim(), ok = /^\d{1,5}([.,]\d{1,2})?$/.test(v);
      i.setAttribute("aria-invalid", String(!!v && !ok));
      if (ok) { set += 1; }
    });
    var c = $("#priceCount");
    c.textContent = set + " von " + inputs.length + " Preisen gesetzt" + (set >= 5 ? ", genug für den Start" : "");
    c.classList.toggle("is-ok", set >= 5);
    var pv = $("#pvPrice");
    pv.textContent = set ? set + " von " + inputs.length + " Preisen gesetzt" : "Preise fehlen";
    pv.classList.toggle("is-set", set > 0);
  }
  $$(".price-in").forEach(function (i) {
    i.addEventListener("input", countPrices);
    i.addEventListener("change", function () {
      var v = i.value.trim();
      if (!/^\d{1,5}([.,]\d{1,2})?$/.test(v)) { return; }
      var parts = v.replace(".", ",").split(","), cents = Number(parts[0]) * 100 + Number(((parts[1] || "") + "00").slice(0, 2));
      i.value = euro(cents).replace(" €", "");
    });
  });

  /* ================= 7.15 Coverage sheet and Feierabend ================= */
  function updateCov() {
    var open = $$(".gap").filter(function (g) { return !g.classList.contains("is-resolved"); }).length;
    $("#covCount").textContent = open === 0 ? "alles belegt" : open + (open === 1 ? " Punkt" : " Punkte") + " ohne Nachweis";
    $("#finishNote").textContent = open ? "Offene Punkte erscheinen im Bericht als „Kein Nachweis“." : "Jeder Punkt hat einen Nachweis oder einen Grund.";
  }
  function resolveGap(g, text, skipped) {
    g.classList.add("is-resolved");
    g.classList.toggle("is-skipped", !!skipped);
    var p = el("p", "resolved-text");
    p.appendChild(glyph(skipped ? "st-notpossible" : "st-done", skipped ? "gl-unknown" : "gl-ok"));
    p.appendChild(document.createTextNode(text));
    g.appendChild(p);
    $(".gap-head use", g).setAttribute("href", skipped ? "#st-notpossible" : "#st-done");
    $(".gap-head svg", g).setAttribute("class", "i i-24 " + (skipped ? "gl-unknown" : "gl-ok"));
    updateCov();
  }
  $$(".gap").forEach(function (g) {
    $$("[data-resolve]", g).forEach(function (b) { b.addEventListener("click", function () { resolveGap(g, b.getAttribute("data-resolve"), false); }); });
    var skip = $("[data-skip]", g), reason = $(".skip-reason", g);
    skip.addEventListener("click", function () {
      if (reason.hidden) { reason.hidden = false; skip.textContent = "Grund speichern"; $("select", reason).focus(); return; }
      resolveGap(g, "Heute nicht erledigt: " + $("select", reason).value, true);
    });
  });
  $("#finishVisit").addEventListener("click", function () {
    var open = $$(".gap").filter(function (g) { return !g.classList.contains("is-resolved"); }).length;
    toast(open ? "Einsatz abgeschlossen um 08:41. " + open + (open === 1 ? " Punkt erscheint" : " Punkte erscheinen") + " im Bericht als „Kein Nachweis“." : "Einsatz abgeschlossen um 08:41. Jeder Punkt ist belegt.", "Zum Verlauf", "#timeline");
  });
  var faUnsynced = 2;
  $("#faUpload").addEventListener("click", function () {
    var b = this;
    b.disabled = true;
    b.lastChild.textContent = "Lädt hoch …";
    window.setTimeout(function () {
      faUnsynced = 0;
      var pill = $("#faPill");
      pill.className = "sync-pill is-ok";
      pill.firstChild.textContent = "Alles hochgeladen";
      $("use", pill).setAttribute("href", "#g-sync");
      b.hidden = true;
      $("#faPhotos").textContent = "2 Fotos hochgeladen";
      $("#faWarn").hidden = true;
    }, reduceMotion ? 0 : 900);
  });
  $("#faHand").addEventListener("click", function () {
    $("#faOpen").classList.add("is-handed");
    this.disabled = true;
    this.textContent = "An Büro übergeben, Tim Berger";
    toast("An Tim Berger übergeben: 1 Zusatzwunsch ohne Preis, Rosenstraße 4.");
  });
  $("#faDone").addEventListener("click", function () {
    if (faUnsynced) { $("#faWarn").hidden = false; return; }
    toast("Schönen Feierabend. Alles ist synchronisiert.");
  });

  /* ================= 7.11 Command bar ================= */
  var cmd = $("#cmd"), cmdInput = $("#cmdInput"), cmdOpts = $$(".cmd-opt"), cmdIdx = 0;
  var cmdEmpty = el("li", "cmd-empty", "Keine Treffer. Versuche einen Objektnamen oder eine Aktion wie „Nachtrag“.");
  cmdEmpty.setAttribute("role", "presentation");
  cmdEmpty.hidden = true;
  $("#cmdList").appendChild(cmdEmpty);
  var PREVIEW = {
    co: ["Nachtrag an Frau Beispiel", ["Kellerfenster", "6 Stück", "80,33 €"], "Öffnet den Nachtrag zum Prüfen. Gesendet wird erst dort, mit deinem Klick.", "Öffnen und prüfen"],
    price: ["Zusatzwunsch bepreisen", ["Kellerfenster putzen", "Lindenstraße 14", "aus deinem Preisbuch"], "Öffnet die Positionen mit dem Vorschlag aus deinem Preisbuch.", "Öffnen"],
    link: ["Freigabelink an Frau Beispiel", ["NT-2026-0031", "per E-Mail", "80,33 €"], "Braucht Bestätigung: Die Vorschau öffnet sich, gesendet wird erst mit deinem Klick.", "Vorschau öffnen"],
    frame: ["Freigaberahmen für Lindenstraße 14", ["400,00 € im Monat", "150,00 € je Nachtrag", "12 Monate"], "Öffnet den Rahmen als Entwurf. Gesendet wird erst dort, mit deinem Klick.", "Öffnen und prüfen"],
    bundle: ["Freigabe-Übersicht an Frau Beispiel", ["3 Nachträge", "292,50 € netto", "per E-Mail"], "Braucht Bestätigung: Die Vorschau öffnet sich, gesendet wird erst mit deinem Klick.", "Vorschau öffnen"],
    job: ["Treppenhausreinigung Lindenstraße 14", ["wöchentlich dienstags", "1 Extra offen"], "Öffnet den Verlauf des Auftrags.", "Öffnen"],
    customer: ["Hausverwaltung Beispiel GmbH", ["Frau Beispiel", "5 Objekte"], "Öffnet den Kunden.", "Öffnen"],
    site: ["Lindenstraße 14, Musterstadt", ["1 Auftrag", "letzte Reinigung heute 08:14"], "Öffnet das Objekt.", "Öffnen"],
    inbox: ["Anfragen öffnen", ["5 Anfragen", "1 Zusatzwunsch", "1 Reklamation"], "Öffnet die Anfragen. Es wird nichts gesendet.", "Öffnen"],
    prices: ["Preisbuch öffnen", ["6 Positionen", "5 Regeln", "Stand 01.09.2026"], "Öffnet Positionen und Regeln.", "Öffnen"]
  };
  var STOP = ["für", "die", "der", "das", "den", "dem", "und", "mit", "an", "am", "im"];
  function renderPreview() {
    var o = cmdOpts[cmdIdx], p = PREVIEW[o.getAttribute("data-preview")], f = $("#pvFacts");
    $("#pvLine").textContent = p[0];
    f.textContent = "";
    p[1].forEach(function (t) { f.appendChild(el("li", /€$/.test(t) ? "mono" : "", t)); });
    $("#pvNote").textContent = p[2];
    $("#cmdGo").textContent = p[3];
  }
  function setOpt(o) {
    cmdOpts.forEach(function (x) { x.setAttribute("aria-selected", String(x === o)); });
    cmdIdx = cmdOpts.indexOf(o);
    cmdInput.setAttribute("aria-activedescendant", o.id);
    if (cmd.open) { o.scrollIntoView({ block: "nearest" }); }
    renderPreview();
  }
  function visibleOpts() { return cmdOpts.filter(function (o) { return !o.classList.contains("is-filtered"); }); }
  function filterCmd() {
    var words = cmdInput.value.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 1 && STOP.indexOf(w) < 0; });
    cmdOpts.forEach(function (o) {
      var hay = (o.getAttribute("data-k") + " " + o.textContent).toLowerCase();
      o.classList.toggle("is-filtered", !!words.length && !words.some(function (w) { return hay.indexOf(w) >= 0; }));
    });
    $$(".cmd-group").forEach(function (g) {
      var n = g.nextElementSibling, any = false;
      while (n && n.classList.contains("cmd-opt")) { if (!n.classList.contains("is-filtered")) { any = true; } n = n.nextElementSibling; }
      g.classList.toggle("is-filtered", !any);
    });
    var vis = visibleOpts();
    cmdEmpty.hidden = !!vis.length;
    $("#cmdPreview").hidden = !vis.length;
    cmdInput.setAttribute("aria-expanded", String(!!vis.length));
    if (vis.length) { setOpt(vis.indexOf(cmdOpts[cmdIdx]) >= 0 ? cmdOpts[cmdIdx] : vis[0]); }
  }
  function openCmd() {
    if (!cmd.open) { cmd.showModal(); }
    filterCmd();
    cmdInput.focus();
    var len = cmdInput.value.length;
    cmdInput.setSelectionRange(len, len);
  }
  function markProto(id) {
    $$(".proto-links a").forEach(function (a) {
      var on = a.getAttribute("data-go") === id;
      a.classList.toggle("is-on", on);
      if (on) {
        a.setAttribute("aria-current", "page");
        if (a.scrollIntoView) { a.scrollIntoView({ block: "nearest", inline: "nearest" }); }
      } else { a.removeAttribute("aria-current"); }
    });
  }
  function runOpt(o) {
    var go = o.getAttribute("data-go");
    cmd.close();
    if (location.hash === "#" + go) { show(go); } else { foldGo("#" + go); }
  }
  cmdInput.addEventListener("input", filterCmd);
  cmdInput.addEventListener("keydown", function (e) {
    var vis = visibleOpts(), i = vis.indexOf(cmdOpts[cmdIdx]);
    if (e.key === "ArrowDown" && vis.length) { e.preventDefault(); setOpt(vis[Math.min(vis.length - 1, i + 1)]); }
    else if (e.key === "ArrowUp" && vis.length) { e.preventDefault(); setOpt(vis[Math.max(0, i - 1)]); }
    else if (e.key === "Enter" && vis.length) { e.preventDefault(); runOpt(cmdOpts[cmdIdx]); }
  });
  cmdOpts.forEach(function (o) {
    o.addEventListener("click", function () { runOpt(o); });
    o.addEventListener("mousemove", function () { if (cmdOpts[cmdIdx] !== o) { setOpt(o); } });
  });
  $("#cmdGo").addEventListener("click", function () { runOpt(cmdOpts[cmdIdx]); });
  cmd.addEventListener("click", function (e) { if (e.target === cmd) { cmd.close(); } });
  cmd.addEventListener("close", function () {
    if (location.hash === "#command") { history.replaceState(null, "", "#timeline"); markProto("timeline"); }
  });
  $$("[data-open-cmd]").forEach(function (b) { b.addEventListener("click", openCmd); });

  /* ================= 7.17 Freigaberahmen ================= */
  function parseCents(v) {
    v = String(v).replace(/€/g, "").replace(/\s/g, "");
    if (!/^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/.test(v)) { return null; }
    var p = v.replace(/\./g, "").split(",");
    return Number(p[0]) * 100 + Number(((p[1] || "") + "00").slice(0, 2));
  }
  var FR_TEXT = { draft: "Entwurf, noch nicht vom Kunden freigegeben", active: "aktiv bis 30.09.2027, Klasse A", spent: "im Oktober ausgeschöpft" };
  var FR_CLS = { draft: "c-open", active: "c-ok", spent: "c-unknown" };
  var FR_ICON = { draft: "st-wait", active: "st-done", spent: "st-noev" };
  function renderFrame() {
    var shown = FRAME.mode === "spent" ? FRAME.budget : FRAME.used;
    var st = $("#frState");
    st.className = "state-chip " + FR_CLS[FRAME.mode];
    $("use", st).setAttribute("href", "#" + FR_ICON[FRAME.mode]);
    st.lastChild.textContent = FR_TEXT[FRAME.mode];
    $("#frNote").hidden = FRAME.mode === "active";
    $("#frNoteText").textContent = FRAME.mode === "draft"
      ? "Frau Beispiel hat diesen Rahmen noch nicht unterschrieben. Buchungen sind gesperrt, bis sie ihn freigibt."
      : "Der Rahmen ist im Oktober ausgeschöpft. Weitere Nachträge brauchen eine eigene Freigabe.";
    $("#frUse").textContent = euro(shown) + " von " + euro(FRAME.budget) + " im Oktober, noch " + euro(FRAME.budget - shown);
    var m = $("#frMeter");
    m.max = FRAME.budget / 100;
    m.value = shown / 100;
    m.textContent = euro(shown) + " von " + euro(FRAME.budget);
    var rows = $("#frRows");
    rows.textContent = "";
    if (!FRAME.bookings.length) {
      var tr0 = el("tr", "fr-empty"), td0 = el("td", "", "Noch keine Buchung im Oktober.");
      td0.colSpan = 4;
      tr0.appendChild(td0);
      rows.appendChild(tr0);
    }
    FRAME.bookings.forEach(function (bk) {
      var tr = el("tr");
      tr.appendChild(el("td", "mono", bk.no));
      tr.appendChild(el("td", "", bk.what));
      tr.appendChild(el("td", "num mono", euro(bk.net)));
      tr.appendChild(el("td", "", "Klasse A, im Rahmen"));
      rows.appendChild(tr);
    });
    $("#frSend").disabled = FRAME.mode !== "draft";
  }
  $$("#frMode [role='radio']").forEach(function (b) {
    b.addEventListener("click", function () { FRAME.mode = b.getAttribute("data-fr"); renderFrame(); recalc(); });
  });
  ["frMonth", "frMax"].forEach(function (id) {
    $("#" + id).addEventListener("change", function () {
      var c = parseCents(this.value);
      $("#frErr").hidden = c !== null;
      this.setAttribute("aria-invalid", String(c === null));
      if (c === null) { return; }
      this.value = euro(c);
      var month = parseCents($("#frMonth").value), max = parseCents($("#frMax").value);
      if (month !== null && max !== null) {
        $("#frSentence").textContent = "Ich erlaube Nachträge bis " + euro(max) + " einzeln und " + euro(month) + " im Monat für diese Leistungen.";
      }
      toast("Die Änderung erzeugt Version 2 als Entwurf. Frau Beispiel muss sie neu unterschreiben; bis dahin gilt Version 1.");
    });
  });
  $("#frSend").addEventListener("click", function () {
    openConfirm("Rahmen an Frau Beispiel senden?", "E-Mail an f.beispiel@beispiel-verwaltung.example mit Link und dem Satz: " + $("#frSentence").textContent + " Der Rahmen gilt erst, wenn sie ihn mit E-Mail-Code und Unterschrift freigibt.", "Senden",
      function () { toast("Rahmen gesendet. Er gilt erst, wenn Frau Beispiel unterschrieben hat."); }, true);
  });
  $("#bundleSend").addEventListener("click", function () {
    openConfirm("Freigabe-Übersicht an Frau Beispiel senden?", "E-Mail mit einem Link zu 3 offenen Nachträgen (292,50 € netto). Frau Beispiel kann alle gemeinsam beantworten oder die Entscheidung weitergeben.", "Senden",
      function () { toast("Freigabe-Übersicht gesendet an Frau Beispiel.", "Kundenansicht öffnen", "#bundle"); }, true);
  });

  /* ================= 7.20 Geldbrief ================= */
  function renderLetter() { return; }
  $$("#ltMode [role='radio']").forEach(function (b) {
    b.addEventListener("click", function () {
      var quiet = b.getAttribute("data-lt") === "quiet";
      $("#ltWeek").hidden = quiet;
      $("#ltQuiet").hidden = !quiet;
    });
  });
  $$(".remind").forEach(function (b) {
    b.addEventListener("click", function () {
      var msg = "Guten Tag Frau Beispiel, zur Erinnerung: Der Nachtrag " + b.getAttribute("data-no") + " (" + b.getAttribute("data-what") + ", " + b.getAttribute("data-amt") + " netto) wartet noch auf Ihre Antwort und gilt bis " + b.getAttribute("data-until") + ". Hier prüfen und antworten: jobfold.eu/r/… Viele Grüße, Tim Berger";
      openConfirm("Erinnerung an Frau Beispiel senden?", msg, "Erinnerung senden", function () {
        b.disabled = true;
        b.textContent = "Erinnerung gesendet 11:32";
        b.closest("li").classList.add("is-sent");
        toast("Erinnerung zu " + b.getAttribute("data-no") + " per E-Mail gesendet. Die nächste ist in 5 Tagen möglich.");
      }, true);
    });
  });

  /* ================= 7.18 Sammelfreigabe ================= */
  var bundleEl = $("#bundle"), bundleDone = false;
  function choiceOf(li) { var c = $("input:checked", li); return c ? c.value : ""; }
  function bundleSelected() { return $$(".bi", bundleEl).filter(function (li) { return choiceOf(li) === "approve"; }); }
  function validateBundle() {
    var ok = bundleSelected().length > 0 && $("#bfName").value.trim().length > 1 && /^\d{6}$/.test($("#bfCode").value) && $("#bfSig").value.trim().length > 1 && $("#bfCheck").checked;
    $("#bfSubmit").disabled = !ok;
  }
  function bundleUpdate() {
    var sel = bundleSelected(), net = 0, gross = 0;
    sel.forEach(function (li) { net += Number(li.getAttribute("data-net")); gross += Number(li.getAttribute("data-gross")); });
    $("#bundleSum").textContent = sel.length ? "Ausgewählt: " + sel.length + " von 3, " + euro(net) + " netto, " + euro(gross) + " brutto" : "Noch nichts zur Freigabe ausgewählt.";
    $("#bundleForm").hidden = bundleDone || !sel.length;
    validateBundle();
  }
  bundleEl.addEventListener("change", bundleUpdate);
  ["#bfName", "#bfSig"].forEach(function (s) { $(s).addEventListener("input", validateBundle); });
  $("#bfCheck").addEventListener("change", validateBundle);
  $("#bfCode").addEventListener("input", function () {
    var v = this.value.replace(/\D/g, "").slice(0, 6);
    if (v !== this.value) { this.value = v; }
    validateBundle();
  });
  $("#bundleForm").addEventListener("submit", function (e) {
    e.preventDefault();
    if ($("#bfSubmit").disabled) { return; }
    var list = $("#bdList");
    list.textContent = "";
    $$(".bi", bundleEl).forEach(function (li) {
      var c = choiceOf(li), row = el("li");
      if (c === "approve") {
        var st = el("span", "stamp", "Freigegeben");
        st.appendChild(el("small", "", "Klasse A, 14:05"));
        row.appendChild(st);
      } else if (c === "ask") { row.appendChild(el("span", "state-chip c-open", "Rückfrage gestellt")); }
      else if (c === "decline") { row.appendChild(el("span", "state-chip c-stop", "Abgelehnt")); }
      else { row.appendChild(el("span", "state-chip", "Noch offen")); }
      row.appendChild(el("span", "", $(".bi-title", li).textContent));
      list.appendChild(row);
    });
    $$("input", bundleEl).forEach(function (i) { i.disabled = true; });
    bundleDone = true;
    $("#bundleForm").hidden = true;
    var done = $("#bundleDone");
    done.hidden = false;
    done.focus();
  });
  $("#fwOpen").addEventListener("click", function () {
    var open = $("#fwForm").hidden;
    $("#fwForm").hidden = !open;
    this.setAttribute("aria-expanded", String(open));
    if (open) { $("#fwName").focus(); }
  });
  $("#fwForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("#fwName").value.trim(), to = $("#fwTo").value.trim();
    $("#fwErr").hidden = !!(name && to);
    if (!name || !to) { (name ? $("#fwTo") : $("#fwName")).focus(); return; }
    var fw = $("#biFw");
    fw.hidden = false;
    fw.textContent = "Weitergeleitet an " + name + " am 29.09.2026 um 14:05. Diese Person antwortet mit eigenem Code; Sie sehen den Verlauf hier.";
    $("#fwForm").hidden = true;
    $("#fwOpen").setAttribute("aria-expanded", "false");
    toast("Weitergeleitet: " + name + " hat eine E-Mail mit dem Link erhalten.");
  });

  /* ================= 7.19 Prüfsiegel ================= */
  var sealPreset = "", sealCur = null, sealHash = "";
  var SEALS = {
    "K3P9-4XQ2": { kind: "Freigabe, Nachtrag NT-2026-0031", object: "Lindenstraße 14", ver: "1", at: "29.09.2026, 14:02", anchor: "", body: "Nachtrag NT-2026-0031, Kellerfenster innen und außen putzen, 6 Stück, 67,50 € netto, freigegeben Klasse A am 29.09.2026 um 14:02" },
    "M4TX-7HD8": { kind: "Freigabe, Nachtrag NT-2026-0024", object: "Lindenstraße 14", ver: "1", at: "08.09.2026, 14:02", anchor: "09.09.2026, 00:15 UTC", body: "Nachtrag NT-2026-0024, Sperrmüll im Hof abtransportieren, 160,00 € netto, freigegeben Klasse A am 08.09.2026 um 14:02" },
    "R8WN-5DZ7": { kind: "Sammelfreigabe, 2 Nachträge", object: "Hausverwaltung Beispiel GmbH", ver: "1", at: "29.09.2026, 14:05", anchor: "", body: "Sammelfreigabe NT-2026-0031 und NT-2026-0030, 112,50 € netto, Klasse A am 29.09.2026 um 14:05" },
    "P2LQ-8VC3": { kind: "Leistungsnachweis August 2026", object: "Lindenstraße 14", ver: "1", at: "01.09.2026, 07:40", anchor: "02.09.2026, 00:15 UTC", replaced: "Ersetzt durch Version 2 am 23.09.2026", newCode: "T6HB-2MK9", body: "Leistungsnachweis August 2026 Version 1, 5 Einsätze, 40 von 40 Punkten belegt" },
    "T6HB-2MK9": { kind: "Leistungsnachweis August 2026", object: "Lindenstraße 14", ver: "2", at: "23.09.2026, 08:05", anchor: "24.09.2026, 00:15 UTC", body: "Leistungsnachweis August 2026 Version 2, ersetzt Version 1, 5 Einsätze, 40 von 40 Punkten belegt, Korrektur einer Uhrzeit" }
  };
  function hexOf(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }
  function groups(h) { return h.slice(0, 16).replace(/(.{4})/g, "$1 ").trim(); }
  function digest(data) {
    if (!window.crypto || !window.crypto.subtle) { return Promise.reject(new Error("no crypto")); }
    return window.crypto.subtle.digest("SHA-256", data).then(hexOf);
  }
  function verdict(ok, h) {
    var v = $("#sealVerdict");
    v.className = "seal-verdict " + (ok ? "is-ok" : "is-bad");
    v.textContent = (ok ? "Stimmt überein: Die Datei ist unverändert." : "Stimmt nicht überein: Die Datei weicht vom Siegel ab.") + " Hash " + groups(h);
  }
  function verdictFail() {
    var v = $("#sealVerdict");
    v.className = "seal-verdict is-bad";
    v.textContent = "In diesem Browser lässt sich die Datei nicht prüfen.";
  }
  function renderSeal() {
    var input = $("#sealCode");
    if (sealPreset) { input.value = sealPreset; sealPreset = ""; }
    var code = input.value.trim().toUpperCase();
    input.value = code;
    var out = $("#sealResult");
    out.textContent = "";
    $("#sealVerdict").textContent = "";
    $("#sealVerdict").className = "seal-verdict";
    sealCur = SEALS[code] || null;
    sealHash = "";
    $("#sealCheck").hidden = !sealCur;
    if (!code) { out.appendChild(el("p", "", "Bitte einen Siegelcode eingeben, zum Beispiel K3P9-4XQ2.")); return; }
    if (!sealCur) {
      var bad = el("span", "state-chip c-stop", "Unbekannter Code");
      out.appendChild(bad);
      out.appendChild(el("p", "muted", "Prüfen Sie die Schreibweise. Codes haben acht Zeichen, zum Beispiel K3P9-4XQ2."));
      return;
    }
    var head = el("div", "seal-head"), stamp = el("span", "stamp" + (sealCur.replaced ? " is-wait" : ""), sealCur.replaced ? "Ersetzt" : "Unverändert");
    stamp.appendChild(el("small", "", sealCur.replaced ? sealCur.replaced.replace("Ersetzt durch ", "durch ") : "seit " + sealCur.at));
    head.appendChild(stamp);
    out.appendChild(head);
    var dl = el("dl", "facts"), hashDd = el("dd", "hash", "wird berechnet");
    function fact(k, v) { dl.appendChild(el("dt", "", k)); var d = el("dd", "", v); dl.appendChild(d); return d; }
    fact("Dokument", sealCur.kind);
    fact("Firma", "Muster Gebäudeservice GmbH");
    fact("Objekt", sealCur.object);
    fact("Version", sealCur.ver + ", festgehalten " + sealCur.at);
    fact("Siegelcode", code).className = "mono";
    dl.appendChild(el("dt", "", "Hash-Anfang"));
    dl.appendChild(hashDd);
    fact("Zeitstempel", sealCur.anchor ? "vom " + sealCur.anchor + ", Aussteller Beispiel-Zeitstempeldienst, nicht qualifiziert" : "folgt heute um 00:15 UTC");
    out.appendChild(dl);
    if (sealCur.newCode) {
      var jump = el("button", "link-btn", "Zur aktuellen Version " + sealCur.newCode);
      jump.type = "button";
      jump.addEventListener("click", function () { input.value = sealCur.newCode; renderSeal(); });
      out.appendChild(jump);
    }
    digest(new TextEncoder().encode(sealCur.body)).then(function (h) { sealHash = h; hashDd.textContent = groups(h); }, function () { hashDd.textContent = "in diesem Browser nicht berechenbar"; });
  }
  $("#sealForm").addEventListener("submit", function (e) { e.preventDefault(); renderSeal(); });
  $("#sealSample").addEventListener("click", function () {
    if (!sealCur) { return; }
    digest(new TextEncoder().encode(sealCur.body)).then(function (h) { verdict(h === sealHash, h); }, verdictFail);
  });
  $("#sealSampleBad").addEventListener("click", function () {
    if (!sealCur) { return; }
    digest(new TextEncoder().encode(sealCur.body + " ")).then(function (h) { verdict(h === sealHash, h); }, verdictFail);
  });
  $("#sealFile").addEventListener("change", function () {
    var f = this.files && this.files[0];
    if (!f || !sealCur) { return; }
    f.arrayBuffer().then(digest).then(function (h) { verdict(h === sealHash, h); }, verdictFail);
  });
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-seal]");
    if (a) { sealPreset = a.getAttribute("data-seal"); }
  });

  /* ================= 7.21 Objektmappe ================= */
  var fileDlg = $("#fileDlg"), codeShown = false;
  $("#fileOpen").addEventListener("click", function () { fileDlg.showModal(); });
  $("#sfClose").addEventListener("click", function () { fileDlg.close(); });
  $("#sfReveal").addEventListener("click", function () {
    codeShown = !codeShown;
    $("#sfCode").textContent = codeShown ? "4827" : "••••";
    this.textContent = codeShown ? "Verbergen" : "Anzeigen (wird protokolliert)";
    if (codeShown) { $("#sfSeenNote").textContent = "Protokolliert: Anna K. hat den Zugangscode um 08:12 angezeigt."; }
  });
  $("#sfSeen").addEventListener("click", function () {
    this.disabled = true;
    this.textContent = "Gesehen, 08:12";
    $("#sfSeenNote").textContent = "Gespeichert: Anna K. hat die Objektmappe am 29.09.2026 um 08:12 gesehen.";
  });

  /* ================= 7.8 Request inbox ================= */
  var JOBS = ["Lindenstraße 14", "Hofweg 3", "Parkstraße 8", "Rosenstraße 4"];
  var INBOX = [
    { id: "i1", ch: "WhatsApp", who: "Frau Beispiel", age: "vor 2 Std", kind: "extra", job: "Lindenstraße 14", state: "neu", hl: "Könnten Sie am Samstag auch die sechs Kellerfenster putzen",
      msgs: [["Guten Morgen! Könnten Sie am Samstag auch die sechs Kellerfenster putzen, innen und außen?", "heute 08:31"]] },
    { id: "i2", ch: "E-Mail", who: "Hausverwaltung Nord", age: "gestern", kind: "complaint", job: "Parkstraße 8", state: "neu", hl: "war letzte Woche nicht sauber",
      msgs: [["Das Geländer im 2. OG war letzte Woche nicht sauber. Bitte prüfen Sie das.", "gestern 16:12"]] },
    { id: "i3", ch: "WhatsApp", who: "Herr Yilmaz", age: "gestern", kind: "schedule", job: "Rosenstraße 4", state: "neu", hl: "erst ab 10 Uhr",
      msgs: [["Bitte am Freitag erst ab 10 Uhr kommen, der Aufzug wird gewartet.", "gestern 17:02"]] },
    { id: "i4", ch: "Aushang", who: "Bewohnerin, 2. OG", age: "vor 3 Std", kind: "report", job: "Lindenstraße 14", state: "neu", hl: "",
      msgs: [["Licht im Keller defekt.", "heute 07:12"]] },
    { id: "i5", ch: "Portal", who: "Frau Beispiel", age: "Mo 28.09.", kind: "quote", job: "Parkstraße 8", state: "neu", hl: "Angebot",
      msgs: [["Bitte ein Angebot für die Reinigung der Fassade im Innenhof, etwa 120 m².", "Mo 09:40"]] }
  ];
  var KIND = { extra: ["Zusatzwunsch erkannt", "c-open"], complaint: ["Reklamation", "c-stop"], schedule: ["Termin", ""], report: ["Meldung vom Aushang", ""], quote: ["Angebotsanfrage", ""] };
  var IN_STATE = { zugeordnet: "zugeordnet", angebot: "Angebot vorgemerkt", reklamation: "Reklamation bestätigt", verworfen: "verworfen" };
  var inCur = "i1", inCh = "all";
  function inItem(id) { return INBOX.filter(function (x) { return x.id === id; })[0]; }
  function hlText(p, text, hl) {
    var i = hl ? text.indexOf(hl) : -1;
    if (i < 0) { p.appendChild(document.createTextNode(text)); return; }
    p.appendChild(document.createTextNode(text.slice(0, i)));
    p.appendChild(el("mark", "", hl));
    p.appendChild(document.createTextNode(text.slice(i + hl.length)));
  }
  function inSection(side, title) {
    var sec = el("section");
    sec.appendChild(el("h2", "", title));
    side.appendChild(sec);
    return sec;
  }
  function renderThread(x) {
    var t = $("#inThread");
    t.textContent = "";
    t.appendChild(el("h2", "", x.who));
    t.appendChild(el("p", "in-meta", x.ch + ", " + x.age + ", Auftrag " + x.job));
    var box = el("div", "in-msgs");
    x.msgs.forEach(function (m) {
      var p = el("p", "in-msg");
      hlText(p, m[0], x.hl);
      p.appendChild(el("span", "in-time", m[1]));
      box.appendChild(p);
    });
    t.appendChild(box);
    t.appendChild(el("p", "note", "Die Markierung zeigt, worauf sich der Vorschlag stützt. Das Original der Nachricht bleibt unverändert."));
  }
  function renderSide(x) {
    var side = $("#inSide");
    side.textContent = "";
    var a = inSection(side, "Zuordnung");
    var lab = el("label", "field");
    lab.appendChild(el("span", "", "Auftrag"));
    var sel = el("select");
    sel.id = "inJob";
    JOBS.forEach(function (j) { var o = el("option", "", j); o.value = j; if (j === x.job) { o.selected = true; } sel.appendChild(o); });
    sel.addEventListener("change", function () { x.job = sel.value; renderInbox(); });
    lab.appendChild(sel);
    a.appendChild(lab);
    a.appendChild(el("p", "note", x.state === "neu" ? "Vorschlag aus Absender und Text. Du bestätigst." : "Zugeordnet von dir."));
    var r = inSection(side, "Radar");
    if (x.kind === "extra") {
      r.appendChild(el("p", "", "Zusatzwunsch: Kellerfenster putzen. Menge 6, gelesen aus „sechs“. Nicht im Umfang (Version 2)."));
      r.appendChild(el("p", "note", "Vorschlag aus dem Preisbuch: FR-02 Fensterreinigung innen und außen, 9,00 € netto je Stück. Den Preis rechnet der Code."));
      var go = el("a", "btn btn-primary", "Nachtrag bepreisen");
      go.href = "#change";
      r.appendChild(go);
    } else if (x.kind === "complaint") {
      r.appendChild(el("p", "", "Reklamation. Daraus wird nie ein Preis; die Nachricht kommt in den Reklamationsverlauf."));
      var rp = el("div", "in-reply");
      rp.appendChild(el("span", "label-sm", "Vorlage „Reklamation, Eingang bestätigt“"));
      rp.appendChild(el("p", "", "Guten Tag, danke für Ihre Nachricht zum Auftrag " + x.job + ". Wir prüfen das und melden uns bis Freitag 02.10.2026. Muster Gebäudeservice GmbH"));
      rp.appendChild(el("p", "note", "Vorlage 3 von 12, von der Prüfung gewählt; Datum und Auftrag setzt der Code ein. Kein Modell schreibt diesen Text."));
      var send = el("button", "btn btn-secondary", "Antwort prüfen und senden");
      send.type = "button";
      send.setAttribute("data-toast", "Die Vorschau öffnet sich, gesendet wird erst mit deinem Klick. Im Prototyp nicht ausgeführt.");
      rp.appendChild(send);
      r.appendChild(rp);
    } else if (x.kind === "schedule") {
      r.appendChild(el("p", "", "Terminwunsch, kein Zusatzwunsch. Vorschlag: Einsatz am Fr 02.10. auf 10:00 Uhr legen."));
      var pl = el("a", "btn btn-secondary", "Im Plan ansehen");
      pl.href = "#today";
      r.appendChild(pl);
    } else if (x.kind === "report") {
      r.appendChild(el("p", "", "Meldung eines Bewohners über den Aushang. Ob es ein Mangel mit Folgeauftrag wird, entscheidest du."));
    } else {
      var u = el("p", "unknown-block", "Fassadenreinigung steht nicht im Preisbuch. Der Preis ist unbekannt, nicht 0,00 €.");
      r.appendChild(u);
      r.appendChild(el("p", "note", "Ein Angebot aus einer Anfrage ist eine Funktion von Wave 2."));
    }
    var b = inSection(side, "Aktionen");
    var keys = el("div", "in-keys");
    [["z", "Zu Auftrag"], ["a", "Angebot"], ["r", "Reklamation"], ["v", "Verwerfen"]].forEach(function (k) {
      var btn = el("button", "btn btn-secondary");
      btn.type = "button";
      btn.appendChild(el("span", "", k[1]));
      btn.appendChild(el("kbd", "", k[0].toUpperCase()));
      if (x.state === "verworfen") { btn.disabled = true; }
      btn.addEventListener("click", function () { inAct(k[0]); });
      keys.appendChild(btn);
    });
    b.appendChild(keys);
  }
  function renderInbox() {
    var list = $("#inList");
    list.textContent = "";
    var shown = INBOX.filter(function (x) { return inCh === "all" || x.ch === inCh; });
    $("#inEmpty").hidden = shown.length > 0;
    if (shown.length && !shown.some(function (x) { return x.id === inCur; })) { inCur = shown[0].id; }
    shown.forEach(function (x) {
      var li = el("li"), btn = el("button", "in-row" + (x.state === "verworfen" ? " is-done" : ""));
      btn.type = "button";
      btn.setAttribute("aria-pressed", String(x.id === inCur));
      var top = el("span", "in-top");
      top.appendChild(el("span", "mini", x.ch));
      top.appendChild(el("span", "in-who", x.who));
      top.appendChild(el("span", "in-age", x.age));
      btn.appendChild(top);
      btn.appendChild(el("span", "in-first", x.msgs[0][0]));
      var chips = el("span", "in-chips"), k = KIND[x.kind];
      chips.appendChild(el("span", "mini " + k[1], k[0]));
      chips.appendChild(el("span", "job-chip", x.job));
      if (x.state !== "neu") { chips.appendChild(el("span", "mini c-ok", IN_STATE[x.state])); }
      btn.appendChild(chips);
      btn.addEventListener("click", function () { inCur = x.id; renderInbox(); });
      li.appendChild(btn);
      list.appendChild(li);
    });
    var cur = inItem(inCur);
    if (cur && shown.length) { renderThread(cur); renderSide(cur); } else { $("#inThread").textContent = ""; $("#inSide").textContent = ""; }
  }
  function inAct(k) {
    var x = inItem(inCur);
    if (!x || x.state === "verworfen") { return; }
    if (k === "z") { x.state = "zugeordnet"; toast("Zu " + x.job + " zugeordnet. Es wurde nichts gesendet."); }
    else if (k === "a") { x.state = "angebot"; toast("Als Angebotsanfrage vorgemerkt. Es wurde nichts gesendet."); }
    else if (k === "r") { x.kind = "complaint"; x.state = "reklamation"; toast("Als Reklamation markiert. Eine Reklamation wird nie berechnet."); }
    else if (k === "v") {
      openConfirm("Anfrage verwerfen?", "Die Nachricht bleibt im Verlauf des Kunden lesbar. Es geht nichts an den Kunden.", "Verwerfen", function () { x.state = "verworfen"; renderInbox(); toast("Anfrage verworfen."); });
      return;
    }
    renderInbox();
  }
  $$("#inFilter .fchip").forEach(function (b) {
    b.addEventListener("click", function () {
      inCh = b.getAttribute("data-ch");
      $$("#inFilter .fchip").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      renderInbox();
    });
  });

  /* ================= F-09 Price book ================= */
  var RULES = { sat: true, hol: true, rush: true, night: false, min: true };
  function priceOf(code) {
    var row = $('#prRows tr[data-code="' + code + '"]');
    return row ? Number(row.getAttribute("data-cents")) : 0;
  }
  function calcPrices() {
    var qty = Number($("#prQty").value), d = $("#prDate").value, unit = priceOf("FR-02");
    var lines = [{ n: qty + " Stück Fensterreinigung (FR-02)", net: halfUp(qty * 1000 * unit, 1000) }], why;
    var bp = 0, name = "";
    if (d === "hol" && RULES.hol) { bp = 5000; name = "Zuschlag Sonn- und Feiertag +50 %"; why = "Der 03.10.2026 ist Tag der Deutschen Einheit, ein Feiertag in allen Ländern. Feiertag geht vor Samstag."; }
    else if ((d === "hol" || d === "sat") && RULES.sat) { bp = 2500; name = "Zuschlag Samstag +25 %"; why = "Der Termin ist ein Samstag; die Regel „Samstag“ greift."; }
    else { why = d === "wd" ? "Mo 12.10.2026 ist ein Werktag; keine Regel greift." : "Für diesen Termin ist keine Regel eingeschaltet."; }
    if (bp) { lines.push({ n: name, net: halfUp(lines[0].net * bp, 10000) }); }
    var sum = lines.reduce(function (a, l) { return a + l.net; }, 0);
    if (RULES.min && sum < 3500) {
      lines.push({ n: "Aufschlag bis Mindestbetrag 35,00 €", net: 3500 - sum });
      why += " Der Mindestbetrag hebt die Summe auf 35,00 € netto.";
    }
    var tb = $("#prCalc"), net = 0, vat = 0;
    tb.textContent = "";
    lines.forEach(function (l) {
      var v = halfUp(l.net * 1900, 10000);
      net += l.net; vat += v;
      var tr = el("tr");
      tr.appendChild(el("td", "", l.n));
      tr.appendChild(el("td", "num mono", euro(l.net)));
      tr.appendChild(el("td", "num mono", euro(v)));
      tb.appendChild(tr);
    });
    [["Netto", net, false], ["MwSt. 19 % (je Position gerundet)", vat, false], ["Brutto", net + vat, true]].forEach(function (t) {
      var tr = el("tr", t[2] ? "is-total" : "");
      tr.appendChild(el("td", "", t[0]));
      tr.appendChild(el("td", "num mono", ""));
      tr.appendChild(el("td", "num mono", euro(t[1])));
      tb.appendChild(tr);
    });
    $("#prCalcNote").textContent = why;
  }
  $$("#prRules .switch").forEach(function (b) {
    b.addEventListener("click", function () {
      var on = b.getAttribute("aria-checked") !== "true";
      b.setAttribute("aria-checked", String(on));
      RULES[b.getAttribute("data-rule")] = on;
      calcPrices();
    });
  });
  $("#prQty").addEventListener("change", calcPrices);
  $("#prDate").addEventListener("change", calcPrices);

  var prDlg = $("#prDlg"), prRow = null;
  function centsText(c) { return String(Math.floor(c / 100)) + "," + ("0" + (c % 100)).slice(-2); }
  function pdEffect() {
    var ver = Number(prRow.getAttribute("data-ver"));
    $("#pdEffect").textContent = "Wird Version " + (ver + 1) + " und gilt für neue Nachträge. Gesendete Nachträge bleiben bei Version " + ver + ".";
  }
  $("#prRows").addEventListener("click", function (e) {
    var b = e.target.closest("[data-edit]");
    if (!b) { return; }
    prRow = b.closest("tr");
    $("#pdCode").value = prRow.getAttribute("data-code");
    $("#pdName").value = prRow.getAttribute("data-name");
    $("#pdUnit").value = prRow.getAttribute("data-unit");
    $("#pdPrice").value = centsText(Number(prRow.getAttribute("data-cents")));
    $("#pdVat").value = prRow.getAttribute("data-vat");
    $("#pdError").hidden = true;
    pdEffect();
    prDlg.showModal();
    $("#pdPrice").focus();
  });
  $("#pdCancel").addEventListener("click", function () { prDlg.close(); });
  $("#pdSave").addEventListener("click", function () {
    var c = parseCents($("#pdPrice").value);
    if (c === null) { $("#pdError").hidden = false; $("#pdPrice").focus(); return; }
    var ver = Number(prRow.getAttribute("data-ver")) + 1, cells = prRow.children;
    prRow.setAttribute("data-cents", String(c));
    prRow.setAttribute("data-name", $("#pdName").value);
    prRow.setAttribute("data-unit", $("#pdUnit").value);
    prRow.setAttribute("data-vat", $("#pdVat").value);
    prRow.setAttribute("data-ver", String(ver));
    cells[1].textContent = $("#pdName").value;
    cells[2].textContent = $("#pdUnit").value;
    cells[3].textContent = euro(c);
    cells[4].textContent = $("#pdVat").value + " %";
    cells[5].textContent = "v" + ver;
    prDlg.close();
    calcPrices();
    toast(prRow.getAttribute("data-code") + " ist jetzt Version " + ver + ". Gesendete Nachträge bleiben bei der alten Version.");
  });

  var prImp = $("#prImp");
  function piCount() {
    var n = $$("#piTable input[data-pi]:checked").length;
    $("#piSum").textContent = n ? n + " Zeilen ausgewählt. Nichts wird aktiv, bis du das Preisbuch speicherst." : "Keine Zeile ausgewählt.";
    $("#piApply").disabled = !n;
  }
  $("#prImportOpen").addEventListener("click", function () { piCount(); prImp.showModal(); });
  $("#piCancel").addEventListener("click", function () { prImp.close(); });
  $$("#piTable input[data-pi]").forEach(function (c) { c.addEventListener("change", piCount); });
  $("#piApply").addEventListener("click", function () {
    var items = 0, rules = 0, change = null;
    $$("#piTable input[data-pi]:checked").forEach(function (c) {
      var kind = c.getAttribute("data-pi");
      if (kind === "item") {
        items += 1;
        var tr = el("tr", "is-draft");
        tr.setAttribute("data-draft", "1");
        tr.setAttribute("data-code", "NEU-" + items);
        tr.setAttribute("data-cents", c.getAttribute("data-cents"));
        tr.setAttribute("data-name", c.getAttribute("data-name"));
        tr.setAttribute("data-unit", c.getAttribute("data-unit"));
        tr.setAttribute("data-vat", "19");
        tr.setAttribute("data-ver", "0");
        tr.appendChild(el("td", "mono", "neu"));
        tr.appendChild(el("td", "", c.getAttribute("data-name")));
        tr.appendChild(el("td", "", c.getAttribute("data-unit")));
        tr.appendChild(el("td", "num mono", euro(Number(c.getAttribute("data-cents")))));
        tr.appendChild(el("td", "num mono", "19 %"));
        tr.appendChild(el("td", "", "Entwurf"));
        tr.appendChild(el("td", "", ""));
        $("#prRows").appendChild(tr);
      } else if (kind === "rule") {
        rules += 1;
      } else { change = true; }
    });
    prImp.close();
    $("#prDraft").hidden = false;
    $("#prDraftSave").hidden = false;
    $("#prDraft").lastChild.textContent = "Entwurf: " + items + " Positionen, " + rules + " Regel" + (change ? ", 1 Änderung" : "") + " warten auf Speichern";
    $("#prDraftSave").setAttribute("data-rules", String(rules));
    $("#prDraftSave").setAttribute("data-change", change ? "1" : "");
    prImp.querySelectorAll("input[data-pi]").forEach(function (c) { c.checked = false; });
  });
  $("#prDraftSave").addEventListener("click", function () {
    var n = 0, cnt = 0;
    $$("#prRows tr[data-draft]").forEach(function (tr) {
      n += 1;
      tr.removeAttribute("data-draft");
      tr.classList.remove("is-draft");
      tr.setAttribute("data-code", "PB-" + (100 + n));
      tr.setAttribute("data-ver", "1");
      tr.children[0].textContent = "PB-" + (100 + n);
      tr.children[5].textContent = "v1";
      var b = el("button", "link-btn", "Bearbeiten");
      b.type = "button";
      b.setAttribute("data-edit", "");
      tr.children[6].appendChild(b);
    });
    if (this.getAttribute("data-rules") === "1") {
      var li = el("li"), d = el("div"), sw = el("button", "switch");
      d.appendChild(el("strong", "", "Anfahrt"));
      d.appendChild(el("span", "", "18,00 € netto je Einsatz, als eigene Zeile"));
      sw.type = "button";
      sw.setAttribute("role", "switch");
      sw.setAttribute("aria-checked", "true");
      sw.setAttribute("aria-label", "Regel Anfahrt");
      li.appendChild(d);
      li.appendChild(sw);
      $("#prRules").appendChild(li);
      cnt += 1;
    }
    if (this.getAttribute("data-change") === "1") {
      var fr = $('#prRows tr[data-code="FR-02"]');
      fr.setAttribute("data-cents", "950");
      fr.setAttribute("data-ver", "4");
      fr.children[3].textContent = euro(950);
      fr.children[5].textContent = "v4";
      calcPrices();
    }
    $("#prDraft").hidden = true;
    this.hidden = true;
    toast("Preisbuch gespeichert: " + n + " Positionen" + (cnt ? " und 1 Regel" : "") + " sind aktiv, neue Nachträge nutzen sie.");
  });

  /* ================= 8.17 Insights ================= */
  var INS = [
    { id: "found", label: "Geld gefunden", money: 108450, sub: "14 Zusatzwünsche als Extra bestätigt", h: "Geld gefunden nach Kanal",
      cols: ["Kanal", "Anzahl", "Netto"], rows: [["WhatsApp", 7, 58500], ["E-Mail", 4, 30150], ["Aushang", 2, 9900], ["Portal", 1, 9900]],
      more: { h: "Nach Stand", cols: ["Stand", "Anzahl", "Netto"], rows: [["Freigegeben", 9, 73600], ["Verloren", 4, 18000], ["Wartet auf Antwort", 1, 16850]] } },
    { id: "appr", label: "Freigegeben", money: 73600, sub: "9 Nachträge, Median bis zur Freigabe 3 Std 20 Min", h: "Freigegeben nach Nachweisklasse",
      cols: ["Klasse", "Anzahl", "Netto"], rows: [["A Link mit Code und Unterschrift", 5, 42100], ["B Link mit Unterschrift", 1, 9600], ["C Antwort im Chat", 2, 14500], ["D am Telefon oder vor Ort erfasst", 1, 7400]] },
    { id: "lost", label: "Verloren", money: 18000, sub: "4 Extras ohne Bezahlung", h: "Verloren nach Grund",
      cols: ["Grund", "Anzahl", "Netto"], rows: [["abgelehnt", 1, 4500], ["abgelaufen", 2, 10000], ["ohne Freigabe ausgeführt", 1, 3500]] },
    { id: "good", label: "Kulanz", money: 11200, sub: "6 Einsätze, Budget 150,00 € im Monat", h: "Kulanz nach Einsatz",
      cols: ["Einsatz", "Anzahl", "Wert"], rows: [["Kellerflur zusätzlich gefegt", 1, 2500], ["Briefkästen poliert", 1, 1800], ["Sperrmüll mitgenommen", 1, 1500], ["Hofeinfahrt gekehrt", 1, 2200], ["Fensterbänke innen", 1, 1700], ["Klingelschilder gereinigt", 1, 1500]] },
    { id: "cov", label: "Nachweis-Abdeckung", text: "94 %", sub: "188 von 200 Pflichtpunkten belegt", h: "Fehlender Nachweis nach Grund",
      cols: ["Grund", "Anzahl"], rows: [["Foto fehlt", 7], ["Wert fehlt", 3], ["Vorher-Nachher-Paar fehlt", 2]], count: 12, note: "Zusätzlich 2 verpasste Einsätze: Krankheit (1), Zugang nicht möglich (1)." },
    { id: "comp", label: "Reklamationen", text: "3", sub: "Erste Antwort im Median nach 1 Std 05 Min", h: "Reklamationen",
      cols: ["Objekt", "Erste Antwort", "Nacharbeit"], rows: [["Parkstraße 8, Geländer", "35 Min", "Einsatz am 24.09."], ["Hofweg 3, Klingelschilder", "1 Std 05 Min", "Einsatz am 25.09."], ["Rosenstraße 4, Treppe nass", "2 Std 10 Min", "keine"]], plain: true, note: "Reklamationen werden nie berechnet; Nacharbeit erscheint in keiner Exportdatei für die Buchhaltung." },
    { id: "rep", label: "Berichte", text: "21", sub: "17 geöffnet, 2 Monatsübersichten", h: "Berichte nach Stand",
      cols: ["Stand", "Anzahl"], rows: [["geöffnet", 17], ["noch nicht geöffnet", 4]], count: 21 },
    { id: "chk", label: "Prüfungen", text: "82 %", sub: "JF-RADAR-1: 51 von 62 Vorschlägen angenommen", h: "Trust Meter",
      cols: ["Aufgabe", "Stufe", "Vorschläge", "angenommen"], rows: [["JF-RADAR-1, Deutsch", "sichtbar", "62", "51 (82 %)"], ["JF-PRICE-1, Deutsch", "Schatten", "0 angezeigt", "–"], ["JF-APPROVAL-1, Deutsch", "Schatten", "0 angezeigt", "–"]], plain: true, note: "Angenommen heißt: von einer Person bestätigt. 5 der 51 wurden vor dem Bestätigen geändert." }
  ];
  var insCur = "appr";
  function insFig(t) { return t.money !== undefined ? euro(t.money) : t.text; }
  function insTable(cols, rows, moneyCol, plain) {
    var wrap = el("div", "table-wrap"), tb = el("table", "data"), th = el("thead"), tr = el("tr");
    cols.forEach(function (c, i) { var h = el("th", i > 0 && !plain ? "num" : "", c); h.setAttribute("scope", "col"); tr.appendChild(h); });
    th.appendChild(tr);
    tb.appendChild(th);
    var body = el("tbody");
    rows.forEach(function (r) {
      var rw = el("tr");
      r.forEach(function (v, i) {
        var last = i === r.length - 1 && moneyCol;
        rw.appendChild(el("td", i > 0 && !plain ? "num mono" : "", last ? euro(v) : String(v)));
      });
      body.appendChild(rw);
    });
    tb.appendChild(body);
    wrap.appendChild(tb);
    return wrap;
  }
  function renderIns() {
    var grid = $("#insGrid");
    grid.textContent = "";
    INS.forEach(function (t) {
      var b = el("button", "ins-tile");
      b.type = "button";
      b.setAttribute("aria-pressed", String(t.id === insCur));
      b.appendChild(el("span", "label-sm", t.label));
      b.appendChild(el("span", "ins-value", insFig(t)));
      b.appendChild(el("span", "ins-sub", t.sub));
      b.addEventListener("click", function () { insCur = t.id; renderIns(); });
      grid.appendChild(b);
    });
    var t = INS.filter(function (x) { return x.id === insCur; })[0], d = $("#insDetail");
    d.textContent = "";
    d.appendChild(el("h2", "", t.h));
    d.setAttribute("aria-label", t.label);
    var isMoney = t.money !== undefined, isCount = t.count !== undefined;
    d.appendChild(insTable(t.cols, t.rows, isMoney, t.plain));
    if (isMoney) {
      var sum = t.rows.reduce(function (a, r) { return a + r[2]; }, 0), n = t.rows.reduce(function (a, r) { return a + r[1]; }, 0);
      d.appendChild(el("p", "ins-sum", "Summe der Zeilen: " + n + " Stück, " + euro(sum) + (sum === t.money ? ", gleich der Kachel." : ", weicht von der Kachel ab.")));
    } else if (isCount) {
      var c = t.rows.reduce(function (a, r) { return a + r[1]; }, 0);
      d.appendChild(el("p", "ins-sum", "Summe der Zeilen: " + c + (c === t.count ? ", gleich der Grundmenge." : ", weicht ab.")));
    }
    if (t.more) {
      d.appendChild(el("h2", "", t.more.h));
      d.appendChild(insTable(t.more.cols, t.more.rows, true, false));
      var s2 = t.more.rows.reduce(function (a, r) { return a + r[2]; }, 0);
      d.appendChild(el("p", "ins-sum", "Summe: " + euro(s2) + (s2 === t.money ? ", gleich der Kachel." : ", weicht ab.")));
    }
    if (t.note) { d.appendChild(el("p", "ins-note", t.note)); }
    var a = el("a", "link-btn", "Quellen im Verlauf ansehen");
    a.href = "#timeline";
    d.appendChild(a);
  }

  /* ================= 7.13 Customer portal ================= */
  var PTL = [
    { id: "lind", name: "Lindenstraße 14", by: ["Muster Gebäudeservice"], tabs: {
        Einsätze: [["Di 22.09.2026", "08:14 bis 08:41, Treppenhausreinigung, 8 von 8 belegt"], ["Di 15.09.2026", "08:09 bis 08:38, Treppenhausreinigung, 8 von 8 belegt"], ["Di 08.09.2026", "08:16 bis 08:44, Treppenhausreinigung, 7 von 8 belegt, 1 ohne Nachweis"]],
        Nachweise: [["Leistungsnachweis September 2026", "Siegelcode K3P9-4XQ2, festgehalten 29.09.2026"], ["Leistungsnachweis August 2026", "Siegelcode M4TX-7HD8, festgehalten 01.09.2026"]],
        Nachträge: [["NT-2026-0031", "Kellerfenster innen und außen putzen, 6 Stück, 67,50 € netto, gültig bis 13.10.2026"]],
        Anfragen: [["Licht im Keller defekt", "gemeldet über den Aushang, in Bearbeitung"]],
        Mängel: [["Kellertür klemmt", "gemeldet 21.09., Folgeauftrag angeboten"]] } },
    { id: "hof", name: "Hofweg 3", by: ["Muster Gebäudeservice"], tabs: {
        Einsätze: [["Mo 28.09.2026", "13:00 bis 13:35, Unterhaltsreinigung, 6 von 6 belegt"], ["Fr 25.09.2026", "13:02 bis 13:31, Unterhaltsreinigung, 6 von 6 belegt"]],
        Nachweise: [["Leistungsnachweis September 2026", "Siegelcode R8WN-5DZ7, festgehalten 29.09.2026"]],
        Nachträge: [["NT-2026-0030", "Glasvordach am Eingang reinigen, 45,00 € netto, gültig bis 02.10.2026"]],
        Anfragen: [], Mängel: [] } },
    { id: "park", name: "Parkstraße 8", by: ["Muster Gebäudeservice", "Nord Winterdienst Muster"], tabs: {
        Einsätze: [["Do 24.09.2026", "07:30 bis 08:10, Nacharbeit Geländer 2. OG (Muster Gebäudeservice)"], ["Mi 23.09.2026", "07:45 bis 08:25, Tiefgarage (Muster Gebäudeservice)"]],
        Nachweise: [["Winterdienst-Protokoll Saison 2025/26", "Siegelcode P2LQ-8VC3, festgehalten 31.03.2026 (Nord Winterdienst Muster)"]],
        Nachträge: [["NT-2026-0028", "Tiefgarage grundreinigen, 60 m², 180,00 € netto, gültig bis 09.10.2026"]],
        Anfragen: [["Angebot Fassadenreinigung Innenhof", "gestellt Mo 28.09., wartet auf das Angebot"]],
        Mängel: [["Geländer 2. OG nicht sauber", "gemeldet 22.09., Nacharbeit am 24.09. erledigt"]] } },
    { id: "rose", name: "Rosenstraße 4", by: ["Muster Gebäudeservice"], tabs: {
        Einsätze: [["Fr 25.09.2026", "10:05 bis 10:40, Unterhaltsreinigung, 5 von 5 belegt"]],
        Nachweise: [["Leistungsnachweis August 2026", "Siegelcode T6HB-2MK9, festgehalten 01.09.2026"]],
        Nachträge: [], Anfragen: [], Mängel: [["Treppe im 1. OG war nass", "gemeldet 27.09., Antwort gesendet"]] } }
  ];
  var TAB_NAMES = ["Einsätze", "Nachweise", "Nachträge", "Anfragen", "Mängel"];
  var ptlCur = "lind", ptlTab = "Nachträge";
  function renderPortal() {
    var ul = $("#ptlList");
    ul.textContent = "";
    PTL.forEach(function (b) {
      var li = el("li"), btn = el("button", "ptl-b");
      btn.type = "button";
      if (b.id === ptlCur) { btn.setAttribute("aria-current", "true"); }
      btn.appendChild(el("strong", "", b.name));
      var open = b.tabs.Nachträge.length;
      btn.appendChild(el("span", "", open ? open + " Nachtrag" + (open === 1 ? "" : "träge") + " wartet" : "nichts offen"));
      btn.addEventListener("click", function () { ptlCur = b.id; renderPortal(); });
      li.appendChild(btn);
      ul.appendChild(li);
    });
    var b = PTL.filter(function (x) { return x.id === ptlCur; })[0], m = $("#ptlMain");
    m.textContent = "";
    m.appendChild(el("h1", "display", b.name));
    var flags = el("div", "ptl-sum");
    b.by.forEach(function (c) { flags.appendChild(el("span", "job-chip", c)); });
    m.appendChild(flags);
    var tabs = el("div", "tabs");
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Bereiche des Objekts");
    TAB_NAMES.forEach(function (n) {
      var t = el("button", "tab", n), cnt = b.tabs[n].length;
      t.type = "button";
      t.setAttribute("role", "tab");
      t.setAttribute("aria-selected", String(n === ptlTab));
      if (cnt) { t.appendChild(el("span", "tab-count", String(cnt))); }
      t.addEventListener("click", function () { ptlTab = n; renderPortal(); });
      tabs.appendChild(t);
    });
    m.appendChild(tabs);
    var rows = b.tabs[ptlTab], panel = el("div");
    panel.setAttribute("role", "tabpanel");
    if (!rows.length) {
      panel.appendChild(el("p", "note", ptlTab === "Anfragen" ? "Keine offenen Anfragen für dieses Objekt." : "Hier ist nichts eingetragen. Ein leeres Feld heißt: es liegt nichts vor, nicht: es wurde nichts geprüft."));
    } else {
      var list = el("ul", "ptl-rows");
      rows.forEach(function (r) {
        var li = el("li"), d = el("div");
        d.appendChild(el("strong", "", r[0]));
        d.appendChild(el("span", "", r[1]));
        li.appendChild(d);
        if (ptlTab === "Nachträge") { var a = el("a", "btn btn-primary", "Ansehen und freigeben"); a.href = "#bundle"; li.appendChild(a); }
        if (ptlTab === "Nachweise") { var s = el("a", "btn btn-secondary", "Siegel prüfen"); s.href = "#seal"; li.appendChild(s); }
        list.appendChild(li);
      });
      panel.appendChild(list);
    }
    if (ptlTab === "Anfragen") {
      var f = el("div", "ptl-form");
      var lab = el("label", "field");
      lab.appendChild(el("span", "", "Neue Anfrage an den Dienstleister"));
      var ta = el("textarea");
      ta.rows = 3;
      ta.id = "ptlReq";
      lab.appendChild(ta);
      f.appendChild(lab);
      var go = el("button", "btn btn-secondary", "Anfrage senden");
      go.type = "button";
      go.addEventListener("click", function () {
        if (!ta.value.trim()) { toast("Bitte die Anfrage kurz beschreiben."); ta.focus(); return; }
        ta.value = "";
        toast("Gesendet an " + b.by[0] + ". Die Firma sieht sie unter Anfragen.");
      });
      f.appendChild(go);
      panel.appendChild(f);
    }
    m.appendChild(panel);
  }

  /* ================= 7.16 Stairwell notice ================= */
  $("#ntForm").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!$("#ntText").value.trim()) { $("#ntError").hidden = false; $("#ntText").focus(); return; }
    $("#ntError").hidden = true;
    $("#ntForm").hidden = true;
    $("#ntDone").hidden = false;
  });
  $("#ntAgain").addEventListener("click", function () {
    $("#ntText").value = "";
    $("#ntForm").hidden = false;
    $("#ntDone").hidden = true;
    $("#ntText").focus();
  });

  /* ================= 7.14 Admin console ================= */
  $$("#admTabs .tab").forEach(function (t) {
    t.addEventListener("click", function () {
      var n = t.getAttribute("data-adm");
      $$("#admTabs .tab").forEach(function (x) { x.setAttribute("aria-selected", String(x === t)); });
      [1, 2, 3, 4, 5].forEach(function (i) { $("#admP" + i).hidden = String(i) !== n; });
    });
  });
  $("#admSearch").addEventListener("input", function () {
    var q = this.value.trim().toLowerCase(), any = false;
    $$("#admTable tbody tr").forEach(function (tr) {
      var hit = !q || tr.textContent.toLowerCase().indexOf(q) >= 0;
      tr.hidden = !hit;
      if (hit) { any = true; }
    });
    $("#admEmpty").hidden = any;
  });
  $("#admSupForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var why = $("#admSupWhy").value.trim();
    if (!why) { $("#admSupErr").hidden = false; $("#admSupWhy").focus(); return; }
    $("#admSupErr").hidden = true;
    var li = el("li"), d = el("div"), chip = el("span", "state-chip c-open");
    d.appendChild(el("strong", "", $("#admSupWs").value));
    d.appendChild(el("span", "", why + ", " + $("#admSupMin").value + " Minuten, jetzt angefragt"));
    chip.appendChild(el("span", "", "angefragt, wartet auf die Freigabe des Betriebs"));
    var sim = el("button", "link-btn small", "Prototyp: Betrieb gibt frei");
    sim.type = "button";
    sim.addEventListener("click", function () {
      chip.className = "state-chip c-ok";
      chip.firstChild.textContent = "aktiv, nur lesen, jede Ansicht wird protokolliert";
      sim.hidden = true;
      var end = el("button", "link-btn small", "Sitzung beenden");
      end.type = "button";
      end.addEventListener("click", function () { chip.className = "state-chip c-unknown"; chip.firstChild.textContent = "beendet, 0 Ansichten protokolliert"; end.hidden = true; });
      li.appendChild(end);
    });
    li.appendChild(d);
    li.appendChild(chip);
    li.appendChild(sim);
    $("#admSessions").insertBefore(li, $("#admSessions").firstChild);
    $("#admSupWhy").value = "";
    toast("Anfrage gesendet. Der Betrieb sieht sie und entscheidet.");
  });
  $("#admIncSend").addEventListener("click", function () {
    openConfirm("Statusseite aktualisieren?", "14 Betriebe werden benachrichtigt. Die Meldung ist danach öffentlich sichtbar.", "Aktualisieren und benachrichtigen", function () {
      $("#admIncDone").hidden = false;
      $("#admIncSend").disabled = true;
    }, true);
  });

  /* ================= routing ================= */
  var OFFICE = { timeline: "jobs", change: "jobs", report: "reports", finder: "money", today: "today", team: "settings", billing: "settings", frame: "customers", letter: "money", inbox: "inbox", prices: "prices", insights: "insights" };
  var DEFAULT = "timeline", entered = {};
  var ENTER = {
    change: function () { recalc(); },
    finder: function (first) { if (first) { streamFinder(); } },
    today: function (first) { if (first) { checkConflicts(); } },
    frame: function () { renderFrame(); },
    bundle: function () { bundleUpdate(); },
    seal: function () { renderSeal(); },
    inbox: function () { renderInbox(); },
    prices: function () { calcPrices(); },
    insights: function () { renderIns(); },
    portal: function () { renderPortal(); },
    onboarding: function (first) { if (first) { renderPack(); countPrices(); } }
  };
  function show(hash) {
    var id = hash || DEFAULT, wantCmd = id === "command";
    if (wantCmd) { id = DEFAULT; }
    var target = document.getElementById("s-" + id);
    if (!target) { id = DEFAULT; target = document.getElementById("s-" + DEFAULT); }
    $$(".screen").forEach(function (s) { s.classList.toggle("is-active", s === target); });
    document.body.setAttribute("data-surface", OFFICE[id] ? "office" : "stage");
    markProto(wantCmd ? "command" : id);
    $$("[data-nav]").forEach(function (a) { a.classList.toggle("is-on", a.getAttribute("data-nav") === OFFICE[id]); });
    if (ENTER[id]) { ENTER[id](!entered[id]); }
    entered[id] = true;
    closeDrawer();
    if (wantCmd) { openCmd(); } else if (cmd.open) { cmd.close(); }
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", function () { show(location.hash.slice(1)); });

  /* ================= global keys ================= */
  document.addEventListener("keydown", function (e) {
    var office = document.body.getAttribute("data-surface") === "office";
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) { if (office) { e.preventDefault(); openCmd(); } return; }
    var active = $(".screen.is-active"), scr = active ? active.getAttribute("data-screen") : "";
    if (!active || cmd.open || confirmDlg.open) { return; }
    if (scr === "change" && (e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); sendChange(); return; }
    if (typing(e) || e.ctrlKey || e.metaKey || e.altKey) { return; }
    var k = e.key.toLowerCase();
    if (scr === "inbox" && (k === "z" || k === "a" || k === "r" || k === "v")) { e.preventDefault(); inAct(k); return; }
    if (scr === "timeline" && k === "n") { e.preventDefault(); foldGo("#change"); return; }
    if (scr === "finder") {
      if (k === "j" || k === "k") {
        e.preventDefault();
        setActive(k === "j" ? Math.min(mfRows.length - 1, mfActive + 1) : Math.max(0, mfActive - 1));
        mfRows[mfActive].focus();
      } else if ((k === "a" || k === "g" || k === "d") && !e.target.closest("button")) {
        e.preventDefault();
        var row = mfRows[mfActive];
        decide(row, k);
        mfRows[mfActive].focus();
      }
      return;
    }
    if (scr === "today" && picked && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      moveVisit(e.key === "ArrowUp" ? -1 : 1);
      picked.focus();
    }
  });

  /* ================= start ================= */
  fillDrawer("co31");
  setupPad();
  recalc();
  show(location.hash.slice(1));
})();
