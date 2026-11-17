// Мови сайту: українська (основна, у розмітці), англійська та польська (словники data/i18n/*.json).
//
// Як це працює: ключ словника — сам український рядок. Після завантаження словника
// скрипт проходить по тексту сторінки й підставляє переклад, а MutationObserver
// так само перекладає все, що інші модулі домальовують пізніше (картки з data.json,
// результат конструктора, помилки форм). Тому окремих ключів у розмітці немає.
// Рядки з числами («8 км», «3 з 14 готово») шукаються за шаблоном: «{0} км», «{0} з {1} готово».

export const LANGS = { uk: 'Українська', en: 'English', pl: 'Polski' };
export const LANG_KEY = 'ks-lang';
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'TEXTAREA']);
const CYRILLIC = /[А-Яа-яІіЇїЄєҐґ]/;
const NUMBER = /\d(?:[\d  ]*\d)?(?:[.,]\d+)?/g;

export function getLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return LANGS[saved] ? saved : 'uk';
  } catch {
    return 'uk';
  }
}

export const lang = getLang();
let dict = null;

const norm = (s) => s.replace(/\s+/g, ' ').trim();

/** Переклад одного рядка. Якщо точного збігу немає — пробує шаблон із числами, далі частини через роздільники. */
export function t(source) {
  if (!dict || !source) return source;
  const key = norm(source);
  if (!key || !CYRILLIC.test(key)) return source;
  if (dict[key] !== undefined) return dict[key];

  // «2061 м» → «{0} м»
  const numbers = [];
  const template = key.replace(NUMBER, (m) => `{${numbers.push(m) - 1}}`);
  if (numbers.length && dict[template] !== undefined) {
    return dict[template].replace(/\{(\d+)\}/g, (_, i) => numbers[Number(i)] ?? '');
  }

  // «1 день · 8 км», «Чорногора: найвищі вершини України»
  for (const sep of [' · ', ' — ', ': ', ', ']) {
    if (key.includes(sep)) {
      const parts = key.split(sep);
      const done = parts.map((p) => tPart(p));
      if (done.some((p, i) => p !== parts[i])) return done.join(sep);
    }
  }
  return source;
}

/** Рядок із вставками: tf('Усі маршрути регіону {name}', { name }) — перекладає шаблон і самі значення. */
export function tf(template, vars = {}) {
  return t(template).replace(/\{(\w+)\}/g, (match, key) => (key in vars ? t(String(vars[key])) : match));
}

function tPart(part) {
  if (dict[part] !== undefined) return dict[part];
  const numbers = [];
  const template = part.replace(NUMBER, (m) => `{${numbers.push(m) - 1}}`);
  if (numbers.length && dict[template] !== undefined) {
    return dict[template].replace(/\{(\d+)\}/g, (_, i) => numbers[Number(i)] ?? '');
  }
  return part;
}

function translateText(node) {
  const value = node.nodeValue;
  if (!value || !CYRILLIC.test(value)) return;
  const out = t(value);
  if (out === value) return;
  // Зберігаємо пробіли на краях — від них залежать відступи між сусідніми елементами
  const lead = value.match(/^\s*/)[0];
  const tail = value.match(/\s*$/)[0];
  node.nodeValue = lead + out + tail;
}

function translateAttrs(el) {
  for (const name of ATTRS) {
    const value = el.getAttribute?.(name);
    if (value && CYRILLIC.test(value)) {
      const out = t(value);
      if (out !== value) el.setAttribute(name, out);
    }
  }
}

function translateTree(root) {
  if (root.nodeType === Node.TEXT_NODE) {
    if (!SKIP.has(root.parentNode?.nodeName)) translateText(root);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE || SKIP.has(root.nodeName) || root.closest?.('[translate="no"]')) return;
  translateAttrs(root);
  root.querySelectorAll?.('[placeholder], [aria-label], [title], [alt]').forEach((el) => {
    if (!el.closest('[translate="no"]')) translateAttrs(el);
  });
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent || SKIP.has(parent.nodeName) || parent.closest('[translate="no"]')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(translateText);
}

function translateHead() {
  document.title = t(document.title);
  document.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"]').forEach((meta) => {
    meta.setAttribute('content', t(meta.getAttribute('content')));
  });
}

function reveal() {
  document.documentElement.classList.remove('i18n-wait');
}

async function start() {
  if (lang === 'uk') return;
  try {
    const response = await fetch(`data/i18n/${lang}.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    dict = await response.json();
  } catch (error) {
    console.warn('Не вдалося завантажити переклад, лишаємо українську:', error);
    reveal();
    return;
  }
  document.documentElement.lang = lang;
  translateHead();
  translateTree(document.body);

  // Усе, що з'являється або змінюється пізніше, перекладається до відмальовки кадру
  new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData') translateTree(record.target);
      else if (record.type === 'attributes') translateAttrs(record.target);
      else record.addedNodes.forEach(translateTree);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  new MutationObserver(() => {
    const translated = t(document.title);
    if (translated !== document.title) document.title = translated;
  }).observe(document.querySelector('title'), { childList: true });
  reveal();
}

export const ready = start();

// ---------- Перемикач мови в шапці ----------
export function setLang(next) {
  if (!LANGS[next] || next === lang) return;
  try {
    localStorage.setItem(LANG_KEY, next);
  } catch {
    // без localStorage вибір не запам'ятається — тоді й перезавантажувати немає сенсу
    return;
  }
  location.reload();
}

export function initLangSwitch() {
  document.querySelectorAll('[data-lang-current]').forEach((node) => {
    node.textContent = lang.toUpperCase();
  });
  document.querySelectorAll('[data-lang]').forEach((button) => {
    const active = button.dataset.lang === lang;
    button.setAttribute('aria-pressed', String(active));
    button.addEventListener('click', () => setLang(button.dataset.lang));
  });

  const toggle = document.querySelector('[data-lang-toggle]');
  const menu = document.getElementById('lang-menu');
  if (!toggle || !menu) return;
  const setOpen = (open) => {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    setOpen(menu.hidden);
  });
  document.addEventListener('click', (event) => {
    if (!menu.hidden && !menu.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menu.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
}
