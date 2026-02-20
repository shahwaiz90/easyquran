class EQHeader extends HTMLElement {
  connectedCallback() {
    const active = this.getAttribute('active') || '';

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
              <li><a href="index.html" class="${active === 'home' ? 'active' : ''}">Home</a></li>
              <li><a href="goals.html" class="${active === 'goals' ? 'active' : ''}" style="color:#F6AD55; font-weight:bold;">Ramadan Goals</a></li>
              <li><a href="features.html" class="${active === 'features' ? 'active' : ''}">Features</a></li>
              <li><a href="reviews.html" class="${active === 'reviews' ? 'active' : ''}">Reviews</a></li>
              <li><a href="listenquran.html" class="${active === 'listen' ? 'active' : ''}">Listen Quran</a></li>
              <!-- Button link to App Store -->
              <li>
                <a href="https://play.google.com/store/apps/details?id=com.ahmadshahwaiz.easyquran" class="btn-nav-accent">
                  <span>📲</span> Get App
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    `;

    const toggle = this.querySelector('.menu-toggle');
    const nav = this.querySelector('.nav-links');

    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        nav.classList.toggle('show');
      });
    }

    // Auto-spawn decorations
    requestAnimationFrame(() => {
      this.spawnDecorations();
      this.setupScrollAnimations();
    });
  }

  spawnDecorations() {
    const bg = document.createElement('div');
    bg.className = 'ramadan-bg-container';

    // Create random stars
    for (let i = 0; i < 30; i++) {
      const star = document.createElement('div');
      star.className = 'star-deco';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      star.style.opacity = Math.random() * 0.5 + 0.1;
      bg.appendChild(star);
    }

    // Create Lanterns (Hanging from top)
    const lanternPositions = [10, 85, 92]; // percentages
    lanternPositions.forEach(pos => {
      const lantern = document.createElement('div');
      lantern.className = 'lantern-deco';
      lantern.style.left = pos + '%';
      lantern.style.height = (Math.random() * 40 + 40) + 'px'; // Random length
      lantern.style.animationDelay = Math.random() * 2 + 's';
      bg.appendChild(lantern);
    });

    document.body.prepend(bg);
  }

  setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('section, h2, .feature-card, .goal-card').forEach(el => {
      el.classList.add('fade-up');
      observer.observe(el);
    });
  }
}
customElements.define('eq-header', EQHeader);

class EQFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer>
        <div class="container">
          <div class="footer-content">
            <div class="footer-links">
               <a href="index.html">Home</a>
               <a href="goals.html" style="color:#F6AD55; font-weight:bold;">Ramadan Goals</a>
               <a href="listenquran.html">Listen Quran</a>
               <a href="privacy-policy.html">Privacy Policy</a>
               <a href="sitemap.xml">Sitemap</a>
            </div>
            <div class="social-links">
              <a href="mailto:ahmadshahwaiz@gmail.com" title="Email" aria-label="Email">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/></svg>
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
