/* ═══════════════════════════════════════════════════════════
   GIOVANI FERREIRA — Portfolio Script
   Canvas BG · Typed Text · Scroll Reveal · Counters
═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Canvas Particle Network ───────────────────────────── */
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H, particles, animId;

  const GOLD  = 'rgba(212,175,55,';
  const COUNT = window.innerWidth < 768 ? 40 : 80;
  const DIST  = 140;
  const SPEED = .4;

  class Particle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : (Math.random() > .5 ? -5 : H + 5);
      this.vx = (Math.random() - .5) * SPEED;
      this.vy = (Math.random() - .5) * SPEED;
      this.r  = Math.random() * 1.5 + .5;
      this.a  = Math.random() * .5 + .1;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < -20 || this.x > W + 20 || this.y < -20 || this.y > H + 20) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = GOLD + this.a + ')';
      ctx.fill();
    }
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function init() {
    resize();
    particles = Array.from({ length: COUNT }, () => new Particle());
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < DIST) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = GOLD + (.15 * (1 - d / DIST)) + ')';
          ctx.lineWidth = .6;
          ctx.stroke();
        }
      }
    }
    animId = requestAnimationFrame(frame);
  }

  init();
  frame();
  window.addEventListener('resize', () => { cancelAnimationFrame(animId); init(); frame(); });
})();


/* ── Typed Text ────────────────────────────────────────── */
(function initTyped() {
  const el      = document.getElementById('typed');
  const phrases = [
    'Power BI Developer',
    'DAX Specialist',
    'Analytics Engineer',
    'Microsoft Fabric Expert',
    'Data Storyteller',
  ];
  let pi = 0, ci = 0, deleting = false, pause = 0;

  function tick() {
    const phrase = phrases[pi];
    if (!deleting) {
      el.textContent = phrase.slice(0, ++ci);
      if (ci === phrase.length) { deleting = true; pause = 60; }
      setTimeout(tick, 80);
    } else {
      if (pause-- > 0) return setTimeout(tick, 30);
      el.textContent = phrase.slice(0, --ci);
      if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; }
      setTimeout(tick, 45);
    }
  }
  setTimeout(tick, 600);
})();


/* ── Scroll Reveal ─────────────────────────────────────── */
(function initReveal() {
  const els = document.querySelectorAll('.reveal-up, .reveal-right');
  const io  = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        // Animate skill bars when visible
        const fill = e.target.querySelector('.level-fill');
        if (fill) fill.style.width = fill.style.getPropertyValue('--w') || fill.dataset.w;
        io.unobserve(e.target);
      }
    });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => io.observe(el));
})();


/* ── Scroll-triggered Counters ─────────────────────────── */
(function initCounters() {
  const counters = document.querySelectorAll('.counter');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target;
      const target = +el.dataset.target;
      const dur    = 1600;
      const start  = performance.now();
      const ease   = t => t < .5 ? 2*t*t : -1+(4-2*t)*t;

      function step(now) {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = Math.floor(ease(p) * target);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target;
      }
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: .5 });
  counters.forEach(c => io.observe(c));
})();


/* ── Skill Bar Init ────────────────────────────────────── */
(function initSkillBars() {
  document.querySelectorAll('.level-fill').forEach(el => {
    const w = getComputedStyle(el).getPropertyValue('--w').trim();
    // Store value, reset to 0 until revealed
    el.dataset.w = w;
    el.style.width = '0';
  });
})();


/* ── Navbar Scroll ─────────────────────────────────────── */
(function initNavbar() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  document.getElementById('hamburger').addEventListener('click', () => {
    nav.classList.toggle('nav-open');
  });

  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => nav.classList.remove('nav-open'));
  });
})();


/* ── Active Nav Link on Scroll ─────────────────────────── */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-links a');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: .4 });
  sections.forEach(s => io.observe(s));
})();


/* ── Contact Form ──────────────────────────────────────── */
(function initForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = form.querySelector('[type=submit]');
    btn.textContent = 'Mensagem enviada ✓';
    btn.style.background = 'linear-gradient(135deg, #4ade80, #16a34a)';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = 'Enviar mensagem <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
      btn.style.background = '';
      btn.disabled = false;
      form.reset();
    }, 4000);
  });
})();


/* ── Smooth hover glow on cards ────────────────────────── */
(function initCardGlow() {
  document.querySelectorAll('.project-card, .skill-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x    = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
      const y    = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
      card.style.setProperty('--mx', x + '%');
      card.style.setProperty('--my', y + '%');
    });
  });
})();


/* ── Staggered bar chart animation in mockup ───────────── */
(function animateMockBars() {
  const bars = document.querySelectorAll('.bar');
  bars.forEach((bar, i) => {
    bar.style.height = '0';
    setTimeout(() => {
      bar.style.transition = 'height .6s cubic-bezier(.16,1,.3,1)';
      bar.style.height = bar.style.getPropertyValue('--h') || '50%';
    }, 800 + i * 100);
  });
})();
