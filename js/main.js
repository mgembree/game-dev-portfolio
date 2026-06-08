/* =====================================================
   MAIN.JS — Matthew Embree Portfolio
   ===================================================== */

'use strict';

// ── NAV: sticky scroll state ──────────────────────────
const header = document.getElementById('site-header');
const root = document.documentElement;
const hero = document.getElementById('hero');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function handleScroll() {
  header.classList.toggle('is-scrolled', window.scrollY > 24);

  const scrollHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const pageProgress = Math.min(Math.max(window.scrollY / scrollHeight, 0), 1);
  root.style.setProperty('--page-scroll-progress', pageProgress.toFixed(3));
  root.style.setProperty('--page-ambient-x', Math.sin(pageProgress * Math.PI * 2).toFixed(3));
  root.style.setProperty('--page-ambient-y', Math.cos(pageProgress * Math.PI * 1.5).toFixed(3));

  if (!hero || prefersReducedMotion) return;

  const heroRect = hero.getBoundingClientRect();
  const windowHeight = window.innerHeight || 1;

  // Progress from 0 to 1 while hero scrolls through view.
  const progress = Math.min(Math.max(-heroRect.top / windowHeight, 0), 1);
  root.style.setProperty('--hero-scroll-progress', progress.toFixed(3));
}

window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll(); // run once on load

// ── HERO: parallax motion + pointer response ─────────
if (hero && !prefersReducedMotion) {
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  let rafId = null;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const updatePointerTarget = (clientX, clientY) => {
    const rect = hero.getBoundingClientRect();
    const xNorm = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    const yNorm = ((clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1;
    targetX = clamp(xNorm, -1, 1);
    targetY = clamp(yNorm, -1, 1);
  };

  const animateParallax = () => {
    pointerX += (targetX - pointerX) * 0.08;
    pointerY += (targetY - pointerY) * 0.08;

    root.style.setProperty('--hero-parallax-x', pointerX.toFixed(3));
    root.style.setProperty('--hero-parallax-y', pointerY.toFixed(3));

    if (Math.abs(targetX - pointerX) > 0.001 || Math.abs(targetY - pointerY) > 0.001) {
      rafId = requestAnimationFrame(animateParallax);
      return;
    }

    rafId = null;
  };

  const queueParallax = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(animateParallax);
  };

  hero.addEventListener('pointermove', (event) => {
    updatePointerTarget(event.clientX, event.clientY);
    queueParallax();
  }, { passive: true });

  hero.addEventListener('pointerleave', () => {
    targetX = 0;
    targetY = 0;
    queueParallax();
  }, { passive: true });

  // Mobile fallback: subtle parallax based on scroll if pointer input is absent.
  if (window.matchMedia('(pointer: coarse)').matches) {
    const applyCoarseParallax = () => {
      const viewportHeight = window.innerHeight || 1;
      const ratio = clamp(window.scrollY / viewportHeight, 0, 1);
      targetX = 0;
      targetY = ratio * 0.35;
      queueParallax();
    };

    window.addEventListener('scroll', applyCoarseParallax, { passive: true });
    applyCoarseParallax();
  }
}

// ── NAV: mobile toggle ────────────────────────────────
const navToggle = document.getElementById('nav-toggle');
const navLinks  = document.getElementById('nav-links');

navToggle.addEventListener('click', () => {
  const isOpen = navToggle.classList.toggle('is-open');
  navLinks.classList.toggle('is-open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

// Close mobile nav when any link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeMobileNav);
});

function closeMobileNav() {
  navToggle.classList.remove('is-open');
  navLinks.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

// ── SCROLL REVEAL ─────────────────────────────────────
// General elements with class="reveal"
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target); // animate once
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -48px 0px' }
);

document.querySelectorAll('.reveal').forEach(el => {
  revealObserver.observe(el);
});

// ── GAME CARDS: staggered reveal ──────────────────────
// Cards use the same .reveal class but stagger via setTimeout
const cardObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card  = entry.target;
        const index = parseInt(card.getAttribute('data-index') || '0', 10);
        setTimeout(() => {
          card.classList.add('is-visible');
        }, index * 120);
        cardObserver.unobserve(card);
      }
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.game-card').forEach(card => {
  cardObserver.observe(card);
});

// ── GAME CARDS: full-card case study navigation ──────
document.querySelectorAll('.game-card--link[data-case-study]').forEach((card) => {
  const targetHref = card.dataset.caseStudy;

  if (!targetHref) return;

  const shouldIgnoreTarget = (target) => target.closest('a, button, input, textarea, select, label');

  card.addEventListener('click', (event) => {
    if (shouldIgnoreTarget(event.target)) return;
    window.location.href = targetHref;
  });

  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (shouldIgnoreTarget(event.target)) return;
    event.preventDefault();
    window.location.href = targetHref;
  });
});

// ── ACTIVE NAV LINK on scroll ─────────────────────────
const sections  = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav__link');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navAnchors.forEach(a => {
          a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`);
        });
      }
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);

sections.forEach(section => sectionObserver.observe(section));
