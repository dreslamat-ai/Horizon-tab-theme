/* ============================================================================
   HORIZON — عمود الترحيب/دعوة التسجيل على صفحة /login فقط.
   يبني عمودًا جديدًا بجانب فورم الدخول الأصلي (بلا لمس بنية فرابي الداخلية)،
   ويقرأ اسم الشركة والشعار من العناصر الحقيقية المرندرة أصلاً في الصفحة
   (.navbar-brand و .app-logo) — لا نص ولا صورة مختلَقة، فيعمل صح تلقائيًا
   لكل عميل بشعاره واسمه الحقيقيين بلا أي تعديل يدوي لكل مستأجر.

   فشل هذا الملف (أو حظره) لا يكسر تسجيل الدخول — أسوأ حالة: يختفي عمود
   الترحيب ويبقى فورم الدخول العادي شغّالًا بمفرده.
   ========================================================================== */
(function () {
  "use strict";
  if (document.body.getAttribute("data-path") !== "login") return;

  var wrapper = document.querySelector("#page-login .page-content-wrapper");
  if (!wrapper || wrapper.querySelector(".h-welcome")) return;

  var companyName = (document.querySelector(".navbar-brand") || {}).textContent;
  companyName = companyName ? companyName.trim() : "Horizon";

  var logoEl = document.querySelector(".app-logo");
  var logoSrc = logoEl ? logoEl.getAttribute("src") : null;

  var ICONS = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12a8 8 0 1 1-3.2-6.4L21 4l-1 4.2A7.9 7.9 0 0 1 21 12Z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  var SIGNUP_URL = "https://horizonerp.cloud/signup";

  var aside = document.createElement("aside");
  aside.className = "h-welcome";
  aside.innerHTML =
    '<div class="h-eyebrow">Horizon AI Powered ERP</div>' +
    "<h1>منصّة واحدة تدير بيها شركتك بالكامل</h1>" +
    '<p class="h-lede">مبيعات، فواتير، مخزون، ومساعد ذكي يتحدّث العربية — كل ده جاهز فور تسجيلك، بلا تدخل يدوي من فريقنا.</p>' +
    '<div class="h-feature-list">' +
      '<div class="h-feature"><div class="h-icon">' + ICONS.chat + '</div><div><h3>ألاء — مساعدك الذكي العربي</h3><p>يجاوبك عن أي سؤال يخص عملك مباشرة من لوحتك.</p></div></div>' +
      '<div class="h-feature"><div class="h-icon">' + ICONS.shield + '</div><div><h3>امتثال ضريبي مضبوط تلقائيًا لدولتك</h3><p>فوترتك الإلكترونية تُهيَّأ حسب بلدك من أول يوم دون إعداد يدوي.</p></div></div>' +
      '<div class="h-feature"><div class="h-icon">' + ICONS.bolt + '</div><div><h3>جاهز فور تسجيلك</h3><p>نظامك يُجهَّز تلقائيًا بلا انتظار فريق تقني.</p></div></div>' +
    "</div>" +
    '<div class="h-cta-box">' +
      "<p>شركة جديدة؟ سجّل حسابك وابدأ التشغيل خلال دقائق.</p>" +
      '<a class="h-btn-cta" href="' + SIGNUP_URL + '">سجّل شركتك الآن ' + ICONS.arrow + "</a>" +
    "</div>";

  wrapper.insertBefore(aside, wrapper.firstChild);
  document.getElementById("page-login").classList.add("h-login-shell");

  var head = document.querySelector(".page-card-head");
  if (head && !head.querySelector(".app-logo") && logoSrc) {
    var img = document.createElement("img");
    img.className = "app-logo";
    img.src = logoSrc;
    head.insertBefore(img, head.firstChild);
  }

  /* فاصل "أو" بين زرّي "استمر" و"تسجيل الدخول برابط البريد" — موجود في
     البروتوتايب المعتمد لكن غير موجود في page-card-actions الأصلي لفرابي،
     فيُحقَن هنا بدل تعديل قالب فرابي نفسه. */
  /* .btn-login و.btn-login-with-email-link موجودان أكثر من مرة في نفس
     الصفحة (فرابي بيرندر كل أقسام for-login/for-forgot/for-login-with-
     email-link معًا في الـDOM، ويظهر واحدًا بس بالـJS) — لازم النطاق
     داخل section.for-login تحديدًا لضمان أخذ الزرّين من نفس الأب. */
  var loginSection = document.querySelector("section.for-login");
  var loginBtn = loginSection && loginSection.querySelector(".btn-login");
  var emailLinkBtn = loginSection && loginSection.querySelector(".btn-login-with-email-link");
  if (loginBtn && emailLinkBtn && loginBtn.parentElement === emailLinkBtn.parentElement) {
    var divider = document.createElement("div");
    divider.className = "h-divider";
    divider.textContent = "أو";
    loginBtn.parentElement.insertBefore(divider, emailLinkBtn);
  }

  /* بديل الموبايل — عمود الترحيب الكامل يختفي تحت 900px (نفس البروتوتايب
     حرفيًا)، فبلا هذا السطر يختفي أي أثر لدعوة التسجيل تمامًا على الموبايل
     (بلاغ مالك حقيقي: "عند العملاء مش ظاهر إلا فورم الدخول من غير محتوى"،
     من فتح الصفحة على موبايل فعليًا). يُحقَن داخل بطاقة الدخول نفسها —
     ظاهر فقط تحت 900px عبر CSS، لا مكرَّر مع عمود الترحيب على الديسكتوب. */
  var actions = document.querySelector("section.for-login .page-card-actions");
  if (actions && !actions.querySelector(".h-mobile-cta")) {
    var mobileCta = document.createElement("div");
    mobileCta.className = "h-mobile-cta";
    mobileCta.innerHTML = 'لسه معندكش حساب؟ <a href="' + SIGNUP_URL + '">سجّل شركتك الآن</a>';
    actions.appendChild(mobileCta);
  }

  void companyName; /* محجوز لاستخدام لاحق (تذييل مخصَّص) لو طُلب */
})();
