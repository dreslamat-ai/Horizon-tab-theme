"""إدارة ترتيب/إظهار تابات شريط Horizon — بلا صفحة كانت موجودة لده.

بلاغ المالك (٣٠ أغسطس): "عاوز اشوف صفحة اعدادات الثيم خصوصا ترتيب
التابات والاضافة والحذف". التابات مش عنصر مستقل — منسوخة تلقائيًا من
قائمة Workspace الفعلية (horizon_command_tabs.js: topLevelWorkspaces)،
فـ"الترتيب" هنا فعليًا هو `sequence_id` بتاع الـWorkspace، و"الحذف"
هو `is_hidden`. الصفحة دي واجهة مباشرة لنفس الحقلين، بدل ما المستخدم
يفتح كل Workspace لوحده من واجهة فرابي الأصلية.
"""
import frappe

ROLE = "System Manager"


@frappe.whitelist()
def get_tabs():
	frappe.only_for(ROLE)
	return frappe.get_all(
		"Workspace",
		filters={"parent_page": ["in", ["", None]]},
		fields=["name", "label", "title", "icon", "sequence_id", "is_hidden"],
		order_by="sequence_id asc, title asc",
	)


@frappe.whitelist()
def set_order(names):
	frappe.only_for(ROLE)
	names = frappe.parse_json(names)
	for idx, name in enumerate(names):
		frappe.db.set_value("Workspace", name, "sequence_id", idx + 1, update_modified=False)
	frappe.db.commit()
	return "ok"


@frappe.whitelist()
def set_hidden(name, hidden):
	frappe.only_for(ROLE)
	frappe.db.set_value("Workspace", name, "is_hidden", int(frappe.utils.cint(hidden)), update_modified=False)
	frappe.db.commit()
	return "ok"
