// Same pattern as horizon_theme's own settings form, independently defined
// here since this is a separate app with its own doctype — not a shared
// script, on purpose, so this app has zero load-time dependency on
// horizon_theme being installed at all.
frappe.ui.form.on("Horizon Command Settings", {
	reset_to_defaults(frm) {
		frappe.confirm(
			"هيرجّع كل القيم للافتراضي — تأكيد؟",
			() => {
				frm.call("reset_to_defaults").then(() => {
					frm.reload_doc();
					frappe.show_alert({ message: "تم الاسترجاع", indicator: "green" });
				});
			}
		);
	},
});
