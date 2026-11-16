// Перевірка RegEx-валідації форми і маски телефону: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatPhone, validateField } from '../src/js/form.js';

test('маска телефону приводить будь-яке введення до +380 XX XXX XX XX', () => {
  assert.equal(formatPhone('0671234567'), '+380 67 123 45 67');
  assert.equal(formatPhone('+380671234567'), '+380 67 123 45 67');
  assert.equal(formatPhone('80671234567'), '+380 67 123 45 67');
  assert.equal(formatPhone('+38 (067) 123-45-67'), '+380 67 123 45 67');
  assert.equal(formatPhone('067123456789999'), '+380 67 123 45 67'); // зайві цифри відкидаються
  assert.equal(formatPhone('067'), '+380 67');
  assert.equal(formatPhone('abc'), '');
});

test('ім\'я: літери, апостроф, дефіс; 2–50 символів', () => {
  assert.equal(validateField('name', 'Оксана'), '');
  assert.equal(validateField('name', "Мар'яна"), '');
  assert.equal(validateField('name', 'Анна-Марія'), '');
  assert.equal(validateField('name', 'Olena'), '');
  assert.notEqual(validateField('name', ''), '');
  assert.notEqual(validateField('name', 'О'), '');
  assert.notEqual(validateField('name', 'Оксана123'), '');
  assert.notEqual(validateField('name', '<script>'), '');
  assert.notEqual(validateField('name', '-Оксана'), '');
});

test('email', () => {
  assert.equal(validateField('email', 'oksana@example.com'), '');
  assert.equal(validateField('email', 'o.k+trip@mail.lviv.ua'), '');
  assert.notEqual(validateField('email', 'oksana@'), '');
  assert.notEqual(validateField('email', 'oksana@example'), '');
  assert.notEqual(validateField('email', 'oks ana@example.com'), '');
  assert.notEqual(validateField('email', '@example.com'), '');
});

test('телефон після маски', () => {
  assert.equal(validateField('phone', '+380 67 123 45 67'), '');
  assert.notEqual(validateField('phone', '+380 67 123'), '');
  assert.notEqual(validateField('phone', ''), '');
});

test('повідомлення 10–1000 символів і згода', () => {
  assert.notEqual(validateField('message', 'Привіт'), '');
  assert.equal(validateField('message', 'Який маршрут обрати на два дні?'), '');
  assert.notEqual(validateField('message', 'а'.repeat(1001)), '');
  assert.notEqual(validateField('consent', false), '');
  assert.equal(validateField('consent', true), '');
});
