import re

import frappe
from frappe.model.document import Document

HEX_RE = re.compile(r"^#(?:[0-9a-fA-F]{3}){1,2}$")

DEFAULTS = {
    "primary_color": "#1D2D44",
    "accent_color": "#8FA8CC",
    "success_color": "#5083BC",
    "pending_color": "#B8860B",
    "approved_color": "#4E7A5C",
    "rejected_color": "#B04A3F",
    "font_family": "Tajawal",
    "control_radius": 7,
    "form_density": "مضغوط (Command Center)",
    "tab_overflow": "تمرير أفقي",
}

COLOR_FIELDS = ("primary_color", "accent_color", "success_color",
                "pending_color", "approved_color", "rejected_color")


class HorizonCommandSettings(Document):
    def validate(self):
        for field in COLOR_FIELDS:
            value = (self.get(field) or "").strip()
            if value and not HEX_RE.match(value):
                frappe.throw(f"'{value}' ليس لون hex صالح — استخدم صيغة زي #1D2D44")

        if self.control_radius is not None:
            self.control_radius = max(0, min(24, int(self.control_radius)))

    @frappe.whitelist()
    def reset_to_defaults(self):
        for field, value in DEFAULTS.items():
            self.set(field, value)
        self.save()
        return "ok"
