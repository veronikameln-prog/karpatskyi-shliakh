// Спільний код для всіх сторінок: тема, меню, рік у футері, анімація появи блоків.
import { initTheme } from './theme.js';
import { initMenu } from './menu.js';

initTheme();
initMenu();

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

// ---------- Поява блоків під час прокрутки ----------
// GSAP ScrollTrigger (CDN), якщо він підключений на сторінці; інакше — IntersectionObserver.
// Блоки, що вже на екрані, з'являються одразу.
export function revealOnScroll(root = document) {
  const items = [...root.querySelectorAll('[data-reveal]:not(.is-in)')];
  if (!items.length) return;
  const show = (node) => node.classList.add('is-in');

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(show);
    return;
  }

  const { gsap, ScrollTrigger } = window;
  if (gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.batch(items, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => batch.forEach((node, i) => setTimeout(() => show(node), i * 90)),
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        show(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  items.forEach((node) => observer.observe(node));
}

// Скрипти GSAP мають defer, а модулі виконуються після них — бібліотека вже доступна
revealOnScroll();
