// Спільний код для всіх сторінок: тема, меню, рік у футері.
import { initTheme } from './theme.js';
import { initMenu } from './menu.js';

initTheme();
initMenu();

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());
