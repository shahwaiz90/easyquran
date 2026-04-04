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
              <li><a id="nav-quran" href="/quran/" class="${active === 'quran' ? 'active' : ''}">Quran & Hadith</a></li>
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

/* ════════════════════════════════════════════════════════════
   EQ SIDEBAR
   ════════════════════════════════════════════════════════════ */
class EQSidebar extends HTMLElement {
  connectedCallback() {
    const type = this.getAttribute('type') || 'hadith';
    const activeTab = this.getAttribute('active-tab') || '';

    this.innerHTML = `
      <style>
        .eq-sidebar {
            width: 280px;
            background: var(--primary-color, #1a4d2e); /* Forest Green Sync */
            color: white;
            height: 100vh;
            position: fixed;
            left: 0;
            top: 0;
            display: flex;
            flex-direction: column;
            padding: 30px 0;
            z-index: 1000;
            font-family: 'Inter', sans-serif !important;
            box-shadow: 4px 0 15px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }

        /* Mobile Responsive Sidebar */
        @media (max-width: 1024px) {
            .eq-sidebar {
                transform: translateX(-100%);
            }
            .eq-sidebar.open {
                transform: translateX(0);
            }
            
            /* Add overlay when sidebar is open */
            .sidebar-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0,0,0,0.5);
                z-index: 999;
                display: none;
                backdrop-filter: blur(2px);
            }
            .sidebar-overlay.active {
                display: block;
            }
        }

        .eq-sidebar .logo {
            display: flex;
            align-items: center;
            padding: 0 25px;
            margin-bottom: 40px;
        }
        .eq-sidebar .logo img {
            width: 32px;
            height: 32px;
            border-radius: 8px;
        }
        .eq-sidebar .logo span {
            font-size: 24px;
            font-weight: 700;
            color: white;
            margin-left: 12px;
            letter-spacing: -0.5px;
        }

        .eq-sidebar .nav-links {
            flex: 1;
            padding: 0 15px;
            overflow-y: auto;
        }

        .eq-sidebar .nav-link {
            display: flex !important;
            align-items: center !important;
            padding: 12px 15px !important;
            color: rgba(255, 255, 255, 0.7) !important;
            text-decoration: none !important;
            border-radius: 10px !important;
            margin-bottom: 5px !important;
            transition: all 0.2s ease !important;
            font-weight: 500 !important;
            font-size: 14px !important;
        }

        .eq-sidebar .nav-link:hover, 
        .eq-sidebar .nav-link.active {
            background: rgba(230, 244, 241, 0.15) !important;
            color: white !important;
        }

        .eq-sidebar .nav-link i, 
        .eq-sidebar .nav-link svg {
            margin-right: 15px !important;
            width: 20px !important;
            height: 20px !important;
            flex-shrink: 0;
        }

        .eq-sidebar .nav-divider {
            height: 1px;
            background: rgba(255, 255, 255, 0.1);
            margin: 20px 15px;
        }

        .eq-sidebar .nav-section-title {
            font-size: 11px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.4);
            padding: 0 10px;
            margin-bottom: 15px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .eq-sidebar .sidebar-footer {
            padding: 20px 25px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(0,0,0,0.1);
        }

        .eq-sidebar .select-modern {
            width: 100%;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.05);
            color: white;
            font-size: 13px;
            outline: none;
            cursor: pointer;
        }
        .eq-sidebar .select-modern option {
            background: #004D40;
            color: white;
        }
      </style>

      <aside class="eq-sidebar">
        <div class="logo" style="cursor: pointer;" onclick="window.location.href='/'">
            <img src="https://easyquran.app/newappicon.webp" alt="Logo">
            <span>Easy Quran</span>
        </div>

        <nav class="nav-links">
            <a href="/quran/" class="nav-link ${activeTab === 'quran' ? 'active' : ''}" id="tab-read">
                <i data-lucide="book-open"></i>
                <span>Read Quran</span>
            </a>
            <a href="/quran/full.html" class="nav-link ${activeTab === 'full-quran' ? 'active' : ''}" id="tab-full-quran">
                <i data-lucide="layout"></i>
                <span>Full Quran (Arabic)</span>
            </a>
            <a href="/hadith/" class="nav-link ${activeTab === 'hadith' ? 'active' : ''}" id="tab-hadith">
                <i data-lucide="library"></i>
                <span>Hadith Reader</span>
            </a>
            <a href="/quran/16-lines.html" class="nav-link ${activeTab === '16-lines' ? 'active' : ''}" id="tab-16-lines">
                <i data-lucide="book"></i>
                <span>16-Line Tajweed Quran</span>
            </a>

            <div class="nav-divider"></div>
            
            ${type === 'hadith' ? `
                <div class="nav-section-title">HADITH COLLECTIONS</div>
                <a href="/hadith/" class="nav-link" id="nav-hadith-main" data-collection="all">
                    <i data-lucide="layout-grid"></i>
                    <span>All Collections</span>
                </a>
                <div id="collections-list">
                    <a href="/hadith/bukhari/" class="nav-link" data-collection="bukhari"><i data-lucide="scroll"></i><span>Sahih al-Bukhari</span></a>
                    <a href="/hadith/muslim/" class="nav-link" data-collection="muslim"><i data-lucide="scroll"></i><span>Sahih Muslim</span></a>
                    <a href="/hadith/nasai/" class="nav-link" data-collection="nasai"><i data-lucide="scroll"></i><span>Sunan an-Nasa'i</span></a>
                    <a href="/hadith/abudawud/" class="nav-link" data-collection="abudawud"><i data-lucide="scroll"></i><span>Sunan Abi Dawud</span></a>
                    <a href="/hadith/tirmidhi/" class="nav-link" data-collection="tirmidhi"><i data-lucide="scroll"></i><span>Jami' at-Tirmidhi</span></a>
                    <a href="/hadith/ibnmajah/" class="nav-link" data-collection="ibnmajah"><i data-lucide="scroll"></i><span>Sunan Ibn Majah</span></a>
                    <a href="/hadith/malik/" class="nav-link" data-collection="malik"><i data-lucide="scroll"></i><span>Muwatta Malik</span></a>
                    <a href="/hadith/ahmad/" class="nav-link" data-collection="ahmad"><i data-lucide="scroll"></i><span>Musnad Ahmad</span></a>
                </div>
            ` : activeTab === 'full-quran' ? `
                <!-- Cleaned up per user request -->
            ` : `
                <div class="nav-section-title">Translations & Tools</div>
                <div style="padding: 0 10px;" id="quran-nav-lists">
                    <div id="translation-list" class="collections-list">
                        <!-- Populate via Quran JS -->
                    </div>
                    <div class="nav-divider"></div>
                    <div class="nav-section-title" style="margin-top: 20px;">Tafseer</div>
                    <div id="tafseer-list" class="collections-list">
                        <!-- Populate via Quran JS -->
                    </div>
                </div>
            `}
        </nav>
        </nav>
      </aside>
    `;

    // Add click listeners to links to close sidebar on mobile after navigating
    this.querySelectorAll('.nav-link, .logo').forEach(el => {
        el.addEventListener('click', () => {
            const sidebar = this.querySelector('.eq-sidebar');
            if (sidebar.classList.contains('open')) {
                this.toggle();
            }
        });
    });

    // Only run if lucide is available globally
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Auto-highlight based on current path
    this.updateActiveFromPath();
  }

  updateActiveFromPath() {
    const path = window.location.pathname.replace(/\/$/, '') || '/'; // Remove trailing slash for comparison
    const links = this.querySelectorAll('.nav-link');
    
    // Default: Clear all
    links.forEach(l => l.classList.remove('active'));

    // Highlight Read Quran / Full Quran / Hadith Reader tabs
    if (path.includes('/quran/full')) {
        const fullTab = this.querySelector('#tab-full-quran');
        if (fullTab) fullTab.classList.add('active');
    } else if (path.includes('/quran/16-lines')) {
        const linesTab = this.querySelector('#tab-16-lines');
        if (linesTab) linesTab.classList.add('active');
    } else if (path === '/quran' || path === '/quran/index.html' || (path.startsWith('/quran') && !path.includes('/full') && !path.includes('/16-lines'))) {
        const quranTab = this.querySelector('#tab-read');
        if (quranTab) quranTab.classList.add('active');
    } else if (path.startsWith('/hadith')) {
        const hadithTab = this.querySelector('#tab-hadith');
        if (hadithTab) hadithTab.classList.add('active');
        
        // ENFORCE ENGLISH ON HADITH HOME: Hide selector on the root hadith page
        const langFooter = this.querySelector('.sidebar-footer');
        if (langFooter && (path === '/hadith' || path === '/hadith/index.html')) {
            langFooter.style.display = 'none';
        } else if (langFooter) {
            langFooter.style.display = 'block';
        }
    }

    // Collection Level Highlighting
    if (path === '/hadith') {
        const globalHome = this.querySelector('[data-collection="all"]');
        if (globalHome) globalHome.classList.add('active');
    } else {
        links.forEach(link => {
            const href = link.getAttribute('href');
            // SKIP main reader tabs to prevent double-highlighting
            if (link.id === 'tab-read' || link.id === 'tab-full-quran' || link.id === 'tab-hadith') return;
            
            if (href) {
                const cleanHref = href.replace(/\/$/, '');
                // Precise match: collection links start with /hadith/COLL
                if (cleanHref !== '/hadith' && path.startsWith(cleanHref)) {
                    link.classList.add('active');
                }
            }
        });
    }
  }

  setAvailableLanguages(langs) {
    const select = this.querySelector('#hadith-lang-selector');
    if (!select) return;

    const options = select.querySelectorAll('option');
    options.forEach(opt => {
        // Arabic is always implied or handled separately sometimes, 
        // but here the dropdown is for translations.
        // Iflangs includes the option value, show it, otherwise hide.
        if (langs.includes(opt.value)) {
            opt.style.display = 'block';
            opt.disabled = false;
        } else {
            opt.style.display = 'none';
            opt.disabled = true;
        }
    });

    // If current selected value is now hidden, fallback to English
    if (select.selectedOptions[0]?.style.display === 'none') {
        select.value = 'en';
        // Trigger change if needed? Usually handle in the caller.
    }
  }

  toggle() {
    const sidebar = this.querySelector('.eq-sidebar');
    let overlay = document.querySelector('.sidebar-overlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
        overlay.onclick = () => this.toggle();
    }

    if (sidebar) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
        
        // Prevent body scrolling when menu is open
        if (sidebar.classList.contains('open')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
  }
}
customElements.define('eq-sidebar', EQSidebar);
/* ════════════════════════════════════════════════════════════
   EQ SEARCH BAR (Shared Component)
   ════════════════════════════════════════════════════════════ */
class EQSearchBar extends HTMLElement {
  constructor() {
    super();
    this.style.display = 'block';
    this.style.width = '100%';
  }

  connectedCallback() {
    const placeholder = this.getAttribute('placeholder') || 'What would you like to read?';
    const isReadOnly = this.hasAttribute('readonly');
    const id = this.getAttribute('id') || 'eq-search-input';

    this.innerHTML = `
      <style>
        .eq-search-container {
            background: white;
            border-radius: 18px;
            padding: 14px 30px; /* Precise match with Hadith padding */
            display: flex;
            align-items: center;
            width: 95%; /* Match Hadith's 95% expansion */
            max-width: 1200px;
            margin: 0 auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04), 0 2px 10px rgba(0,0,0,0.02);
            border: 1px solid rgba(0,0,0,0.06);
            transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
            cursor: ${isReadOnly ? 'pointer' : 'text'};
            position: relative;
            z-index: 10;
        }

        .eq-search-container:hover {
            background: #fdfdfd;
            box-shadow: 0 15px 50px rgba(0, 0, 0, 0.08);
        }

        .eq-search-container:focus-within {
            box-shadow: 0 20px 60px rgba(26, 77, 46, 0.12);
            transform: translateY(-2px);
            border-color: rgba(26, 77, 46, 0.2);
        }

        .eq-search-container i, 
        .eq-search-container svg {
            color: var(--primary-color, #1a4d2e);
            width: 22px;
            height: 22px;
            opacity: 0.8;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .eq-search-container input {
            background: transparent;
            border: none;
            outline: none;
            margin-left: 18px;
            width: 100%;
            font-size: 1.25rem; /* Expanded font size to match Hadith precisely */
            font-weight: 500;
            color: #2c3e50;
            letter-spacing: -0.2px;
            font-family: 'Inter', sans-serif !important;
            cursor: inherit;
        }

        .eq-search-container input::placeholder {
            color: #7f8c8d;
            opacity: 0.6;
            font-weight: 400;
        }

        .eq-search-shortcut {
            background: #f1f5f9;
            color: #94a3b8;
            padding: 4px 10px;
            border-radius: 6px;
            font-family: var(--main-font);
            font-size: 0.75rem;
            font-weight: 700;
            border: 1px solid #e2e8f0;
            margin-left: 10px;
            pointer-events: none;
        }

        @media (max-width: 768px) {
            .eq-search-container {
                padding: 10px 15px;
            }
            .eq-search-container input {
                font-size: 1rem;
                margin-left: 12px;
            }
            .eq-search-shortcut {
                display: none;
            }
        }
      </style>

      <div class="eq-search-container" id="container-${id}">
          <i data-lucide="search"></i>
          <input type="text" id="${id}" placeholder="${placeholder}" ${isReadOnly ? 'readonly' : ''} autocomplete="off">
          ${isReadOnly ? `<div class="eq-search-shortcut">/</div>` : ''}
      </div>
    `;

    // Initialize Lucide Icons if available
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}
customElements.define('eq-search-bar', EQSearchBar);
