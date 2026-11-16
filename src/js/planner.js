// Інтерфейс конструктора походу: читає форму, показує помилки й результат.
// Уся математика — у planner-calc.js.
import { validateTrip, calculateTrip, matchRoutes, formatUAH } from './planner-calc.js';
import { loadData, el, DIFFICULTY_LABELS, daysLabel, peopleLabel } from './data.js';

const form = document.getElementById('planner-form');
const result = document.getElementById('planner-result');
const emptyState = result.querySelector('[data-result-empty]');
const body = result.querySelector('[data-result-body]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const NOTE_STYLES = {
  warning: 'border-red-700/40 bg-red-700/5 text-red-900 dark:border-red-300/40 dark:bg-red-300/10 dark:text-red-100',
  tip: 'border-accent/40 bg-accent/10',
  info: 'border-stone/40 bg-stone/10',
};
const NOTE_TITLES = { warning: 'Увага', tip: 'Порада', info: 'До відома' };

let calculatedOnce = false;
let regionNames = {};

// ---------- Читання форми ----------
function readForm() {
  const data = new FormData(form);
  return {
    region: data.get('region'),
    days: data.get('days'),
    people: data.get('people'),
    difficulty: data.get('difficulty'),
    stay: data.get('stay'),
    extras: data.getAll('extras'),
  };
}

// ---------- Помилки полів ----------
function setFieldError(name, message) {
  const input = form.elements[name];
  const error = document.getElementById(`p-${name}-error`);
  if (!input || !error) return;
  error.textContent = message || '';
  if (message) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

function showErrors(errors) {
  ['days', 'people'].forEach((name) => setFieldError(name, errors[name]));
}

// ---------- Результат ----------
function renderEmpty() {
  body.replaceChildren();
  body.hidden = true;
  emptyState.hidden = false;
}

function renderInvalid() {
  emptyState.hidden = true;
  body.hidden = false;
  body.replaceChildren(
    el('p', 'mt-3 rounded-lg border border-red-700/40 bg-red-700/5 p-4 text-sm text-red-900 dark:border-red-300/40 dark:bg-red-300/10 dark:text-red-100',
      'Виправ поля, позначені червоним, — і ми одразу порахуємо похід.'),
  );
}

function renderTrip(values, trip) {
  const region = values.region === 'any' ? 'будь-який регіон' : regionNames[values.region] || values.region;
  const summary = [
    daysLabel(values.days),
    peopleLabel(values.people),
    region,
    DIFFICULTY_LABELS[values.difficulty].toLowerCase(),
  ].join(' · ');

  const price = el('div', 'mt-5');
  price.append(
    el('p', 'text-sm text-muted', 'Орієнтовно з особи'),
    el('p', 'font-serif text-5xl font-semibold tabular-nums text-accent md:text-6xl', formatUAH(trip.perPerson)),
    el('p', 'mt-1 text-sm', `Разом на групу: ${formatUAH(trip.total)}`),
  );

  const breakdown = el('dl', 'mt-6 divide-y divide-stone/20 border-y border-stone/20 text-sm');
  trip.lines.forEach((line) => {
    const row = el('div', 'flex justify-between gap-4 py-2.5');
    row.append(el('dt', 'text-muted', line.label), el('dd', 'shrink-0 font-medium tabular-nums', formatUAH(line.amount)));
    breakdown.append(row);
  });

  const nodes = [el('p', 'mt-2 text-sm text-muted', summary), price, breakdown];

  if (trip.notes.length) {
    const list = el('ul', 'mt-6 space-y-3');
    list.setAttribute('aria-label', 'Попередження і поради');
    trip.notes.forEach((note) => {
      const item = el('li', `rounded-lg border p-3 text-sm ${NOTE_STYLES[note.type]}`);
      item.append(el('strong', 'font-semibold', `${NOTE_TITLES[note.type]}: `), document.createTextNode(note.text));
      list.append(item);
    });
    nodes.push(list);
  }

  const routesBox = el('div', 'mt-8');
  routesBox.append(el('h3', 'text-2xl', 'Маршрути для тебе'));
  const routesSlot = el('div', 'mt-3');
  routesSlot.append(el('p', 'text-sm text-muted', 'Підбираємо маршрути…'));
  routesBox.append(routesSlot);
  nodes.push(routesBox);

  emptyState.hidden = true;
  body.hidden = false;
  body.replaceChildren(...nodes);

  fillRoutes(routesSlot, values);
}

async function fillRoutes(slot, values) {
  try {
    const data = await loadData();
    regionNames = data.regions || regionNames;
    const { routes, relaxed } = matchRoutes(data.routes, values);
    const nodes = [];

    if (relaxed === 'difficulty') {
      nodes.push(el('p', 'mb-3 text-sm text-muted', 'Маршрутів такої складності в цьому регіоні немає — ось інші варіанти поруч.'));
    } else if (relaxed === 'region') {
      nodes.push(el('p', 'mb-3 text-sm text-muted', 'У цьому регіоні немає маршрутів на твою кількість днів — подивись інші регіони.'));
    }

    if (!routes.length) {
      nodes.push(el('p', 'text-sm', 'Під ці параметри маршрутів поки немає. Спробуй додати днів або змінити складність.'));
    } else {
      const list = el('ul', 'space-y-2');
      routes.forEach((route) => {
        const link = el('a', 'flex items-center justify-between gap-3 rounded-lg border border-stone/30 px-4 py-3 transition-colors hover:border-accent');
        link.href = `routes.html#${encodeURIComponent(route.id)}`;
        const text = el('span', 'min-w-0');
        text.append(
          el('span', 'block font-medium', route.name),
          el('span', 'block text-xs text-muted', `${regionNames[route.region] || ''} · ${daysLabel(route.days)} · ${route.distanceKm} км`),
        );
        link.append(text, el('span', `badge badge-${route.difficulty} shrink-0`, DIFFICULTY_LABELS[route.difficulty]));
        const item = el('li');
        item.append(link);
        list.append(item);
      });
      nodes.push(list);
    }
    slot.replaceChildren(...nodes);
  } catch (error) {
    console.warn('Не вдалося завантажити маршрути:', error);
    const retry = el('button', 'btn-ghost mt-3 px-4 py-2 text-sm', 'Спробувати ще раз');
    retry.type = 'button';
    retry.addEventListener('click', () => {
      slot.replaceChildren(el('p', 'text-sm text-muted', 'Підбираємо маршрути…'));
      fillRoutes(slot, values);
    });
    slot.replaceChildren(
      el('p', 'text-sm', 'Не вдалося завантажити маршрути. Перевір інтернет — розрахунок вартості при цьому правильний.'),
      retry,
    );
  }
}

// ---------- Події ----------
function calculate({ scroll } = { scroll: false }) {
  const { ok, errors, values } = validateTrip(readForm());
  showErrors(errors);

  if (!ok) {
    renderInvalid();
    return false;
  }
  renderTrip(values, calculateTrip(values));
  calculatedOnce = true;

  // На телефоні результат під формою — прокручуємо до нього
  if (scroll && window.matchMedia('(max-width: 1023px)').matches) {
    result.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
  return true;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!calculate({ scroll: true })) {
    form.querySelector('[aria-invalid="true"]')?.focus();
  }
});

// Після першого розрахунку результат оновлюється одразу при зміні параметрів
let timer;
form.addEventListener('input', (event) => {
  if (event.target.name in { days: 1, people: 1 }) setFieldError(event.target.name, '');
  if (!calculatedOnce) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    const { ok, values } = validateTrip(readForm());
    if (ok) renderTrip(values, calculateTrip(values));
  }, 250);
});

form.addEventListener('reset', () => {
  calculatedOnce = false;
  clearTimeout(timer);
  showErrors({});
  renderEmpty();
});

// Перехід з каталогу: planner.html?region=chornohora&days=2&difficulty=medium
// Значення з адреси перевіряються так само, як і введені вручну.
function prefillFromUrl() {
  const params = new URLSearchParams(location.search);
  if (!params.size) return false;
  const region = params.get('region');
  if ([...form.elements.region.options].some((o) => o.value === region)) form.elements.region.value = region;
  if (params.has('days')) form.elements.days.value = params.get('days');
  const difficulty = form.querySelector(`input[name="difficulty"][value="${CSS.escape(params.get('difficulty') || '')}"]`);
  if (difficulty) difficulty.checked = true;
  return true;
}
const prefilled = prefillFromUrl();

// Назви регіонів підвантажуємо заздалегідь; якщо прийшли з каталогу — рахуємо після цього
loadData()
  .then((data) => {
    regionNames = data.regions || {};
  })
  .catch(() => {})
  .finally(() => {
    if (prefilled) calculate();
  });
