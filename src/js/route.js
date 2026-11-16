// Сторінка одного маршруту: route.html?id=hoverla. Усі дані — з data.json.
import { loadData, el, icon, routeCard, daysLabel, DIFFICULTY_LABELS, loadError } from './data.js';
import { revealOnScroll } from './site.js';

const MONTHS = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
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

function statItem(iconName, label, value) {
  const item = el('div', 'flex items-center gap-3 lg:px-4 lg:first:pl-0');
  item.append(icon(iconName, 'h-7 w-7 text-accent'));
  const text = el('div');
  text.append(el('dt', 'text-xs text-muted', label), el('dd', 'font-semibold text-heading', value));
  item.append(text);
  return item;
}

// Спрощена схема: старт унизу ліворуч, вершина вгорі праворуч, плавна стежка між ними.
// Креслимо через DOM API (createElementNS) — без вставки рядків HTML.
function drawMap(svg, route) {
  const NS = 'http://www.w3.org/2000/svg';
  const node = (tag, attrs, text) => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (text) n.textContent = text;
    return n;
  };
  const title = svg.querySelector('title');
  title.textContent = `Схема маршруту «${route.name}»: від ${route.start} до найвищої точки ${route.peakM} м`;
  [...svg.childNodes].forEach((c) => c !== title && c.remove());

  // Рельєф (горизонталі)
  const relief = node('g', { fill: 'none', stroke: 'currentColor', 'stroke-width': '1', class: 'text-[#9DBBA4] dark:text-[#3C5A50]', opacity: '0.8' });
  for (let i = 0; i < 7; i += 1) {
    const y = 60 + i * 34;
    relief.append(node('path', { d: `M0 ${y + 30} C 140 ${y - 10}, 260 ${y + 50}, 420 ${y} S 600 ${y - 30}, 640 ${y - 10}` }));
  }
  svg.append(relief);

  const path = 'M90 240 C 170 230, 200 190, 280 185 S 400 170, 450 120 S 540 70, 560 60';
  svg.append(node('path', { d: path, fill: 'none', stroke: 'rgb(22 52 40)', 'stroke-width': '4', 'stroke-linecap': 'round', class: 'dark:stroke-[#9CD3AE]' }));

  const point = (x, y, label, anchor) => {
    const g = node('g', {});
    g.append(node('circle', { cx: x, cy: y, r: 9, fill: '#fff', stroke: 'rgb(22 52 40)', 'stroke-width': 4 }));
    const width = label.length * 8.2 + 20;
    const bx = anchor === 'end' ? x - width - 14 : x + 14;
    g.append(node('rect', { x: bx, y: y - 16, width, height: 30, rx: 8, fill: '#fff', opacity: '0.95' }));
    g.append(node('text', { x: bx + 10, y: y + 4, 'font-size': 14, 'font-weight': 600, fill: '#163428', 'font-family': 'Inter, sans-serif' }, label));
    return g;
  };
  svg.append(point(90, 240, route.start.replace(/\s*\(.*\)/, ''), 'start'));
  svg.append(point(560, 60, `${route.peakM} м`, 'end'));
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
  note.textContent = `Найкраще: ${MONTHS[from - 1].toLowerCase()} — ${MONTHS[to - 1].toLowerCase()}. Пунктиром позначено місяці, коли на вершинах можливий сніг.`;
}

function render(route, data) {
  const region = data.regions.find((r) => r.id === route.region) || {};

  document.title = `${route.name} — маршрут | Карпатський шлях`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', route.description);

  const hero = $('route-hero');
  hero.src = route.hero || region.image || route.image;
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

  if (region.months) renderSeason(region.months, $('route-season'), $('route-season-note'));

  $('route-description').textContent = route.description;
  $('route-highlights').replaceChildren(
    ...route.highlights.map((h) => {
      const li = el('li', 'flex gap-2');
      li.append(el('span', 'text-accent', '—'), document.createTextNode(h));
      return li;
    }),
  );

  const gallery = route.gallery || [{ src: route.image, caption: route.highlights[0] }, { src: region.image, caption: `${region.name}: ${region.tagline}` }];
  $('route-gallery').className = `grid gap-4 ${gallery.length > 2 ? 'grid-cols-2 sm:grid-cols-4' : 'sm:grid-cols-2'}`;
  $('route-gallery').replaceChildren(
    ...gallery.map((g) => {
      const li = el('li', 'card overflow-hidden');
      li.dataset.reveal = '';
      const fig = el('figure');
      const img = el('img', 'aspect-square w-full object-cover');
      img.src = g.src;
      img.alt = g.caption;
      img.loading = 'lazy';
      img.width = 300;
      img.height = 300;
      fig.append(img, el('figcaption', 'p-3 text-center text-sm font-medium text-heading', g.caption));
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
