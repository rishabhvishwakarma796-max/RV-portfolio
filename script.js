document.addEventListener('DOMContentLoaded', () => {

  /* ─── Video Background Autoplay ─── */
  const bgVideos = document.querySelectorAll('.bg-video');

  /* Tap-to-play banner shown when autoplay is blocked */
  const tapBanner = document.createElement('div');
  tapBanner.id = 'tap-to-play';
  tapBanner.innerHTML = `<span>▶ Click anywhere to play background video</span>`;
  tapBanner.style.cssText = `
    position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
    background:rgba(0,240,255,0.12); border:1px solid rgba(0,240,255,0.3);
    color:rgba(0,240,255,0.9); padding:10px 24px; border-radius:50px;
    font-size:0.85rem; letter-spacing:1px; z-index:9999;
    backdrop-filter:blur(10px); cursor:pointer;
    transition:opacity 0.5s ease; pointer-events:auto; display:none;
  `;
  document.body.appendChild(tapBanner);

  let autoplayBlocked = false;

  function hideBanner() {
    tapBanner.style.opacity = '0';
    setTimeout(() => { tapBanner.style.display = 'none'; }, 500);
  }

  function forcePlayVideo(v) {
    v.muted = true;
    v.volume = 0;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    if (v.paused) {
      return v.play();
    }
    return Promise.resolve();
  }

  function playAllVideos() {
    const promises = [];
    bgVideos.forEach(v => {
      v.muted = true;
      v.volume = 0;
      if (v.paused) promises.push(v.play().catch(e => e));
    });
    return Promise.all(promises);
  }

  function attemptAutoplay() {
    const plays = [];
    bgVideos.forEach(v => {
      v.muted = true;
      v.volume = 0;
      v.loop = true;
      v.setAttribute('muted', '');
      plays.push(
        v.play().then(() => {
          autoplayBlocked = false;
        }).catch(() => {
          autoplayBlocked = true;
        })
      );
    });

    Promise.all(plays).then(() => {
      if (autoplayBlocked) {
        /* Show banner to guide user */
        tapBanner.style.display = 'block';
        requestAnimationFrame(() => { tapBanner.style.opacity = '1'; });
      }
    });
  }

  /* On any user interaction — play videos and hide banner */
  function unlockOnInteraction() {
    playAllVideos().then(() => hideBanner());
    /* Remove all listeners */
    ['click','touchstart','keydown','scroll','mousedown','pointerdown'].forEach(e =>
      document.removeEventListener(e, unlockOnInteraction)
    );
  }

  ['click','touchstart','keydown','scroll','mousedown','pointerdown'].forEach(evt =>
    document.addEventListener(evt, unlockOnInteraction, { once: false, passive: true })
  );

  tapBanner.addEventListener('click', unlockOnInteraction);

  /* Resume on tab focus / visibility change */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) playAllVideos();
  });
  window.addEventListener('focus', () => playAllVideos());

  /* Per-video resilience */
  bgVideos.forEach(v => {
    v.muted = true;
    v.volume = 0;
    v.loop = true;
    v.addEventListener('canplay', () => { if (v.paused) forcePlayVideo(v).catch(() => {}); });
    v.addEventListener('stalled', () => { v.load(); setTimeout(() => forcePlayVideo(v).catch(() => {}), 400); });
    v.addEventListener('pause', () => { if (!document.hidden && !autoplayBlocked) forcePlayVideo(v).catch(() => {}); });
  });

  /* Kick off initial play */
  if (document.readyState === 'complete') {
    attemptAutoplay();
  } else {
    window.addEventListener('load', attemptAutoplay);
  }

  /* ─── Solar System Animation ─── */
  const solarCanvas = document.getElementById('solar-canvas');
  const solarCtx = solarCanvas && solarCanvas.getContext ? solarCanvas.getContext('2d') : null;
  let sw, sh;

  function resizeSolar() {
    sw = solarCanvas.width = window.innerWidth;
    sh = solarCanvas.height = window.innerHeight;
  }
  resizeSolar();
  window.addEventListener('resize', resizeSolar);

  const planets = [
    { name: 'Mercury', dist: 0.12, size: 3, speed: 0.008, color: '#b5b5b5', angle: 0 },
    { name: 'Venus',   dist: 0.18, size: 5, speed: 0.005, color: '#e8cda0', angle: 1.2 },
    { name: 'Earth',   dist: 0.25, size: 5.5, speed: 0.004, color: '#4b8bf5', angle: 2.8 },
    { name: 'Mars',    dist: 0.32, size: 4, speed: 0.0032, color: '#e27b58', angle: 4.1 },
    { name: 'Jupiter', dist: 0.4, size: 9, speed: 0.002, color: '#c8a06e', angle: 0.5 },
    { name: 'Saturn',  dist: 0.48, size: 7.5, speed: 0.0015, color: '#e8d5a3', angle: 3.3 },
  ];

  function drawSolarSystem() {
    solarCtx.clearRect(0, 0, sw, sh);
    const cx = sw / 2;
    const cy = sh / 2;
    const maxR = Math.min(sw, sh) * 0.42;

    /* orbital rings */
    planets.forEach(p => {
      const r = p.dist * maxR;
      solarCtx.beginPath();
      solarCtx.arc(cx, cy, r, 0, Math.PI * 2);
      solarCtx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
      solarCtx.lineWidth = 0.8;
      solarCtx.stroke();
    });

    /* sun glow — large outer aura */
    const sunAura = solarCtx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.18);
    sunAura.addColorStop(0, 'rgba(255, 220, 80, 0.25)');
    sunAura.addColorStop(0.3, 'rgba(255, 180, 30, 0.12)');
    sunAura.addColorStop(0.6, 'rgba(255, 120, 0, 0.04)');
    sunAura.addColorStop(1, 'rgba(255, 100, 0, 0)');
    solarCtx.fillStyle = sunAura;
    solarCtx.beginPath();
    solarCtx.arc(cx, cy, maxR * 0.18, 0, Math.PI * 2);
    solarCtx.fill();

    /* sun core */
    const sunCore = solarCtx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.04);
    sunCore.addColorStop(0, '#fffbe6');
    sunCore.addColorStop(0.2, '#ffe066');
    sunCore.addColorStop(0.5, '#ffaa22');
    sunCore.addColorStop(0.8, '#ff6600');
    sunCore.addColorStop(1, '#cc3300');
    solarCtx.fillStyle = sunCore;
    solarCtx.beginPath();
    solarCtx.arc(cx, cy, maxR * 0.04, 0, Math.PI * 2);
    solarCtx.fill();

    /* planets */
    planets.forEach(p => {
      p.angle += p.speed;
      const r = p.dist * maxR;
      const px = cx + r * Math.cos(p.angle);
      const py = cy + r * Math.sin(p.angle);

      /* planet glow */
      const glow = solarCtx.createRadialGradient(px, py, 0, px, py, p.size * 4);
      glow.addColorStop(0, p.color + '60');
      glow.addColorStop(0.4, p.color + '20');
      glow.addColorStop(1, p.color + '00');
      solarCtx.fillStyle = glow;
      solarCtx.beginPath();
      solarCtx.arc(px, py, p.size * 4, 0, Math.PI * 2);
      solarCtx.fill();

      /* planet core */
      solarCtx.fillStyle = p.color;
      solarCtx.beginPath();
      solarCtx.arc(px, py, p.size, 0, Math.PI * 2);
      solarCtx.fill();

      /* Saturn ring */
      if (p.name === 'Saturn') {
        solarCtx.strokeStyle = 'rgba(232,213,163,0.35)';
        solarCtx.lineWidth = 2.5;
        solarCtx.beginPath();
        solarCtx.ellipse(px, py, p.size * 1.8, p.size * 0.4, p.angle * 0.3, 0, Math.PI * 2);
        solarCtx.stroke();
      }
    });

    requestAnimationFrame(drawSolarSystem);
  }
  drawSolarSystem();

  /* ─── RV Portfolio Brand Animation ─── */
  const brandCanvas = document.getElementById('brand-canvas');
  const brandCtx = brandCanvas && brandCanvas.getContext ? brandCanvas.getContext('2d') : null;
  let bw, bh;
  let brandAngle = 0;

  function resizeBrand() {
    bw = brandCanvas.width = window.innerWidth;
    bh = brandCanvas.height = window.innerHeight;
  }
  resizeBrand();
  window.addEventListener('resize', resizeBrand);

  function drawBrand() {
    brandCtx.clearRect(0, 0, bw, bh);
    brandAngle += 0.0015;
    const cx = bw / 2;
    const cy = bh / 2;
    const offsetX = Math.sin(brandAngle * 0.7) * bw * 0.02;
    const offsetY = Math.cos(brandAngle * 0.5) * bh * 0.015;
    const scale = 1 + 0.02 * Math.sin(brandAngle * 0.3);

    brandCtx.save();
    brandCtx.translate(cx + offsetX, cy + offsetY);
    brandCtx.scale(scale, scale);
    brandCtx.rotate(Math.sin(brandAngle * 0.4) * 0.02);

    const text = 'RV Portfolio';
    const fontSize = Math.min(bw * 0.12, bh * 0.12, 120);
    brandCtx.font = `700 ${fontSize}px Kalam, cursive`;
    brandCtx.textAlign = 'center';
    brandCtx.textBaseline = 'middle';

    /* outer glow */
    brandCtx.shadowColor = '#00f0ff';
    brandCtx.shadowBlur = 60;
    brandCtx.fillStyle = 'rgba(0, 240, 255, 0.06)';
    brandCtx.fillText(text, 0, 0);

    brandCtx.shadowBlur = 30;
    brandCtx.shadowColor = '#8a2be2';
    brandCtx.fillStyle = 'rgba(138, 43, 226, 0.05)';
    brandCtx.fillText(text, 0, 0);

    brandCtx.shadowBlur = 0;
    const grad = brandCtx.createLinearGradient(-fontSize * 2.5, 0, fontSize * 2.5, 0);
    grad.addColorStop(0, 'rgba(0, 240, 255, 0.07)');
    grad.addColorStop(0.4, 'rgba(138, 43, 226, 0.08)');
    grad.addColorStop(0.6, 'rgba(138, 43, 226, 0.08)');
    grad.addColorStop(1, 'rgba(0, 240, 255, 0.07)');
    brandCtx.fillStyle = grad;
    brandCtx.fillText(text, 0, 0);

    /* subtle outline stroke for definition */
    brandCtx.shadowBlur = 0;
    brandCtx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
    brandCtx.lineWidth = 1.5;
    brandCtx.strokeText(text, 0, 0);

    brandCtx.restore();
    requestAnimationFrame(drawBrand);
  }
  drawBrand();

  /* ─── Animated Gradient Mesh ─── */
  const gCanvas = document.getElementById('gradient-canvas');
  const gCtx = gCanvas && gCanvas.getContext ? gCanvas.getContext('2d') : null;
  let gw, gh;
  let time = 0;

  function resizeGradient() {
    gw = gCanvas.width = window.innerWidth;
    gh = gCanvas.height = window.innerHeight;
  }
  resizeGradient();
  window.addEventListener('resize', resizeGradient);

  function drawGradient() {
    time += 0.003;
    gCtx.clearRect(0, 0, gw, gh);

    const cx1 = gw * (0.5 + 0.3 * Math.sin(time * 0.7));
    const cy1 = gh * (0.5 + 0.3 * Math.cos(time * 0.5));
    const cx2 = gw * (0.5 + 0.3 * Math.cos(time * 0.9));
    const cy2 = gh * (0.5 + 0.3 * Math.sin(time * 0.6));
    const cx3 = gw * (0.5 + 0.3 * Math.sin(time * 1.1 + 1));
    const cy3 = gh * (0.5 + 0.3 * Math.cos(time * 0.8 + 1));

    const grad1 = gCtx.createRadialGradient(cx1, cy1, 0, cx1, cy1, gw * 0.5);
    grad1.addColorStop(0, 'rgba(0, 240, 255, 0.03)');
    grad1.addColorStop(1, 'rgba(0, 240, 255, 0)');

    const grad2 = gCtx.createRadialGradient(cx2, cy2, 0, cx2, cy2, gw * 0.45);
    grad2.addColorStop(0, 'rgba(138, 43, 226, 0.025)');
    grad2.addColorStop(1, 'rgba(138, 43, 226, 0)');

    const grad3 = gCtx.createRadialGradient(cx3, cy3, 0, cx3, cy3, gw * 0.4);
    grad3.addColorStop(0, 'rgba(0, 255, 136, 0.015)');
    grad3.addColorStop(1, 'rgba(0, 255, 136, 0)');

    gCtx.fillStyle = grad1;
    gCtx.fillRect(0, 0, gw, gh);
    gCtx.fillStyle = grad2;
    gCtx.fillRect(0, 0, gw, gh);
    gCtx.fillStyle = grad3;
    gCtx.fillRect(0, 0, gw, gh);

    requestAnimationFrame(drawGradient);
  }
  drawGradient();

  /* ─── Particle Network ─── */
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  let particles = [];
  let w, h;

  function resizeCanvas() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.size = Math.random() * 2.5 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.4 + 0.15;
      this.pulse = Math.random() * Math.PI * 2;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.pulse += 0.02;
      if (this.x < 0 || this.x > w) this.speedX *= -1;
      if (this.y < 0 || this.y > h) this.speedY *= -1;
    }
    draw() {
      const glow = 0.5 + 0.5 * Math.sin(this.pulse);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 240, 255, ${this.opacity * glow})`;
      ctx.fill();
    }
  }

  function initParticles() {
    const count = Math.min(Math.floor((w * h) / 9000), 80);
    particles = Array.from({ length: count }, () => new Particle());
  }
  initParticles();
  window.addEventListener('resize', () => { resizeCanvas(); initParticles(); });

  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.05 * (1 - dist / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => { p.update(); p.draw(); });
    drawLines();
    requestAnimationFrame(animateParticles);
  }
  animateParticles();

  /* ─── Typing Animation ─── */
  function typeText(element, text, speed, callback) {
    if (!element) { if (callback) callback(); return; }
    let i = 0;
    element.textContent = '';
    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else if (callback) {
        callback();
      }
    }
    type();
  }

  const typedName = document.querySelector('.typed-name');
  const typedTitle = document.querySelector('.typed-title');
  const nameText = 'Rishabh Vishwakarma';
  const titles = ['Web Developer', 'MERN Stack Developer', 'Spring Boot Expert', 'Next.js Enthusiast'];
  let titleIndex = 0;

  function typeName() {
    typeText(typedName, nameText, 80, typeTitleLoop);
  }

  function typeTitleLoop() {
    function cycleTitle() {
      if (!typedTitle) return;
      const current = titles[titleIndex % titles.length];
      let i = 0;
      typedTitle.textContent = '';
      function type() {
        if (i < current.length) {
          typedTitle.textContent += current.charAt(i);
          i++;
          setTimeout(type, 50);
        } else {
          titleIndex++;
          setTimeout(() => {
            let j = current.length;
            function erase() {
              if (j > 0) {
                typedTitle.textContent = current.substring(0, j - 1);
                j--;
                setTimeout(erase, 25);
              } else {
                setTimeout(cycleTitle, 500);
              }
            }
            setTimeout(erase, 2000);
          }, 2500);
        }
      }
      type();
    }
    cycleTitle();
  }

  typeName();

  /* ─── Counter Animation ─── */
  const statNumbers = document.querySelectorAll('.stat-number[data-count]');
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'));
        let current = 0;
        const increment = Math.ceil(target / 40);
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            el.textContent = target + '+';
            clearInterval(timer);
          } else {
            el.textContent = current;
          }
        }, 30);
        statObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => statObserver.observe(el));

  /* ─── Navbar Menu ─── */
  const navbar    = document.getElementById('navbar');
  const navToggle = document.getElementById('nav-toggle');
  const navMenu   = document.getElementById('nav-menu');
  const navLinks  = document.querySelectorAll('.nav-link');

  if (navToggle && navMenu) {

    /* Backdrop overlay */
    const navOverlay = document.createElement('div');
    navOverlay.className = 'nav-overlay';
    document.body.appendChild(navOverlay);

    function openMenu() {
      navToggle.classList.add('active');
      navMenu.classList.add('active');
      navOverlay.classList.add('show');
      navToggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('no-scroll');
      navLinks[0]?.focus();
    }

    function closeMenu() {
      navToggle.classList.remove('active');
      navMenu.classList.remove('active');
      navOverlay.classList.remove('show');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('no-scroll');
      navToggle.focus();
    }

    function toggleMenu() {
      if (navMenu.classList.contains('active')) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    /* Main toggle click */
    navToggle.addEventListener('click', toggleMenu);

    /* Toggle on Enter / Space key */
    navToggle.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMenu();
      }
    });

    /* Close on backdrop click */
    navOverlay.addEventListener('click', closeMenu);

    /* Close when a link is clicked */
    navLinks.forEach(function(link) {
      link.addEventListener('click', closeMenu);
    });

    /* Close on Escape key + focus back to toggle */
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeMenu();
      }
    });

    /* Trap focus within open menu */
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Tab' && navMenu.classList.contains('active')) {
        const focusable = navMenu.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    /* Close on resize to desktop */
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768) closeMenu();
    });

    /* Highlight active page link */
    navLinks.forEach(function(link) {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('#')) {
        const current = window.location.pathname.split('/').pop() || 'index.html';
        if (current === href || window.location.href.endsWith('/' + href)) {
          link.classList.add('active');
        }
      }
    });

    /* Navbar scroll style */
    function onScroll() {
      if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
    }
    onScroll();
    window.addEventListener('scroll', onScroll);

  } /* end navToggle && navMenu */

  /* ─── Reveal Animations ─── */
  const glassCards = document.querySelectorAll('.glass');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  glassCards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `all 0.6s ease ${i * 0.1}s`;
    observer.observe(card);
  });

  const skillItems = document.querySelectorAll('.skill-item');
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        skillObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  skillItems.forEach((item, i) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = `all 0.5s ease ${i * 0.05}s`;
    skillObserver.observe(item);
  });

  /* ─── Contact Form ─── */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const subject = document.getElementById('subject').value || 'Portfolio Inquiry';
      const message = document.getElementById('message').value;
      const mailto = `mailto:rvish230801@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;
      window.location.href = mailto;
    });
  }

});
