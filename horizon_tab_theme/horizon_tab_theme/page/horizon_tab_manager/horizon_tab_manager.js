frappe.pages["horizon-tab-manager"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("ترتيب تابات Horizon"),
		single_column: true,
	});

	page.main.append(`
	<div id="h-tabmgr" dir="rtl" style="max-width:520px">
	<style>
		#h-tabmgr .h-tm-hint{background:#F7F8F6;border:1px solid #E3E5E0;border-radius:10px;
			padding:10px 14px;margin-bottom:16px;font-size:.85rem;color:#4A5361}
		#h-tabmgr .h-tm-row{display:flex;align-items:center;gap:10px;background:#fff;
			border:1.5px solid #E3E5E0;border-radius:10px;padding:8px 12px;margin-bottom:8px}
		#h-tabmgr .h-tm-row.is-hidden{opacity:.5}
		#h-tabmgr .h-tm-icon{width:20px;height:20px;flex:none;color:#1D2D44}
		#h-tabmgr .h-tm-label{flex:1;font-weight:700;color:#1A1717}
		#h-tabmgr .h-tm-btn{border:1px solid #E3E5E0;background:#fff;border-radius:7px;
			width:30px;height:30px;display:flex;align-items:center;justify-content:center;
			cursor:pointer;color:#1D2D44;font-weight:900}
		#h-tabmgr .h-tm-btn:hover{background:#F7F8F6}
		#h-tabmgr .h-tm-btn:disabled{opacity:.3;cursor:default}
		#h-tabmgr .h-tm-btn:disabled:hover{background:#fff}
		#h-tabmgr .h-tm-toggle{border:1px solid #E3E5E0;background:#fff;border-radius:7px;
			padding:5px 12px;cursor:pointer;font-size:.78rem;font-weight:700;color:#4A5361}
		#h-tabmgr .h-tm-toggle.on{background:#EAF4EC;border-color:#4E7A5C;color:#1e5c37}
		#h-tabmgr .h-tm-empty{color:#69727F;text-align:center;padding:30px 0}
	</style>
	<div class="h-tm-hint">
		${__("هذا هو ترتيب التابات في شريط Horizon فعليًا (مشتق من الـWorkspaces). غيّر الترتيب بالأسهم، أو أخفِ تاب بلا حذف الـWorkspace نفسه. التغيير يظهر فورًا بعد إعادة تحميل أي صفحة.")}
	</div>
	<div id="h-tm-list"></div>
	<div id="h-tm-empty" class="h-tm-empty" style="display:none">${__("جاري التحميل…")}</div>
	</div>
	`);

	const listEl = page.main.find("#h-tm-list")[0];
	const emptyEl = page.main.find("#h-tm-empty")[0];
	let tabs = [];

	function render() {
		listEl.innerHTML = "";
		if (!tabs.length) {
			emptyEl.style.display = "block";
			emptyEl.textContent = __("مفيش تابات");
			return;
		}
		emptyEl.style.display = "none";
		tabs.forEach(function (t, i) {
			const row = document.createElement("div");
			row.className = "h-tm-row" + (t.is_hidden ? " is-hidden" : "");

			let iconHtml = "";
			try { iconHtml = frappe.utils.icon(t.icon || "folder-normal", "sm"); } catch (e) {}
			const icon = document.createElement("span");
			icon.className = "h-tm-icon";
			icon.innerHTML = iconHtml;

			const label = document.createElement("span");
			label.className = "h-tm-label";
			// نداء Workspace المباشر بيرجّع label الخام بلا ترجمة — الشريط
			// الحقيقي بياخد نسخته المترجَمة من frappe.boot (desktop.py:
			// item["label"] = _(item.label)). __() هنا بيقرا نفس قاموس
			// الترجمة المحمَّل بالفعل في نفس الجلسة.
			label.textContent = __(t.label || t.title || t.name);

			const up = document.createElement("button");
			up.className = "h-tm-btn";
			up.textContent = "↑";
			up.disabled = i === 0;
			up.onclick = function () { move(i, i - 1); };

			const down = document.createElement("button");
			down.className = "h-tm-btn";
			down.textContent = "↓";
			down.disabled = i === tabs.length - 1;
			down.onclick = function () { move(i, i + 1); };

			const toggle = document.createElement("button");
			toggle.className = "h-tm-toggle" + (t.is_hidden ? "" : " on");
			toggle.textContent = t.is_hidden ? __("مخفي") : __("ظاهر");
			toggle.onclick = function () { setHidden(t, !t.is_hidden); };

			row.appendChild(icon);
			row.appendChild(label);
			row.appendChild(toggle);
			row.appendChild(up);
			row.appendChild(down);
			listEl.appendChild(row);
		});
	}

	function move(from, to) {
		const item = tabs.splice(from, 1)[0];
		tabs.splice(to, 0, item);
		render();
		frappe.call({
			method: "horizon_tab_theme.api.tab_manager.set_order",
			args: { names: tabs.map(function (t) { return t.name; }) },
		}).catch(function () { frappe.msgprint(__("تعذّر حفظ الترتيب")); });
	}

	function setHidden(t, hidden) {
		t.is_hidden = hidden ? 1 : 0;
		render();
		frappe.call({
			method: "horizon_tab_theme.api.tab_manager.set_hidden",
			args: { name: t.name, hidden: t.is_hidden },
		}).catch(function () { frappe.msgprint(__("تعذّر حفظ الحالة")); });
	}

	frappe.call({ method: "horizon_tab_theme.api.tab_manager.get_tabs" })
		.then(function (r) {
			tabs = r.message || [];
			render();
		})
		.catch(function () {
			emptyEl.style.display = "block";
			emptyEl.textContent = __("تعذّر تحميل التابات");
		});
};
