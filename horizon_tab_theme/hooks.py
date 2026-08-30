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
    "/assets/horizon_tab_theme/css/horizon_command.css",
    # منقول من horizon_desk_theme (٣٠ أغسطس) — كروت البوستر، النماذج،
    # القوائم. لازم يفضل قبل theme_css عشان الإعدادات الحيّة تكسب أي
    # تعارض بترتيب التحميل، مش !important.
    # ?v= (٣٠ أغسطس، تصحيح الدمج): كلاودفلير قدام *.horizonerp.cloud بيكاش
    # الأصول الثابتة — نفس درس صفحة الدخول، لازم رقم نسخة جديد مع أي تعديل.
    "/assets/horizon_tab_theme/css/horizon_module_poster.css?v=20260830f",
    "/api/method/horizon_tab_theme.api.theme_css",
]
app_include_js = [
    "/assets/horizon_tab_theme/js/horizon_command_tabs.js",
    # منقولون من horizon_desk_theme (٣٠ أغسطس) — بلا horizon_rail.bundle.js
    # (الرايل بديله شريط التابات) ولا horizon_desk_theme.bundle.js (كان
    # بيحقن --primary كـinline style على <html>، بيغلب theme_css) ولا
    # horizon_desktop.bundle.js (سطح مكتب overlay كامل، هيتعارض بصريًا مع
    # بروتوتايب داشبورد البنتو الموجود فعلًا — قرار منفصل مؤجَّل).
    "/assets/horizon_tab_theme/js/horizon_module_poster.bundle.js?v=20260830f",
    "/assets/horizon_tab_theme/js/horizon_widget_cluster.bundle.js?v=20260830f",
    "/assets/horizon_tab_theme/js/horizon_form_layout.bundle.js?v=20260830f",
    "/assets/horizon_tab_theme/js/horizon_list_layout.bundle.js?v=20260830f",
    "/assets/horizon_tab_theme/js/horizon_module_layout.bundle.js?v=20260830f",
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
    "/assets/horizon_tab_theme/css/horizon_command_web.css?v=20260830e",  # نفس درس كاش كلاودفلير — بلا رقم نسخة إضافة .h-alaa-fab ماكانتش هتوصل خالص
    "/api/method/horizon_tab_theme.api.theme_css",
]
web_include_js = [
    # زرار "اتكلم مع ألاء" العايم — إضافي بحت، بلا أي لمس لمنطق تسجيل
    # الدخول. رابط ثابت لـhorizonerp.cloud (ألاء مركّبة هناك فعليًا) —
    # قرار مؤقت لحد ما يُحدَّد وجهة أدق (واتساب دعم مثلًا).
    "/assets/horizon_tab_theme/js/horizon_login_alaa.js?v=20260830e",  # كلاودفلير قدام e.horizonerp بيكاش الملفات الثابتة — نفس درس ?v= المسجَّل قبل كده
]
