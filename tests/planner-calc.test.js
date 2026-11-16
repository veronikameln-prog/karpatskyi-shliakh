// Перевірка логіки конструктора походу: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCount, validateTrip, calculateTrip, matchRoutes } from '../src/js/planner-calc.js';

const { routes } = JSON.parse(readFileSync(new URL('../data/data.json', import.meta.url), 'utf8'));
const base = { region: 'any', difficulty: 'easy', stay: 'hut', extras: [] };

test('edge cases введення: порожньо, текст, дроби, нуль, мінус, межі', () => {
  assert.match(parseCount('', 'days').error, /Вкажи/);
  assert.match(parseCount('   ', 'people').error, /Вкажи/);
  assert.match(parseCount('abc', 'days').error, /число/);
  assert.match(parseCount('2д', 'days').error, /число/);
  assert.match(parseCount('1e2', 'days').error, /число/);
  assert.match(parseCount('2.5', 'days').error, /ціле/);
  assert.match(parseCount('2,5', 'people').error, /ціле/);
  assert.match(parseCount('0', 'days').error, /щонайменше 1/);
  assert.match(parseCount('-3', 'people').error, /щонайменше 1/);
  assert.match(parseCount('8', 'days').error, /експедиція/);
  assert.match(parseCount('11', 'people').error, /індивідуально/);
  assert.equal(parseCount(' 7 ', 'days').value, 7);
  assert.equal(parseCount('10', 'people').value, 10);
});

test('validateTrip збирає помилки обох полів', () => {
  const r = validateTrip({ ...base, days: '0', people: '' });
  assert.equal(r.ok, false);
  assert.ok(r.errors.days && r.errors.people);
});

test('розрахунок: 2 дні, 2 людини, колиба, без опцій', () => {
  const r = calculateTrip({ ...base, days: 2, people: 2 });
  // харчування 450×2×2 = 1800, колиба 400×1×2 = 800
  assert.equal(r.total, 2600);
  assert.equal(r.perPerson, 1300);
  assert.equal(r.nights, 1);
});

test('усі опції: гід на групу, прокат і трансфер на кожного', () => {
  const r = calculateTrip({ ...base, days: 3, people: 4, stay: 'hotel', extras: ['guide', 'rent', 'transfer'] });
  // 450×3×4 + 1100×2×4 + 2500×3 + 250×3×4 + 700×4
  assert.equal(r.total, 5400 + 8800 + 7500 + 3000 + 2800);
  assert.equal(r.perPerson, Math.round(27500 / 4));
});

test('1 день — житло не рахується, є пояснення', () => {
  const r = calculateTrip({ ...base, days: 1, people: 3, stay: 'hotel' });
  assert.equal(r.total, 450 * 3);
  assert.ok(r.notes.some((n) => /ночівля не потрібна/.test(n.text)));
});

test('попередження про ризиковані комбінації', () => {
  const hardOneDay = calculateTrip({ ...base, difficulty: 'hard', days: 1, people: 2 });
  assert.ok(hardOneDay.notes.some((n) => n.type === 'warning' && /2\+ дні/.test(n.text)));

  const hardAlone = calculateTrip({ ...base, difficulty: 'hard', days: 2, people: 1 });
  assert.ok(hardAlone.notes.some((n) => /самому/.test(n.text)));

  const hotelRidge = calculateTrip({ ...base, difficulty: 'hard', days: 3, people: 2, stay: 'hotel' });
  assert.ok(hotelRidge.notes.some((n) => /далеко від готелів/.test(n.text)));

  const guideAlone = calculateTrip({ ...base, days: 2, people: 1, extras: ['guide'] });
  assert.ok(guideAlone.notes.some((n) => n.type === 'tip' && /4 людей/.test(n.text)));
});

test('підбір маршрутів: точний збіг і тривалість не довша за похід', () => {
  const r = matchRoutes(routes, { region: 'chornohora', difficulty: 'easy', days: 1 });
  assert.equal(r.relaxed, null);
  assert.ok(r.routes.length > 0);
  assert.ok(r.routes.every((x) => x.region === 'chornohora' && x.difficulty === 'easy' && x.days <= 1));
});

test('підбір маршрутів: якщо збігу немає — послаблюємо фільтр', () => {
  // На Боржаві немає складних маршрутів
  const r = matchRoutes(routes, { region: 'borzhava', difficulty: 'hard', days: 7 });
  assert.equal(r.relaxed, 'difficulty');
  assert.ok(r.routes.every((x) => x.region === 'borzhava'));

  // Складний маршрут за 1 день не знайдеться ніде
  const none = matchRoutes(routes, { region: 'any', difficulty: 'hard', days: 1 });
  assert.notEqual(none.relaxed, null);
});
