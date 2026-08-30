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


@frappe.whitelist()
def get_kpi_metrics():
	"""كروت الـKPI الأربعة في البروتوتايب كانت أرقامًا ثابتة (بلاغ المالك
	"شغل باقي البنتو بيانات حقيقية"، ٣٠ أغسطس). كل رقم هنا مُشتق من نفس
	قواعد المحاسبة اللي فرابي/إيربكست نفسهم بيستخدموها (GL Entry لهامش
	الربح، get_balance_on للنقدي، Work Order للانحراف) — مفيش رقم مختلَق.
	حالة الفراغ صريحة (None لكل قيمة) بدل صفر مضلِّل لما مفيش بيانات كفاية
	— نفس مبدأ get_dashboard_feed أعلاه ("مفيش فواتير لسه" لا فاتورة وهمية).
	"""
	from frappe.utils import flt, nowdate, add_days, get_first_day, get_last_day
	from erpnext.accounts.utils import get_balance_on

	result = {"net_cash": None, "cost_deviation": None, "margin": None}
	# مواقع بلا erpnext (مثلًا control.horizonerp.cloud — بنية تحتية بس)
	# مالهاش Global Defaults ولا الدوكتايبات المحاسبية دي أصلًا
	if "Global Defaults" not in frappe.get_all("DocType", pluck="name", filters={"name": "Global Defaults"}):
		return result
	company = frappe.db.get_single_value("Global Defaults", "default_company")
	if not company:
		return result

	# ١) صافي المركز النقدي — مجموع أرصدة حسابات البنك/الكاش الفعلية
	# اليوم مقابل نفس المجموع من ٧ أيام (اتجاه حقيقي، مش رقم واحد معلَّق)
	try:
		bank_cash_accounts = frappe.get_all(
			"Account",
			filters={"account_type": ["in", ["Bank", "Cash"]], "is_group": 0, "company": company},
			pluck="name",
		)
		# صفر بلا أي حركة (٠ صف GL) يُعامل كبيانات غير كافية لا رصيد حقيقي —
		# نفس مبدأ "مفيش فواتير لسه" فوق: صفر مسكوت عنه بيبان كأنه عطل
		# لعميل تجريبي لسه ماسجّلش حركة بنكية، مش رصيد فعلي يستاهل يتعرض
		if bank_cash_accounts and frappe.db.count("GL Entry", {"account": ["in", bank_cash_accounts]}):
			today_total = sum(flt(get_balance_on(a, date=nowdate())) for a in bank_cash_accounts)
			week_ago_total = sum(flt(get_balance_on(a, date=add_days(nowdate(), -7))) for a in bank_cash_accounts)
			trend_pct = ((today_total - week_ago_total) / week_ago_total * 100) if week_ago_total else 0
			result["net_cash"] = {"value": today_total, "trend_pct": trend_pct}
	except Exception:
		frappe.log_error(title="Bento KPI: net_cash")

	# ٢) انحراف التكلفة — أوامر تشغيل الشهر الحالي، فعلي مقابل مخطَّط
	try:
		month_start = get_first_day(nowdate())
		work_orders = frappe.get_all(
			"Work Order",
			filters={"docstatus": 1, "company": company, "planned_start_date": [">=", month_start]},
			fields=["name", "planned_operating_cost", "actual_operating_cost"],
		)
		total_planned = sum(flt(w.planned_operating_cost) for w in work_orders)
		total_actual = sum(flt(w.actual_operating_cost) for w in work_orders)
		if total_planned:
			deviation_pct = (total_actual - total_planned) / total_planned * 100
			worst = max(
				work_orders,
				key=lambda w: abs(flt(w.actual_operating_cost) - flt(w.planned_operating_cost)),
			)
			result["cost_deviation"] = {
				"value": deviation_pct,
				"worst_order": worst["name"],
				"worst_share_pct": (
					abs(flt(worst.actual_operating_cost) - flt(worst.planned_operating_cost))
					/ abs(total_actual - total_planned) * 100
				) if (total_actual - total_planned) else 0,
			}
	except Exception:
		frappe.log_error(title="Bento KPI: cost_deviation")

	# ٣) هامش الشهر الحالي — (دخل - مصروف) / دخل من GL Entry مباشرة،
	# نفس الأساس اللي تقرير الأرباح والخسائر في فرابي نفسه بيبني عليه
	try:
		month_start = get_first_day(nowdate())
		month_end = get_last_day(nowdate())
		income = frappe.db.sql(
			"""select sum(gle.credit - gle.debit) from `tabGL Entry` gle
			join `tabAccount` acc on acc.name = gle.account
			where acc.root_type = 'Income' and acc.company = %s
			and gle.posting_date between %s and %s and gle.is_cancelled = 0""",
			(company, month_start, month_end),
		)[0][0] or 0
		expense = frappe.db.sql(
			"""select sum(gle.debit - gle.credit) from `tabGL Entry` gle
			join `tabAccount` acc on acc.name = gle.account
			where acc.root_type = 'Expense' and acc.company = %s
			and gle.posting_date between %s and %s and gle.is_cancelled = 0""",
			(company, month_start, month_end),
		)[0][0] or 0
		# حارس سلامة: دخل ضئيل جدًا (شركة تجريبية، شهر بلا حركة تقريبًا)
		# مع مصروف بالسالب (قيود عكس/تسوية) بيطلّع نسبة مهووسة (اتقاس فعليًا:
		# ١٠٧١٥٪ على شركة تجريبية بدخل ١٣٠٠ ومصروف -١٣٨٠٠٠) — رقم مضلِّل
		# أخطر من غيابه. لو النتيجة برّه مدى منطقي، تُعامل كبيانات غير كافية.
		if income and income > 0:
			margin_pct = (income - expense) / income * 100
			if -100 <= margin_pct <= 100:
				result["margin"] = {"value": margin_pct}
	except Exception:
		frappe.log_error(title="Bento KPI: margin")

	return result
