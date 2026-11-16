// «Поради новачкам»: чек-лист спорядження з прогресом, який зберігається в localStorage.
const KEY = 'ks-checklist';
const form = document.getElementById('checklist-form');
const boxes = [...form.querySelectorAll('input[name="item"]')];
const count = document.getElementById('checklist-count');
const progress = document.getElementById('checklist-progress');

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return []; // пошкоджені дані або localStorage недоступний — починаємо з нуля
  }
}

function save() {
  const checked = boxes.filter((b) => b.checked).map((b) => b.value);
  try {
    localStorage.setItem(KEY, JSON.stringify(checked));
  } catch {
    // приватний режим — список просто не запам'ятається
  }
}

function update() {
  const done = boxes.filter((b) => b.checked).length;
  count.textContent = done === boxes.length ? 'Усе готово — гарного походу!' : `${done} з ${boxes.length} готово`;
  progress.max = boxes.length;
  progress.value = done;
}

const saved = new Set(load());
boxes.forEach((b) => {
  b.checked = saved.has(b.value);
});
update();

form.addEventListener('change', () => {
  update();
  save();
});
form.addEventListener('reset', () => {
  setTimeout(() => {
    update();
    save();
  });
});

// «Завантажити PDF»: діалог друку браузера, де можна обрати «Зберегти як PDF».
// Стилі друку (src/input.css, @media print) лишають на аркуші тільки чек-лист.
document.getElementById('checklist-print').addEventListener('click', () => window.print());
