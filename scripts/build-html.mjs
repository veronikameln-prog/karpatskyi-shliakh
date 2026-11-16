// Збирає сторінки сайту: src/pages/*.html + спільні шапка, футер і <head> із src/partials.
// Запуск: npm run build:html (входить у npm run build).
//
// Кожна сторінка починається з блоку налаштувань:
// <!--
// title: Заголовок вкладки
// description: Опис для пошуку й Open Graph
// nav: routes            (який пункт меню підсвітити; 404 — без пункту)
// libs: gsap, swiper     (бібліотеки з CDN)
// script: routes.js      (модуль сторінки з src/js)
// -->
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_URL = 'https://karpatskyi-shliakh.netlify.app';

const CDN = {
  gsap: {
    js: [
      'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js',
    ],
  },
  swiper: {
    css: ['https://cdnjs.cloudflare.com/ajax/libs/Swiper/11.1.14/swiper-bundle.min.css'],
    js: ['https://cdnjs.cloudflare.com/ajax/libs/Swiper/11.1.14/swiper-bundle.min.js'],
  },
};

const read = (path) => readFileSync(join(root, path), 'utf8');
const logo = read('src/partials/logo.html').trim();
const partials = {
  head: read('src/partials/head.html'),
  header: read('src/partials/header.html').replaceAll('{{logo}}', logo),
  footer: read('src/partials/footer.html').replaceAll('{{logo}}', logo),
};

function parsePage(source) {
  const match = source.match(/^<!--([\s\S]*?)-->\s*/);
  if (!match) throw new Error('Немає блоку налаштувань на початку сторінки');
  const meta = {};
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(':');
    if (key.trim() && rest.length) meta[key.trim()] = rest.join(':').trim();
  }
  return { meta, body: source.slice(match[0].length) };
}

const escapeAttr = (s) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

const pages = readdirSync(join(root, 'src/pages')).filter((f) => f.endsWith('.html'));
for (const file of pages) {
  const { meta, body } = parsePage(read(`src/pages/${file}`));
  const libs = (meta.libs || '').split(',').map((s) => s.trim()).filter(Boolean);
  for (const lib of libs) if (!CDN[lib]) throw new Error(`${file}: невідома бібліотека ${lib}`);

  const libsCss = libs.flatMap((l) => CDN[l].css || []).map((href) => `  <link rel="stylesheet" href="${href}">\n`).join('');
  const libsJs = libs.flatMap((l) => CDN[l].js || []).map((src) => `  <script src="${src}" defer></script>\n`).join('');
  const pageScript = meta.script ? `  <script type="module" src="src/js/${meta.script}"></script>\n` : '';

  const head = partials.head
    .replaceAll('{{title}}', escapeAttr(meta.title))
    .replaceAll('{{description}}', escapeAttr(meta.description))
    .replaceAll('{{siteUrl}}', SITE_URL)
    .replaceAll('{{file}}', file === 'index.html' ? '' : file)
    .replace('{{libsCss}}', libsCss)
    // 404 віддається з будь-якої адреси (/a/b/c), тому відносні шляхи рахуємо від кореня сайту
    .replace('<meta charset="utf-8">', meta.base ? `<meta charset="utf-8">
  <base href="${meta.base}">` : '<meta charset="utf-8">');

  // Активний пункт меню
  const header = partials.header
    .replaceAll(`data-nav="${meta.nav}"`, 'aria-current="page"')
    .replace(/ data-nav="[^"]*"/g, '');

  const html = `${head}${header}\n${body.trimEnd()}\n\n${partials.footer}\n${libsJs}  <script type="module" src="src/js/site.js"></script>\n${pageScript}</body>\n</html>\n`;
  writeFileSync(join(root, file), html);
  console.log(`✓ ${file}`);
}
