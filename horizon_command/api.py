"""
Serves the current Horizon Command Settings as a stylesheet — same proven
mechanism as horizon_theme's own endpoint (see that app's api.py for the
fuller comment on why a raw werkzeug Response is used instead of a plain
`return`, which Frappe would otherwise wrap in a JSON envelope a
<link rel="stylesheet"> can't parse). Kept as its own independent copy
here rather than imported from horizon_theme, since this app is meant to
run with zero dependency on horizon_theme being installed at all.
"""

import frappe
from werkzeug.wrappers import Response

DOCTYPE = "Horizon Command Settings"

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

    collapsed_by_default = "1" if (settings.sidebar_default_state or "").startswith("مقفول") else "0"
    form_pad, form_font = DENSITY.get(settings.form_density or "", DENSITY["مضغوط (Command Center)"])

    lines = []
    if font_url:
        lines.append(f"@import url('{font_url}');")

    lines.append(":root{")
    lines.append(f"  --h-navy: {settings.primary_color or '#1D2D44'};")
    lines.append(f"  --h-steel: {settings.accent_color or '#8FA8CC'};")
    lines.append(f"  --h-blue: {settings.success_color or '#5083BC'};")
    lines.append(f"  --h-amber: {settings.pending_color or '#B8860B'};")
    lines.append(f"  --h-green: {settings.approved_color or '#4E7A5C'};")
    lines.append(f"  --h-red: {settings.rejected_color or '#B04A3F'};")
    lines.append(f"  --h-font: {font_stack};")
    radius = settings.control_radius if settings.control_radius is not None else 7
    lines.append(f"  --h-r-sm: {radius}px;")
    rail_w = max(48, min(120, settings.rail_collapsed_width or 68))
    rail_open = max(160, min(360, settings.rail_open_width or 232))
    lines.append(f"  --h-rail-w: {rail_w}px;")
    lines.append(f"  --h-rail-w-open: {rail_open}px;")
    lines.append(f"  --h-rail-default-collapsed: {collapsed_by_default};")
    lines.append(f"  --h-form-pad: {form_pad};")
    lines.append(f"  --h-form-font: {form_font};")
    lines.append("}")

    css = "\n".join(lines)
    return Response(css, mimetype="text/css", headers={"Cache-Control": "no-store"})
