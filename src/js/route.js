// Сторінка одного маршруту: route.html?id=hoverla. Усі дані — з data.json.
import { loadData, el, icon, routeCard, daysLabel, DIFFICULTY_LABELS, loadError, setPhoto } from './data.js';
import { revealOnScroll } from './site.js';
import { createMap, addPin } from './map.js';
import { t, tf } from './i18n.js';

const MONTHS = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
const MONTHS_FROM = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
const MONTHS_TO = MONTHS_FROM;
const GENERIC_TIPS = [
  'Виходь рано — у горах після обіду часто гроза.',
  'Візьми щонайменше 1,5 л води на людину.',
  'Вітрівка й теплий шар потрібні навіть улітку.',
  'Повідом близьким маршрут і час повернення.',
];
const TIP_ICONS = [
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/></svg>',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M10 2h4v3l2 3v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8l2-3V2Z"/><path d="M8 12h8"/></svg>',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M9 3 4 6v15h16V6l-5-3-3 3-3-3Z"/><path d="M12 6v15"/></svg>',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.5c2.7 0 4.5 1.6 5 4.5"/></svg>',
];

const $ = (id) => document.getElementById(id);
const main = $('main');

// У <dl> пара «назва — значення» має бути саме dt + dd, тому іконка лежить усередині dt
function statItem(iconName, label, value) {
  const item = el('div', 'group/stat relative flex min-h-9 flex-col justify-center pl-10 lg:pl-14 lg:pr-4 lg:first:pl-10');
  const term = el('dt', 'text-xs text-muted', label);
  term.prepend(icon(iconName, 'absolute left-0 top-1/2 h-7 w-7 -translate-y-1/2 text-accent lg:left-4 lg:group-first/stat:left-0'));
  item.append(term, el('dd', 'font-semibold text-heading', value));
  return item;
}

// Карта: старт, найвища точка (і фініш, якщо маршрут не кільцевий). Пунктир — лише напрямок.
function drawMap(container, route) {
  const c = route.coords;
  if (!c) {
    container.closest('figure').hidden = true;
    return;
  }
  const map = createMap(container, { center: c.peak, zoom: 12 });
  if (!map) {
    container.querySelector('p').textContent = 'Не вдалося завантажити карту. Скористайся кнопкою «Прокласти дорогу до старту».';
    return;
  }
  const { L } = window;
  const points = [c.start, c.peak, ...(c.end ? [c.end] : [])];
  L.polyline(points, { color: '#163428', weight: 3, dashArray: '6 8', opacity: 0.85, className: 'map-route' }).addTo(map);
  addPin(map, c.start, `Старт: ${route.start.replace(/\s*\(.*\)/, '')}`, 'start');
  addPin(map, c.peak, `${c.peakName} · ${route.peakM} м`, 'peak');
  if (c.end) addPin(map, c.end, c.endName, 'start');
  map.fitBounds(L.latLngBounds(points), { padding: [56, 56], maxZoom: 13 });
  container.setAttribute('aria-label', tf('Карта маршруту «{name}»: від {start} до точки {peak}', { name: route.name, start: route.start.replace(/\s*\(.*\)/, ''), peak: c.peakName }));
}

function renderSeason(months, list, note) {
  const [from, to] = months;
  list.replaceChildren(
    ...MONTHS.map((name, i) => {
      const m = i + 1;
      const best = m >= from && m <= to;
      const edge = m === from - 1 || m === to + 1;
      const item = el('li', `rounded-full px-2 py-2 text-center text-xs font-medium ${best ? 'bg-primary text-on-primary' : edge ? 'border border-dashed border-primary/50 text-heading' : 'border border-line text-muted'}`, name);
      if (best) item.setAttribute('aria-label', `${name} — найкращий час`);
      else if (edge) item.setAttribute('aria-label', `${name} — можливий сніг`);
      return item;
    }),
  );
  note.textContent = tf('Найкраще йти з {from} до {to}: стежки сухі, а день достатньо довгий.', { from: MONTHS_FROM[from - 1], to: MONTHS_TO[to - 1] });
}

function render(route, data) {
  const region = data.regions.find((r) => r.id === route.region) || {};

  document.title = `${route.name} — маршрут | Карпатський шлях`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', route.description);

  const hero = $('route-hero');
  setPhoto(hero, route.hero || route.image || region.image);
  $('crumb-region').textContent = region.name || '';
  $('crumb-region').href = `regions.html#${route.region}`;
  $('crumb-route').textContent = route.name;
  const badge = $('route-badge');
  badge.className = `badge badge-${route.difficulty}`;
  badge.textContent = DIFFICULTY_LABELS[route.difficulty];
  $('route-title').textContent = route.name;
  $('route-subtitle').textContent = route.subtitle || `${region.name} · ${route.highlights[0]}`;

  $('route-stats').replaceChildren(
    statItem('clock', 'Тривалість', daysLabel(route.days)),
    statItem('pin', 'Відстань', `${route.distanceKm} км`),
    statItem('peak', 'Набір висоти', `${route.gainM} м`),
    statItem('peak', 'Найвища точка', `${route.peakM} м`),
    statItem('pin', 'Старт', route.start),
  );

  const steps = route.access || region.access || [];
  $('route-access').replaceChildren(
    ...steps.map((text, i) => {
      const li = el('li', 'relative flex items-center gap-4');
      li.append(el('span', 'relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-on-primary', String(i + 1)), el('span', 'text-lg', text));
      return li;
    }),
  );
  drawMap($('route-map'), route);
  if (route.coords) $('route-directions').href = `https://www.google.com/maps/dir/?api=1&destination=${route.coords.start.join(',')}`;

  if (region.months) renderSeason(region.months, $('route-season'), $('route-season-note'));

  $('route-description').textContent = route.description;
  $('route-highlights').replaceChildren(
    ...route.highlights.map((h) => {
      const li = el('li', 'flex items-start gap-3');
      const check = el('span', 'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-2 text-accent');
      check.innerHTML = '<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';
      const text = t(h);
      li.append(check, document.createTextNode(text.charAt(0).toUpperCase() + text.slice(1)));
      return li;
    }),
  );

  const gallery = route.gallery || [{ src: route.image, caption: route.highlights[0] }, { src: region.image, caption: `${region.name}: ${region.tagline}` }];
  $('route-gallery').replaceChildren(
    ...gallery.map((g) => {
      const li = el('li', 'group relative overflow-hidden rounded-2xl shadow-[0_10px_28px_-16px_rgb(22_52_40/0.5)]');
      li.dataset.reveal = '';
      const fig = el('figure');
      const img = el('img', 'aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105');
      setPhoto(img, g.src, '(min-width: 768px) 33vw, 100vw');
      img.alt = g.caption;
      img.loading = 'lazy';
      img.width = 900;
      img.height = 675;
      fig.append(img, el('figcaption', 'photo-shade absolute inset-x-0 bottom-0 px-4 pb-3 pt-10 text-sm font-semibold text-white', g.caption));
      li.append(fig);
      return li;
    }),
  );

  $('route-tips').replaceChildren(
    ...(route.tips || GENERIC_TIPS).map((text, i) => {
      const li = el('li', 'card flex items-center gap-4 p-4 text-sm');
      li.dataset.reveal = '';
      const ic = el('span', 'icon-circle');
      ic.innerHTML = TIP_ICONS[i % TIP_ICONS.length];
      ic.firstChild.setAttribute('class', 'h-6 w-6');
      li.append(ic, el('span', '', text));
      return li;
    }),
  );

  const cost = $('route-cost');
  cost.elements.region.value = route.region;
  cost.elements.difficulty.value = route.difficulty;
  cost.elements.days.value = String(route.days);

  const similar = data.routes
    .filter((r) => r.id !== route.id)
    .map((r) => ({ r, score: (r.region === route.region ? 2 : 0) + (r.difficulty === route.difficulty ? 1 : 0) }))
    .sort((a, b) => b.score - a.score || b.r.popularity - a.r.popularity)
    .slice(0, 3)
    .map(({ r }) => {
      const li = el('li');
      li.dataset.reveal = '';
      li.append(routeCard(r, data.regionNames));
      return li;
    });
  $('route-similar').replaceChildren(...similar);
  revealOnScroll();
}

async function init() {
  const id = new URLSearchParams(location.search).get('id') || 'hoverla';
  try {
    const data = await loadData();
    const route = data.routes.find((r) => r.id === id);
    if (!route) {
      $('route-content').hidden = true;
      $('route-missing').hidden = false;
      $('route-title').textContent = 'Маршрут не знайдено';
      $('route-badge').hidden = true;
      $('crumb-route').textContent = 'Не знайдено';
      document.title = 'Маршрут не знайдено | Карпатський шлях';
      return;
    }
    render(route, data);
  } catch (error) {
    console.warn('Не вдалося завантажити маршрут:', error);
    $('route-title').textContent = 'Не вдалося завантажити маршрут';
    $('route-content').replaceChildren(loadError(() => location.reload()));
  } finally {
    main.setAttribute('aria-busy', 'false');
  }
}

init();
