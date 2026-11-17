// Спільний код для всіх сторінок: тема, меню, рік у футері, анімація появи блоків.
import { initTheme } from './theme.js';
import { initMenu } from './menu.js';
import { initLangSwitch } from './i18n.js';
import { initRail } from './rail.js';

initTheme();
initMenu();
initLangSwitch();

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

// ---------- Поява блоків під час прокрутки ----------
// Вбудований у браузер IntersectionObserver, без бібліотек (GSAP потрібен лише головній — для сцени висот).
// Блоки, що з'явились на екрані разом, проявляються по черзі з кроком 90 мс.
export function revealOnScroll(root = document) {
  const items = [...root.querySelectorAll('[data-reveal]:not(.is-in)')];
  if (!items.length) return;
  const show = (node) => node.classList.add('is-in');

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(show);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.filter((entry) => entry.isIntersecting).forEach((entry, i) => {
      observer.unobserve(entry.target);
      setTimeout(() => show(entry.target), i * 90);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  items.forEach((node) => observer.observe(node));
}

revealOnScroll();

// ---------- Горизонтальні стрічки карток на телефоні (.m-rail) ----------
// data-rail-autoplay="3000" — стрічка гортається сама кожні 3 с, доки людина її не торкнеться
document.querySelectorAll('.m-rail').forEach((list) => initRail(list, { autoplay: Number(list.dataset.railAutoplay) || 0 }));
