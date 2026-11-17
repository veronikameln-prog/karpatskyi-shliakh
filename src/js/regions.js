// Сторінка «Регіони»: секції-«зигзаг» для кожного масиву з data.json і по два маршрути регіону.
import { loadData, el, icon, routeUrl, daysLabel, DIFFICULTY_LABELS, loadError, setPhoto } from './data.js';
import { revealOnScroll } from './site.js';
import { createMap, addPin } from './map.js';
import { tf } from './i18n.js';

const list = document.getElementById('regions-list');

const FACT_ICONS = {
  peak: 'peak',
  difficulty: 'clock',
  season: 'clock',
  start: 'pin',
};

// У <dl> пара «назва — значення» має бути саме dt + dd, тому іконка лежить усередині dt
function fact(iconName, label, value) {
  const item = el('div', 'relative pl-7');
  const term = el('dt', 'text-xs text-muted', label);
  term.prepend(icon(iconName, 'absolute left-0 top-0.5 h-5 w-5 text-accent'));
  item.append(term, el('dd', 'text-sm font-semibold text-heading', value));
  return item;
}

function miniRoute(route) {
  const link = el('a', 'card card-hover flex items-center gap-3 p-2 pr-4');
  link.href = routeUrl(route);
  const img = el('img', 'h-14 w-20 shrink-0 rounded-lg object-cover');
  setPhoto(img, route.image, '80px');
  img.alt = '';
  img.width = 80;
  img.height = 56;
  img.loading = 'lazy';
  const text = el('span', 'min-w-0');
  const top = el('span', 'flex flex-wrap items-center gap-2');
  top.append(el('span', 'font-semibold text-heading', route.name), el('span', `badge badge-${route.difficulty} !py-0.5`, DIFFICULTY_LABELS[route.difficulty]));
  text.append(top, el('span', 'mt-0.5 block text-xs text-muted', `${daysLabel(route.days)} · ${route.distanceKm} км`));
  link.append(img, text);
  const li = el('li');
  li.append(link);
  return li;
}

function regionSection(region, routes, index) {
  const section = el('section', 'scroll-mt-28 grid items-center gap-8 lg:grid-cols-2 lg:gap-12');
  section.id = region.id;
  section.setAttribute('aria-labelledby', `${region.id}-title`);

  const photo = el('img', `aspect-[16/10] w-full rounded-3xl object-cover shadow-lg ${index % 2 ? 'lg:order-2' : ''}`);
  setPhoto(photo, region.image, '(min-width: 1024px) 50vw, 100vw');
  photo.alt = `${region.name}: ${region.tagline}`;
  photo.width = 620;
  photo.height = 390;
  photo.loading = index ? 'lazy' : 'eager';
  photo.dataset.reveal = '';

  const body = el('div');
  body.dataset.reveal = '';
  const title = el('h2', 'text-3xl md:text-4xl', region.longName || region.name);
  title.id = `${region.id}-title`;

  const facts = el('dl', 'mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4');
  facts.append(
    fact(FACT_ICONS.peak, 'Вершина', region.peak),
    fact('peak', 'Складність', region.difficulty),
    fact(FACT_ICONS.season, 'Сезон', region.season),
    fact(FACT_ICONS.start, 'Старт', region.start),
  );

  const routesTitle = el('h3', 'mt-6 font-sans text-sm font-bold', 'Популярні маршрути:');
  const routesList = el('ul', 'mt-3 grid gap-3 sm:grid-cols-2');
  routesList.append(...routes.slice(0, 2).map(miniRoute));

  const all = el('a', 'btn-ghost btn-sm mt-6');
  all.href = `routes.html?region=${region.id}`;
  all.append(document.createTextNode('Маршрути регіону'), icon('arrow'));
  all.setAttribute('aria-label', tf('Усі маршрути регіону {name}', { name: region.name }));

  body.append(title, el('p', 'mt-2 text-lg', region.tagline), facts, routesTitle, routesList, all);
  section.append(photo, body);
  return section;
}

// Карта масивів: пунктирний контур і мітка для кожного регіону; клік веде до його опису
function initMap(regions) {
  const map = createMap(document.getElementById('regions-map'), { center: [48.55, 23.95], zoom: 8 });
  if (!map) return;
  const { L } = window;
  const shapes = {};
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const highlight = (id, on) => shapes[id]?.setStyle({ fillOpacity: on ? 0.5 : 0.28, weight: on ? 3.5 : 2.5 });

  regions.forEach((region) => {
    if (!region.outline) return;
    const shape = L.polygon(region.outline, { color: '#123524', weight: 2.5, dashArray: '8 7', fillColor: '#ffffff', fillOpacity: 0.28, className: 'map-region' }).addTo(map);
    shapes[region.id] = shape;
    const pin = addPin(map, region.center, region.name, 'region');
    [shape, pin].forEach((layer) => {
      layer.on('click', () => go(region.id));
      layer.on('mouseover', () => highlight(region.id, true));
      layer.on('mouseout', () => highlight(region.id, false));
    });
  });
  map.fitBounds(L.featureGroup(Object.values(shapes)).getBounds(), { padding: [24, 24] });

  document.querySelectorAll('#regions-legend [data-region]').forEach((link) => {
    const id = link.dataset.region;
    ['pointerenter', 'focus'].forEach((type) => link.addEventListener(type, () => highlight(id, true)));
    ['pointerleave', 'blur'].forEach((type) => link.addEventListener(type, () => highlight(id, false)));
  });
}

async function init() {
  list.setAttribute('aria-busy', 'true');
  try {
    const data = await loadData();
    list.replaceChildren(
      ...data.regions.map((region, i) => {
        const routes = data.routes.filter((r) => r.region === region.id).sort((a, b) => b.popularity - a.popularity);
        return regionSection(region, routes, i);
      }),
    );
    revealOnScroll(list);
    initMap(data.regions);
    // Якщо прийшли за посиланням regions.html#gorgany — прокрутити після рендеру
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  } catch (error) {
    console.warn('Не вдалося завантажити регіони:', error);
    list.replaceChildren(loadError(init));
  } finally {
    list.setAttribute('aria-busy', 'false');
  }
}

init();
