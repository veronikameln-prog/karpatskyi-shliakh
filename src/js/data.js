// Завантаження mock-даних (маршрути, відгуки) з data/data.json.
// Запит робиться один раз, далі всі модулі отримують ту саму відповідь.

let cache = null;

export async function loadData() {
  if (!cache) {
    cache = (async () => {
      const response = await fetch('data/data.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.routes)) throw new Error('Неправильний формат даних');
      return data;
    })();
    // Якщо запит не вдався — наступна спроба зробить новий запит
    cache.catch(() => {
      cache = null;
    });
  }
  return cache;
}

export const DIFFICULTY_LABELS = { easy: 'Легка', medium: 'Середня', hard: 'Складна' };

/** Створює елемент із класами й текстом. Текст — лише через textContent (безпечно). */
export function el(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function daysLabel(n) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return `${n} день`;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${n} дні`;
  return `${n} днів`;
}

export function peopleLabel(n) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return `${n} людина`;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${n} людини`;
  return `${n} людей`;
}
