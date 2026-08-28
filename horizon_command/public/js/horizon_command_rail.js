/* ============================================================================
   HORIZON COMMAND — sidebar rail open/close toggle
   The ONLY JavaScript in this theme. Every other file in this app is
   deliberately CSS-only (see the note in hooks.py and the top of
   horizon_desk.css) because v16's Desk shell is still settling upstream and
   code that reads Frappe's *internal* data (the workspace list, boot info,
   route state) can silently break on the next point release.

   This file is a different, much safer category of JavaScript: it never
   reads anything Frappe-specific. It only —
     (a) toggles one class on <html>, and
     (b) listens for plain click/DOM events with the standard DOM API.
   The one thing it DOES touch — finding the sidebar to attach the toggle
   button to — uses the same broad selector family already used throughout
   horizon_desk.css, so it carries exactly the risk that selector already
   carries, no more.

   Behaviour:
     - starts OPEN by default (full width, module names visible) — this is
       the CSS default with no class needed, so it's correct on first paint
       before this script has even run; see the "STATE MODEL" note at the
       top of the rail section in horizon_desk.css. If Horizon Theme
       Settings has "sidebar_default_state" set to collapsed instead, the
       live settings endpoint sets a CSS custom property
       (--h-rail-default-collapsed: 1) that this script reads on load and
       collapses immediately for — still not reading anything
       Frappe-internal, just our own variable, set by our own endpoint.
     - clicking a link inside it navigates AND collapses it back to the
       68px icon rail
     - clicking anywhere outside it collapses it back the same way
     - the toggle button re-expands it by hand at any time, and also
       collapses it manually if you click it while already open
   ========================================================================== */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function bindRail() {
    var sidebar = document.querySelector(
      // v16.31: السايدبار بقى .body-sidebar-container — مقيس على DOM البنش الفعلي
      ".body-sidebar-container, .workspace-sidebar, [class*='sidebar'][class*='workspace']"
    );
    if (!sidebar) return false; // no sidebar on this page (e.g. the login screen) — nothing to do
    if (sidebar.dataset.horizonRailBound) return true; // v16's shell can re-render this container on
    sidebar.dataset.horizonRailBound = "1";        // navigation; don't attach a second toggle if it does

    var COLLAPSED_CLASS = "h-sidebar-collapsed";
    var root = document.documentElement;

    function isCollapsed() { return root.classList.contains(COLLAPSED_CLASS); }
    function collapse() { root.classList.add(COLLAPSED_CLASS); }
    function expand() { root.classList.remove(COLLAPSED_CLASS); }
    function toggle() { root.classList.toggle(COLLAPSED_CLASS); }

    // honour the "start collapsed" preference from Horizon Theme Settings,
    // if set — read once, on load, from our own CSS custom property.
    // Note: if the settings stylesheet hasn't finished loading yet when this
    // runs, the property reads as empty and we just fall through to the
    // CSS's own hardcoded default (open) — a harmless, rare cosmetic
    // inconsistency, not worth blocking script execution on the stylesheet
    // to fully eliminate.
    try {
      var pref = getComputedStyle(root).getPropertyValue("--h-rail-default-collapsed").trim();
      if (pref === "1") collapse();
    } catch (e) { /* getComputedStyle is universally supported, but never let a
                      preference read break the rest of this script if it did */ }

    // the toggle button — one real element, injected once, anchored to the
    // rail's outer edge via CSS (see horizon_desk.css for its position).
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "h-rail-toggle";
    btn.setAttribute("aria-label", "فتح/قفل القائمة الجانبية");
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" ' +
      'stroke="currentColor" stroke-width="2.6"><path d="M9 6l6 6-6 6"/></svg>';
    btn.addEventListener("click", function (e) {
      e.stopPropagation(); // otherwise the document-level listener below would
      toggle();            // immediately see this same click as "outside" and re-collapse it
    });
    sidebar.appendChild(btn);

    // navigating away (clicking any link inside the rail) collapses it —
    // delegated, so it works for links Frappe adds after this script runs
    sidebar.addEventListener("click", function (e) {
      if (e.target.closest("a")) collapse();
    });

    // clicking anywhere outside the rail collapses it — "لو خرجت يقفل أوتوماتيك"
    document.addEventListener("click", function (e) {
      if (!isCollapsed() && !sidebar.contains(e.target)) collapse();
    });

    // Escape collapses it too — small accessibility courtesy, not in the
    // brief but costs nothing and matches how every other drawer/menu in
    // Desk behaves
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !isCollapsed()) collapse();
    });
    return true;
  }

  ready(function () {
    // v16.31 يرندر السايدبار بعد DOMContentLoaded (مقيس فعليًا على البنش:
    // querySelector كان بيرجع null وقت التشغيل والعنصر بيظهر بعدها) —
    // فالربط بمحاولات كل ٣٠٠م.ث. لحد ٣٠ ثانية بدل محاولة واحدة بتفوته
    if (bindRail()) return;
    var tries = 0;
    var t = setInterval(function () {
      if (bindRail() || ++tries > 100) clearInterval(t);
    }, 300);
  });
})();
