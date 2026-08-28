/* ============================================================================
   HORIZON COMMAND — top tab bar
   ============================================================================
   REPLACES horizon_command_rail.js, which drove the old icon-rail sidebar.
   That file is deleted, not disabled — the sidebar approach was dropped
   after a prototype review, so leaving dead code that still binds click
   handlers would be worse than removing it.

   بلاغ حقيقي (٢٩ أغسطس): النسخة الأولى من هذا الملف كانت بتلقط عناصر
   <a> من القائمة الجانبية المعروضة فعليًا (DOM) — وده غلط جوهري لأن
   القائمة الجانبية شجرة هرمية: لما تكون داخل Workspace معيّن (مثلًا
   Stock) بتتوسّع كل الروابط الفرعية بتاعته (تقارير، إعدادات، دوكتايبات)
   جوّه نفس الحاوية، فالشريط كان بيطلع بـ٥٠ تاب بدل أسماء الـWorkspaces
   الرئيسية بس. القياس الحي أثبت الفرق: `.body-sidebar-container a`
   في صفحة /app/stock رجّعت ٥٠ رابط، بينما `frappe.boot.allowed_workspaces`
   المفلترة لـ`parent_page === ""` رجّعت ١٨ بس — وهي بالظبط قائمة
   الـWorkspaces الرئيسية اللي فرابي نفسه بيستخدمها لبناء شريطه.

   المصدر الصحيح إذن هو بيانات فرابي (`frappe.boot.allowed_workspaces`)
   لا شكل DOM اللحظي — البيانات موجودة من أول تحميل الصفحة (محقونة في
   الـHTML)، فمفيش داعي ننتظر رسم القائمة الجانبية أصلًا.
   ========================================================================== */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function topLevelWorkspaces() {
    var all = (window.frappe && frappe.boot && frappe.boot.allowed_workspaces) || [];
    return all.filter(function (w) { return !w.parent_page && !w.is_hidden; });
  }

  function isActive(w) {
    var route = (window.frappe && frappe.get_route && frappe.get_route()) || [];
    return route[0] === "Workspaces" && route[1] === w.name;
  }

  function updateActive(bar) {
    var tabs = bar.querySelectorAll(".h-tab");
    for (var i = 0; i < tabs.length; i++) {
      var match = tabs[i].dataset.wsName ===
        ((window.frappe && frappe.get_route && frappe.get_route()[1]) || "");
      tabs[i].classList.toggle("active", match);
    }
  }

  function buildTabs() {
    if (document.querySelector(".h-tab-bar")) return true;  // already built

    var workspaces = topLevelWorkspaces();
    if (!workspaces.length) return false;  // frappe.boot not ready yet → leave Frappe alone

    var bar = document.createElement("nav");
    bar.className = "h-tab-bar";

    var brand = document.createElement("div");
    brand.className = "h-brand";
    brand.innerHTML =
      '<span class="mark"><img src="/assets/horizon_tab_theme/images/horizon-mark.png" alt="Horizon"></span><span>Horizon</span>';
    bar.appendChild(brand);

    workspaces.forEach(function (w) {
      var a = document.createElement("a");
      a.className = "h-tab";
      a.href = "/app/" + frappe.router.slug(w.name);
      a.dataset.wsName = w.name;
      if (isActive(w)) a.classList.add("active");

      var iconHtml = "";
      try { iconHtml = frappe.utils.icon(w.icon || "folder-normal", "sm"); } catch (e) { /* لا أيقونة أهون من كسر الشريط */ }
      a.innerHTML = iconHtml + "<span>" + frappe.utils.escape_html(w.label || w.title || w.name) + "</span>";
      var icon = a.querySelector("svg");
      if (icon) icon.classList.add("h-tab-ic");

      a.addEventListener("click", function (e) {
        e.preventDefault();
        frappe.set_route(frappe.router.slug(w.name));
      });

      bar.appendChild(a);
    });

    document.body.insertBefore(bar, document.body.firstChild);
    document.documentElement.classList.add("h-tabs-ready");  // gates the CSS that hides the sidebar

    if (window.frappe && frappe.router && frappe.router.on) {
      frappe.router.on("change", function () { updateActive(bar); });
    }
    return true;
  }

  ready(function () {
    if (buildTabs()) return;

    // frappe.boot عادة جاهز من أول تحميل، لكن نحتفظ بمحاولات قليلة
    // احتياطًا لأي تسلسل تحميل غير متوقّع — بلا مراقب يفضل شغّال للأبد
    var tries = 0;
    var timer = setInterval(function () {
      if (buildTabs() || ++tries > 20) clearInterval(timer);
    }, 250);
  });
})();
