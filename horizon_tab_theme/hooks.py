app_name = "horizon_tab_theme"
app_title = "Horizon Tab Theme"
app_publisher = "Horizon Smart Systems"
app_description = (
    "The flagship Desk theme for Horizon's SaaS tenants — a dense, "
    "table-first 'Command Center' visual direction (formerly shipped as "
    "horizon_command; renamed when the sidebar was replaced with a top tab "
    "bar), plus a built-in bento dashboard component layer for Workspace "
    "HTML Blocks. A SEPARATE app from horizon_theme (the calmer, more "
    "spacious general-purpose reskin) — not an extension of it, no shared "
    "assets, no dependency either way. One Single DocType (Horizon Command "
    "Settings — kept its original name; renaming it would rename its live "
    "database table) and one small API endpoint that serves it as a "
    "stylesheet; no other business logic."
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
    "/assets/horizon_tab_theme/css/horizon_command.css?v=20260830h",  # كلاودفلير بيكاش الأصول الثابتة بلا نسخة — نفس درس اليوم المتكرر
    "/api/method/horizon_tab_theme.api.theme_css",
]
app_include_js = [
    "/assets/horizon_tab_theme/js/horizon_command_tabs.js",
]
# horizon_command_tabs.js is the ONLY static JavaScript in this app (kept
# its filename across the rename — only the app folder/import path changed)
# and it never reads Frappe-internal data (no workspace list, no boot info,
# no route state): it relocates the sidebar's own <a> elements into a tab
# bar and adds html.h-tabs-ready only once that succeeds — nothing here
# reads a CSS custom property for a default state (that was the old rail's
# behaviour; the tab bar has none). See the file's own header comment.

# ---------------------------------------------------------------------------
# Website / portal pages (/login, /me, error pages). Desk assets above do NOT
# load here — Frappe serves web pages through a separate bundle — so the
# login screen needs its own small stylesheet, and the SAME live settings
# endpoint (it's allow_guest=True for exactly this reason).
# ---------------------------------------------------------------------------
web_include_css = [
    "/assets/horizon_tab_theme/css/horizon_command_web.css?v=20260901e",  # كلاودفلير بيكاش الأصول الثابتة بلا نسخة — نفس درس app_include_css أعلاه، ورقم النسخة لازم يتغيّر مع كل تعديل لنفس الملف لا مرة واحدة فقط
    "/api/method/horizon_tab_theme.api.theme_css",
]
web_include_js = [
    "/assets/horizon_tab_theme/js/horizon_login_welcome.js?v=20260901d",
]

# ---------------------------------------------------------------------------
# لوحة بنتو الرئيسية — كانت بلوكًا يتيمًا في قاعدة بيانات سموك بس (مش
# متتبَّع في الريبو، أي تركيب تاني للتطبيق ماكانش هيجيبه). بقت fixture
# رسمية هنا (٣٠ أغسطس) فتتزرع تلقائيًا مع أي تركيب/ترحيل لـhorizon_tab_theme.
# ---------------------------------------------------------------------------
fixtures = [
    {"dt": "Custom HTML Block", "filters": [["name", "=", "home-bento-dashboard-prototype"]]},
]
