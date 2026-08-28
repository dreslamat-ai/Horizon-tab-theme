app_name = "horizon_command"
app_title = "Horizon Command"
app_publisher = "Horizon Smart Systems"
app_description = (
    "The flagship Desk theme for Horizon's SaaS tenants — a dense, "
    "table-first 'Command Center' visual direction, plus a built-in bento "
    "dashboard component layer for Workspace HTML Blocks. A SEPARATE app "
    "from horizon_theme (the calmer, more spacious general-purpose "
    "reskin) — not an extension of it, no shared assets, no dependency "
    "either way. One Single DocType (Horizon Command Settings) and one "
    "small API endpoint that serves it as a stylesheet; no other business "
    "logic."
)
app_email = "support@horizonerp.cloud"
app_license = "MIT"
required_apps = []  # theme-only: installs cleanly alongside any app, including ERPNext/HRMS

# ---------------------------------------------------------------------------
# Desk (the /app workspace).
#
# Load order: horizon_command.css first (defines every --h-* variable,
# including --h-form-pad/--h-form-font for the density layer, with its
# shipped defaults) — then the live settings endpoint last, so it wins the
# cascade purely by loading later. No !important needed.
#
# JetBrains Mono is NOT part of Horizon Command Settings (only the main UI
# font is user-configurable) — it stays a plain static include.
# ---------------------------------------------------------------------------
app_include_css = [
    "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600&display=swap",
    "/assets/horizon_command/css/horizon_command.css",
    "/api/method/horizon_command.api.theme_css",
]
app_include_js = [
    "/assets/horizon_command/js/horizon_command_tabs.js",
]
# horizon_command_tabs.js is the ONLY static JavaScript in this app, and —
# same as horizon_theme's equivalent file — it never reads Frappe-internal
# data (no workspace list, no boot info, no route state): it only toggles a
# class on <html>, reads the one CSS custom property the settings endpoint
# above sets for it (--h-rail-default-collapsed), and listens for generic
# click events. See the file's own header comment for the full reasoning.

# ---------------------------------------------------------------------------
# Website / portal pages (/login, /me, error pages). Desk assets above do NOT
# load here — Frappe serves web pages through a separate bundle — so the
# login screen needs its own small stylesheet, and the SAME live settings
# endpoint (it's allow_guest=True for exactly this reason).
# ---------------------------------------------------------------------------
web_include_css = [
    "/assets/horizon_command/css/horizon_command_web.css",
    "/api/method/horizon_command.api.theme_css",
]
