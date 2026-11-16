// Відгуки на сторінці «Про нас»: дані з data.json, карусель — бібліотека Swiper (CDN).
// Якщо Swiper не завантажився, відгуки показуються звичайною сіткою.
import { loadData, el } from './data.js';

const list = document.getElementById('reviews-list');
const status = document.getElementById('reviews-status');
const slider = document.querySelector('[data-reviews-slider]');

function reviewCard(review, routeName) {
  const item = el('li', 'swiper-slide !h-auto');
  const figure = el('figure', 'card flex h-full flex-col p-6');

  const stars = el('p', 'text-accent');
  stars.setAttribute('aria-label', `Оцінка: ${review.rating} з 5`);
  stars.append(el('span', '', '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)));
  stars.firstChild.setAttribute('aria-hidden', 'true');

  const quote = el('blockquote', 'mt-3 flex-1');
  quote.append(el('p', '', `«${review.text}»`));

  const caption = el('figcaption', 'mt-5 text-sm');
  caption.append(el('span', 'block font-semibold', review.name), el('span', 'block text-muted', routeName));

  figure.append(stars, quote, caption);
  item.append(figure);
  return item;
}

async function init() {
  try {
    const data = await loadData();
    const names = Object.fromEntries(data.routes.map((r) => [r.id, r.name]));
    const reviews = Array.isArray(data.reviews) ? data.reviews : [];

    if (!reviews.length) {
      status.textContent = 'Відгуків поки немає — стань першим, хто поділиться враженнями.';
      return;
    }
    list.replaceChildren(...reviews.map((r) => reviewCard(r, names[r.route] || '')));
    status.textContent = 'Демонстраційні відгуки для навчального проєкту.';

    if (window.Swiper) {
      // eslint-disable-next-line no-new
      new window.Swiper(slider, {
        slidesPerView: 1.1,
        spaceBetween: 16,
        breakpoints: { 640: { slidesPerView: 2, spaceBetween: 24 }, 1024: { slidesPerView: 3, spaceBetween: 24 } },
        keyboard: { enabled: true, onlyInViewport: true },
        navigation: { prevEl: '[data-reviews-prev]', nextEl: '[data-reviews-next]' },
        pagination: { el: '[data-reviews-pagination]', clickable: true },
        a11y: {
          prevSlideMessage: 'Попередній відгук',
          nextSlideMessage: 'Наступний відгук',
          paginationBulletMessage: 'Перейти до відгуку {{index}}',
        },
      });
    } else {
      // Запасний варіант без бібліотеки
      list.classList.add('grid', 'gap-6', 'md:grid-cols-3');
      document.querySelectorAll('[data-reviews-prev], [data-reviews-next]').forEach((b) => (b.hidden = true));
    }
  } catch (error) {
    console.warn('Не вдалося завантажити відгуки:', error);
    status.textContent = 'Не вдалося завантажити відгуки. Онови сторінку трохи згодом.';
  }
}

init();
