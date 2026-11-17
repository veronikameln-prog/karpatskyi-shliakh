// Завантаження mock-даних (регіони, маршрути, відгуки) з data/data.json
// і спільні «будівельники» карток, які використовують кілька сторінок.
// Запит робиться один раз, далі всі модулі отримують ту саму відповідь.

let cache = null;

export async function loadData() {
  if (!cache) {
    cache = (async () => {
      const response = await fetch('data/data.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.routes) || !Array.isArray(data.regions)) throw new Error('Неправильний формат даних');
      data.regionNames = Object.fromEntries(data.regions.map((r) => [r.id, r.name]));
      return data;
    })();
    // Якщо запит не вдався — наступна спроба зробить новий запит
    cache.catch(() => {
      cache = null;
    });
  }
  return cache;
}

export const DIFFICULTY_LABELS = { easy: 'Легкий', medium: 'Середній', hard: 'Складний' };

/** Створює елемент із класами й текстом. Текст — лише через textContent (безпечно). */
export function el(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/**
 * Ставить фото з легкою копією для телефонів: для кожного фото з assets/img/photos є файл «-sm» (720 px).
 * Браузер сам обирає: телефон бере малу копію, великий екран — повну.
 */
export function setPhoto(img, src, sizes = '100vw') {
  img.src = src;
  const match = /^(assets\/img\/photos\/.+?)(\.(?:jpe?g|webp))$/.exec(src || '');
  if (match) {
    img.srcset = `${match[1]}-sm${match[2]} 720w, ${src} 1600w`;
    img.sizes = sizes;
  } else {
    img.removeAttribute('srcset');
  }
}

function plural(n, one, few, many) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return one;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
  return many;
}

export const daysLabel = (n) => `${n} ${plural(n, 'день', 'дні', 'днів')}`;
export const peopleLabel = (n) => `${n} ${plural(n, 'людина', 'людини', 'людей')}`;
export const routesWord = (n) => plural(n, 'маршрут', 'маршрути', 'маршрутів');

// Іконки — сталі рядки в коді (не дані з мережі), тому їх безпечно вставляти як SVG
export const ICONS = {
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  peak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="m2 20 7-12 4 6 3-4 6 10H2Z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};

export function icon(name, className = 'h-4 w-4') {
  const span = el('span', `inline-block shrink-0 ${className}`);
  span.innerHTML = ICONS[name];
  return span;
}

export const routeUrl = (route) => `route.html?id=${encodeURIComponent(route.id)}`;

function stat(iconName, text, label) {
  const item = el('li', 'flex items-center gap-1.5');
  const value = el('span', '', text);
  value.setAttribute('aria-label', `${label}: ${text}`);
  item.append(icon(iconName, 'h-4 w-4 text-accent'), value);
  return item;
}

/** Картка маршруту (Головна, Маршрути, «Схожі маршрути»). */
export function routeCard(route, regionNames = {}, { headingLevel = 'h3' } = {}) {
  const article = el('article', 'card card-hover group relative flex h-full flex-col overflow-hidden');

  const figure = el('div', 'relative aspect-[16/9] overflow-hidden');
  const img = el('img', 'h-full w-full object-cover transition duration-500 group-hover:scale-105');
  setPhoto(img, route.image, '(min-width: 768px) 33vw, 100vw');
  img.alt = '';
  img.width = 426;
  img.height = 240;
  img.loading = 'lazy';
  img.decoding = 'async';
  figure.append(img, el('span', `badge badge-${route.difficulty} absolute left-3 top-3 shadow-sm`, DIFFICULTY_LABELS[route.difficulty]));

  const body = el('div', 'flex flex-1 flex-col p-5');
  const title = el(headingLevel, 'font-sans text-lg font-bold text-heading');
  const link = el('a', 'after:absolute after:inset-0 after:content-[""] focus-visible:outline-none', route.name);
  link.href = routeUrl(route);
  title.append(link);

  const stats = el('ul', 'mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm');
  stats.append(
    stat('clock', daysLabel(route.days), 'Тривалість'),
    stat('pin', `${route.distanceKm} км`, 'Відстань'),
    stat('peak', `${route.peakM} м`, 'Найвища точка'),
  );

  const more = el('span', 'btn-ghost btn-sm mt-5 self-center group-hover:border-primary group-focus-within:border-primary');
  more.setAttribute('aria-hidden', 'true');
  more.append(document.createTextNode('Детальніше'), icon('arrow'));

  body.append(title, el('p', 'mt-1 text-sm text-muted', regionNames[route.region] || ''), stats, more);
  article.append(figure, body);
  return article;
}

/** Повідомлення про помилку завантаження з кнопкою «Спробувати ще раз». */
export function loadError(onRetry, text = 'Не вдалося завантажити дані. Перевір інтернет і спробуй ще раз.') {
  const box = el('div', 'card col-span-full p-6 text-center');
  const retry = el('button', 'btn-ghost btn-sm mt-4', 'Спробувати ще раз');
  retry.type = 'button';
  retry.addEventListener('click', onRetry);
  box.append(el('p', '', text), retry);
  return box;
}
