// Форма зворотного зв'язку: перевірка через регулярні вирази (RegEx) і маска телефону.
// Дані нікуди не надсилаються — це демо. Для справжньої відправки потрібен сервер
// (або сервіс на кшталт Netlify Forms), який би приймав і захищав дані.

export const PATTERNS = {
  // Літера на початку, далі літери (укр/лат), пробіл, апостроф, дефіс; загалом 2–50 символів
  name: /^[A-Za-zА-ЩЬЮЯҐЄІЇа-щьюяґєії][A-Za-zА-ЩЬЮЯҐЄІЇа-щьюяґєії'ʼ’ -]{1,49}$/,
  // Частина до @, домен і зона з 2+ латинських літер
  email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/,
  // Український номер: +380 і ще 9 цифр (пробіли маска додає лише для зручності)
  phone: /^\+380\d{9}$/,
};

const MESSAGE = { min: 10, max: 1000 };

/** Маска: будь-яке введення → «+380 67 123 45 67» */
export function formatPhone(raw) {
  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('380')) digits = digits.slice(3);
  else if (digits.startsWith('80')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  digits = digits.slice(0, 9);

  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);
  return ['+380', ...parts].join(' ');
}

/** Перевірка одного поля. Повертає текст помилки або ''. */
export function validateField(name, value) {
  const text = typeof value === 'string' ? value.trim() : value;
  switch (name) {
    case 'name':
      if (!text) return 'Як до тебе звертатися?';
      if (text.length < 2) return 'Ім\'я — щонайменше 2 літери.';
      if (!PATTERNS.name.test(text)) return 'Тільки літери, пробіл, апостроф або дефіс.';
      return '';
    case 'email':
      if (!text) return 'Вкажи email, щоб ми могли відповісти.';
      if (!PATTERNS.email.test(text)) return 'Перевір email: він має виглядати як name@example.com.';
      return '';
    case 'phone': {
      const compact = text.replace(/\s/g, '');
      if (!compact) return 'Вкажи номер телефону.';
      if (!PATTERNS.phone.test(compact)) return 'Номер має бути у форматі +380 XX XXX XX XX.';
      return '';
    }
    case 'message':
      if (!text) return 'Напиши, з чим допомогти.';
      if (text.length < MESSAGE.min) return `Трохи детальніше — щонайменше ${MESSAGE.min} символів.`;
      if (text.length > MESSAGE.max) return `Занадто довго — максимум ${MESSAGE.max} символів.`;
      return '';
    case 'consent':
      return value ? '' : 'Потрібна згода на обробку повідомлення.';
    default:
      return '';
  }
}

// ---------- Інтерфейс ----------
// (перевірка typeof document дозволяє тестувати функції вище в Node.js)
const form = typeof document !== 'undefined' ? document.getElementById('contact-form') : null;

if (form) {
  const success = document.getElementById('contact-success');
  const successText = success?.querySelector('[data-success-text]');
  const FIELDS = ['name', 'email', 'phone', 'message', 'consent'];
  const touched = new Set();

  const valueOf = (name) => {
    const input = form.elements[name];
    return input.type === 'checkbox' ? input.checked : input.value;
  };

  const showError = (name, message) => {
    const input = form.elements[name];
    document.getElementById(`c-${name}-error`).textContent = message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  };

  const check = (name) => {
    const message = validateField(name, valueOf(name));
    showError(name, message);
    return !message;
  };

  // Маска телефону під час введення
  const phone = form.elements.phone;
  phone.addEventListener('focus', () => {
    if (!phone.value) phone.value = '+380 ';
  });
  phone.addEventListener('input', () => {
    phone.value = formatPhone(phone.value);
  });
  phone.addEventListener('blur', () => {
    if (phone.value.trim() === '+380') phone.value = '';
  });

  // Лічильник символів повідомлення
  const message = form.elements.message;
  const counter = document.getElementById('c-message-count');
  const updateCounter = () => {
    if (counter) counter.textContent = `${message.value.trim().length} / ${MESSAGE.max}`;
  };
  message.addEventListener('input', updateCounter);

  // Помилку показуємо після того, як людина вийшла з поля, а прибираємо — щойно поле стало правильним
  FIELDS.forEach((name) => {
    const input = form.elements[name];
    input.addEventListener('blur', () => {
      touched.add(name);
      check(name);
    });
    input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', () => {
      if (touched.has(name)) check(name);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const results = FIELDS.map((name) => {
      touched.add(name);
      return check(name);
    });

    if (results.includes(false)) {
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    // Ім'я виводимо лише через textContent — без ризику вставити HTML
    const name = form.elements.name.value.trim();
    if (successText) successText.textContent = `${name}, повідомлення отримано. Відповімо протягом доби.`;

    form.reset();
    touched.clear();
    FIELDS.forEach((n) => showError(n, ''));
    updateCounter();
    success?.showModal();
  });

  success?.addEventListener('click', (event) => {
    if (event.target === success) success.close();
  });
}
