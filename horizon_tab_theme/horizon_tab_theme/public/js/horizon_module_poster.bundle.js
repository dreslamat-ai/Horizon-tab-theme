// تحويل صفحة الموديول لشبكة poster cards حقيقية — بس بدرجتين (زي طلب
// المالك بعد ما الصفحة بقت "زحمة"): مستوى أول = بطاقات تصنيف بعدد
// المجموعات الأصلية في Frappe Workspace نفسها (عناوين links-widget-box
// الحقيقية + "الوصول السريع" للشورتكتس)، مستوى تاني = بوسترات العناصر
// الحقيقية جوّه التصنيف اللي اتفتح — بالظبط نفس نمط سطح المكتب ← موديول
// في horizon-final-poster-design.html (openModule/closeModule)، هنا
// تصنيف ← عناصر بدل موديول ← عناصر.
//
// 🔴 مبدأ أمان مصحَّح (بعد فحص DOM حيّ): الشورتكتس في Frappe مش <a>
// خالص — عنصر <div role="link" tabindex="0"> بحدث نقر مربوط بجافاسكريبت
// (event delegation)، بلا href قابل للاستخراج. الحل الآمن: نقل نفس
// عنصر DOM الحقيقي (moveChild عبر appendChild) لجريد التصنيف بتاعه —
// مرة واحدة وقت البناء، مش نسخ أو إعادة بناء.
//
// الروابط جوّه المجموعات (links-widget-box) عندها <a href> حقيقي —
// بتتنسخ كـ<a> جديدة بنفس الـhref والنص الحقيقي من .link-content
// (مش .textContent الكامل، لأنه بيجيب كمان محتوى popover تلميح مخفي).
//
// عدّاد كل تصنيف (زي "٦ عناصر") رقم حقيقي محسوب من عدد العناصر
// الفعلي داخل نفس المجموعة — مش رقم مخترَع.
(function () {
	// عام على كل موديولات Frappe (مش المخازن بس، بطلب صريح من المالك) —
	// أي صفحة فيها .codex-editor__redactor (محتوى Workspace) وليست
	// راوت الرئيسية (بيتغطّى بسطح المكتب بتاعه لوحده).
	function normalizePath(p) {
		var n = p.replace(/\/+$/, "") || "/app";
		// v16 نقل مسار الـdesk من /app لـ/desk — نوحّدهم لـ/app.
		if (n === "/desk") return "/app";
		if (n.indexOf("/desk/") === 0) return "/app/" + n.slice(6);
		return n;
	}
	// 🔴 لا نتحقّق من .codex-editor__redactor هنا رغم إنه علامة صفحة
	// الموديول الحقيقية — بيترسم بجافاسكريبت بعد الفتح الأول بلحظة، وده
	// كان بيقفل التوحيد بشكل دائم لو الصفحة أبطأ شويّة (اتكشف على
	// Accounting، اشتغل بالصدفة على Stock). الفحص الحقيقي لوجود صفحة
	// موديول قابلة للتوحيد بيحصل أصلاً تحت (وجود شورتكتس/روابط حقيقية)،
	// وده بينتظر بمراقب DOM لحد ٨ ثواني — مش محتاج بوّابة إضافية هنا.
	function currentSlugIsUniform() {
		var current = normalizePath(window.location.pathname);
		return current !== "/app" && current !== "/app/home";
	}
	var TINTS = ["#5083BC", "#3E5578", "#7CA3D6", "#1D2D44", "#65799E", "#3F6A9E", "#4E7A5C", "#B8860B"];
	var tintIndex = 0;
	function nextTint() {
		var t = TINTS[tintIndex % TINTS.length];
		tintIndex++;
		return t;
	}

	function moduleIconName() {
		var parts = window.location.pathname.replace(/\/+$/, "").split("/");
		var slug = parts[parts.length - 1] || "";
		return frappe
			.xcall("frappe.desk.desktop.get_workspaces")
			.then(function (res) {
				var pages = (res && res.pages) || [];
				var match = pages.find(function (p) {
					return frappe.router.slug(p.title) === slug;
				});
				return (match && match.icon) || "folder-normal";
			})
			.catch(function () {
				return "folder-normal";
			});
	}

	function addIcon(el, iconName, tint) {
		if (el.querySelector(".h-desktop-card-icon")) return;
		var iconWrap = document.createElement("div");
		iconWrap.className = "h-desktop-card-icon";
		iconWrap.innerHTML = frappe.utils.icon(iconName, "sm");
		iconWrap.style.setProperty("--h-card-tint", tint);
		el.insertBefore(iconWrap, el.firstChild);
		el.classList.add("h-glass", "h-desktop-card", "h-module-poster-item");

		if (!el.querySelector(".h-desktop-card-bar")) {
			var bar = document.createElement("div");
			bar.className = "h-desktop-card-bar";
			bar.style.setProperty("--h-card-bar-color", tint);
			el.appendChild(bar);
		}
	}

	function posterize() {
		if (window.__hPosterizing) { return; }
		window.__hPosterizing = true;
		moduleIconName()
			.then(function (iconName) {
				try {
					posterizeInner(iconName);
				} catch (e) {
					// 🔴 كان بيتبلّع صامت بالكامل — المالك بلّغ "أحيانًا بيشتغل
					// وأحيانًا لأ" على حساب حقيقي غير Administrator، ومفيش أي
					// أثر يوضّح السبب. لازم يظهر في console على الأقل.
					if (window.console && console.error) {
						console.error("horizon_module_poster: posterizeInner failed", e);
					}
				}
			})
			.then(function () {
				window.__hPosterizing = false;
			});
	}

	function buildItemCard(iconName, tint, label, moveFrom) {
		var card;
		if (moveFrom) {
			card = moveFrom;
		} else {
			card = document.createElement("a");
		}
		addIcon(card, iconName, tint);
		if (!card.querySelector(".h-desktop-card-label")) {
			var labelEl = document.createElement("div");
			labelEl.className = "h-desktop-card-label";
			labelEl.textContent = label;
			card.insertBefore(labelEl, card.querySelector(".h-desktop-card-bar"));
		}
		return card;
	}

	function posterizeInner(iconName) {
		if (!currentSlugIsUniform()) return;
		var redactor = document.querySelector(".codex-editor__redactor");
		if (!redactor) return;
		if (redactor.querySelector(".h-module-category-grid, .h-module-quick-access-grid")) return; // خلص فعلاً

		var shortcuts = Array.prototype.slice.call(
			document.querySelectorAll(".widget.shortcut-widget-box")
		);
		var linkGroups = Array.prototype.slice.call(
			document.querySelectorAll(".widget.links-widget-box")
		);
		if (!shortcuts.length && !linkGroups.length) return;

		// 🔴 عطل حقيقي اتقاس (بلاغ المالك بلقطة: فراغ كبير مش مفهوم —
		// اكتشاف تاني بعد تصحيح الأول): لازم نلقط مرجع الحاوية الأصلية
		// (.ce-block) لكل عنصر *قبل* ما ننقله بـappendChild تحت — لأن
		// appendChild بيشيل العنصر من مكانه القديم أوتوماتيكيًا، فالفحص
		// اللاحق ("هل فيها .shortcut-widget-box؟") هيرجع false دايمًا
		// (المحتوى نفسه اتنقل بالفعل) والحاوية الفاضية تفضل ظاهرة بدل
		// ما تتخفى — عشرة عناصر بالظبط بكده كانوا بيسيبوا فراغ حقيقي
		// (مؤكَّد بفحص DOM حيّ: كل .ce-block منهم height=14px لكنها
		// بتتجمّع مع بعض).
		var originalBlocks = [];
		shortcuts.forEach(function (box) {
			var block = box.closest(".ce-block");
			if (block) originalBlocks.push(block);
		});
		linkGroups.forEach(function (group) {
			var block = group.closest(".ce-block");
			if (block) originalBlocks.push(block);
		});

		// نلقط مكان عنوان "Shortcuts"/"Reports & Masters" الحقيقي *قبل*
		// أي نقل — بطلب صريح من المالك إن كل قسم يفضل جوّه عنوانه الأصلي
		// نفسه، مش يترحّل لآخر الصفحة. المشي لفوق من أول عنصر حقيقي في
		// كل مجموعة لحد ما نلاقي كتلة فيها عنوان (h1-h4) — مش بحث بالنص
		// (الترجمة بتختلف)، بحث ببنية الصفحة الفعلية.
		function precedingHeaderBlock(block) {
			var sib = block ? block.previousElementSibling : null;
			while (sib) {
				if (sib.querySelector("h1,h2,h3,h4,.ce-header")) return sib;
				sib = sib.previousElementSibling;
			}
			return null;
		}
		var shortcutsAnchor = shortcuts.length ? shortcuts[0].closest(".ce-block") : null;
		var linksAnchor = linkGroups.length ? linkGroups[0].closest(".ce-block") : null;
		var quickAccessHeader = precedingHeaderBlock(shortcutsAnchor);
		var categoriesHeader = precedingHeaderBlock(linksAnchor);

		// الوصول السريع (شورتكتس) قسم ظاهر مباشرة فوق التصنيفات — مش
		// تصنيف يتفتح بالنقر، بطلب صريح من المالك ("قسم لوحده قبل
		// التصنيفات، حط محتواه في القسم الأعلى منه").
		var quickAccessGrid = null;
		if (shortcuts.length) {
			quickAccessGrid = document.createElement("div");
			quickAccessGrid.className = "h-desktop-grid h-module-quick-access-grid";
			shortcuts.forEach(function (box) {
				buildItemCard(iconName, nextTint(), null, box);
				quickAccessGrid.appendChild(box);
			});
		}

		var categories = [];
		linkGroups.forEach(function (group) {
			var titleEl = group.querySelector(".widget-title");
			var title = titleEl ? titleEl.textContent.trim() : "أخرى";
			var links = Array.prototype.slice.call(group.querySelectorAll("a[href]"));
			if (links.length) {
				categories.push({ title: title, items: links, kind: "links" });
			}
		});
		if (!categories.length && !quickAccessGrid) return;

		// المستوى الأول — بطاقة واحدة لكل تصنيف حقيقي
		var topGrid = document.createElement("div");
		topGrid.className = "h-desktop-grid h-module-category-grid";

		// المستوى الثاني — جريد مخفي لكل تصنيف، بيتفتح بالنقر
		var subview = document.createElement("div");
		subview.className = "h-module-subview";
		var backBtn = document.createElement("div");
		backBtn.className = "h-module-subview-back";
		backBtn.textContent = "→ رجوع للتصنيفات";
		backBtn.addEventListener("click", function () {
			subview.classList.remove("h-module-subview--open");
			topGrid.style.display = "";
		});
		subview.appendChild(backBtn);

		categories.forEach(function (cat) {
			var tint = nextTint();

			var catCard = document.createElement("div");
			catCard.className = "h-glass h-desktop-card h-module-category-card";
			catCard.style.setProperty("--h-card-tint", tint);

			var iconWrap = document.createElement("div");
			iconWrap.className = "h-desktop-card-icon";
			iconWrap.innerHTML = frappe.utils.icon(iconName, "sm");
			iconWrap.style.setProperty("--h-card-tint", tint);
			catCard.appendChild(iconWrap);

			var label = document.createElement("div");
			label.className = "h-desktop-card-label";
			label.textContent = cat.title;
			catCard.appendChild(label);

			var count = document.createElement("div");
			count.className = "h-desktop-card-stat";
			count.textContent = cat.items.length + " " + (cat.items.length === 1 ? "عنصر" : "عناصر");
			catCard.appendChild(count);

			var bar = document.createElement("div");
			bar.className = "h-desktop-card-bar";
			bar.style.setProperty("--h-card-bar-color", tint);
			catCard.appendChild(bar);

			var catGrid = document.createElement("div");
			catGrid.className = "h-desktop-grid h-module-subview-grid";

			cat.items.forEach(function (origA) {
				var contentEl = origA.querySelector(".link-content");
				var title = (contentEl ? contentEl.textContent : origA.getAttribute("title") || origA.textContent).trim();
				if (!title) return;
				var a = document.createElement("a");
				a.href = origA.getAttribute("href");
				buildItemCard(iconName, nextTint(), title, a);
				catGrid.appendChild(a);
			});

			catCard.addEventListener("click", function () {
				Array.prototype.forEach.call(subview.querySelectorAll(".h-module-subview-grid"), function (g) {
					g.classList.remove("h-module-subview-grid--active");
				});
				catGrid.classList.add("h-module-subview-grid--active");
				subview.classList.add("h-module-subview--open");
				topGrid.style.display = "none";
			});

			topGrid.appendChild(catCard);
			subview.appendChild(catGrid);
		});

		// الكتل الأصلية اللي فضيت (شورتكتس اتنقلت فعليًا) تتخفى — بمرجع
		// مباشر اتلقط *قبل* النقل (originalBlocks)، مش بفحص لاحق بيدوّر
		// على محتوى مش موجود أصلاً بعد النقل.
		originalBlocks.forEach(function (block) {
			block.classList.add("h-posterized-hidden");
		});

		// كل قسم بيترحّل جوّه عنوانه الأصلي نفسه (لقطناه فوق قبل أي نقل)
		// — لا آخر الصفحة. fallback لآخر الـredactor بس لو مفيش عنوان
		// حقيقي اتلاقى (بنية صفحة غير متوقَّعة).
		if (quickAccessGrid) {
			if (quickAccessHeader) {
				quickAccessHeader.insertAdjacentElement("afterend", quickAccessGrid);
			} else {
				redactor.appendChild(quickAccessGrid);
			}
		}
		if (categories.length) {
			if (categoriesHeader) {
				categoriesHeader.insertAdjacentElement("afterend", topGrid);
			} else {
				redactor.appendChild(topGrid);
			}
			topGrid.insertAdjacentElement("afterend", subview);
		}
	}

	function reset() {
		document.querySelectorAll(".h-module-category-grid, .h-module-subview").forEach(function (g) { g.remove(); });
		document.querySelectorAll(".h-posterized-hidden").forEach(function (b) {
			b.classList.remove("h-posterized-hidden");
		});
	}

	// 🔴 المالك بلّغ (بعد التعميم على كل الموديولات) إن الصفحة أحيانًا
	// بتفتح بالشكل القديم وأحيانًا الجديد على نفس الحساب الحقيقي —
	// عطل توقيت (مش دائم زي عطل blocked_modules السابق): مهلة المراقب
	// كانت ٨ ثواني بس قبل ما يستسلم نهائيًا بلا أي محاولة تانية. صفحة
	// أبطأ في الترسيم (اتصال أبطأ، سيرفر مشغول) كانت بتفوّت الشورتكتس
	// بعد الـ٨ ثواني ومفيش خطة بديلة. الحل: مهلة أطول (٢٠ ثانية) +
	// محاولات احتياطية متكرّرة (٥/١٠/١٥/٢٠ ثانية) مستقلّة عن المراقب،
	// حتى لو MutationObserver فوّت التغيير لأي سبب.
	function onRouteChange() {
		if (!currentSlugIsUniform()) { reset(); return; }
		if (document.querySelector(".h-module-category-grid, .h-module-quick-access-grid")) return;

		function alreadyDone() {
			return !!document.querySelector(".h-module-category-grid, .h-module-quick-access-grid");
		}
		function widgetsPresent() {
			return !!document.querySelector(".widget.shortcut-widget-box, .widget.links-widget-box");
		}
		function attempt() {
			if (alreadyDone() || !currentSlugIsUniform()) return;
			if (widgetsPresent()) posterize();
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
