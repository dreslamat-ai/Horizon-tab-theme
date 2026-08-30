"""
Serves the current Horizon Command Settings as a stylesheet — same proven
mechanism as horizon_theme's own endpoint (see that app's api.py for the
fuller comment on why a raw werkzeug Response is used instead of a plain
`return`, which Frappe would otherwise wrap in a JSON envelope a
<link rel="stylesheet"> can't parse). Kept as its own independent copy
here rather than imported from horizon_theme, since this app is meant to
run with zero dependency on horizon_theme being installed at all.

Lives in api/__init__.py (not a sibling api.py) so that
horizon_tab_theme.api.theme_css stays reachable now that api/dashboard_feed
and api/tab_manager made `api` a package — a flat api.py alongside a
package of the same name is shadowed by the package on import, which
silently broke this endpoint (417 "no attribute theme_css") until this
merge.

🔴 تصحيح جوهري (٣٠ أغسطس، ردًا على "بتدمج ثيمين وده غلط"): الكروت/القوائم/
النماذج المنقولة من horizon_desk_theme كانت بتقرأ درجات لون ثابتة
(--h-navy-50..900, --h-blue-50..900) من _tokens.scss القديمة — أرقام
hex مجمَّدة، منفصلة تمامًا عن --h-navy/--h-blue الحيَّين اللي بيطلعهم
الإندبوينت ده من الإعدادات. النتيجة: غيّر primary_color من صفحة
الإعدادات، وشريط التابات بيتبعه لكن كل كارت وكل list-row hover فاضل
بلونه الافتراضي القديم — نظاما ألوان منفصلان فعليًا، بالظبط معنى
"دمج ثيمين". الإصلاح: الدرجات مش بتتنسخ تانية، بتتشتق هنا من نفس
اللون الحيّ (derive_ramp)، فتصير --h-navy-* درجات لنفس --h-navy لا
جدول منفصل. القيم الافتراضية (لو primary_color لسه #1D2D44) بتطلع
قريبة جدًا من الأرقام القديمة (فرق ببكسلات قليلة بسبب تقريب النسبة)
عمدًا — عشان مفيش قفزة بصرية للمواقع الحالية، بس أي لون جديد من
الإعدادات هيتبعه كل شيء من دلوقتي.
"""

import frappe
from werkzeug.wrappers import Response

DOCTYPE = "Horizon Command Settings"

# النسب دي مقيسة من _tokens.scss الأصلية (مش مخترَعة): لكل درجة، نسبة
# الخلط الخطّي (RGB) بين اللون الأساسي والأبيض ('w') أو الأسود ('b').
# navy مرتكزة على درجة ٦٠٠ (كانت هي --h-navy-600 نفسها)، blue على ٥٠٠
# (كانت هي --h-blue-500 نفسها) — نفس المرتكز اللي الإعدادات بتضبطه فعليًا.
_NAVY_RAMP_SHAPE = {
    50: ("w", .955), 100: ("w", .89), 200: ("w", .77), 300: ("w", .585),
    400: ("w", .385), 500: ("w", .205), 600: None,
    700: ("b", .195), 800: ("b", .355), 900: ("b", .58),
}
_BLUE_RAMP_SHAPE = {
    50: ("w", .93), 100: ("w", .875), 200: ("w", .705), 300: ("w", .5),
    400: ("w", .30), 500: None,
    600: ("b", .19), 700: ("b", .35), 800: ("b", .51), 900: ("b", .66),
}


def _hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _mix(base_rgb, target_rgb, t):
    return tuple(round(base_rgb[i] + (target_rgb[i] - base_rgb[i]) * t) for i in range(3))


def derive_ramp(base_hex, shape):
    """درجات تظليل/تفتيح حقيقية مشتقّة من لون حيّ واحد — بديل جدول
    الـhex الثابت المنفصل اللي كان سبب انفصال ألوان الكروت عن الإعدادات."""
    try:
        base_rgb = _hex_to_rgb(base_hex)
    except (ValueError, IndexError):
        base_rgb = _hex_to_rgb("#1D2D44")
    white, black = (255, 255, 255), (0, 0, 0)
    out = {}
    for step, spec in shape.items():
        if spec is None:
            rgb = base_rgb
        else:
            kind, frac = spec
            rgb = _mix(base_rgb, white if kind == "w" else black, frac)
        out[step] = "#%02X%02X%02X" % rgb
    return out

FONT_STACKS = {
    "Tajawal": ("'Tajawal','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
                "https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap"),
    "Cairo": ("'Cairo','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
              "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700;800;900&display=swap"),
    "Inter": ("'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
              "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap"),
    "System Default": ("-apple-system,BlinkMacSystemFont,'Segoe UI',Tahoma,sans-serif", None),
}

# the one setting distinctive to this app: density is Command Center's whole
# identity, so — unlike horizon_theme, which never needed a density toggle —
# it's the one structural (not just colour) variable this endpoint controls
DENSITY = {
    "مضغوط (Command Center)": ("6px 10px", ".87rem"),
    "عادي": ("9px 12px", ".92rem"),
}


@frappe.whitelist(allow_guest=True)
def theme_css():
    """Returns text/css. allow_guest=True for the same reason as
    horizon_theme's endpoint: horizon_command_web.css (the login page) needs
    it too, and nothing served here is sensitive."""
    settings = frappe.get_single(DOCTYPE)

    font_choice = settings.font_family or "Tajawal"
    font_stack, font_url = FONT_STACKS.get(font_choice, FONT_STACKS["Tajawal"])

    form_pad, form_font = DENSITY.get(settings.form_density or "", DENSITY["مضغوط (Command Center)"])
    # tab bar overflow behaviour — the sidebar-era width/state settings are
    # gone entirely (that sidebar no longer exists), replaced by this one
    shrink_tabs = (settings.tab_overflow or "") == "تصغير التابات"

    lines = []
    if font_url:
        lines.append(f"@import url('{font_url}');")

    navy_base = settings.primary_color or "#1D2D44"
    blue_base = settings.success_color or "#5083BC"

    lines.append(":root{")
    lines.append(f"  --h-navy: {navy_base};")
    lines.append(f"  --h-steel: {settings.accent_color or '#8FA8CC'};")
    lines.append(f"  --h-blue: {blue_base};")
    lines.append(f"  --h-amber: {settings.pending_color or '#B8860B'};")
    lines.append(f"  --h-green: {settings.approved_color or '#4E7A5C'};")
    lines.append(f"  --h-red: {settings.rejected_color or '#B04A3F'};")
    lines.append(f"  --h-font: {font_stack};")
    radius = settings.control_radius if settings.control_radius is not None else 7
    lines.append(f"  --h-r-sm: {radius}px;")
    lines.append(f"  --h-form-pad: {form_pad};")
    lines.append(f"  --h-form-font: {form_font};")

    # الدرجات دي هي اللي كروت البوستر/القوائم/النماذج المنقولة من
    # horizon_desk_theme بتقرأها فعليًا — قبل كده كانت مجمَّدة على
    # #1D2D44/#5083BC في CSS منفصل، فمكانتش بتتحرك مع الإعدادات
    for step, hexv in derive_ramp(navy_base, _NAVY_RAMP_SHAPE).items():
        lines.append(f"  --h-navy-{step}: {hexv};")
    for step, hexv in derive_ramp(blue_base, _BLUE_RAMP_SHAPE).items():
        lines.append(f"  --h-blue-{step}: {hexv};")

    # نفس المنطق للظلال — كانت rgba(29,45,68,..) ثابتة (نفس navy-600
    # الافتراضي حرفيًا)، بقت مشتقّة من navy_base الحيّ
    try:
        shadow_rgb = ",".join(str(c) for c in _hex_to_rgb(navy_base))
    except (ValueError, IndexError):
        shadow_rgb = "29,45,68"
    lines.append(f"  --h-shadow-1: 0 1px 3px rgba({shadow_rgb},.06);")
    lines.append(f"  --h-shadow-2: 0 6px 16px rgba({shadow_rgb},.08);")
    lines.append(f"  --h-shadow-3: 0 16px 36px rgba({shadow_rgb},.14);")

    lines.append("}")

    # "shrink tabs" is a second, narrower rule rather than a variable:
    # tightening padding/font is a set of declarations, not a single value,
    # so a rule expresses it more directly than three separate custom props
    if shrink_tabs:
        lines.append(".h-tab{ padding: 7px 10px 6px !important; font-size: .76rem !important; }")

    css = "\n".join(lines)
    return Response(css, mimetype="text/css", headers={"Cache-Control": "no-store"})
