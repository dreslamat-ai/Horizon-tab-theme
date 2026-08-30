// اسم المستند الحقيقي (زي ACC-JV-2026-00001 في المرجع) تحت عنوان
// المستند في الرأس الكحلي — لمستند محفوظ بس (لمستند جديد مفيش اسم
// حقيقي أصلاً قبل الحفظ).
//
// 🔴 مبدأ أمان: العنصر `.sub-heading` **موجود فعلاً في بنية Frappe
// الأصلية** لنفس الغرض بالظبط (مؤكَّد بفحص DOM حيّ — عنصر حقيقي بكلاس
// `hide` بس، مش مُخترَع)، بعض الدوكتايبات بيستخدموه (sub_title_field)
// والبعض لأ. إظهاره وملؤه باسم المستند الحقيقي من الراوت نفسه —
// معلومة عرض بحتة، صفر لمس لأي حقل فورم أو منطق حفظ/تحقّق.
(function () {
	function isNewDoc(name) {
		return !name || /^new-/i.test(name);
	}

	function applyDocName() {
		var container = document.querySelector(".page-container:is(.editable-form, .submitted-form, .cancelled-form)");
		if (!container) return;

		var route = frappe.get_route ? frappe.get_route() : [];
		var docname = route && route[2];
		var subHeading = document.querySelector(".page-head .sub-heading");
		if (!subHeading) return;

		if (isNewDoc(docname)) {
			subHeading.classList.add("hide");
			subHeading.textContent = "";
		} else {
			subHeading.textContent = docname;
			subHeading.classList.remove("hide");
		}
	}

	// مرحلة ٣ (نهج ثانٍ) — حقول أساسية مُبرَزة بالاسم لكل دوكتايب
	// (h-meta-field). التجربة الأولى (تحويل أول قسم كامل لـgrid ٣
	// أعمدة) كسرت فاتورة المبيعات فعليًا — القسم الأول فيها فحصناه
	// حيًّا ولقيناه ١١ حقلًا مختلطًا (شاملًا ٣ خانات اختيار)، وgrid
	// عام مالوش عليه سيطرة كافية على توزيع بهذا التفاوت.
	// النهج الجديد: صفر لمس لتخطيط .form-column/.form-section — بس
	// كلاس بصري هادئ على الحقول الثلاثة المحدَّدة بالاسم لكل دوكتايب،
	// مؤكَّدة موجودة وظاهرة فعليًا بفحص DOM حيّ (لا تخمين). دوكتايب
	// غير مُدرَج في الخريطة = صفر أثر (يفضل شكله الطبيعي الحالي).
	// 🔴 مؤكَّد بفحص حيّ: `frappe.get_route()[1]` بيرجّع اسم الدوكتايب
	// الفعلي ("Journal Entry") لا صيغة الرابط المختصرة ("journal-entry")
	// — افتراضٌ أوّليٌّ غلط اتكشف بفحص DOM مباشر، مش تخمين نظري.
	// 🔴 بلاغ المالك (لقطة، دائرة حمراء حوالين naming_series): "سلسلة
	// التسمية" كانت مش في الخريطة أصلاً فبتفضل بشكلها الافتراضي القديم
	// وسط باقي حقول meta-field الحديثة — تناقض بصري واضح. أُضيفت هنا.
	var META_FIELDS_BY_DOCTYPE = {
		"Journal Entry": ["company", "posting_date", "voucher_type", "naming_series"],
		"Sales Invoice": ["customer", "posting_date", "due_date"],
	};

	function applyMetaFields() {
		var container = document.querySelector(".page-container:is(.editable-form, .submitted-form, .cancelled-form)");
		if (!container) return;

		var already = container.querySelectorAll(".h-meta-field");
		for (var k = 0; k < already.length; k++) {
			already[k].classList.remove("h-meta-field");
		}

		var route = frappe.get_route ? frappe.get_route() : [];
		var doctype = route && route[1];
		var fieldnames = META_FIELDS_BY_DOCTYPE[doctype];
		if (!fieldnames) return;

		for (var i = 0; i < fieldnames.length; i++) {
			var el = container.querySelector('.frappe-control[data-fieldname="' + fieldnames[i] + '"]');
			if (el) el.classList.add("h-meta-field");
		}
	}

	// 🔴 عطل حقيقي اتقاس (بلاغ المالك بلقطة مباشرة، دائرة حمراء حوالين
	// صف كامل فاضي): خلايا Currency/Float الفاضية في جدول البنود
	// بيعرض Frappe نفسه اسم الحقل كـ`.static-area` placeholder ("مدين"،
	// "دائن") — سلوك Frappe الأصلي القياسي، صفر علاقة بينا. لكن قاعدة
	// SCSS الموجودة `[data-fieldtype=Currency] { font-weight:700;
	// color:#1D2D44 }` (لإبراز الأرقام الحقيقية) كانت بتتفعّل على هذا
	// الـplaceholder الفاضي بنفس القوة — فبيبان النص الإرشادي الفاضي
	// بنفس بروز رقم حقيقي فعلي، مضلِّل (مؤكَّد بفحص getComputedStyle
	// حيّ: fontWeight=700 color=rgb(29,45,68) على خلية "مدين" فاضية
	// تمامًا). التمييز: Frappe بيحط `title` بنفس اسم الحقل دايمًا —
	// لو نص `.static-area` مطابق لـ`title` تمامًا فالخلية فاضية أكيد.
	var lastCellCheck = 0;
	function markEmptyCells() {
		var now = Date.now();
		if (now - lastCellCheck < 150) return; // throttle بسيط أثناء الكتابة السريعة
		lastCellCheck = now;
		var cells = document.querySelectorAll('.grid-static-col[data-fieldtype="Currency"], .grid-static-col[data-fieldtype="Float"]');
		for (var i = 0; i < cells.length; i++) {
			var cell = cells[i];
			var staticArea = cell.querySelector(".static-area");
			if (!staticArea) continue;
			var title = (cell.getAttribute("title") || "").trim();
			var text = staticArea.textContent.trim();
			if (title && text === title) {
				cell.classList.add("h-cell-empty");
			} else {
				cell.classList.remove("h-cell-empty");
			}
		}
	}

	// 🔴 عطل حقيقي اتقاس اليوم: فتح مستند جديد بيطلق "change" على
	// الراوتر أكتر من مرة متتالية (انتقالات وسيطة قبل استقرار الراوت
	// النهائي). كل استدعاء `attempt()` كان بيضبط setTimeout مستقل، فلو
	// استدعاء وسيط اتنفَّذ بعد الاستدعاء الصحيح (route[1] لسه مش
	// الدوكتايب المستهدَف وقتها) كان بيشيل الكلاس اللي اتضاف من غير ما
	// يرجّعه — النتيجة: الحقل يفقد التمييز البصري بصمت. الإصلاح: مؤقّت
	// واحد بس (يُلغى ويُعاد ضبطه)، فما يشتغل غير آخر استدعاء بعد
	// استقرار الراوت فعليًا.
	// تقرير مراجعة ٢٤ أغسطس، بند ١ + قسم «ما حُذف ولماذا»:
	// select إلزامي بخيار وحيد (زي سلسلة التسمية MAT-STE-.YYYY.- —
	// اتقاس فعليًا: خيار واحد) لا يُعرض — قيمته بتتملي ضمنًا أصلًا.
	// عام لكل الدوكتايبات: أي select بخيار فعلي واحد وقيمته متحددة
	// يُطوى، ولو الخيارات زادت لاحقًا يظهر تاني (تقييم متكرر idempotent).
	function hideSingleOptionSelects() {
		document.querySelectorAll(".frappe-control[data-fieldtype='Select']").forEach(function (ctrl) {
			var sel = ctrl.querySelector("select.form-control");
			if (!sel) return;
			var real = Array.prototype.filter.call(sel.options, function (o) {
				return (o.value || "").trim() !== "";
			});
			var single = real.length <= 1 && (sel.value || "").trim() !== "";
			ctrl.style.display = single ? "none" : "";
		});
	}

	// قسم «ما حُذف ولماذا» بند ٥: تاريخ/وقت القيد تفاصيل تدقيق —
	// يظهروا فقط عند تفعيل «تعديل تاريخ القيد ووقته». مقصور على
	// حركة المخزون (المستند اللي اتراجع فعليًا) — التعميم قرار لاحق.
	function foldPostingFields() {
		var route = frappe.get_route ? frappe.get_route() : [];
		if (!route || route[1] !== "Stock Entry") return;
		var cbCtrl = document.querySelector(".frappe-control[data-fieldname='set_posting_time']");
		var cb = cbCtrl && cbCtrl.querySelector("input[type='checkbox']");
		if (!cb) return;
		function sync() {
			["posting_date", "posting_time"].forEach(function (fn) {
				var c = document.querySelector(".frappe-control[data-fieldname='" + fn + "']");
				if (c) c.style.display = cb.checked ? "" : "none";
			});
		}
		if (!cb.dataset.hFoldWired) {
			cb.dataset.hFoldWired = "1";
			cb.addEventListener("change", sync);
		}
		sync();
	}

	var pendingTimer = null;
	function attempt() {
		if (pendingTimer) clearTimeout(pendingTimer);
		pendingTimer = setTimeout(function () {
			pendingTimer = null;
			applyDocName();
			applyMetaFields();
			markEmptyCells();
			hideSingleOptionSelects();
			foldPostingFields();
		}, 700);
	}

	attempt();
	if (frappe.router && frappe.router.on) {
		frappe.router.on("change", attempt);
	}

	// markEmptyCells لازم يتكرر مع كل تعديل جوّه جدول البنود (كتابة
	// قيمة، إضافة/حذف صف) — مش بس عند فتح المستند أو تغيير الراوت،
	// عشان الخلية تفقد الكلاس فور ما تاخد قيمة حقيقية (وتاخده تاني لو
	// اتمسحت). نفس نمط المراقب المستخدَم في horizon_list_layout.bundle.js.
	var gridObserver = new MutationObserver(function () {
		markEmptyCells();
	});
	function watchGrids() {
		document.querySelectorAll(".form-grid").forEach(function (grid) {
			if (grid.dataset.hCellWatched) return;
			grid.dataset.hCellWatched = "1";
			gridObserver.observe(grid, { childList: true, subtree: true, characterData: true });
		});
	}
	watchGrids();
	setInterval(watchGrids, 2000);
})();
