/* Reveal progressivo por seção. Sem dependência externa. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = document.querySelectorAll(
    '#hero > *, .sec-head, .entry, .mini, .principle, .ledger li, .c-card'
  );

  if (reduced || !('IntersectionObserver' in window)) return;

  targets.forEach(function (el) { el.classList.add('reveal'); });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry, i) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.style.transitionDelay = Math.min(i * 60, 240) + 'ms';
      el.classList.add('in');
      io.unobserve(el);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(function (el) { io.observe(el); });
})();
