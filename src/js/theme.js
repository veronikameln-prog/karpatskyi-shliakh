// Тема «день / ніч у горах».
// Початковий клас .dark ставить маленький inline-скрипт у <head> (щоб не було «спалаху»),
// а тут — лише перемикач і збереження вибору в localStorage.

export const THEME_KEY = 'ks-theme';

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // localStorage може бути недоступний (приватний режим) — тема просто не запам'ятається
  }
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    // Підпис кнопки сталий («Нічна тема»), а стан передає aria-pressed
    btn.setAttribute('aria-pressed', String(isDark));
    btn.title = isDark ? 'Увімкнути день' : 'Увімкнути ніч';
  });

  // Колір рядка браузера на телефоні
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isDark ? '#0E1A24' : '#E9ECE8');
}

export function initTheme() {
  const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  applyTheme(current);

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
      applyTheme(next);
      saveTheme(next);
    });
  });
}
