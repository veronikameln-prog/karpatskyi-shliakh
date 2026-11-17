// Перевірка зібраного сайту перед публікацією (npm run check):
// 1) кожне локальне посилання, картинка, стиль і скрипт у сторінках існує;
// 2) зображення з data.json існують;
// 3) словники en / pl мають однаковий набір ключів і жодного порожнього перекладу.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const exists = (path) => existsSync(join(root, path.split(/[?#]/)[0]));

for (const file of readdirSync(root).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(join(root, file), 'utf8');
  for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:|#)/.test(url)) continue;
    const path = url.replace(/^\//, '');
    if (path && !exists(path)) errors.push(`${file}: немає файлу ${url}`);
  }
}

const data = JSON.parse(readFileSync(join(root, 'data/data.json'), 'utf8'));
const images = new Set();
const collect = (value) => {
  if (typeof value === 'string' && value.startsWith('assets/')) images.add(value);
  else if (Array.isArray(value)) value.forEach(collect);
  else if (value && typeof value === 'object') Object.values(value).forEach(collect);
};
collect(data);
for (const image of images) if (!exists(image)) errors.push(`data.json: немає зображення ${image}`);

const en = JSON.parse(readFileSync(join(root, 'data/i18n/en.json'), 'utf8'));
const pl = JSON.parse(readFileSync(join(root, 'data/i18n/pl.json'), 'utf8'));
for (const key of Object.keys(en)) {
  if (!(key in pl)) errors.push(`pl.json: немає перекладу «${key}»`);
  if (!en[key]) errors.push(`en.json: порожній переклад «${key}»`);
}
for (const key of Object.keys(pl)) {
  if (!(key in en)) errors.push(`en.json: немає перекладу «${key}»`);
  if (!pl[key]) errors.push(`pl.json: порожній переклад «${key}»`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`✓ посилання й файли на місці, зображень у data.json: ${images.size}, рядків у словниках: ${Object.keys(en).length}`);
