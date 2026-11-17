// Аналітика (Google Analytics 4). Сам лічильник підключає <head>, лише коли в scripts/build-html.mjs задано GA_ID.
// Тут — події, які варто рахувати окремо від переглядів сторінок: розрахунок у конструкторі й надіслана форма.
// Якщо лічильника немає (локальний перегляд, тести в Node), track() просто нічого не робить.
// Персональних даних (ім'я, email, телефон) у події не передаємо — лише узагальнені параметри.

export function track(event, params = {}) {
  if (typeof globalThis.gtag === 'function') globalThis.gtag('event', event, params);
}
