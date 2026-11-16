// Каталог маршрутів: завантаження data.json, фільтри, модальне вікно з деталями.
import { loadData, el, DIFFICULTY_LABELS, daysLabel } from './data.js';

const grid = document.getElementById('routes-grid');
const status = document.getElementById('routes-status');
const filters = document.getElementById('route-filters');
const dialog = document.getElementById('route-dialog');
const dialogBody = dialog.querySelector('[data-dialog-body]');

let allRoutes = [];
let regionNames = {};
let lastOpener = null;

function routesWord(n) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return 'маршрут';
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return 'маршрути';
  return 'маршрутів';
}

// ---------- Фільтри ----------
function matchesDays(route, value) {
  if (value === '1') return route.days === 1;
  if (value === '2-3') return route.days >= 2 && route.days <= 3;
  if (value === '4+') return route.days >= 4;
  return true;
}

function applyFilters() {
  const data = new FormData(filters);
  const difficulty = data.get('difficulty');
  const days = data.get('days');
  const region = data.get('region');

  const visible = allRoutes.filter(
    (r) =>
      (difficulty === 'all' || r.difficulty === difficulty) &&
      (region === 'all' || r.region === region) &&
      matchesDays(r, days),
  );
  renderGrid(visible);
}

// ---------- Картки ----------
function stat(label, value) {
  const item = el('div');
  item.append(el('dt', 'text-xs text-muted', label), el('dd', 'font-medium tabular-nums', value));
  return item;
}

function card(route) {
  const item = el('li');
  item.id = route.id;

  const article = el('article', 'card flex h-full flex-col overflow-hidden transition-colors hover:border-accent');
  const img = el('img', 'aspect-[3/2] w-full object-cover');
  img.src = route.image;
  img.alt = '';
  img.width = 600;
  img.height = 400;
  img.loading = 'lazy';
  img.decoding = 'async';

  const content = el('div', 'flex flex-1 flex-col p-5');
  const tags = el('p', 'flex items-center gap-2 text-xs text-muted');
  tags.append(el('span', `badge badge-${route.difficulty}`, DIFFICULTY_LABELS[route.difficulty]), document.createTextNode(regionNames[route.region] || ''));

  const stats = el('dl', 'mt-4 grid grid-cols-3 gap-2 text-sm');
  stats.append(stat('Тривалість', daysLabel(route.days)), stat('Відстань', `${route.distanceKm} км`), stat('Вершина', `${route.peakM} м`));

  const more = el('button', 'btn-ghost mt-5 self-start px-5 py-2 text-sm', 'Детальніше');
  more.type = 'button';
  more.setAttribute('aria-haspopup', 'dialog');
  more.addEventListener('click', () => openRoute(route, more));

  content.append(
    tags,
    el('h2', 'mt-3 text-2xl', route.name),
    el('p', 'mt-2 line-clamp-3 text-sm text-muted', route.description),
    stats,
    more,
  );
  article.append(img, content);
  item.append(article);
  return item;
}

function renderGrid(routes) {
  if (!routes.length) {
    status.textContent = 'Таких маршрутів поки немає.';
    const reset = el('button', 'btn-ghost px-5 py-2 text-sm', 'Скинути фільтри');
    reset.type = 'button';
    reset.addEventListener('click', () => {
      filters.reset();
      applyFilters();
    });
    const empty = el('li', 'card col-span-full p-8 text-center');
    empty.append(el('p', 'mb-4', 'Спробуй іншу складність або тривалість — або подивись усі маршрути.'), reset);
    grid.replaceChildren(empty);
    return;
  }
  status.textContent = `Знайдено ${routes.length} ${routesWord(routes.length)}`;
  grid.replaceChildren(...routes.map(card));
}

// ---------- Модальне вікно ----------
function openRoute(route, opener = null) {
  lastOpener = opener;

  const img = el('img', 'aspect-[3/2] w-full rounded-xl object-cover md:aspect-[2/1]');
  img.src = route.image;
  img.alt = `Ілюстрація маршруту «${route.name}»`;
  img.width = 600;
  img.height = 400;

  const title = el('h2', 'mt-6 text-4xl', route.name);
  title.id = 'route-dialog-title';

  const tags = el('p', 'mt-2 flex flex-wrap items-center gap-2 text-sm text-muted');
  tags.append(
    el('span', `badge badge-${route.difficulty}`, DIFFICULTY_LABELS[route.difficulty]),
    document.createTextNode(`${regionNames[route.region] || ''} · старт: ${route.start}`),
  );

  const stats = el('dl', 'mt-6 grid grid-cols-2 gap-4 rounded-xl border border-stone/30 p-4 sm:grid-cols-4');
  stats.append(
    stat('Тривалість', daysLabel(route.days)),
    stat('Відстань', `${route.distanceKm} км`),
    stat('Набір висоти', `${route.gainM} м`),
    stat('Найвища точка', `${route.peakM} м`),
  );

  const highlights = el('ul', 'mt-4 space-y-1.5');
  route.highlights.forEach((h) => {
    const li = el('li', 'flex gap-2');
    li.append(el('span', 'text-accent', '—'), document.createTextNode(h));
    highlights.append(li);
  });

  const plan = el('a', 'btn-primary mt-8', 'Розрахувати похід цим маршрутом');
  const params = new URLSearchParams({ region: route.region, days: route.days, difficulty: route.difficulty });
  plan.href = `planner.html?${params}`;

  dialogBody.replaceChildren(
    img,
    title,
    tags,
    el('p', 'mt-5 text-lg', route.description),
    stats,
    el('h3', 'mt-6 text-2xl', 'Що побачиш'),
    highlights,
    plan,
  );

  history.replaceState(null, '', `#${route.id}`);
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
}

dialog.addEventListener('close', () => {
  history.replaceState(null, '', location.pathname + location.search);
  lastOpener?.focus();
});

// Клік по затемненому фону закриває вікно
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

// ---------- Старт ----------
async function init() {
  status.textContent = 'Завантажуємо маршрути…';
  try {
    const data = await loadData();
    allRoutes = data.routes;
    regionNames = data.regions || {};
    applyFilters();

    // Посилання виду routes.html#hoverla-zaroslyak відкриває потрібний маршрут
    const id = decodeURIComponent(location.hash.slice(1));
    const route = allRoutes.find((r) => r.id === id);
    if (route) {
      document.getElementById(route.id)?.scrollIntoView({ block: 'center' });
      openRoute(route, document.querySelector(`#${CSS.escape(route.id)} button`));
    }
  } catch (error) {
    console.warn('Не вдалося завантажити data.json:', error);
    status.textContent = 'Не вдалося завантажити маршрути. Перевір підключення до інтернету.';
    const retry = el('button', 'btn-ghost px-5 py-2 text-sm', 'Спробувати ще раз');
    retry.type = 'button';
    retry.addEventListener('click', init);
    const item = el('li', 'col-span-full');
    item.append(retry);
    grid.replaceChildren(item);
  }
}

// Якщо адреса змінилася без перезавантаження (наприклад, routes.html#petros) — відкрити маршрут
window.addEventListener('hashchange', () => {
  const route = allRoutes.find((r) => r.id === decodeURIComponent(location.hash.slice(1)));
  if (route && !dialog.open) openRoute(route, document.querySelector(`#${CSS.escape(route.id)} button`));
});

filters.addEventListener('change', applyFilters);
filters.addEventListener('reset', () => setTimeout(applyFilters));
init();
