// Логіка конструктора походу — чисті функції без DOM.
// Їх можна перевірити окремо (tests/planner-calc.test.js) і використати будь-де.

// Демонстраційні ціни, грн (таблиця «Як ми рахуємо» на planner.html)
export const PRICES = {
  foodPerPersonDay: 450,
  stayPerPersonNight: { tent: 0, hut: 400, hotel: 1100 },
  guidePerDay: 2500, // на всю групу
  rentPerPersonDay: 250,
  transferPerPerson: 700,
};

export const LIMITS = {
  days: { min: 1, max: 7 },
  people: { min: 1, max: 10 },
};

const STAY_LABELS = { tent: 'Намет', hut: 'Колиба', hotel: 'Готель' };

/**
 * Перевіряє одне числове поле. Приймає рядок з input (або число).
 * Повертає { value } або { error } з людським поясненням.
 */
export function parseCount(raw, field) {
  const { min, max } = LIMITS[field];
  const text = String(raw ?? '').trim().replace(',', '.');
  const unit = field === 'days' ? 'днів' : 'людей';

  if (text === '') {
    return { error: field === 'days' ? 'Вкажи кількість днів.' : 'Вкажи, скільки вас буде.' };
  }
  // Лише цифри (з можливим мінусом і дробовою частиною) — без «2д», «e5», «0x10»
  if (!/^-?\d+(\.\d+)?$/.test(text)) {
    return { error: 'Тут потрібне число, наприклад 2.' };
  }
  const value = Number(text);
  if (!Number.isInteger(value)) {
    return { error: `Кількість ${unit} — тільки ціле число.` };
  }
  if (value <= 0) {
    return {
      error: field === 'days'
        ? 'Похід триває щонайменше 1 день.'
        : 'У поході має бути щонайменше 1 людина.',
    };
  }
  if (value > max) {
    return {
      error: field === 'days'
        ? `Понад ${max} днів — це вже експедиція. Напиши нам, сплануємо окремо.`
        : `Групу понад ${max} людей плануємо індивідуально — напиши нам.`,
    };
  }
  if (value < min) return { error: `Мінімум — ${min}.` };
  return { value };
}

/**
 * Перевіряє всі параметри форми.
 * @returns {{ ok: boolean, errors: Record<string,string>, values: object }}
 */
export function validateTrip(input) {
  const errors = {};
  const values = {
    region: input.region || 'any',
    difficulty: ['easy', 'medium', 'hard'].includes(input.difficulty) ? input.difficulty : 'easy',
    stay: STAY_LABELS[input.stay] ? input.stay : 'hut',
    extras: Array.isArray(input.extras) ? input.extras : [],
  };

  const days = parseCount(input.days, 'days');
  if (days.error) errors.days = days.error;
  else values.days = days.value;

  const people = parseCount(input.people, 'people');
  if (people.error) errors.people = people.error;
  else values.people = people.value;

  return { ok: Object.keys(errors).length === 0, errors, values };
}

/**
 * Рахує вартість походу. Приймає вже перевірені значення (validateTrip).
 * @returns {{ nights, lines: {label, amount}[], total, perPerson, notes: {type, text}[] }}
 */
export function calculateTrip({ days, people, difficulty, stay, extras }) {
  const has = (x) => extras.includes(x);
  const nights = days - 1;
  const lines = [];
  const notes = [];

  lines.push({
    label: `Харчування: ${days} дн. × ${people} ос.`,
    amount: PRICES.foodPerPersonDay * days * people,
  });

  if (nights > 0) {
    lines.push({
      label: `${STAY_LABELS[stay]}: ${nights} ноч. × ${people} ос.`,
      amount: PRICES.stayPerPersonNight[stay] * nights * people,
    });
  } else {
    notes.push({ type: 'info', text: 'Похід на один день — ночівля не потрібна, житло не враховано.' });
  }

  if (has('guide')) {
    lines.push({ label: `Гід: ${days} дн. на групу`, amount: PRICES.guidePerDay * days });
  }
  if (has('rent')) {
    lines.push({
      label: `Прокат спорядження: ${days} дн. × ${people} ос.`,
      amount: PRICES.rentPerPersonDay * days * people,
    });
  }
  if (has('transfer')) {
    lines.push({ label: `Трансфер: ${people} ос.`, amount: PRICES.transferPerPerson * people });
  }

  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  const perPerson = Math.round(total / people);

  // --- Попередження про нелогічні або ризиковані комбінації ---
  if (difficulty === 'hard' && days === 1) {
    notes.push({
      type: 'warning',
      text: 'Складні маршрути розраховані на 2+ дні. За один день є ризик не встигнути спуститися до темряви.',
    });
  }
  if (difficulty === 'hard' && people === 1 && !has('guide')) {
    notes.push({
      type: 'warning',
      text: 'Не варто йти на складний маршрут самому. Візьми компанію або гіда.',
    });
  }
  if (stay === 'hotel' && difficulty === 'hard' && days >= 3) {
    notes.push({
      type: 'warning',
      text: 'Багатоденні складні маршрути проходять хребтом, далеко від готелів. Ночувати доведеться в наметі або колибі.',
    });
  }
  if (has('guide') && people === 1) {
    const perPersonInFour = Math.round((PRICES.guidePerDay * days) / 4);
    notes.push({
      type: 'tip',
      text: `Гід платить уся група разом: компанією з 4 людей він коштував би ${formatUAH(perPersonInFour)} з особи.`,
    });
  }
  if (stay === 'tent' && nights > 0 && !has('rent')) {
    notes.push({
      type: 'tip',
      text: 'Намет рахуємо як власний. Немає спорядження — додай «Прокат спорядження».',
    });
  }

  return { nights, lines, total, perPerson, notes };
}

/**
 * Підбирає маршрути: регіон, складність і тривалість не довша за похід.
 * Якщо нічого не знайшлося — поступово послаблює фільтр.
 * @returns {{ routes: object[], relaxed: null | 'difficulty' | 'region' }}
 */
export function matchRoutes(routes, { region, difficulty, days }) {
  const inRegion = (r) => region === 'any' || r.region === region;
  const fits = (r) => r.days <= days;

  const exact = routes.filter((r) => inRegion(r) && r.difficulty === difficulty && fits(r));
  if (exact.length) return { routes: exact, relaxed: null };

  const anyDifficulty = routes.filter((r) => inRegion(r) && fits(r));
  if (anyDifficulty.length) return { routes: anyDifficulty, relaxed: 'difficulty' };

  const anyRegion = routes.filter((r) => r.difficulty === difficulty && fits(r));
  return { routes: anyRegion, relaxed: 'region' };
}

/**
 * Орієнтовна вартість маршруту з особи для фільтра «Бюджет» у каталозі:
 * група з 2 людей, ночівлі в колибі, трансфер до старту — як типовий похід у конструкторі.
 */
export function estimatePerPerson(route) {
  return calculateTrip({
    days: route.days,
    people: 2,
    difficulty: route.difficulty,
    stay: 'hut',
    extras: ['transfer'],
  }).perPerson;
}

export function formatUAH(amount) {
  return `${new Intl.NumberFormat('uk-UA').format(amount)} грн`;
}
