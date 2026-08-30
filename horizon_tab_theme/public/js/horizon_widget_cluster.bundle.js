// تجميع كتل بطاقة الرقم/الرسم البياني المتتالية في عنقود CSS Grid
// واحد (.h-widget-cluster) — بدل flex ثابت العرض اللي كان بيتصرّف
// صح لعدد عناصر معيَّن بس (اتكشف على المحاسبة: ٤ بطاقات + رسم بيانات
// طلّعوا صفّين متفاوتين بفجوة). الـGrid (auto-fill) بيحسب عدد الأعمدة
// المثالي تلقائيًا لأي عدد عناصر ولأي عرض شاشة — استجابة حقيقية بدل
// breakpoint واحد يدوي.
//
// **مفيش فقد محتوى**: نفس عناصر number-widget-box/dashboard-widget-box
// الحقيقية بتتنقل (moveChild) لعنصر عنقود جديد، مش تتحذف أو تتستنسخ —
// الرقم الفعلي والرسم البياني الفعلي (وأحداثهم المربوطة زي الفلاتر)
// يفضلوا زي ما هم.
(function () {
	function normalizePath(p) {
		var n = p.replace(/\/+$/, "") || "/app";
		// v16 نقل مسار الـdesk من /app لـ/desk — نفس توحيد module_poster
		// وmodule_layout، كان ناقصًا هنا فـisHomeRoute كانت دايمًا false
		// فعليًا على v16 (مش عطل خطير، بس غير دقيق).
		if (n === "/desk") return "/app";
		if (n.indexOf("/desk/") === 0) return "/app/" + n.slice(6);
		return n;
	}
	function isHomeRoute() {
		var current = normalizePath(window.location.pathname);
		return current === "/app" || current === "/app/home";
	}

	function clusterWidgets() {
		if (isHomeRoute()) return;
		var redactor = document.querySelector(".codex-editor__redactor");
		if (!redactor) return;
		if (redactor.querySelector(".h-widget-cluster")) return; // خلص فعلاً

		var children = Array.prototype.slice.call(redactor.children);
		var widgetBlocks = children.filter(function (b) {
			return (
				b.classList &&
				b.classList.contains("ce-block") &&
				b.querySelector(".number-widget-box, .dashboard-widget-box")
			);
		});
		if (widgetBlocks.length < 2) return; // مفيش داعي لعنقود لعنصر واحد

		// ترتيب موحَّد لكل الموديولات — بطلب صريح من المالك بعد ما
		// المخازن طلعت بترتيب مختلف عن المحاسبة (الرسم في النص بدل
		// الأول). كل موديول عنده ترتيب مؤلَّف مختلف في Workspace نفسه
		// (حسب ترتيب المؤلِّف الأصلي في Frappe) — بدل ما نسيبه عشوائي،
		// الرسم البياني دايمًا أول عنصر في العنقود، وبعده بطاقات الرقم
		// بترتيبها الأصلي بينها.
		var dashboards = widgetBlocks.filter(function (b) {
			return !!b.querySelector(".dashboard-widget-box");
		});
		var numbers = widgetBlocks.filter(function (b) {
			return !b.querySelector(".dashboard-widget-box");
		});
		var orderedBlocks = dashboards.concat(numbers);

		var cluster = document.createElement("div");
		cluster.className = "h-widget-cluster";
		widgetBlocks[0].parentNode.insertBefore(cluster, widgetBlocks[0]);
		orderedBlocks.forEach(function (block) {
			if (block.querySelector(".dashboard-widget-box")) {
				block.classList.add("h-widget-cluster-wide");
			}
			cluster.appendChild(block);
		});
	}

	function onRouteChange() {
		if (isHomeRoute()) return;
		if (document.querySelector(".h-widget-cluster")) return;
		function widgetsPresent() {
			return !!document.querySelector(".number-widget-box, .dashboard-widget-box");
		}
		function attempt() {
			if (document.querySelector(".h-widget-cluster") || isHomeRoute()) return;
			if (widgetsPresent()) clusterWidgets();
		}
		setTimeout(attempt, 2500);
		[5000, 8000, 12000, 16000, 20000].forEach(function (delay) {
			setTimeout(attempt, delay);
		});
		var target = document.querySelector(".layout-main-section") || document.body;
		var observer = new MutationObserver(function () {
			if (widgetsPresent()) {
				observer.disconnect();
				setTimeout(attempt, 300);
			}
		});
		observer.observe(target, { childList: true, subtree: true });
		setTimeout(function () { observer.disconnect(); }, 20000);
	}

	if (frappe.router && frappe.router.on) {
		frappe.router.on("change", onRouteChange);
	}
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", onRouteChange);
	} else {
		onRouteChange();
	}
})();
