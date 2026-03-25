/* ─────────────────────────────────────────────────────────────
   Easy Quran – Shared Web Components
   EQHeader  →  <eq-header active="home">
   EQFooter  →  <eq-footer>
   ───────────────────────────────────────────────────────────── */

/* ════════════════════════════════════════════════════════════
   EQ HEADER
   ════════════════════════════════════════════════════════════ */
class EQHeader extends HTMLElement {
  connectedCallback() {
    const active = this.getAttribute('active') || '';

    this.innerHTML = `
      <header>
        <div class="container">
          <nav aria-label="Primary">
            <a href="/" class="logo">
              <div class="logo-icon" aria-hidden="true"></div>
              <span class="logo-text">Easy Quran</span>
            </a>
            <button class="menu-toggle" aria-label="Toggle menu">☰</button>
            <ul class="nav-links">
              <li><a id="nav-home" href="/"       class="${active === 'home' ? 'active' : ''}">Home</a></li>
              <li><a id="nav-goals" href="/goals.html"       class="${active === 'goals' ? 'active' : ''}" style="color:#F6AD55;font-weight:bold;">Quran Goals</a></li>
              <li><a id="nav-features" href="/features.html"    class="${active === 'features' ? 'active' : ''}">Features</a></li>
              <li><a id="nav-reviews" href="/reviews.html"     class="${active === 'reviews' ? 'active' : ''}">Reviews</a></li>
              <li><a id="nav-ambassadors" href="/ambassadors.html" class="${active === 'ambassadors' ? 'active' : ''}">Join us as Ambassador</a></li>
              <li><a id="nav-listen" href="/listenquran.html" class="${active === 'listen' ? 'active' : ''}">Listen Quran</a></li>
              <li>
                <a href="https://play.google.com/store/apps/details?id=com.ahmadshahwaiz.easyquran" class="btn-nav-accent">
                  📲 Get App
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <style>
        .logo-text {
          font-family: Inter, system-ui, -apple-system, sans-serif !important;
        }
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

  spawnDecorations() {
    const bg = document.createElement('div');
    bg.className = 'goals-bg-container';
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
               <a href="/">Home</a>
               <a href="goals.html" style="color:#F6AD55;font-weight:bold;">Quran Goals</a>
               <a href="listenquran.html">Listen Quran</a>
               <a href="privacy-policy.html">Privacy Policy</a>
               <a href="sitemap.xml">Sitemap</a>
            </div>
            <div class="social-links">
              <a href="mailto:ahmadshahwaiz@gmail.com" title="Email" aria-label="Email">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/></svg>
              </a>
              <a href="https://www.instagram.com/easyquran.app/" target="_blank" rel="noopener" aria-label="Instagram">
                <img src="/icons/instagram.png" alt="Instagram" style="width:28px;height:28px;">
              </a>
              <a href="https://www.youtube.com/@easyquranapp/shorts" target="_blank" rel="noopener" aria-label="YouTube">
                <img src="/icons/youtube.png" alt="YouTube" style="width:28px;height:28px;">
              </a>
              <a href="https://www.tiktok.com/@easyquran.app" target="_blank" rel="noopener" aria-label="TikTok">
                <img src="/icons/tiktok.png" alt="TikTok" style="width:28px;height:28px;">
              </a>
              <a href="https://www.facebook.com/profile.php?id=61586484481410" target="_blank" rel="noopener" aria-label="Facebook">
                <img src="/icons/facebook.png" alt="Facebook" style="width:28px;height:28px;">
              </a>
            </div>
          </div>
          <div class="copyright">
            &copy; 2026 Easy Quran. All rights reserved. Made with ❤️ for the Muslim Ummah
          </div>
        </div>
      </footer>
    `;
  }
}
customElements.define('eq-footer', EQFooter);
