"""أحدث الفواتير + آخر الأنشطة في داشبورد البنتو — بيانات حقيقية بدل النص الجاهز.

بلاغ المالك (٣٠ أغسطس): "ايه فايدتهم وانا مش قادر اضغط عليهم" — جدول
الفواتير وقائمة الأنشطة في البروتوتايب كانا نصًا ثابتًا (مؤسسة الأفق،
شركة النخيل...) بلا روابط حقيقية. هنا استعلام حقيقي + رابط فعلي لكل
صف يفتح المستند نفسه في فرابي.
"""
import frappe


def arabic_time_ago(dt):
	"""فرابي pretty_date بترجع إنجليزي دايمًا بغض النظر عن لغة الموقع —
	نفس صيغة النص الجاهز في البروتوتايب الأصلي (قبل ١٠ د / قبل ساعة)."""
	diff = frappe.utils.now_datetime() - frappe.utils.get_datetime(dt)
	seconds = diff.total_seconds()
	if seconds < 60:
		return "الآن"
	minutes = int(seconds // 60)
	if minutes < 60:
		return f"قبل {minutes} د"
	hours = int(minutes // 60)
	if hours < 24:
		return f"قبل {hours} س"
	days = int(hours // 24)
	if days < 7:
		return f"قبل {days} يوم"
	weeks = int(days // 7)
	return f"قبل {weeks} أسبوع"


DOCTYPE_ROUTE = {
	"Sales Invoice": "sales-invoice",
	"Journal Entry": "journal-entry",
	"Payment Entry": "payment-entry",
}


@frappe.whitelist()
def get_dashboard_feed():
	invoices = frappe.get_all(
		"Sales Invoice",
		filters={"docstatus": 1},
		fields=["name", "customer", "grand_total", "outstanding_amount"],
		order_by="creation desc",
		limit_page_length=3,
	)
	for inv in invoices:
		inv["paid"] = (inv.get("outstanding_amount") or 0) <= 0
		inv["url"] = f"/desk/sales-invoice/{inv['name']}"

	activities = []

	si_rows = frappe.get_all(
		"Sales Invoice",
		filters={"docstatus": 1},
		fields=["name", "customer", "modified"],
		order_by="modified desc",
		limit_page_length=3,
	)
	for r in si_rows:
		activities.append({
			"label": f"فاتورة {r['name']} — {r.get('customer') or ''}",
			"modified": str(r["modified"]),
			"url": f"/desk/{DOCTYPE_ROUTE['Sales Invoice']}/{r['name']}",
			"color": "--h-blue",
		})

	je_rows = frappe.get_all(
		"Journal Entry",
		filters={"docstatus": 1},
		fields=["name", "modified"],
		order_by="modified desc",
		limit_page_length=3,
	)
	for r in je_rows:
		activities.append({
			"label": f"تم اعتماد قيد {r['name']}",
			"modified": str(r["modified"]),
			"url": f"/desk/{DOCTYPE_ROUTE['Journal Entry']}/{r['name']}",
			"color": "--h-green",
		})

	pe_rows = frappe.get_all(
		"Payment Entry",
		filters={"docstatus": 1},
		fields=["name", "party", "modified"],
		order_by="modified desc",
		limit_page_length=3,
	)
	for r in pe_rows:
		activities.append({
			"label": f"سند {r['name']} — {r.get('party') or ''}",
			"modified": str(r["modified"]),
			"url": f"/desk/{DOCTYPE_ROUTE['Payment Entry']}/{r['name']}",
			"color": "--h-amber",
		})

	activities.sort(key=lambda a: a["modified"], reverse=True)
	activities = activities[:3]
	for a in activities:
		a["time_ago"] = arabic_time_ago(a["modified"])

	return {"invoices": invoices, "activities": activities}
