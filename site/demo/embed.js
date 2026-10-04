/* Embed mode for the landing page (loaded with ?embed=1). Hides the prototype bar, opens the screen named by
   ?screen= and changes screens without fragment navigation: a fragment that matches an element id scrolls the
   landing page around the demo, so screens change through history.replaceState and a hashchange event instead.
   Follows the landing page's theme (its explicit choice if it has one, else the system setting).
   Outside embed mode foldGo() sets the URL fragment as before. */
window.foldGo = function (screen) { location.hash = screen; };
if (/[?&]embed\b/.test(location.search)) {
  (function () {
    var root = document.documentElement;
    root.classList.add("is-embed");

    var start = /[?&]screen=([\w-]+)/.exec(location.search);
    if (start && !location.hash) history.replaceState(history.state, "", "#" + start[1]);
    /* When parsing ends the browser scrolls to the fragment of the current URL, and that scroll reaches the
       landing page. The prototype has routed by then (its script is deferred), so hide the fragment for that
       moment and put it back right after. A window listener runs after all document listeners. */
    window.addEventListener("DOMContentLoaded", function () {
      var hash = location.hash;
      if (!hash) return;
      history.replaceState(history.state, "", location.pathname + location.search);
      window.setTimeout(function () { if (!location.hash) history.replaceState(history.state, "", hash); }, 0);
    });
    window.foldGo = function (screen) {
      var next = "#" + String(screen).replace(/^#/, "");
      if (location.hash === next) return;
      var old = location.href;
      history.replaceState(history.state, "", next);
      window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL: old, newURL: location.href }));
    };
    /* Links to other screens take the same path; runs after the prototype's own handlers. */
    window.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var href = a.getAttribute("href");
      if (href.length < 2) return;
      e.preventDefault();
      window.foldGo(href.slice(1));
    });
    /* Programmatic focus and scrollIntoView stay inside the demo; natively they also scroll the landing page to
       bring the element into view. Browsers without the scrollIntoView container option keep native scrolling,
       and focus then only skips the scroll. */
    var nearest = false;
    try { document.createElement("div").scrollIntoView({ get container() { nearest = true; return "nearest"; } }); } catch (err) { nearest = false; }
    var nativeFocus = HTMLElement.prototype.focus;
    var nativeIntoView = Element.prototype.scrollIntoView;
    if (nearest) {
      Element.prototype.scrollIntoView = function (arg) {
        var opts = arg && typeof arg === "object" ? arg : { block: arg === false ? "end" : "start" };
        return nativeIntoView.call(this, Object.assign({}, opts, { container: "nearest" }));
      };
    }
    HTMLElement.prototype.focus = function (opts) {
      nativeFocus.call(this, Object.assign({}, opts, { preventScroll: true }));
      if (nearest && !(opts && opts.preventScroll)) this.scrollIntoView({ block: "nearest", inline: "nearest" });
    };
    var fromTop = function () { window.setTimeout(function () { window.scrollTo(0, 0); }, 0); };
    window.addEventListener("load", fromTop);
    window.addEventListener("hashchange", fromTop);

    var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    var host = null;
    try { if (window.parent !== window) host = window.parent.document.documentElement; } catch (err) { host = null; }
    var sync = function () {
      var chosen = host ? host.getAttribute("data-theme") : null;
      if (chosen !== "dark" && chosen !== "light") chosen = media && media.matches ? "dark" : "light";
      root.setAttribute("data-theme", chosen);
    };
    sync();
    document.addEventListener("DOMContentLoaded", sync);
    window.addEventListener("load", sync);
    if (media && media.addEventListener) media.addEventListener("change", sync);
    if (host && window.MutationObserver) new MutationObserver(sync).observe(host, { attributes: true, attributeFilter: ["data-theme"] });
  })();
}
