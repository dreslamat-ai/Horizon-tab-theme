// توحيد بنية صفحات الموديول بمقاس البطاقة الموحَّد — عام على كل
// موديولات Frappe (مش المخازن بس، بطلب صريح من المالك بعد تجربة
// المخازن). الكشف: أي صفحة فيها .codex-editor__redactor (محتوى
// Workspace نفسه، مؤكَّد إنه غير موجود في صفحات القوائم/الفورمات/
// التقارير) وليست راوت الرئيسية (ده بيتغطّى بسطح المكتب بتاعه لوحده).
(function () {
	function normalizePath(p) {
		var n = p.replace(/\/+$/, "") || "/app";
		// v16 نقل مسار الـdesk من /app لـ/desk — نوحّدهم لـ/app.
		if (n === "/desk") return "/app";
		if (n.indexOf("/desk/") === 0) return "/app/" + n.slice(6);
		return n;
	}

	function isHomeRoute() {
		var current = normalizePath(window.location.pathname);
		return current === "/app" || current === "/app/home";
	}

	function isWorkspacePage() {
		return !!document.querySelector(".codex-editor__redactor");
	}

	function update() {
		document.body.classList.toggle(
			"h-uniform-module",
			!isHomeRoute() && isWorkspacePage()
		);
	}

	// 🔴 عطل اتكشف (١٦ أغسطس): .codex-editor__redactor بيترسم بعد
	// DOMContentLoaded بلحظة (محتوى Workspace بيتحمّل بجافاسكريبت)، فالتحديث
	// الفوري وقت الفتح الأول للصفحة (لا SPA route change) كان بيلاقي
	// redactor لسه مش موجود ويقفل .h-uniform-module غلط بشكل دائم — نفس
	// نمط التأخير المستخدَم في horizon_module_poster.bundle.js.
	function updateWithRetry() {
		update();
		if (isWorkspacePage()) return;
		[2000, 5000, 8000, 12000, 16000, 20000].forEach(function (delay) {
			setTimeout(update, delay);
		});
		var target = document.querySelector(".layout-main-section") || document.body;
		var observer = new MutationObserver(function () {
			if (isWorkspacePage()) {
				observer.disconnect();
				update();
			}
		});
		observer.observe(target, { childList: true, subtree: true });
		setTimeout(function () { observer.disconnect(); }, 20000);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", updateWithRetry);
	} else {
		updateWithRetry();
	}

	if (frappe.router && frappe.router.on) {
		frappe.router.on("change", function () {
			setTimeout(updateWithRetry, 300);
		});
	}
})();
