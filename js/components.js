/* ─────────────────────────────────────────────────────────────
   Easy Quran – Shared Web Components
   EQHeader  →  <eq-header active="home">
   EQFooter  →  <eq-footer>
   ───────────────────────────────────────────────────────────── */

/* ── Inject i18n engine once (before any component renders) ── */
(function injectI18n() {
  if (document.querySelector('script[src*="i18n.js"]')) return; // already loaded
  const s = document.createElement('script');
  s.src = 'js/i18n.js';
  s.defer = true;
  document.head.appendChild(s);
})();

/* ── RTL body style helper (Urdu / Arabic) ───────────────── */
const RTL_CSS = `
  .rtl .nav-links { direction: rtl; }
  .rtl .footer-links { direction: rtl; }
  .rtl .lang-switcher { margin-left: 0; margin-right: auto; }
`;
(function injectRTLStyle() {
  const st = document.createElement('style');
  st.textContent = RTL_CSS;
  document.head.appendChild(st);
})();

/* ════════════════════════════════════════════════════════════
   EQ HEADER
   ════════════════════════════════════════════════════════════ */
class EQHeader extends HTMLElement {
  connectedCallback() {
    const active = this.getAttribute('active') || '';
    // Stay within /ur/ when navigating from a Urdu page
    const isUrdu = window.location.pathname.includes('/ur/');
    const L = isUrdu ? 'ur/' : '';   // nav link prefix

    this.innerHTML = `
      <header>
        <div class="container">
          <nav aria-label="Primary">
            <a href="index.html" class="logo">
              <div class="logo-icon" aria-hidden="true" style="background-image: url('newappicon.webp'); background-size: cover;"></div>
              <span class="logo-text">Easy Quran</span>
            </a>
            <button class="menu-toggle" aria-label="Toggle menu">☰</button>
            <ul class="nav-links">
              <li><a href="${L}index.html"       class="${active === 'home' ? 'active' : ''}" data-i18n="nav.home">Home</a></li>
              <li><a href="${L}goals.html"       class="${active === 'goals' ? 'active' : ''}" style="color:#F6AD55;font-weight:bold;" data-i18n="nav.goals">Ramadan Goals</a></li>
              <li><a href="${L}features.html"    class="${active === 'features' ? 'active' : ''}" data-i18n="nav.features">Features</a></li>
              <li><a href="${L}reviews.html"     class="${active === 'reviews' ? 'active' : ''}" data-i18n="nav.reviews">Reviews</a></li>
              <li><a href="${L}listenquran.html" class="${active === 'listen' ? 'active' : ''}" data-i18n="nav.listen">Listen Quran</a></li>
              <li>
                <a href="https://play.google.com/store/apps/details?id=com.ahmadshahwaiz.easyquran" class="btn-nav-accent">
                  <span data-i18n="nav.get_app">📲 Get App</span>
                </a>
              </li>
              <!-- Language switcher -->
              <li class="lang-switcher" aria-label="Language switcher"
                  style="display:flex;align-items:center;gap:6px;margin-left:8px;">
                <button class="lang-btn ${this._activeLang() === 'en' ? 'lang-btn--active' : ''}"
                        data-lang="en"
                        onclick="EQi18n.setLang('en')"
                        title="English"
                        style="background:none;border:1px solid rgba(255,255,255,0.4);color:#fff;border-radius:6px;padding:4px 10px;font-size:13px;cursor:pointer;font-weight:600;transition:all 0.2s;">
                  EN
                </button>
                <button class="lang-btn ${this._activeLang() === 'ur' ? 'lang-btn--active' : ''}"
                        data-lang="ur"
                        onclick="EQi18n.setLang('ur')"
                        title="اردو"
                        style="background:none;border:1px solid rgba(255,255,255,0.4);color:#fff;border-radius:6px;padding:4px 10px;font-size:13px;cursor:pointer;font-weight:600;transition:all 0.2s;">
                  UR
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <style>
        .lang-btn--active {
          background: rgba(255,255,255,0.25) !important;
          border-color: #F6AD55 !important;
          color: #F6AD55 !important;
        }
        .lang-btn:hover { background: rgba(255,255,255,0.15) !important; }
      </style>
    `;

    const toggle = this.querySelector('.menu-toggle');
    const nav = this.querySelector('.nav-links');
    if (toggle && nav) {
      toggle.addEventListener('click', () => nav.classList.toggle('show'));
    }

    requestAnimationFrame(() => {
      this.spawnDecorations();
      this.setupScrollAnimations();
    });
  }

  _activeLang() {
    return localStorage.getItem('eq-lang') || 'en';
  }

  spawnDecorations() {
    const bg = document.createElement('div');
    bg.className = 'ramadan-bg-container';
    for (let i = 0; i < 30; i++) {
      const star = document.createElement('div');
      star.className = 'star-deco';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      star.style.opacity = Math.random() * 0.5 + 0.1;
      bg.appendChild(star);
    }
    const lanternPositions = [10, 85, 92];
    lanternPositions.forEach(pos => {
      const lantern = document.createElement('div');
      lantern.className = 'lantern-deco';
      lantern.style.left = pos + '%';
      lantern.style.height = (Math.random() * 40 + 40) + 'px';
      lantern.style.animationDelay = Math.random() * 2 + 's';
      bg.appendChild(lantern);
    });
    document.body.prepend(bg);
  }

  setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('section:not(.hero):not(.goals-hero), h2, .feature-card:not(.hero *)').forEach(el => {
      el.classList.add('fade-up');
      observer.observe(el);
    });
  }
}
customElements.define('eq-header', EQHeader);

/* ════════════════════════════════════════════════════════════
   EQ FOOTER
   ════════════════════════════════════════════════════════════ */
class EQFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer>
        <div class="container">
          <div class="footer-content">
            <div class="footer-links">
               <a href="index.html"          data-i18n="footer.home">Home</a>
               <a href="goals.html"          style="color:#F6AD55;font-weight:bold;" data-i18n="footer.goals">Ramadan Goals</a>
               <a href="listenquran.html"    data-i18n="footer.listen">Listen Quran</a>
               <a href="privacy-policy.html" data-i18n="footer.privacy">Privacy Policy</a>
               <a href="sitemap.xml"         data-i18n="footer.sitemap">Sitemap</a>
            </div>
            <div class="social-links">
              <a href="mailto:ahmadshahwaiz@gmail.com" title="Email" aria-label="Email">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/></svg>
              </a>
            </div>
          </div>
          <div class="copyright" data-i18n="footer.copyright">
            &copy; 2026 Easy Quran. All rights reserved. Made with ❤️ for the Muslim Ummah
          </div>
        </div>
      </footer>
    `;
  }
}
customElements.define('eq-footer', EQFooter);
