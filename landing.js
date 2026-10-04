/* JobFold landing page 2027: the doorbell panel of the hero, the live demo of the clickable product design (an iframe
   with sample data), feature filter, pilot request and the free Money Finder, in English, German and Turkish. The copy
   comes from the page itself and from landing-i18n-<lang>.js (window.JF_I18N). No network calls, no inline styles;
   works under a strict CSP. */

/* ------------------------------------------------------------ hero panel: press a doorbell, see what is behind its light */
(function () {
  "use strict";
  var panel = document.querySelector("[data-panel]");
  if (!panel) return;
  var rows = Array.prototype.slice.call(panel.querySelectorAll("[data-row]"));
  var status = panel.querySelector("[data-panel-status]");
  var approve = panel.querySelector("[data-panel-approve]");
  var current = null;
  function select(row) {
    current = row;
    rows.forEach(function (r) { r.setAttribute("aria-pressed", String(r === row)); });
    status.textContent = row.getAttribute("data-detail");
    /* Only a row that waits for a person offers the approval; everything else is a fact to read. */
    approve.hidden = !row.hasAttribute("data-approved-meta");
  }
  rows.forEach(function (r) { r.addEventListener("click", function () { select(r); }); });
  approve.addEventListener("click", function () {
    if (!current || !current.hasAttribute("data-approved-meta")) return;
    var led = current.querySelector(".led");
    led.setAttribute("data-s", "sign");
    led.classList.add("is-answered");
    led.querySelector("use").setAttribute("href", "#i-pen");
    current.querySelector(".np-meta").textContent = current.getAttribute("data-approved-meta");
    current.setAttribute("data-detail", current.getAttribute("data-approved-detail"));
    current.removeAttribute("data-approved-meta");
    status.textContent = current.getAttribute("data-detail");
    approve.hidden = true;
    current.focus();
  });
})();

/* ------------------------------------------------------------ live demo */
(function () {
  "use strict";
  var phone = window.matchMedia("(max-width: 760px)");
  var boxes = Array.prototype.slice.call(document.querySelectorAll("[data-fit]"));
  /* Each [data-fit] box shows its iframe at a fixed virtual size (data-w x data-h), scaled to the box width.
     On phones the product's own phone layout is shown at full width instead. */
  function fit() {
    boxes.forEach(function (box) {
      var f = box.querySelector("iframe");
      if (!f) return;
      var w = Number(box.getAttribute("data-w")) || 1440, h = Number(box.getAttribute("data-h")) || 900;
      if (phone.matches) { f.style.width = ""; f.style.height = ""; f.style.transform = ""; box.style.height = ""; return; }
      var s = Math.min(1, box.clientWidth / w);
      f.style.width = w + "px";
      f.style.height = h + "px";
      f.style.transform = "scale(" + s + ")";
      box.style.height = Math.round(h * s) + "px";
    });
  }
  fit();
  window.addEventListener("resize", fit);
  if (window.ResizeObserver) { var ro = new ResizeObserver(fit); boxes.forEach(function (b) { ro.observe(b); }); }

  var stage = document.getElementById("demo-stage");
  var frame = document.getElementById("demo-frame");
  if (!stage || !frame) return;
  /* The demo names its screens in the fragment: /site/objektakte/?embed=1#objekt */
  var base = frame.getAttribute("src").split("#")[0];
  var plain = base.replace(/[?&]embed=1$/, "");
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".demo-tabs [data-screen]"));
  var full = document.getElementById("demo-open");
  var caption = document.getElementById("demo-caption");
  function go(screen) {
    var current = null;
    tabs.forEach(function (t) {
      var on = t.getAttribute("data-screen") === screen;
      if (on) current = t;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    var inner = null;
    try { inner = frame.contentWindow && typeof frame.contentWindow.foldGo === "function" ? frame.contentWindow : null; } catch (err) { inner = null; }
    /* Change the screen inside the loaded demo without a history entry; before it has loaded, set the address. */
    if (inner) inner.foldGo(screen); else frame.src = base + "#" + screen;
    if (full) full.href = plain + "#" + screen;
    if (caption && current && current.getAttribute("data-caption")) caption.textContent = current.getAttribute("data-caption");
    /* On a phone the tabs are one scrolling row. Bring the chosen tab to its middle by scrolling that row only,
       never the page, so a button elsewhere on the page that opens a screen also shows which tab is on. */
    var strip = current && current.parentNode;
    if (strip && strip.scrollWidth > strip.clientWidth) {
      strip.scrollLeft += current.getBoundingClientRect().left - strip.getBoundingClientRect().left - (strip.clientWidth - current.offsetWidth) / 2;
    }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { go(t.getAttribute("data-screen")); });
    t.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var next = tabs[(i + d + tabs.length) % tabs.length];
      next.focus();
      go(next.getAttribute("data-screen"));
    });
    t.tabIndex = t.getAttribute("aria-selected") === "true" ? 0 : -1;
  });
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.querySelectorAll("[data-demo]").forEach(function (a) {
    a.addEventListener("click", function () {
      go(a.getAttribute("data-demo"));
      stage.scrollIntoView({ block: "center", behavior: calm.matches ? "auto" : "smooth" });
    });
  });
})();

/* ------------------------------------------------------------ capability filter (area and release) */
(function () {
  "use strict";
  var S = (window.JF_I18N || { js: {} }).js;
  var areas = document.querySelectorAll("[data-filter]");
  var waves = document.querySelectorAll("[data-wave]");
  var count = document.getElementById("cap-count");
  if (!areas.length) return;
  var area = "all", wave = "all";
  function apply() {
    var shown = 0;
    document.querySelectorAll(".cap").forEach(function (c) {
      var ok = (area === "all" || c.dataset.status === area) && (wave === "all" || c.dataset.release === wave);
      c.hidden = !ok;
      if (ok) shown += 1;
    });
    document.querySelectorAll(".cap-group").forEach(function (g) { g.hidden = !g.querySelector(".cap:not([hidden])"); });
    areas.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.filter === area)); });
    waves.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.wave === wave)); });
    if (count) count.textContent = shown + " " + (shown === 1 ? S.caps_one : S.caps_many);
    var none = document.getElementById("cap-empty");
    if (none) none.hidden = shown > 0;
  }
  areas.forEach(function (b) { b.addEventListener("click", function () { area = b.dataset.filter; apply(); }); });
  waves.forEach(function (b) { b.addEventListener("click", function () { wave = b.dataset.wave; apply(); }); });
  apply();
})();

/* ------------------------------------------------------------ language menu and hint */
(function () {
  "use strict";
  var I = window.JF_I18N;
  var menu = document.querySelector(".langmenu");
  if (menu) {
    document.addEventListener("click", function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.open) { menu.open = false; menu.querySelector("summary").focus(); } });
  }
  var box = document.getElementById("lang-hint");
  if (!box || !I || !I.hints) return;
  var wanted = (navigator.languages || [navigator.language || ""]).map(function (l) { return String(l).slice(0, 2).toLowerCase(); })
    .filter(function (l) { return I.hints[l]; })[0];
  if (!wanted || wanted === I.lang) return;
  var h = I.hints[wanted];
  document.getElementById("lang-hint-text").textContent = h.text;
  var link = document.getElementById("lang-hint-link");
  link.textContent = h.link;
  link.href = h.path;
  link.setAttribute("hreflang", wanted);
  link.setAttribute("lang", wanted);
  var close = document.getElementById("lang-hint-close");
  close.setAttribute("aria-label", h.close);
  close.addEventListener("click", function () { box.hidden = true; });
  box.hidden = false;
})();

/* ------------------------------------------------------------ pilot request (nothing is sent) */
(function () {
  "use strict";
  var S = (window.JF_I18N || { js: { pilot: {} } }).js;
  var form = document.getElementById("pilot-form");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.elements.name.value.trim(), org = form.elements.organization.value.trim();
    if (!name || !org) { form.elements[name ? "organization" : "name"].focus(); return; }
    var p = S.pilot;
    document.getElementById("pilot-text").value = p.head + "\n" + p.name + ": " + name + "\n" + p.company + ": " + org +
      "\n" + p.kind + ": " + form.elements.kind.value +
      "\n" + p.staff + ": " + form.elements.staff.value + "\n" + p.extras + ": " + form.elements.extras.value +
      "\n\n" + p.closing;
    document.getElementById("pilot-out").classList.add("show");
  });
  var copy = document.getElementById("copy-pilot");
  var label = copy.textContent;
  copy.addEventListener("click", function () {
    var area = document.getElementById("pilot-text");
    try {
      navigator.clipboard.writeText(area.value).then(function () {
        copy.textContent = S.copied;
        window.setTimeout(function () { copy.textContent = label; }, 2500);
      }, function () { area.select(); });
    } catch (err) { area.select(); }
  });
})();

/* ------------------------------------------------------------ free tool: Money Finder (v2.1)
   Runs in the browser: parses a WhatsApp chat export or pasted messages and flags requests that
   look like extra work with keyword rules (German, English, Turkish). Nothing is uploaded. */
(function () {
  "use strict";
  var run = document.getElementById("mf-run");
  if (!run) return;
  var I = window.JF_I18N || { lang: "en", js: { locale: "en", finder: {} } };
  var F = I.js.finder;
  var text = document.getElementById("mf-text");
  var file = document.getElementById("mf-file");
  var priceInput = document.getElementById("mf-price");
  var out = document.getElementById("mf-out");

  var SAMPLE = [
    "12.09.26, 08:14 - Frau Keller: Guten Morgen! Könnten Sie diese Woche auch die Kellerfenster putzen? Die sind sehr dreckig.",
    "12.09.26, 08:20 - Muster Gebäudeservice: Gerne, wir schauen am Donnerstag.",
    "14.09.26, 17:02 - Herr Yilmaz: Bitte am Freitag erst ab 10 Uhr kommen, der Aufzug wird gewartet.",
    "16.09.26, 09:31 - Frau Keller: Wäre es möglich, bei der Gelegenheit den Sperrmüll im Hof mitzunehmen?",
    "18.09.26, 12:05 - Hausverwaltung Nord: Das Geländer im 2. OG war letzte Woche nicht sauber.",
    "19.09.26, 10:44 - Herr Yilmaz: Können Sie zusätzlich die Garage fegen? Danke!",
    "21.09.26, 15:10 - Frau Keller: Danke für die schnelle Hilfe!",
    "23.09.26, 07:58 - Hausverwaltung Nord: Bitte ab nächster Woche auch den Innenhof einmal im Monat reinigen.",
    "24.09.26, 18:22 - Tom (tenant 3rd floor): Could you also clean the bike room when you are here?",
    "25.09.26, 09:05 - Ayşe D.: Merdivenleri silerken bir de bodrum kapısının önünü süpürebilir misiniz?",
    "26.09.26, 11:47 - Frau Keller: Wann kommen Sie nächste Woche?"
  ].join("\n");

  var REQUEST = [
    /\b(könnten|können|könntest|kannst|würden|würdest)\s+(sie|du|ihr)\b[^.?!]*\b(auch|noch|zusätzlich|mit)\b/i,
    /\b(wäre es möglich|ginge es|geht es)\b/i,
    /\bbitte\b[^.?!]{0,60}\b(auch|zusätzlich|noch)\b/i,
    /\b(zusätzlich|außerdem|extra|nebenbei|bei der gelegenheit|gleich mit|auch noch)\b/i,
    /\bmit(zu)?nehmen\b/i,
    /\b(could|can|would)\s+you\s+(also|please also|additionally)\b/i,
    /\b(additionally|while you('| a)re (there|here|at it)|one more thing|on top of)\b/i,
    /\b(bir de|ayrıca|ek olarak|ekstra)\b/i,
    /\b(yapabilir|temizleyebilir|süpürebilir|silebilir|halledebilir|alabilir)\s*(mi|mı|mu|mü)(siniz|sınız|sunuz|sünüz)\b/i
  ];
  var WORK = /\b(putzen|reinigen|wischen|fegen|kehren|entsorgen|mitnehmen|mitzunehmen|streichen|reparieren|austauschen|montieren|räumen|mähen|schneiden|waschen|saugen|aufräumen|sperrmüll|fenster\w*|keller\w*|garage|hof|innenhof|dachboden|clean|wash|remove|paint|repair|fix|install|mow|sweep|vacuum|windows?|garage|basement|bike room|temizle\w*|sil\w*|süpür\w*|boya\w*|tamir\w*|pencere\w*|bodrum\w*|garaj\w*)\b/i;
  var COMPLAINT = /(nicht sauber|nicht gemacht|vergessen|beschwer|dreckig geblieben|not clean|forgot|complain|temiz değil|unutul)/i;
  var SCHEDULE = /(\buhr\b|\btermin|verschieb|\bspäter\b|\bmorgen\b|wann kommen|o'?clock|tomorrow|reschedule|when (will|are) you|\bsaat\b|\byarın\b|ne zaman)/i;
  var LINE = [
    /^(\d{1,2}[./]\d{1,2}[./]\d{2,4}),?\s(\d{1,2}:\d{2})(?:\s?[AaPp][Mm])?\s[-–]\s([^:]{1,60}):\s([\s\S]*)$/,
    /^\[(\d{1,2}[./]\d{1,2}[./]\d{2,4}),?\s(\d{1,2}:\d{2}(?::\d{2})?)(?:\s?[AaPp][Mm])?\]\s([^:]{1,60}):\s([\s\S]*)$/
  ];

  function el(tag, cls, t) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (t !== undefined) n.textContent = t;
    return n;
  }
  function fill(tpl, values) {
    return String(tpl).replace(/\{(\w+)\}/g, function (m, k) { return values[k] !== undefined ? values[k] : m; });
  }
  /* Money is kept in cents; the format follows the page language: €1,084.50 in English, 1.084,50 € in German and Turkish. */
  function eur(c) {
    var s = (c / 100).toFixed(2).split("."), whole = s[0];
    if (I.js.locale === "en") return "€" + whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + s[1];
    return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + s[1] + " €";
  }
  function cents(s) {
    s = String(s || "").replace(/[€\s]/g, "");
    if (/,\d{1,2}$/.test(s)) s = s.replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
    else if (I.js.locale !== "en" && /^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    else s = s.replace(/,(?=\d{3}\b)/g, "");
    var x = parseFloat(s);
    return isNaN(x) || x < 0 ? 0 : Math.round(x * 100);
  }

  function parse(raw) {
    var msgs = [];
    raw.replace(/[\u200e\u200f\u202a-\u202e]/g, "").split(/\r?\n/).forEach(function (line) {
      if (!line.trim()) return;
      var m = null;
      for (var i = 0; i < LINE.length && !m; i += 1) m = LINE[i].exec(line.trim());
      if (m) msgs.push({ date: m[1], time: m[2], from: m[3].trim(), text: m[4].trim() });
      else if (msgs.length && msgs[msgs.length - 1].date) msgs[msgs.length - 1].text += " " + line.trim();
      else msgs.push({ date: "", time: "", from: "", text: line.trim() });
    });
    return msgs.filter(function (m) { return m.text && !/^<(media omitted|medien ausgeschlossen|medya dahil edilmedi)>$/i.test(m.text); });
  }

  function classify(t) {
    if (COMPLAINT.test(t)) return "complaint";
    var req = REQUEST.some(function (re) { return re.test(t); });
    var work = WORK.test(t);
    if (req && work) return "likely";
    if (req || (work && /\b(auch|also|bir de|de|da)\b/i.test(t))) return SCHEDULE.test(t) && !work ? "" : "maybe";
    return "";
  }

  function highlight(t) {
    var frag = document.createDocumentFragment();
    var all = REQUEST.concat([WORK]);
    var marks = [];
    all.forEach(function (re) {
      var g = new RegExp(re.source, re.flags.indexOf("g") > -1 ? re.flags : re.flags + "g");
      var m;
      while ((m = g.exec(t)) !== null) {
        if (!m[0]) { g.lastIndex += 1; continue; }
        marks.push([m.index, m.index + m[0].length]);
      }
    });
    marks.sort(function (a, b) { return a[0] - b[0]; });
    var pos = 0;
    marks.forEach(function (r) {
      if (r[0] < pos) return;
      frag.appendChild(document.createTextNode(t.slice(pos, r[0])));
      frag.appendChild(el("mark", null, t.slice(r[0], r[1])));
      pos = r[1];
    });
    frag.appendChild(document.createTextNode(t.slice(pos)));
    return frag;
  }

  function summary(likely, maybe, price, msgs, senders) {
    var l = likely === 1 ? F.likely_one : fill(F.likely_many, { n: likely });
    var m = maybe ? fill(F.maybe, { n: maybe }) : "";
    var s = senders ? fill(F.senders_part, { n: senders }) : F.senders_none;
    return fill(F.summary, { amount: "", likely: l, maybe: m, price: eur(price), msgs: msgs, senders: s }).replace(/^\s+/, "");
  }

  function render() {
    var msgs = parse(text.value);
    out.textContent = "";
    if (!msgs.length) { out.appendChild(el("p", "small muted", F.empty)); return; }
    var found = msgs.map(function (m) { m.kind = classify(m.text); return m; }).filter(function (m) { return m.kind; });
    var likely = found.filter(function (m) { return m.kind === "likely"; }).length;
    var maybe = found.filter(function (m) { return m.kind === "maybe"; }).length;
    var price = cents(priceInput.value);
    var senders = {};
    msgs.forEach(function (m) { if (m.from) senders[m.from] = true; });
    var head = el("div", "insight");
    head.appendChild(el("span", "money-total", eur(likely * price) + (maybe ? " – " + eur((likely + maybe) * price) : "")));
    head.appendChild(el("span", null, summary(likely, maybe, price, msgs.length, Object.keys(senders).length)));
    out.appendChild(head);
    var labels = { likely: F.kind_likely, maybe: F.kind_maybe, complaint: F.kind_complaint };
    found.forEach(function (m) {
      var card = el("div", "finding " + m.kind);
      card.appendChild(el("span", "meta", (m.date ? m.date + " " + m.time + ", " : "") + (m.from || F.message) + ": " + labels[m.kind]));
      var p = el("span");
      p.appendChild(highlight(m.text));
      card.appendChild(p);
      out.appendChild(card);
    });
    out.appendChild(el("p", "small muted", F.note));
  }

  file.addEventListener("change", function () {
    var f = file.files && file.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { out.textContent = F.too_large; return; }
    var reader = new FileReader();
    reader.onload = function () { text.value = String(reader.result || ""); render(); };
    reader.onerror = function () { out.textContent = F.read_error; };
    reader.readAsText(f);
  });
  run.addEventListener("click", render);
  document.getElementById("mf-sample").addEventListener("click", function () { text.value = SAMPLE; render(); });
  text.value = SAMPLE;
  render();
})();
