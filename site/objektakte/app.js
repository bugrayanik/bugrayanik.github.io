// JobFold building network prototype. All data on the page is synthetic (Musterdaten).
// No network calls, no storage beyond the chosen theme; every action stays on the page.
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  // Embedded in the landing page (?embed=1): the screen without the prototype bar.
  var embedded = /[?&]embed=1(&|$)/.test(location.search);
  if (embedded) { root.classList.add('is-embed'); }

  function all(sel, scope) { return Array.prototype.slice.call((scope || doc).querySelectorAll(sel)); }
  function one(sel, scope) { return (scope || doc).querySelector(sel); }
  function make(tag, cls, text) {
    var x = doc.createElement(tag);
    if (cls) { x.className = cls; }
    if (text !== undefined && text !== null) { x.textContent = text; }
    return x;
  }
  // Live regions stay mounted; only their text changes, so assistive technology announces the change.
  function say(el, text) { if (el) { el.textContent = text; } }

  var NBSP = ' ';
  // Money is integer cents; formatting only, never arithmetic on floats.
  function euro(cents) {
    var neg = cents < 0;
    var abs = Math.abs(cents);
    var whole = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    var rest = String(abs % 100).padStart(2, '0');
    return (neg ? '−' : '') + whole + ',' + rest + NBSP + '€';
  }

  // ---------- prototype bar ----------
  // The bar wraps in narrow windows; sticky columns and overlays start below its real height.
  var bar = one('.proto');
  function measureBar() {
    if (embedded || !bar) { return; }
    root.style.setProperty('--proto-h', Math.ceil(bar.getBoundingClientRect().height) + 'px');
  }
  measureBar();
  window.addEventListener('resize', measureBar);
  if (window.ResizeObserver && bar) { new ResizeObserver(measureBar).observe(bar); }

  // ---------- screens and overlays ----------
  // An overlay has its own name (#blatt, #vorschau, #befehle) and opens on top of its screen.
  var screens = all('[data-screen]');
  var names = screens.map(function (s) { return s.getAttribute('data-screen'); });
  var overlays = all('[data-overlay]');
  var aliasOf = {};
  overlays.forEach(function (o) { aliasOf[o.getAttribute('data-overlay')] = o.getAttribute('data-on'); });
  var known = names.concat(Object.keys(aliasOf));
  var onShow = {};
  var current = null;
  var focusNext = false;

  function screenOf(el) { return el.closest('[data-screen]'); }
  function titleOf(name) {
    var ov = aliasOf[name] ? one('[data-overlay="' + name + '"]') : null;
    var scr = one('[data-screen="' + (aliasOf[name] || name) + '"]');
    return (ov ? ov.getAttribute('data-title') : scr.getAttribute('data-title')) + ', JobFold Prototyp';
  }
  function syncProtoLinks(name) {
    all('.proto a.scr').forEach(function (a) {
      var t = a.getAttribute('href').slice(1);
      var on = t === name || (!aliasOf[name] && name.indexOf(t + '-') === 0);
      if (on) { a.setAttribute('aria-current', 'page'); } else { a.removeAttribute('aria-current'); }
      // In a narrow window the links scroll in one line; keep the current one in view.
      var nav = a.closest('.proto-nav');
      if (on && nav && nav.scrollWidth > nav.clientWidth) { nav.scrollLeft = Math.max(0, a.offsetLeft - nav.offsetLeft - 24); }
    });
  }

  var openOv = null;
  var inertEls = [];
  var returnTo = null;

  // While an overlay is open, everything else on its screen is inert; the prototype bar stays usable.
  function backdropOf(ov) {
    var host = ov.classList.contains('bsheet') ? ov.parentElement : (screenOf(ov) || current);
    if (!host) { return []; }
    return Array.prototype.filter.call(host.children, function (c) { return c !== ov && !c.hasAttribute('data-scrim'); });
  }
  function focusablesIn(el) {
    return all('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])', el)
      .filter(function (x) { return !x.closest('[hidden]') && x.getClientRects().length > 0; });
  }
  function openOverlay(ov, opts) {
    opts = opts || {};
    if (openOv === ov) { return; }
    if (openOv) { closeOverlay(openOv, { restore: false, keepHash: true }); }
    if (ov.beforeOpen) { ov.beforeOpen(opts); }
    ov.hidden = false;
    var scrim = ov.classList.contains('bsheet') ? one('[data-scrim]', ov.parentElement) : null;
    if (scrim) { scrim.hidden = false; }
    inertEls = backdropOf(ov);
    inertEls.forEach(function (x) { x.inert = true; });
    openOv = ov;
    returnTo = null;
    if (opts.focus) {
      returnTo = opts.from || doc.activeElement;
      ov.classList.add('is-entering');
      var target = opts.focusEl || one('h2[tabindex="-1"]', ov) || focusablesIn(ov)[0];
      if (target) { target.focus(); }
    }
  }
  function closeOverlay(ov, opts) {
    opts = opts || {};
    if (!ov || ov.hidden) { return; }
    var hadFocus = ov.contains(doc.activeElement);
    ov.hidden = true;
    ov.classList.remove('is-entering');
    var scrim = ov.classList.contains('bsheet') ? one('[data-scrim]', ov.parentElement) : null;
    if (scrim) { scrim.hidden = true; }
    inertEls.forEach(function (x) { x.inert = false; });
    inertEls = [];
    if (openOv === ov) { openOv = null; }
    var name = ov.getAttribute('data-overlay');
    if (!opts.keepHash && location.hash === '#' + name) {
      history.replaceState(null, '', '#' + aliasOf[name]);
      syncProtoLinks(aliasOf[name]);
      doc.title = titleOf(aliasOf[name]);
    }
    if (opts.restore !== false) {
      if (returnTo && doc.contains(returnTo) && !returnTo.closest('[hidden]')) {
        returnTo.focus();
      } else if (hadFocus && current) {
        // Opened by its address, so there is no trigger to return to: the screen's heading takes focus.
        var h = one('h1', current) || one('h2', current);
        if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
      }
    }
    returnTo = null;
  }

  function show() {
    var name = (location.hash || '').replace('#', '');
    if (known.indexOf(name) === -1) { name = 'heute'; }
    var base = aliasOf[name] || name;
    if (openOv) { closeOverlay(openOv, { restore: false, keepHash: true }); }
    screens.forEach(function (s) { s.hidden = s.getAttribute('data-screen') !== base; });
    current = one('[data-screen="' + base + '"]');
    syncProtoLinks(name);
    doc.title = titleOf(name);
    window.scrollTo(0, 0);
    if (onShow[base]) { onShow[base](); }
    var ov = aliasOf[name] ? one('[data-overlay="' + name + '"]') : null;
    if (ov) {
      openOverlay(ov, { focus: focusNext, alias: true });
    } else if (focusNext) {
      var h = one('h1', current);
      if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
    }
    focusNext = false;
  }

  all('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () { closeOverlay(b.closest('[data-overlay]')); });
  });
  all('[data-scrim]').forEach(function (s) {
    s.addEventListener('click', function () { if (openOv) { closeOverlay(openOv); } });
  });
  all('.overlay').forEach(function (ov) {
    ov.addEventListener('click', function (e) { if (e.target === ov) { closeOverlay(ov); } });
  });
  all('[data-open]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.getAttribute('aria-disabled') === 'true') { return; }
      openOverlay(one('[data-overlay="' + b.getAttribute('data-open') + '"]'), { focus: true, from: b });
    });
  });

  // ---------- disclosure: technical details stay folded until asked for ----------
  all('[data-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var region = doc.getElementById(b.getAttribute('aria-controls'));
      var open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', String(open));
      if (region) { region.hidden = !open; }
      var label = b.getAttribute(open ? 'data-label-open' : 'data-label-closed');
      if (label) { b.textContent = label; }
    });
  });

  // ---------- theme ----------
  // "Auto" follows the device: night colours when the system is dark. The stylesheet keeps one
  // dark block under [data-theme="nacht"], so the page reads the same with or without this script.
  var themeButtons = all('[data-theme-set]');
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var chosen = 'auto';
  function applyAuto() {
    if (chosen === 'auto') { root.setAttribute('data-theme', darkQuery && darkQuery.matches ? 'nacht' : 'tag'); }
  }
  if (darkQuery && darkQuery.addEventListener) { darkQuery.addEventListener('change', applyAuto); }
  function setTheme(t, keep) {
    chosen = t;
    if (t === 'auto') { applyAuto(); } else { root.setAttribute('data-theme', t); }
    themeButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-theme-set') === t)); });
    if (keep === false) { return; }
    try { localStorage.setItem('jf-proto-theme', t); } catch (e) { /* storage unavailable: theme still applies */ }
  }
  themeButtons.forEach(function (b) { b.addEventListener('click', function () { setTheme(b.getAttribute('data-theme-set')); }); });
  var saved = null;
  try { saved = localStorage.getItem('jf-proto-theme'); } catch (e) { /* ignore */ }
  // ?theme=tag|nacht|draussen shows one theme for a review or an embed without changing the stored choice.
  var asked = /[?&]theme=(tag|nacht|draussen)(&|$)/.exec(location.search);
  if (asked) { setTheme(asked[1], false); } else { setTheme(saved || 'auto'); }
  // Paper is light: print always uses Tag, then the chosen theme returns.
  var themeBeforePrint = null;
  window.addEventListener('beforeprint', function () { themeBeforePrint = root.getAttribute('data-theme'); root.setAttribute('data-theme', 'tag'); });
  window.addEventListener('afterprint', function () {
    if (themeBeforePrint) { root.setAttribute('data-theme', themeBeforePrint); themeBeforePrint = null; }
  });

  // ---------- single-choice chip groups, optionally filtering a list ----------
  all('.toolbar[role="group"]').forEach(function (group) {
    var chips = all('.chip', group);
    var listId = group.getAttribute('data-filter-for');
    var target = listId ? doc.getElementById(listId) : null;
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (o) { o.setAttribute('aria-pressed', String(o === c)); });
        if (target) {
          var f = c.getAttribute('data-filter');
          all('[data-kind]', target).forEach(function (row) { row.hidden = f !== 'alle' && row.getAttribute('data-kind') !== f; });
        }
      });
    });
  });

  // ---------- rows that choose what the inspector shows (a toggle group) ----------
  all('[data-panes]').forEach(function (rows) {
    var buttons = all('[data-pane]', rows);
    function select(b) {
      buttons.forEach(function (o) {
        var on = o === b;
        o.setAttribute('aria-pressed', String(on));
        var tr = o.closest('tr');
        if (tr) { tr.classList.toggle('is-sel', on); }
        var pane = doc.getElementById(o.getAttribute('data-pane'));
        if (pane) { pane.hidden = !on; }
      });
    }
    buttons.forEach(function (b) {
      b.addEventListener('click', function () { select(b); });
      b.selectPane = function () { select(b); };
    });
  });
  function selectPane(id) {
    var b = one('[data-pane="' + id + '"]');
    if (b && b.selectPane) { b.selectPane(); }
  }

  // ---------- checklist and the sheet "Vor dem Gehen" ----------
  var list = one('[data-checklist]');
  if (list) {
    var checks = all('.check', list).filter(function (c) { var m = one('.mark', c); return m && !m.disabled; });
    var marks = checks.map(function (c) { return one('.mark', c); });
    var countEl = one('[data-check-count]', list);
    var progress = one('[data-progress]', list);
    var finish = one('[data-finish]', list);
    var finishCount = one('[data-finish-count]', list);
    var finishStatus = one('[data-finish-status]', list);
    var i18n = one('[data-i18n]', list);
    var sheet = one('[data-overlay="blatt"]');
    var gapList = one('[data-gaps]', sheet);
    var gapCount = one('[data-gap-count]', sheet);
    var gapFinish = one('[data-gap-finish]', sheet);
    var gapFinishCount = one('[data-gap-finish-count]', sheet);
    var REASONS = ['Kein Zugang', 'Material fehlt', 'Keine Zeit mehr', 'Anderer Grund'];
    var finished = false;
    marks.forEach(function () { progress.appendChild(doc.createElement('span')); });
    var bars = all('span', progress);

    var itemTitle = function (check) {
      var lang = i18n && i18n.classList.contains('is-tr') ? '.tr' : '.de';
      var span = one('.check-body b ' + lang, check);
      return (span || one('.check-body b', check)).textContent.trim();
    };
    var gaps = function () {
      return checks.map(function (c, i) {
        var mark = one('.mark', c);
        var cap = one('[data-cap]', c);
        var missing = [];
        if (mark.getAttribute('aria-pressed') !== 'true') { missing.push('tick'); }
        if (cap && !cap.classList.contains('has')) { missing.push('photo'); }
        return { i: i, check: c, mark: mark, cap: cap, missing: missing, reason: c.getAttribute('data-reason') || '' };
      }).filter(function (g) { return g.missing.length > 0; });
    };
    var plural = function (n, one1, many) { return n === 1 ? '1 ' + one1 : n + ' ' + many; };

    var buildSheet = function (focusKey) {
      var gs = gaps();
      gapList.textContent = '';
      gs.forEach(function (g) {
        var li = make('li', 'gap');
        li.setAttribute('data-gap', String(g.i));
        var head = make('div', 'gap-head');
        var body = make('div');
        body.appendChild(make('b', null, itemTitle(g.check)));
        var what = g.missing.map(function (m) { return m === 'tick' ? 'nicht abgehakt' : 'Foto nachher fehlt'; }).join(', ');
        body.appendChild(make('span', 'np-meta', g.reason ? what + '. Heute nicht erledigt: ' + g.reason : what));
        head.appendChild(body);
        head.appendChild(make('span', 'state unk', 'kein Nachweis'));
        li.appendChild(head);
        var acts = make('div', 'gap-acts');
        if (g.missing.indexOf('tick') !== -1) {
          var tick = make('button', 'btn', 'Abhaken');
          tick.type = 'button';
          tick.setAttribute('data-key', g.i + '-tick');
          tick.addEventListener('click', function () { g.mark.click(); buildSheet(g.i + '-next'); });
          acts.appendChild(tick);
        }
        if (g.missing.indexOf('photo') !== -1) {
          var photo = make('button', 'btn', 'Foto aufnehmen');
          photo.type = 'button';
          photo.setAttribute('data-key', g.i + '-photo');
          photo.addEventListener('click', function () { g.cap.click(); buildSheet(g.i + '-next'); });
          acts.appendChild(photo);
        }
        var no = make('button', 'btn quiet', 'Heute nicht erledigt');
        no.type = 'button';
        no.setAttribute('data-key', g.i + '-no');
        no.setAttribute('aria-expanded', String(g.check.hasAttribute('data-reason-open')));
        acts.appendChild(no);
        li.appendChild(acts);
        var field = make('div', 'field-row');
        field.hidden = !g.check.hasAttribute('data-reason-open');
        var label = make('label', null, 'Grund');
        label.htmlFor = 'gr-' + g.i;
        var sel = make('select', 'input');
        sel.id = 'gr-' + g.i;
        sel.setAttribute('data-key', g.i + '-reason');
        [''].concat(REASONS).forEach(function (r) {
          var o = make('option', null, r || 'Grund wählen');
          o.value = r;
          if (r === g.reason) { o.selected = true; }
          sel.appendChild(o);
        });
        sel.addEventListener('change', function () {
          if (sel.value) { g.check.setAttribute('data-reason', sel.value); } else { g.check.removeAttribute('data-reason'); }
          buildSheet(g.i + '-reason');
        });
        no.addEventListener('click', function () {
          g.check.setAttribute('data-reason-open', '');
          buildSheet(g.i + '-reason');
        });
        field.appendChild(label);
        field.appendChild(sel);
        li.appendChild(field);
        gapList.appendChild(li);
      });
      if (gs.length === 0) {
        var okLi = make('li', 'gap');
        okLi.appendChild(make('p', null, 'Alle Punkte sind abgehakt, die nötigen Fotos sind da.'));
        gapList.appendChild(okLi);
      }
      gapCount.textContent = gs.length === 0 ? 'Nichts offen' : plural(gs.length, 'Punkt ohne Nachweis', 'Punkte ohne Nachweis');
      gapFinishCount.textContent = gs.length === 0 ? 'nichts offen' : gs.length + ' ohne Nachweis';
      if (focusKey) {
        // Keep the keyboard where the person was: the same control, else the next open point, else the finish button.
        var same = one('[data-key="' + focusKey + '"]', sheet);
        var acted = parseInt(focusKey, 10);
        var next = gs.filter(function (g) { return g.i > acted; })[0] || gs[gs.length - 1];
        var fallback = next ? one('[data-gap="' + next.i + '"] button', gapList) : null;
        (same || fallback || gapFinish).focus();
      }
    };

    var update = function () {
      var done = marks.filter(function (m) { return m.getAttribute('aria-pressed') === 'true'; }).length;
      countEl.textContent = done + ' von ' + marks.length;
      bars.forEach(function (b, i) { b.classList.toggle('on', i < done); });
      if (!finished) {
        var n = gaps().length;
        finishCount.textContent = n > 0 ? n + ' offen' : 'nichts offen';
      }
    };
    marks.forEach(function (m) {
      m.addEventListener('click', function () {
        var on = m.getAttribute('aria-pressed') !== 'true';
        m.setAttribute('aria-pressed', String(on));
        var row = m.closest('.check');
        row.classList.toggle('is-done', on);
        update();
      });
    });
    all('[data-cap]', list).forEach(function (c) {
      c.addEventListener('click', function () {
        var on = !c.classList.contains('has');
        c.classList.toggle('has', on);
        one('span', c).textContent = on ? 'Foto 08:21' : 'Foto';
        update();
      });
    });

    var complete = function () {
      var gs = gaps();
      finished = true;
      marks.forEach(function (m) { m.disabled = true; });
      all('[data-cap]', list).forEach(function (c) { c.disabled = true; });
      finish.setAttribute('aria-disabled', 'true');
      finish.textContent = 'Einsatz abgeschlossen';
      var withReason = gs.filter(function (g) { return g.reason; }).length;
      say(finishStatus, gs.length === 0
        ? 'Abgeschlossen um 08:41. Der Bericht wird festgeschrieben, sobald er gesendet ist.'
        : 'Abgeschlossen um 08:41. ' + plural(gs.length, 'Punkt steht', 'Punkte stehen') + ' im Bericht als „kein Nachweis“'
          + (withReason ? ', ' + withReason + ' davon mit Grund' : '') + '. Der Bericht wird festgeschrieben, sobald er gesendet ist.');
    };
    finish.addEventListener('click', function () {
      if (finished) { return; }
      if (gaps().length > 0) { openOverlay(sheet, { focus: true, from: finish }); } else { complete(); }
    });
    gapFinish.addEventListener('click', function () {
      closeOverlay(sheet, { restore: false });
      complete();
      finish.focus();
    });
    sheet.beforeOpen = function () { buildSheet(); };
    update();

    var seen = one('[data-seen]', list);
    if (seen) {
      seen.addEventListener('click', function () {
        var box = one('[data-changed]', list);
        box.classList.add('is-seen');
        one('[data-changed-title]', box).textContent = 'Umfang Version 4, gesehen';
        say(one('[data-seen-note]', box), 'Gesehen um 07:58. Das Büro sieht, dass du die Änderung kennst.');
        seen.hidden = true;
        var h = one('h2', box);
        h.setAttribute('tabindex', '-1');
        h.focus();
      });
    }

    var langButtons = all('[data-lang-set]', list);
    langButtons.forEach(function (b) {
      b.addEventListener('click', function () {
        var tr = b.getAttribute('data-lang-set') === 'tr';
        i18n.classList.toggle('is-tr', tr);
        langButtons.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      });
    });
  }

  // ---------- arrival by tag ----------
  var arrive = one('[data-arrive]');
  if (arrive) {
    var arriveLabel = one('[data-arrive-label]', arrive);
    var arriveMeta = one('[data-arrive-meta]', arrive);
    arrive.addEventListener('click', function () {
      arrive.classList.add('is-done');
      arriveLabel.textContent = 'Angekommen 07:52';
      arriveMeta.textContent = 'Objektmarke geprüft, ohne Standortdaten.';
    });
    var manual = one('[data-arrive-manual]');
    if (manual) {
      manual.addEventListener('click', function () {
        arrive.classList.remove('is-done');
        arriveLabel.textContent = 'Angekommen 07:52, ohne Marke';
        arriveMeta.textContent = 'Als Tipp erfasst, nicht geprüft.';
      });
    }
  }

  // ---------- radio groups: route choice and conflicting versions ----------
  all('[data-route]').forEach(function (group) {
    var opts = all('[role="radio"]', group);
    function pick(o) {
      opts.forEach(function (x) {
        x.setAttribute('aria-checked', String(x === o));
        x.tabIndex = x === o ? 0 : -1;
      });
      o.focus();
      if (group.onPick) { group.onPick(o); }
    }
    opts.forEach(function (o, i) {
      o.addEventListener('click', function () { pick(o); });
      o.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); pick(opts[(i + 1) % opts.length]); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); pick(opts[(i - 1 + opts.length) % opts.length]); }
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pick(o); }
      });
    });
  });

  var versions = one('[data-versions]');
  if (versions) {
    var vGo = one('[data-version-go]');
    var vLabel = one('[data-version-label]');
    var vStatus = one('[data-version-status]');
    var vState = one('[data-cf-state]');
    var vChoice = null;
    var vSettled = false;
    var vResult = {
      'Fassung vom Telefon': 'Ab 09:20 gilt die Fassung vom Telefon. Die Fassung vom Büro bleibt im Verlauf der Objektmappe.',
      'Fassung vom Büro': 'Ab 09:20 gilt die Fassung vom Büro. Die Fassung vom Telefon bleibt im Verlauf der Objektmappe.',
      'Beide Fassungen': 'Ab 09:20 gelten beide Fassungen, die vom Büro zuerst. Nichts ist verloren.'
    };
    versions.onPick = function (o) {
      if (vSettled) { return; }
      vChoice = o.getAttribute('data-version');
      vGo.setAttribute('aria-disabled', 'false');
      vLabel.textContent = vChoice + ' übernehmen';
    };
    vGo.addEventListener('click', function () {
      if (vSettled) { return; }
      if (!vChoice) {
        say(vStatus, 'Wählen Sie zuerst eine Fassung.');
        one('[role="radio"][tabindex="0"]', versions).focus();
        return;
      }
      vSettled = true;
      vGo.setAttribute('aria-disabled', 'true');
      vLabel.textContent = 'Übernommen';
      vState.className = 'state ok';
      one('use', vState).setAttribute('href', '#i-check');
      one('span', vState).textContent = 'geprüft';
      say(vStatus, vResult[vChoice] + ' Das Telefon zeigt ab jetzt nur noch diese.');
    });
  }

  // ---------- bundle approval (Eingang) ----------
  var bundle = one('[data-bundle]');
  if (bundle) {
    var boxes = all('input[data-cents]', bundle);
    var bundleGo = one('[data-bundle-go]', bundle);
    var bundleLabel = one('[data-bundle-label]', bundle);
    var toast = one('[data-toast]', bundle);
    var toastText = one('[data-toast-text]', bundle);
    var undo = one('[data-undo]', bundle);
    var lastApproved = [];
    var toastTimer = null;

    var sum = function () {
      var picked = boxes.filter(function (b) { return b.checked && !b.disabled; });
      var cents = picked.reduce(function (acc, b) { return acc + parseInt(b.getAttribute('data-cents'), 10); }, 0);
      var openLeft = boxes.some(function (b) { return !b.disabled; });
      bundleLabel.textContent = !openLeft ? 'Alle Extras freigegeben'
        : picked.length === 0 ? 'Nichts ausgewählt'
        : picked.length + (picked.length === 1 ? ' Extra' : ' Extras') + ' freigeben, ' + euro(cents);
      bundleGo.disabled = picked.length === 0;
      return { picked: picked, cents: cents };
    };
    var setRow = function (box, approved) {
      var row = box.closest('.inrow');
      var led = one('.led', row);
      led.setAttribute('data-s', approved ? 'sign' : 'wait');
      one('use', led).setAttribute('href', approved ? '#i-pen' : '#i-bell');
      say(one('[data-word]', row), approved ? 'freigegeben von Ihnen, 09:12' : 'wartet auf Ihre Freigabe');
    };
    boxes.forEach(function (b) { b.addEventListener('change', sum); });
    bundleGo.addEventListener('click', function () {
      var r = sum();
      if (r.picked.length === 0) { return; }
      clearTimeout(toastTimer);
      lastApproved = r.picked;
      r.picked.forEach(function (b) { b.disabled = true; setRow(b, true); });
      say(toastText, r.picked.length + (r.picked.length === 1 ? ' Extra' : ' Extras') + ' freigegeben, ' + euro(r.cents) + '. Glanzwerk ist informiert.');
      undo.hidden = false;
      toast.classList.add('is-shown');
      sum();
      undo.focus();
    });
    undo.addEventListener('click', function () {
      lastApproved.forEach(function (b) { b.disabled = false; setRow(b, false); });
      var first = lastApproved[0];
      lastApproved = [];
      say(toastText, 'Freigabe zurückgenommen. Die Extras warten wieder auf Ihre Freigabe.');
      undo.hidden = true;
      sum();
      if (first) { first.focus(); }
      toastTimer = setTimeout(function () { toast.classList.remove('is-shown'); say(toastText, ''); }, 5000);
    });
    sum();
  }

  // ---------- cost share confirmation and freezing ----------
  var confirmShare = one('[data-share-confirm]');
  var freeze = one('[data-freeze]');
  if (confirmShare && freeze) {
    var shareStatus = one('[data-share-status]');
    confirmShare.addEventListener('click', function () {
      var st = one('[data-share-state]');
      st.textContent = 'geprüft, Frau Sommer';
      st.className = 'state ok';
      confirmShare.disabled = true;
      confirmShare.lastChild.textContent = 'Anteil bestätigt';
      freeze.setAttribute('aria-disabled', 'false');
      one('[data-freeze-label]').textContent = 'Festschreiben als Version 1';
      say(shareStatus, 'Anteil 62' + NBSP + '% bestätigt von Frau Sommer, 09:16. Die Zeile ist geprüft; Festschreiben ist jetzt möglich.');
      freeze.focus();
    });
    freeze.addEventListener('click', function () {
      if (freeze.getAttribute('aria-disabled') === 'true') {
        if (!confirmShare.disabled) { confirmShare.focus(); }
        return;
      }
      one('[data-freeze-label]').textContent = 'Festgeschrieben, Version 1';
      freeze.setAttribute('aria-disabled', 'true');
      say(shareStatus, 'Festgeschrieben als Version 1 um 09:17. Eine Korrektur wird Version 2; Version 1 bleibt lesbar.');
    });
  }

  // ---------- recipient approval ----------
  var approve = one('[data-approve-go]');
  if (approve) {
    approve.addEventListener('click', function () {
      var done = one('[data-approve-done]');
      done.textContent = '';
      done.className = 'signed';
      done.appendChild(make('b', null, 'Freigegeben von Frau Sommer'));
      done.appendChild(make('span', null, 'Mo 18.01.2027, 09:12, über diesen Link, Nachweisklasse B'));
      done.appendChild(make('span', null, 'Glanzwerk erhält die Freigabe sofort. Den Nachweis finden Sie in der Objektakte.'));
      one('[data-approve-actions]').hidden = true;
      done.setAttribute('tabindex', '-1');
      done.focus();
    });
  }

  // ---------- tenant report ----------
  var report = one('[data-report]');
  if (report) {
    report.addEventListener('submit', function (e) {
      e.preventDefault();
      say(one('[data-report-done]', report), 'Danke. Ihr Hinweis ist bei der Hausverwaltung. Bei Gefahr rufen Sie bitte den Notdienst an.');
    });
  }

  // ---------- loading: the text says how long it takes once the bar has stopped ----------
  var loadTimer = null;
  onShow.laden = function () {
    var st = one('[data-load-status]');
    say(st, 'Lädt seit 10:05 über mobiles Netz.');
    clearTimeout(loadTimer);
    loadTimer = setTimeout(function () {
      if (current && current.getAttribute('data-screen') === 'laden') {
        say(st, 'Dauert länger als üblich: seit 10:05, das Netz ist schwach. Du kannst warten oder zurückgehen; was du erfasst, bleibt auf dem Telefon.');
      }
    }, 6000);
  };

  // ---------- error: send again, keep the work ----------
  var retry = one('[data-retry]');
  if (retry) {
    var retryBox = one('[data-retry-box]');
    var retryStatus = one('[data-retry-status]');
    retry.addEventListener('click', function () {
      if (retry.getAttribute('aria-disabled') === 'true') { return; }
      retry.setAttribute('aria-disabled', 'true');
      say(retryStatus, 'Wird gesendet …');
      setTimeout(function () {
        retryBox.classList.add('is-done');
        one('use', retryBox).setAttribute('href', '#i-cloud');
        say(one('[data-retry-title]', retryBox), 'Bericht gesendet');
        say(one('[data-retry-text]', retryBox), 'Gesendet um 08:44. Der Bericht ist festgeschrieben, Prüfcode JF-7Q4M-2K. Die Verwaltung sieht ihn jetzt.');
        say(one('[data-retry-next]', retryBox), 'Fotos und Häkchen bleiben bis zum Feierabend auch auf dem Telefon.');
        say(one('[data-retry-label]'), 'Gesendet');
        say(retryStatus, 'Gesendet um 08:44, festgeschrieben.');
      }, 1200);
    });
  }

  // ---------- office Objektakte ----------
  var planGo = one('[data-plan-go]');
  if (planGo) {
    planGo.addEventListener('click', function () {
      selectPane('ob-licht');
      if (planGo.getAttribute('aria-disabled') === 'true') { return; }
      planGo.setAttribute('aria-disabled', 'true');
      say(one('[data-plan-label]'), 'Eingeplant, heute 13:00');
      say(one('[data-plan-count]'), 'noch überfällig');
      say(one('[data-plan-meta]'), ', eingeplant heute 13:00');
      say(one('[data-plan-when]'), 'heute 13:00, Olga S.');
      say(one('[data-plan-status]'), 'Eingeplant für heute 13:00 bei Olga S. Die Verwaltung sieht den Termin. Das Licht bleibt rot, bis der Einsatz belegt ist.');
    });
  }
  var grundGo = one('[data-grund-go]');
  if (grundGo) {
    grundGo.addEventListener('click', function () {
      if (grundGo.getAttribute('aria-disabled') === 'true') { return; }
      grundGo.setAttribute('aria-disabled', 'true');
      var led = one('[data-grund-led]');
      led.setAttribute('data-s', 'none');
      one('use', led).setAttribute('href', '#i-dash');
      say(one('[data-grund-meta]'), 'im Vertrag einmal im Jahr, geplant für Sa 13.03.2027');
      var st = one('[data-grund-state]');
      st.className = 'state';
      st.textContent = 'geplant';
      say(one('[data-grund-status]'), 'Termin Sa 13.03.2027, 08:00, eingeplant. Das Licht wechselt von unbekannt zu geplant; belegt wird es erst mit dem Bericht.');
    });
  }

  var remind = one('[data-overlay="vorschau"]');
  if (remind) {
    remind.beforeOpen = function () { selectPane(remind.getAttribute('data-pane-select')); };
    one('[data-remind-send]', remind).addEventListener('click', function () {
      closeOverlay(remind, { restore: false });
      var trigger = one('[data-open="vorschau"]');
      trigger.setAttribute('aria-disabled', 'true');
      say(one('[data-remind-label]'), 'Erinnerung gesendet');
      say(one('[data-remind-meta]'), ', erinnert heute 09:14');
      say(one('[data-remind-status]'), 'Erinnerung an Frau Sommer gesendet, Mo 18.01. 09:14. Die nächste ist frühestens am Sa 23.01. möglich.');
      trigger.focus();
    });
  }

  var exportGo = one('[data-export-go]');
  if (exportGo) {
    exportGo.addEventListener('click', function () {
      if (exportGo.getAttribute('aria-disabled') === 'true') { return; }
      exportGo.setAttribute('aria-disabled', 'true');
      one('[data-export-seal]').hidden = false;
      say(one('[data-export-label]'), 'Nachweis exportiert');
      say(one('[data-export-status]'), 'Versiegelt Mo 18.01.2027, 09:20, Prüfcode JF-W7R2-5T. Jeder kann mit dem Prüfcode prüfen, dass das PDF unverändert ist.');
    });
  }
  var extractGo = one('[data-extract-go]');
  if (extractGo) {
    extractGo.addEventListener('click', function () {
      say(one('[data-extract-status]'), 'Auszug mit 186 Einträgen erstellt, 09:21: ein PDF mit der Quelle jedes Eintrags.');
    });
  }

  // ---------- command bar: navigates and previews, never sends ----------
  var cmd = one('[data-overlay="befehle"]');
  var openCommandBar = function () {};
  if (cmd) {
    var cmdInput = one('[data-cmd-input]', cmd);
    var cmdOpts = all('[role="option"]', cmd);
    var cmdGroups = all('[role="group"]', cmd);
    var cmdNone = one('[data-cmd-none]', cmd);
    var pvTitle = one('[data-pv="title"]', cmd);
    var pvText = one('[data-pv="text"]', cmd);
    var pvNote = one('[data-pv="note"]', cmd);
    var cmdCtx = 'dl';
    var active = null;

    var visibleOpts = function () { return cmdOpts.filter(function (o) { return !o.hidden; }); };
    var setActive = function (o) {
      active = o || null;
      cmdOpts.forEach(function (x) { x.setAttribute('aria-selected', String(x === active)); });
      if (active) {
        cmdInput.setAttribute('aria-activedescendant', active.id);
        active.scrollIntoView({ block: 'nearest' });
      } else {
        cmdInput.removeAttribute('aria-activedescendant');
      }
      pvTitle.textContent = active ? active.getAttribute('data-pv-title') : '';
      pvText.textContent = active ? active.getAttribute('data-pv-text') : '';
      pvNote.textContent = active ? active.getAttribute('data-pv-note') : '';
    };
    var filter = function () {
      var q = cmdInput.value.trim().toLowerCase();
      cmdOpts.forEach(function (o) {
        var hay = (o.textContent + ' ' + (o.getAttribute('data-k') || '')).toLowerCase();
        o.hidden = o.getAttribute('data-ctx') !== cmdCtx || (q !== '' && hay.indexOf(q) === -1);
      });
      cmdGroups.forEach(function (g) {
        g.hidden = !all('[role="option"]', g).some(function (o) { return !o.hidden; });
      });
      var v = visibleOpts();
      cmdNone.hidden = v.length > 0;
      setActive(v[0]);
    };
    var go = function (o) {
      var target = o.getAttribute('data-go');
      closeOverlay(cmd, { restore: false });
      focusNext = true;
      if (location.hash === '#' + target) { show(); } else { location.hash = '#' + target; }
    };
    cmdInput.addEventListener('input', filter);
    cmdInput.addEventListener('keydown', function (e) {
      var v = visibleOpts();
      var i = v.indexOf(active);
      if (e.key === 'ArrowDown' && v.length) { e.preventDefault(); setActive(v[(i + 1) % v.length]); }
      else if (e.key === 'ArrowUp' && v.length) { e.preventDefault(); setActive(v[(i - 1 + v.length) % v.length]); }
      else if (e.key === 'Enter') { e.preventDefault(); if (active) { go(active); } }
    });
    cmdOpts.forEach(function (o) {
      o.addEventListener('click', function () { go(o); });
      o.addEventListener('mousemove', function () { if (active !== o) { setActive(o); } });
    });
    openCommandBar = function (ctx, query, from) {
      if (openOv === cmd) { cmdInput.focus(); return; }
      cmdCtx = ctx;
      cmdInput.value = query || '';
      filter();
      openOverlay(cmd, { focus: true, from: from, focusEl: cmdInput });
    };
    cmd.beforeOpen = function (opts) {
      if (opts.alias) { cmdCtx = 'dl'; cmdInput.value = 'Linden'; filter(); }
    };
    all('[data-cmd-open]').forEach(function (b) {
      b.addEventListener('click', function () { openCommandBar(screenOf(b).getAttribute('data-ctx') || 'dl', '', b); });
    });
    var search = one('[data-cmd-search]');
    if (search) {
      search.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); openCommandBar('hv', search.value, search); }
      });
    }
  }

  // ---------- keyboard: Escape closes, Tab stays inside an open overlay, Strg K opens the command bar ----------
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openOv) { e.preventDefault(); closeOverlay(openOv); return; }
    if (e.key === 'Tab' && openOv && openOv.contains(doc.activeElement)) {
      var f = focusablesIn(openOv);
      if (f.length) {
        var first = f[0];
        var last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      return;
    }
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey) && !e.altKey) {
      var ctx = current && current.getAttribute('data-ctx');
      if (ctx && cmd) { e.preventDefault(); openCommandBar(ctx, '', doc.activeElement); }
    }
  });

  window.addEventListener('hashchange', show);
  show();
  // The landing page changes the screen of the embedded prototype without adding a history entry.
  window.foldGo = function (name) {
    if (known.indexOf(name) === -1) { return; }
    history.replaceState(null, '', '#' + name);
    show();
  };
}());
