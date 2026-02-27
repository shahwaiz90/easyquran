/**
 * Easy Quran – i18n Engine
 * Usage:  Add data-i18n="key.path" to any element.
 *         The engine loads /locales/{lang}.json and replaces innerHTML.
 * Adding a new language: just add a new JSON file in /locales/ and list it in SUPPORTED.
 */
(function () {
    const SUPPORTED = ['en', 'ur'];   // ← add new language codes here
    const RTL_LANGS = ['ur', 'ar'];  // ← languages that need right-to-left layout

    let translations = {};
    let currentLang = 'en';

    /* ── Language detection ──────────────────────────────── */
    function detectLang() {
        const saved = localStorage.getItem('eq-lang');
        if (saved && SUPPORTED.includes(saved)) return saved;

        const browser = (navigator.language || 'en').slice(0, 2).toLowerCase();
        return SUPPORTED.includes(browser) ? browser : 'en';
    }

    /* ── Load locale JSON ────────────────────────────────── */
    async function loadLocale(lang) {
        try {
            const res = await fetch(`locales/${lang}.json?v=2`);
            if (!res.ok) throw new Error(res.status);
            return await res.json();
        } catch (e) {
            console.warn(`[i18n] Could not load locale "${lang}", keeping English.`);
            return {};
        }
    }

    /* ── Resolve a dotted key like "hero.title" ─────────── */
    function t(key) {
        return key.split('.').reduce((obj, k) => obj?.[k], translations) ?? '';
    }

    /* ── Apply translations to DOM ──────────────────────── */
    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const val = t(el.getAttribute('data-i18n'));
            if (val) el.innerHTML = val;
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const val = t(el.getAttribute('data-i18n-placeholder'));
            if (val) el.placeholder = val;
        });
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const val = t(el.getAttribute('data-i18n-aria'));
            if (val) el.setAttribute('aria-label', val);
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const val = t(el.getAttribute('data-i18n-title'));
            if (val) el.title = val;
        });
    }

    /* ── Set RTL / LTR direction and lang attribute ─────── */
    function applyDirection(lang) {
        const isRTL = RTL_LANGS.includes(lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.body?.classList.toggle('rtl', isRTL);
    }

    /* ── Update language switcher buttons ───────────────── */
    function updateSwitcherUI(lang) {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('lang-btn--active', btn.dataset.lang === lang);
        });
    }

    /* ── Public API ──────────────────────────────────────── */
    window.EQi18n = {
        async init() {
            currentLang = detectLang();
            if (currentLang === 'en') return; // English is already in HTML; no fetch needed
            translations = await loadLocale(currentLang);
            applyDirection(currentLang);
            applyTranslations();
            updateSwitcherUI(currentLang);
        },

        async setLang(lang) {
            if (!SUPPORTED.includes(lang)) return;
            currentLang = lang;
            localStorage.setItem('eq-lang', lang);

            if (lang === 'en') {
                // Reload the page so the native English HTML shows cleanly
                location.reload();
                return;
            }

            translations = await loadLocale(lang);
            applyDirection(lang);
            applyTranslations();
            updateSwitcherUI(lang);
        },

        getCurrentLang: () => currentLang,
        t,
        SUPPORTED,
    };

    /* ── Auto-init after DOM is ready ───────────────────── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => EQi18n.init());
    } else {
        EQi18n.init();
    }
})();
