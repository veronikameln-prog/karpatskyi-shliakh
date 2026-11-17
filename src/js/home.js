// Головна: популярні маршрути й відгуки з data.json, безперервна стрічка відгуків, анімації на GSAP.
import { loadData, el, routeCard, routeUrl, loadError } from './data.js';
import { revealOnScroll } from './site.js';
import { t } from './i18n.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Популярні маршрути ----------
const popular = document.getElementById('popular-routes');

async function renderPopular() {
  popular.setAttribute('aria-busy', 'true');
  try {
    const data = await loadData();
    const top = [...data.routes].sort((a, b) => b.popularity - a.popularity).slice(0, 3);
    popular.replaceChildren(
      ...top.map((route) => {
        const item = el('li');
        item.dataset.reveal = '';
        item.append(routeCard(route, data.regionNames));
        return item;
      }),
    );
    revealOnScroll(popular);
    window.ScrollTrigger?.refresh(); // картки змінили висоту сторінки
  } catch (error) {
    console.warn('Не вдалося завантажити маршрути:', error);
    popular.replaceChildren(loadError(renderPopular));
  } finally {
    popular.setAttribute('aria-busy', 'false');
  }
}

// ---------- Відгуки: безперервна стрічка ----------
const reviewsList = document.getElementById('reviews-list');
const reviewsStatus = document.getElementById('reviews-status');

function initials(name) {
  return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function reviewSlide(review, route) {
  // Відступ — padding-right у кожної картки (а не gap), тож дві копії разом рівно вдвічі ширші за одну: зсув -50% без стрибка
  const item = el('li', 'shrink-0 pr-5 md:pr-6');
  const figure = el('figure', 'card flex h-full w-[290px] flex-col p-6 transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_18px_36px_-18px_rgb(22_52_40/0.4)] focus-visible:-translate-y-1 sm:w-[360px]');
  figure.tabIndex = 0; // з клавіатури теж можна «виділити» відгук — стрічка зупиниться

  const head = el('figcaption', 'flex items-center gap-3');
  const avatar = el('span', 'grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-accent text-sm font-bold text-accent', initials(t(review.name)));
  avatar.setAttribute('aria-hidden', 'true');
  const who = el('span', 'min-w-0');
  const stars = el('span', 'block text-amber-500', '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating));
  stars.setAttribute('aria-label', `Оцінка: ${review.rating} з 5`);
  who.append(el('span', 'block font-semibold text-heading', review.name), stars);
  head.append(avatar, who);

  const quote = el('blockquote', 'mt-4 flex-1 text-sm');
  quote.append(el('p', '', `«${t(review.text)}»`));

  const where = el('p', 'mt-4 border-t border-line pt-3 text-xs text-muted');
  if (route) {
    const link = el('a', 'font-semibold text-accent underline-offset-4 hover:underline', route.name);
    link.href = routeUrl(route);
    where.append(document.createTextNode('Маршрут: '), link);
  }
  figure.append(head, quote, where);
  item.append(figure);
  return item;
}

async function renderReviews() {
  try {
    const data = await loadData();
    const byId = Object.fromEntries(data.routes.map((r) => [r.id, r]));
    const reviews = Array.isArray(data.reviews) ? data.reviews : [];
    if (!reviews.length) {
      reviewsStatus.textContent = 'Відгуків поки немає.';
      return;
    }
    const items = reviews.map((r) => reviewSlide(r, byId[r.route]));
    // Друга копія потрібна, щоб стрічка йшла по колу без розриву; для екранних читачів і Tab її немає
    const copies = reduceMotion ? [] : items.map((item) => {
      const copy = item.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.inert = true;
      return copy;
    });
    reviewsList.replaceChildren(...items, ...copies);
    reviewsStatus.textContent = 'Демонстраційні відгуки для навчального проєкту.';
  } catch (error) {
    console.warn('Не вдалося завантажити відгуки:', error);
    reviewsStatus.textContent = 'Не вдалося завантажити відгуки. Онови сторінку трохи згодом.';
  }
}

// ---------- «Від долини до вершини»: прокрутка по черзі підсвічує вершину → полонину → ліс → долину ----------
function altitudeScene() {
  const section = document.querySelector('[data-altitude]');
  if (!section) return;
  const steps = [...section.querySelectorAll('[data-alt-step]')];
  const layers = [...section.querySelectorAll('[data-alt-layer]')];
  const line = section.querySelector('[data-altitude-line]');
  let current = -1;

  const setActive = (index) => {
    if (index === current) return;
    current = index;
    steps.forEach((step, k) => {
      step.classList.toggle('is-active', k === index);
      step.setAttribute('aria-pressed', String(k === index));
    });
    layers.forEach((layer, k) => layer.classList.toggle('is-active', k === index));
    // Лінія шкали заповнюється зверху вниз — до поточного пояса
    line?.style.setProperty('--alt-progress', String(index / (steps.length - 1)));
  };

  section.classList.add('alt-live');
  setActive(0);
  // Пояс можна вибрати й самому: кліком, фокусом або наведенням на шар
  steps.forEach((step, k) => step.addEventListener('click', () => setActive(k)));
  layers.forEach((layer, k) => layer.addEventListener('pointerenter', () => setActive(k)));

  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger || reduceMotion) return;
  gsap.registerPlugin(ScrollTrigger);
  const byProgress = (self) => setActive(Math.min(steps.length - 1, Math.floor(self.progress * steps.length)));

  const mm = gsap.matchMedia();
  // Широкий екран: секція «зупиняється», поки прокрутка не пройде всі чотири пояси
  mm.add('(min-width: 1024px)', () => {
    ScrollTrigger.create({
      trigger: section,
      start: 'center 53%', // трохи нижче центру — заголовок не ховається під плаваючу шапку
      end: () => `+=${window.innerHeight * 1.5}`,
      pin: true,
      onUpdate: byProgress,
    });
  });
  // Телефон і планшет: без закріплення — пояси змінюються, поки зображення проходить екран
  mm.add('(max-width: 1023px)', () => {
    ScrollTrigger.create({
      trigger: section.querySelector('.alt-scene'),
      start: 'top 75%',
      end: 'bottom 35%',
      onUpdate: byProgress,
    });
  });
}

renderPopular();
// ---------- Поява героя: напис, заголовок, форма пошуку — по черзі ----------
function heroIntro() {
  const { gsap } = window;
  const items = document.querySelectorAll('[data-hero-in]');
  if (!gsap || reduceMotion || !items.length) return;
  gsap.from(items, { y: 24, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power2.out' });
}
heroIntro();
renderReviews();
altitudeScene();
