// تجميع اسم العميل + رقم المستند + التاريخ في خلية واحدة (زي
// .list-title/.list-sub في horizon-journal-invoice-list-preview.html)
// — بطلب صريح من المالك بعد ما لاحظ إنهم متفرّقين في أعمدة منفصلة.
//
// نقل عناصر DOM حقيقية موجودة بالفعل في نفس الصف (عمود الـID الحقيقي
// + وقت آخر تعديل الحقيقي) لمكان تحت العنوان مباشرة — بلا اختراع أي
// بيانات جديدة. آمن لأن شاشة القائمة (مش الفورم) — لا حفظ ولا تحقّق
// حيّ، بس عرض بيانات جاهزة، فنقل عناصر العرض ده بلا أي مخاطرة على
// منطق العمل.
// 🔴 السيرفر بلا أي خط إيموجي مثبَّت (fc-list أثبت DejaVu بس، صفر
// Noto Color Emoji) — أي إيموجي CSS content كان بيترسم tofu/شكل
// وحش، مش أيقونة ملوّنة. الحل: أيقونة SVG حقيقية من sprite فرابي
// نفسه (frappe.utils.icon) — نفس الطريقة المؤكَّدة تشتغل صح طول
// اليوم في سطح المكتب والتصنيفات، بلا اعتماد على خط نظام أي جهاز.
(function () {
	// 🔴 عطل حقيقي اتقاس (بلاغ المالك بلقطة حقيقية: الأيقونة موجودة في
	// صفوف ومفقودة في صفوف تانية بنفس القائمة). فحص DOM حيّ أثبت السبب:
	// بعض الصفوف بيعرض العنوان كـ`.level-item.bold.ellipsis > a`، وبعضها
	// (نفس الدوكتايب، بيانات مختلفة) بيعرضه `<span><a class="ellipsis">`
	// بلا `level-item`/`bold` — على الأرجح فرق في طريقة عرض title_field
	// حسب البيانات. السيلكتور القديم `.level-item.bold.ellipsis` كان
	// بيفشل بصمت على النوع التاني فالصف يفضل بلا أيقونة للأبد (بلا
	// تسجيل خطأ). الإصلاح: بدل استهداف class معيّن، ندوّر على أول رابط
	// حقيقي (`<a>`) جوه `.list-subject` مش جوه عمود التحديد
	// (`.select-like`) — يغطي الحالتين لأن الرابط نفسه (مش الغلاف حواليه)
	// هو الثابت المشترك في كل الحالات.
	function findTitleWrap(subject) {
		var links = subject.querySelectorAll("a");
		for (var i = 0; i < links.length; i++) {
			var a = links[i];
			if (a.closest(".select-like")) continue;
			var parent = a.parentElement;
			return parent && parent !== subject ? parent : a;
		}
		return null;
	}

	function layoutRow(row) {
		if (row.dataset.hLayouted) return;
		var subject = row.querySelector(".list-subject");
		if (!subject) return;
		var titleWrap = findTitleWrap(subject);
		if (!titleWrap) return;

		var idLink = row.querySelector('.list-row-col a[data-filter^="name,"]');
		var totalLink = row.querySelector('.list-row-col a[data-filter^="grand_total,"]');
		var idText = idLink ? idLink.textContent.trim() : "";
		var totalText = totalLink ? totalLink.textContent.replace(/\s+/g, " ").trim() : "";
		var parts = [idText, totalText].filter(Boolean);

		// عمود نصّي عمودي (عنوان فوق، تفاصيل تحت) — نقل حقيقي moveChild
		// للعنصر الحقيقي بتاع العنوان (مش نسخ، عشان الرابط الحقيقي
		// يفضل شغّال زي ما هو)، بدل الاعتماد على flex-wrap اللي كان
		// بيتصادم مع الأيقونة الجديدة.
		var textCol = document.createElement("div");
		textCol.className = "h-list-text";
		subject.insertBefore(textCol, titleWrap);
		textCol.appendChild(titleWrap);

		if (parts.length) {
			var sub = document.createElement("div");
			sub.className = "h-list-sub";
			sub.textContent = parts.join(" · ");
			textCol.appendChild(sub);
		}

		var iconWrap = document.createElement("div");
		iconWrap.className = "h-list-icon";
		iconWrap.innerHTML = frappe.utils.icon("file", "sm");
		subject.insertBefore(iconWrap, textCol);

		// عمود الـID الأصلي بيتخفى (بلا حذف — display:none قابل للتراجع)
		// عشان الرقم مايتكرّرش مرتين في نفس الصف بعد ما بقى جوّه العنوان
		var idColumn = idLink ? idLink.closest(".list-row-col") : null;
		if (idColumn) idColumn.classList.add("h-id-column-merged");

		// 🔴 بلاغ المالك بلقطة موبايل حقيقية (دائرتان): رقم الفاتورة
		// بيتقص بسبب مساحة ضيقة جدًا، ومساحة الفراغ يمين الصف (.level-right)
		// بتبان بلا فايدة — النشاط الحقيقي (تعليقات/إعجاب) أصلاً مخفي على
		// الموبايل (hidden-xs من Frappe نفسه)، فمفيش حاجة تانية تملأ
		// المساحة غير بادج الحالة لوحدها. المالك اختار (AskUserQuestion):
		// وسّع رقم الفاتورة + قلّص البادج لحجمها الفعلي + أظهر المبلغ
		// الإجمالي بدل الفراغ. المبلغ منقول نصًّا حقيقيًا من العمود
		// المخفي (hidden-xs) الموجود بالفعل في نفس الصف — بلا اختراع.
		row.dataset.hLayouted = "1";
	}

	function layoutAll() {
		document.querySelectorAll(".list-row-container").forEach(layoutRow);
	}

	function isListRoute() {
		return /\/app\/[^/]+\/view\/list/.test(window.location.pathname) ||
			(document.querySelector(".frappe-list .result") && !document.querySelector(".page-container:is(.editable-form, .submitted-form, .cancelled-form)"));
	}

	function attempt() {
		if (!isListRoute()) return;
		if (document.querySelector(".list-row-container")) layoutAll();
	}

	setTimeout(attempt, 1200);
	[2500, 4000, 6000].forEach(function (delay) {
		setTimeout(attempt, delay);
	});

	var target = document.querySelector(".layout-main-section") || document.body;
	var observer = new MutationObserver(function () {
		attempt();
	});
	observer.observe(target, { childList: true, subtree: true });
})();
