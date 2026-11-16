// Головна: популярні маршрути й відгуки з data.json, безперервна стрічка відгуків, анімації на GSAP.
import { loadData, el, routeCard, loadError } from './data.js';
import { revealOnScroll } from './site.js';

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
    window.ScrollTrigger?.refresh(); // картки змінили висоту сторінки — перерахувати закріплену секцію нижче
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

function reviewSlide(review, routeName) {
  // Відступ — padding-right у кожної картки (а не gap), тож дві копії разом рівно вдвічі ширші за одну: зсув -50% без стрибка
  const item = el('li', 'shrink-0 pr-5 md:pr-6');
  const figure = el('figure', 'card flex h-full w-[290px] flex-col p-6 transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_18px_36px_-18px_rgb(22_52_40/0.4)] focus-visible:-translate-y-1 sm:w-[360px]');
  figure.tabIndex = 0; // з клавіатури теж можна «виділити» відгук — стрічка зупиниться

  const head = el('figcaption', 'flex items-center gap-3');
  const avatar = el('span', 'grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-accent text-sm font-bold text-accent', initials(review.name));
  avatar.setAttribute('aria-hidden', 'true');
  const who = el('span', 'min-w-0');
  const stars = el('span', 'block text-amber-500', '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating));
  stars.setAttribute('aria-label', `Оцінка: ${review.rating} з 5`);
  who.append(el('span', 'block font-semibold text-heading', review.name), stars);
  head.append(avatar, who);

  const quote = el('blockquote', 'mt-4 flex-1 text-sm');
  quote.append(el('p', '', `«${review.text}»`));

  figure.append(head, quote, el('p', 'mt-4 text-xs text-muted', routeName ? `Маршрут: ${routeName}` : ''));
  item.append(figure);
  return item;
}

async function renderReviews() {
  try {
    const data = await loadData();
    const names = Object.fromEntries(data.routes.map((r) => [r.id, r.name]));
    const reviews = Array.isArray(data.reviews) ? data.reviews : [];
    if (!reviews.length) {
      reviewsStatus.textContent = 'Відгуків поки немає.';
      return;
    }
    const items = reviews.map((r) => reviewSlide(r, names[r.route]));
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

// ---------- Висотна шкала: лінія «росте» від долини до вершини під час прокрутки ----------
function animateAltitude() {
  const { gsap, ScrollTrigger } = window;
  const line = document.querySelector('[data-altitude-line]');
  if (!gsap || !ScrollTrigger || !line || reduceMotion) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.fromTo(line, { scaleY: 0 }, {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: { trigger: '[data-altitude]', start: 'top 80%', end: 'bottom 45%', scrub: true },
  });
  gsap.to('[data-parallax]', {
    yPercent: -8,
    ease: 'none',
    scrollTrigger: { trigger: '#altitude', start: 'top bottom', end: 'bottom top', scrub: true },
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
// ---------- «Як це працює»: прокрутка коліщатком по черзі підсвічує кроки 1 → 2 → 3 ----------
function howItWorks() {
  const { gsap, ScrollTrigger } = window;
  const section = document.querySelector('[data-how]');
  if (!gsap || !ScrollTrigger || !section || reduceMotion) return; // без анімації всі кроки видно однаково
  const steps = [...section.querySelectorAll('[data-how-step]')];
  const panels = [...section.querySelectorAll('[data-how-panel]')]; // фото й опис кроку під іконками
  let current = -1;

  const setActive = (index) => {
    if (index === current) return;
    current = index;
    steps.forEach((step, k) => {
      step.classList.toggle('is-active', k === index);
      step.classList.toggle('is-done', k < index); // стрілка після пройденого кроку стає яскравою
      if (k === index) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    panels.forEach((panel, k) => {
      panel.classList.toggle('is-active', k === index);
      panel.inert = k !== index; // посилання з прихованих карток не ловлять Tab
    });
  };

  gsap.registerPlugin(ScrollTrigger);
  section.classList.add('how-live');
  setActive(0);

  const mm = gsap.matchMedia();
  // Десктоп: секція «зупиняється» по центру екрана, поки прокрутка не пройде всі три кроки
  mm.add('(min-width: 768px)', () => {
    ScrollTrigger.create({
      trigger: section,
      start: 'center 55%', // трохи нижче центру — заголовок не ховається під плаваючу шапку
      end: () => `+=${window.innerHeight * 1.2}`,
      pin: true,
      onUpdate: (self) => setActive(Math.min(steps.length - 1, Math.floor(self.progress * steps.length))),
    });
  });
  // Телефон: кроки стоять стовпчиком — підсвічується той, що дійшов до середини екрана
  mm.add('(max-width: 767px)', () => {
    steps.forEach((step, k) => {
      ScrollTrigger.create({
        trigger: step,
        start: 'top 60%',
        end: 'bottom 40%',
        onEnter: () => setActive(k),
        onEnterBack: () => setActive(k),
      });
    });
  });
}

heroIntro();
howItWorks();
renderReviews();
animateAltitude();
