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

  /* بلاغ المالك (لقطة شاشة، ٢٩ أغسطس): فتح "الصنف" (List View داخل
     Workspace المخازن) وما كانش تاب "المخازن" بيتحدد نشط ولا الشريط
     بيتحرّك ليوريه — القياس القديم كان بيقارن route[0]==="Workspaces"
     بس، فأي مسار تاني (List/Form/Report) ما كانش بيتطابق مع أي تاب
     إطلاقًا مهما كان منطقيًّا تابع لأنهي Workspace.

     الحل: فرابي نفسه بيحل نفس المسألة لفتة الخبز (breadcrumbs.js
     set_workspace_breadcrumb) وبيرسم رابط .worksapce-breadcrumb بمسار
     الـWorkspace الصحيح — بما إن روابطنا كلها /desk/<slug> أصلاً (نفس
     تعديل الرابط السابق)، المطابقة تبقى بالـhref مباشرة بلا ما نعيد
     بناء جدول doctype→workspace من عندنا. */
  function currentWorkspaceHref() {
    var route = (window.frappe && frappe.get_route && frappe.get_route()) || [];
    if (route[0] === "Workspaces" && route[1]) {
      return "/desk/" + frappe.router.slug(route[1]);
    }
    var crumb = document.querySelector(".navbar-breadcrumbs a.worksapce-breadcrumb");
    return crumb ? crumb.getAttribute("href") : null;
  }

  /* والتاب النشط لازم يبقى مرئي فعليًا لا نشطًا بالاسم بس — لو كان خارج
     نطاق الشريط المرئي (شريط طويل بيسكرول أفقيًّا) المستخدم ميعرفش
     أصلاً إنه محدد. scrollIntoView بـ"nearest" بيحرّكه لحافة الشريط
     المرئي بالظبط لو كان مقصوص، وما يعملش حاجة لو أصلاً ظاهر. */
  function updateActive(bar) {
    var href = currentWorkspaceHref();
    var matched = null;
    var tabs = bar.querySelectorAll(".h-tab");
    for (var i = 0; i < tabs.length; i++) {
      var isMatch = !!href && tabs[i].getAttribute("href") === href;
      tabs[i].classList.toggle("active", isMatch);
      if (isMatch) matched = tabs[i];
    }
    if (matched) {
      matched.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
    }
  }

  /* بلاغ المالك (٢٩ أغسطس، لقطة حقيقية): على صفحة Workspace نفسها شريط
     فرابي القياسي (بحث + اسم الـWorkspace بقائمة منسدلة + زرار فتح
     السايدبار) بيظهر مباشرة تحت شريط التابات — وهو تكرار تام لنفس
     المعلومة اللي شريط التابات بيعرضها أصلاً (اسم الـWorkspace الحالي +
     التنقّل بينه وبين الباقي). طلب المالك: يتخفي وأزراره (تحديدًا
     البحث، الوحيد اللي بينفّذ فعل حقيقي هنا) تتنقل لشريط التابات.

     مقصور على مسار Workspaces تحديدًا: صفحات القوائم والنماذج فيها نفس
     الشريط لكن بأزرار حقيقية («جديد»، الفلاتر) — مُتحقَّق فعليًا إن
     .page-actions فاضي من أي زرار مرئي على صفحة Workspace بس (كل
     الأزرار فيها class="hide"، بتظهر بس في وضع تحرير لوحة الإدمن).

     النقل فعليّ (moveNode) لا استنساخ — الحدث اللي بيفتح مربع البحث
     مربوط بـfrappe.search.AwesomeBar().setup(selector) وقت إنشاء
     العنصر، وربط jQuery بيفضل شغّال على العقدة نفسها بعد نقلها في
     الـDOM (بيتقطع بس لو العقدة اتشالت وأُعيد إنشاؤها). وبما إن فرابي
     بيعيد بناء .page-head مع كل تنقّل Workspace، النقل بيتكرر مع كل
     تغيير مسار عبر frappe.router.on('change'). */
  function relocateWorkspaceSearch() {
    var route = (window.frappe && frappe.get_route && frappe.get_route()) || [];
    var isWorkspace = route[0] === "Workspaces";
    document.body.classList.toggle("h-ws-page", isWorkspace);
    if (!isWorkspace) return;

    var search = document.querySelector(".page-head .navbar-modal-search-mobile");
    if (!search) return;

    var bar = document.querySelector(".h-tab-bar");
    if (!bar) return;
    var slot = bar.querySelector(".h-search-slot");
    if (!slot) {
      slot = document.createElement("div");
      slot.className = "h-search-slot";
      var brand = bar.querySelector(".h-brand");
      if (brand && brand.nextSibling) bar.insertBefore(slot, brand.nextSibling);
      else bar.appendChild(slot);
    }
    if (search.parentElement !== slot) slot.appendChild(search);
  }

  function buildTabs() {
    if (document.querySelector(".h-tab-bar")) return true;  // already built

    var workspaces = topLevelWorkspaces();
    if (!workspaces.length) return false;  // frappe.boot not ready yet → leave Frappe alone

    var bar = document.createElement("nav");
    bar.className = "h-tab-bar";

    // بلاغ المالك (٣٠ أغسطس): "عاوز اضغط عالشعار يفتح الرئيسية" — كان
    // <div> بلا أي حدث. ولاحظ كمان إن أيقونة البيت الأصلية بتاعة فرابي
    // في فتات الخبز (`.navbar-breadcrumbs a[href="/desk"]`) بترجع
    // بلا أي تنقّل فعلي — مقاس حيًّا: الضغط عليها فضل في نفس المسار.
    // الحل هنا: الشعار وأي أيقونة بيت تانية في الصفحة يتوحّدوا على نفس
    // السلوك الموثوق (frappe.set_route لتاب "Home") بدل الاعتماد على
    // معالج فرابي الأصلي غير المضمون هنا.
    var homeWs = workspaces.filter(function (w) { return w.name === "Home"; })[0] || workspaces[0];
    var homeSlug = frappe.router.slug(homeWs.name);

    function goHome(e) {
      if (e) {
        e.preventDefault();
        // بلاغ لقطة حقيقي (٣٠ أغسطس): معالج فرابي الأصلي على نفس رابط
        // فتات الخبز بيتنفّذ برضه ويكسب السباق (بيرجّع المسار لـ/desk
        // الخام بعد نداء set_route هنا مباشرة) — الاتنين capture على
        // document فمين يفوز يعتمد على ترتيب تسجيل مش مضمون بين تطبيقين.
        // stopImmediatePropagation بيقفل الطريق نهائيًا قدام أي معالج
        // تاني (التقاط أو فقاعة) على نفس الحدث، فمفيش سباق أصلًا.
        e.stopImmediatePropagation();
      }
      frappe.set_route(homeSlug);
    }

    var brand = document.createElement("a");
    brand.className = "h-brand";
    brand.href = "/desk/" + homeSlug;
    brand.innerHTML =
      '<span class="mark"><img src="/assets/horizon_tab_theme/images/horizon-mark.png" alt="Horizon"></span><span>Horizon</span>';
    brand.addEventListener("click", goHome);
    bar.appendChild(brand);

    // أي أيقونة بيت تانية في الصفحة (فتات الخبز الأصلية بتاعة فرابي
    // تحديدًا) تتوحّد على نفس السلوك — بلا الاعتماد على معالجها
    // الأصلي غير الموثوق هنا (مقاس حيًّا: الضغط عليها كان بيرجع بلا أي
    // تنقّل). مربوط على مرحلة الالتقاط (capture=true) لا الفقاعة —
    // معالج فرابي الأصلي على نفس الرابط بيستدعي stopPropagation على ما
    // يبدو، فمستمع على document بالفقاعة العادية ما كانش بيوصله الحدث
    // أصلًا. الالتقاط بيسبق أي stopPropagation في مرحلة الفقاعة.
    document.addEventListener("click", function (e) {
      var link = e.target.closest && e.target.closest(".navbar-breadcrumbs a[href=\"/desk\"]");
      if (link) goHome(e);
    }, true);

    workspaces.forEach(function (w) {
      var a = document.createElement("a");
      a.className = "h-tab";
      // بلاغ المالك (لقطة شاشة، ٢٩ أغسطس): تمرير الماوس فوق تاب بيوَرّي
      // /app/<slug> بينما عنوان الصفحة الفعلي بعد التحميل /desk/<slug> —
      // فرابي نفسه بيولّد روابطه (زي فتات الخبز worksapce-breadcrumb)
      // بـ/desk/ مباشرة؛ /app/ نسخة قديمة لسه شغالة بس بتحوّل (301) لـ
      // /desk/ في كل مرة. الربط هنا بقى /desk/ يطابق الأصل، بلا قفزة تحويل.
      a.href = "/desk/" + frappe.router.slug(w.name);
      a.dataset.wsName = w.name;

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
      frappe.router.on("change", function () {
        updateActive(bar);
        // فرابي بيعيد بناء .page-head (وبالتالي عنصر البحث) مع كل
        // تنقّل — بلا setTimeout الترحيل بيسبق إعادة البناء وياخد
        // عنصرًا لسه في طريقه للحذف
        setTimeout(relocateWorkspaceSearch, 0);
      });
    }

    // فتات الخبز (.worksapce-breadcrumb) بترسم متأخرة عن تغيير المسار
    // في صفحات القوائم (بعد ما فرابي يجيب meta الدوكتايب) — مراقب DOM
    // بيمسك اللحظة اللي ترسم فيها فعليًا بدل تخمين مهلة ثابتة، ومربوط
    // بإطار رسم واحد (requestAnimationFrame) عشان مايتكررش مع كل
    // تغيير صغير في الصفحة المزدحمة أصلاً بتغييرات فرابي الداخلية
    var activeUpdateScheduled = false;
    function scheduleActiveUpdate() {
      if (activeUpdateScheduled) return;
      activeUpdateScheduled = true;
      requestAnimationFrame(function () {
        activeUpdateScheduled = false;
        updateActive(bar);
      });
    }
    new MutationObserver(scheduleActiveUpdate).observe(document.body, {
      childList: true, subtree: true,
    });

    relocateWorkspaceSearch();
    updateActive(bar);
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
