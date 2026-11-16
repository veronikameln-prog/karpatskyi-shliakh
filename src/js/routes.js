// Каталог маршрутів: завантаження data.json, пошук, фільтри, сортування, «Показати ще».
// Стан фільтрів зберігається в адресі (routes.html?region=gorgany&difficulty=easy),
// тому посиланням можна поділитися, а кнопка «Назад» працює.
import { loadData, el, routeCard, routesWord, loadError } from './data.js';
import { revealOnScroll } from './site.js';
import { estimatePerPerson } from './planner-calc.js';

const PAGE_SIZE = 9;
const grid = document.getElementById('routes-grid');
const status = document.getElementById('routes-status');
const form = document.getElementById('route-filters');
const more = document.getElementById('routes-more');

let allRoutes = [];
let regionNames = {};
let shown = PAGE_SIZE;

const SORTERS = {
  popular: (a, b) => b.popularity - a.popularity,
  days: (a, b) => a.days - b.days || a.distanceKm - b.distanceKm,
  distance: (a, b) => a.distanceKm - b.distanceKm,
  peak: (a, b) => b.peakM - a.peakM,
};

function matchesDays(route, value) {
  if (value === '1') return route.days === 1;
  if (value === '2-3') return route.days >= 2 && route.days <= 3;
  return true;
}

// Пошук без урахування регістру й апострофів: «хомяк» знайде «Хом'як»
const normalize = (s) => s.toLowerCase().replace(/['ʼ’`]/g, '').trim();

function readFilters() {
  const data = new FormData(form);
  return {
    q: normalize(String(data.get('q') || '')),
    region: data.get('region') || 'all',
    difficulty: data.get('difficulty') || 'all',
    days: data.get('days') || 'all',
    budget: Number(data.get('budget')) || 0,
    sort: SORTERS[data.get('sort')] ? data.get('sort') : 'popular',
  };
}

function filtered({ q, region, difficulty, days, budget, sort }) {
  return allRoutes
    .filter((r) =>
      (!q || normalize(`${r.name} ${regionNames[r.region]} ${r.start}`).includes(q)) &&
      (region === 'all' || r.region === region) &&
      (difficulty === 'all' || r.difficulty === difficulty) &&
      matchesDays(r, days) &&
      (!budget || estimatePerPerson(r) <= budget))
    .sort(SORTERS[sort]);
}

function render() {
  const filters = readFilters();
  const routes = filtered(filters);

  if (!routes.length) {
    status.textContent = 'Таких маршрутів поки немає';
    const empty = el('li', 'card col-span-full p-10 text-center');
    const reset = el('button', 'btn-ghost btn-sm mt-4', 'Скинути фільтри');
    reset.type = 'button';
    reset.addEventListener('click', () => form.reset());
    empty.append(el('p', '', 'Спробуй іншу складність, тривалість чи бюджет — або подивись усі маршрути.'), reset);
    grid.replaceChildren(empty);
    more.hidden = true;
    return;
  }

  status.textContent = `Знайдено ${routes.length} ${routesWord(routes.length)}`;
  grid.replaceChildren(
    ...routes.slice(0, shown).map((route) => {
      const item = el('li');
      item.dataset.reveal = '';
      item.append(routeCard(route, regionNames, { headingLevel: 'h2' }));
      return item;
    }),
  );
  more.hidden = routes.length <= shown;
  revealOnScroll(grid);
}

// ---------- Синхронізація з адресою ----------
function writeUrl() {
  const { region, difficulty, days, budget, sort } = readFilters();
  const params = new URLSearchParams();
  if (region !== 'all') params.set('region', region);
  if (difficulty !== 'all') params.set('difficulty', difficulty);
  if (days !== 'all') params.set('days', days);
  if (budget) params.set('budget', budget);
  if (sort !== 'popular') params.set('sort', sort);
  const query = params.toString();
  history.replaceState(null, '', query ? `?${query}` : location.pathname);
}

function readUrl() {
  const params = new URLSearchParams(location.search);
  const setRadio = (name, value) => {
    const input = form.querySelector(`input[name="${name}"][value="${CSS.escape(value || 'all')}"]`);
    if (input) input.checked = true;
  };
  const region = params.get('region');
  if ([...form.elements.region.options].some((o) => o.value === region)) form.elements.region.value = region;
  const budget = params.get('budget');
  if ([...form.elements.budget.options].some((o) => o.value === budget)) form.elements.budget.value = budget;
  const sort = params.get('sort');
  if (SORTERS[sort]) form.elements.sort.value = sort;
  setRadio('difficulty', params.get('difficulty'));
  setRadio('days', params.get('days'));
}

function update() {
  shown = PAGE_SIZE;
  writeUrl();
  render();
}

// ---------- Старт ----------
async function init() {
  grid.setAttribute('aria-busy', 'true');
  status.textContent = 'Завантажуємо маршрути…';
  try {
    const data = await loadData();
    allRoutes = data.routes;
    regionNames = data.regionNames;
    readUrl();
    render();
  } catch (error) {
    console.warn('Не вдалося завантажити data.json:', error);
    status.textContent = 'Не вдалося завантажити маршрути';
    const item = el('li', 'col-span-full');
    item.append(loadError(init));
    grid.replaceChildren(item);
  } finally {
    grid.setAttribute('aria-busy', 'false');
  }
}

form.addEventListener('change', update);
let typing;
form.elements.q.addEventListener('input', () => {
  clearTimeout(typing);
  typing = setTimeout(update, 200);
});
form.addEventListener('submit', (event) => event.preventDefault());
form.addEventListener('reset', () => setTimeout(update));
more.addEventListener('click', () => {
  const firstNew = shown;
  shown += PAGE_SIZE;
  render();
  // Фокус на першу нову картку — щоб клавіатура не «губилася»
  grid.children[firstNew]?.querySelector('a')?.focus();
});

init();
