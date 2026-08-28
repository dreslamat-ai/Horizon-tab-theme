/* ============================================================================
   HORIZON COMMAND — top tab bar
   ============================================================================
   REPLACES horizon_command_rail.js, which drove the old icon-rail sidebar.
   That file is deleted, not disabled — the sidebar approach was dropped
   after a prototype review, so leaving dead code that still binds click
   handlers would be worse than removing it.

   WHAT THIS DOES, and why it's the same low-risk category as the file it
   replaces: it does NOT read frappe.boot, the workspace list, route state,
   or any other Frappe-internal data structure. It finds the container
   Frappe already rendered its workspace links into, MOVES those existing
   <a> elements into a tab bar, and marks one active. Everything it touches
   is either a plain DOM node or a class name — no data shapes that v16 is
   still changing underneath us.

   FAILURE MODE IS DELIBERATE: if the sidebar container isn't found (Frappe
   renamed it, or this page has no sidebar at all), the function returns
   early and does nothing. Frappe's own sidebar then stays visible and
   functional — because the CSS that hides it is scoped to run only once
   this script has added the `h-tabs-ready` class to <html>. A missing
   selector therefore degrades to "stock Frappe navigation", never to "no
   navigation at all". That ordering is the single most important thing in
   this file; don't remove the class gate.
   ========================================================================== */
(function () {
  "use strict";

  // v16.31 on this bench: the real sidebar is `.body-sidebar-container`,
  // not `.workspace-sidebar` — measured on live DOM in a prior session
  // (see horizon_command_rail.js, the file this replaces). Kept first so
  // it matches before the generic fallbacks; without it, buildTabs()
  // would return false forever on this exact bench and the safe-fail
  // path would silently keep stock Frappe nav instead of building tabs.
  var SIDEBAR_SELECTOR = ".body-sidebar-container, .workspace-sidebar, [class*='sidebar'][class*='workspace']";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function buildTabs() {
    var sidebar = document.querySelector(SIDEBAR_SELECTOR);
    if (!sidebar) return false;                       // no sidebar → leave Frappe alone
    if (document.querySelector(".h-tab-bar")) return true;  // already built

    // only direct navigation links — skip section headings and anything
    // without an href, which would produce dead tabs
    var links = Array.prototype.slice
      .call(sidebar.querySelectorAll("a"))
      .filter(function (a) { return a.getAttribute("href"); });
    if (!links.length) return false;                  // nothing to move → also leave Frappe alone

    var bar = document.createElement("nav");
    bar.className = "h-tab-bar";

    var brand = document.createElement("div");
    brand.className = "h-brand";
    brand.innerHTML =
      '<span class="mark"><img src="/assets/horizon_tab_theme/images/horizon-mark.png" alt="Horizon"></span><span>Horizon</span>';
    bar.appendChild(brand);

    var here = window.location.pathname;
    links.forEach(function (a) {
      a.classList.add("h-tab");
      // Frappe puts the workspace icon in an <svg>/<img> inside the link;
      // tag whatever it is so the CSS can size it consistently
      var icon = a.querySelector("svg, img, .icon");
      if (icon) icon.classList.add("h-tab-ic");
      if (a.getAttribute("href") === here || a.classList.contains("selected")) {
        a.classList.add("active");
      }
      bar.appendChild(a);                             // MOVE (appendChild relocates)
    });

    // no tab matched the current URL — mark the first so the bar never
    // renders with nothing active
    if (!bar.querySelector(".h-tab.active")) {
      var first = bar.querySelector(".h-tab");
      if (first) first.classList.add("active");
    }

    document.body.insertBefore(bar, document.body.firstChild);
    document.documentElement.classList.add("h-tabs-ready");  // gates the CSS that hides the sidebar
    return true;
  }

  ready(function () {
    if (buildTabs()) return;

    // v16 can render the Desk shell after DOMContentLoaded. Retry briefly,
    // then stop — an observer left running forever on a SPA is a slow leak,
    // and if the sidebar hasn't appeared within a few seconds it isn't
    // going to.
    var tries = 0;
    var timer = setInterval(function () {
      if (buildTabs() || ++tries > 20) clearInterval(timer);
    }, 250);
  });
})();
