// Збирає сторінки сайту: src/pages/*.html + спільні шапка, футер і <head> із src/partials.
// Запуск: npm run build:html (входить у npm run build).
//
// Кожна сторінка починається з блоку налаштувань:
// <!--
// title: Заголовок вкладки
// description: Опис для пошуку й Open Graph
// nav: routes            (який пункт меню підсвітити; 404 — без пункту)
// libs: gsap, leaflet    (бібліотеки з CDN)
// script: routes.js      (модуль сторінки з src/js)
// -->
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_URL = 'https://karpatskyi-shliakh.netlify.app';
// Google Analytics 4 — тег Google з analytics.google.com (Адміністратор → Потоки даних → Сайт → Налаштувати тег).
// Підходить і контейнер тегу Google (GTM-…), і ідентифікатор показника (G-…).
// Змінна середовища GA_ID (на Netlify — Project configuration → Environment variables) має перевагу; '' — без лічильника.
const GA_ID = process.env.GA_ID ?? 'GTM-5R2XLRNB';

// Тег Google. На localhost не завантажується, щоб перегляди під час розробки не псували статистику.
function analyticsTag() {
  const match = /^(GTM|GT|G)-[A-Z0-9]+$/.exec(GA_ID);
  if (!match) return '';
  const lib = match[1] === 'GTM' ? 'gtm.js' : 'gtag/js';
  const config = match[1] === 'GTM' ? '' : `\n      gtag('config', '${GA_ID}');`;
  return `  <script>
    if (!/^(localhost|127\\.0\\.0\\.1)$/.test(location.hostname)) {
      var gtagScript = document.createElement('script');
      gtagScript.async = true;
      gtagScript.src = 'https://www.googletagmanager.com/${lib}?id=${GA_ID}';
      document.head.appendChild(gtagScript);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { dataLayer.push(arguments); };
      gtag('js', new Date());${config}
    }
  </script>
`;
}

const CDN = {
  gsap: {
    js: [
      'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js',
    ],
  },
  leaflet: {
    css: ['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'],
    js: ['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'],
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

// Телефону — легка копія фото (-sm, 720 px), великому екрану — повна. Додається до кожного <img> з assets/img/photos,
// якщо мала копія існує і srcset ще не задано вручну.
function withSrcset(html) {
  return html.replace(/<img\b([^>]*?)\ssrc="(assets\/img\/photos\/([^"]+?)(\.(?:jpe?g|webp)))"([^>]*)>/g, (tag, before, src, name, ext, after) => {
    if (/\ssrcset=/.test(tag)) return tag;
    const small = `assets/img/photos/${name}-sm${ext}`;
    if (!existsSync(join(root, small))) return tag;
    const sizes = /\ssizes=/.test(tag) ? '' : ' sizes="100vw"';
    return `<img${before} src="${src}" srcset="${small} 720w, ${src} 1600w"${sizes}${after}>`;
  });
}

// Сторінка маршруту: фото героя за ?id= ставиться вбудованим скриптом ще під час розбору HTML,
// інакше браузер дізнається про нього лише після route.js і data.json (довгий LCP на телефоні).
function routeHeroesScript() {
  const { routes } = JSON.parse(read('data/data.json'));
  const heroes = Object.fromEntries(routes.map((r) => [r.id, r.hero || r.image]));
  return `(function () {
      var heroes = ${JSON.stringify(heroes)};
      var src = heroes[new URLSearchParams(location.search).get('id')];
      if (!src) return;
      var img = document.getElementById('route-hero');
      var m = /^(.+)(\\.(?:jpe?g|webp))$/.exec(src);
      if (m) { img.srcset = m[1] + '-sm' + m[2] + ' 720w, ' + src + ' 1600w'; img.sizes = '100vw'; }
      img.src = src;
    })();`;
}

const pages = readdirSync(join(root, 'src/pages')).filter((f) => f.endsWith('.html'));
for (const file of pages) {
  const { meta, body: rawBody } = parsePage(read(`src/pages/${file}`));
  const body = rawBody.includes('{{routeHeroes}}') ? rawBody.replace('{{routeHeroes}}', routeHeroesScript()) : rawBody;
  const libs = (meta.libs || '').split(',').map((s) => s.trim()).filter(Boolean);
  for (const lib of libs) if (!CDN[lib]) throw new Error(`${file}: невідома бібліотека ${lib}`);

  // CSS бібліотек (карта, слайдер) не блокує першу відмальовку: вони все одно оживають лише після свого JS
  const libsCss = libs.flatMap((l) => CDN[l].css || [])
    .map((href) => `  <link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'">\n  <noscript><link rel="stylesheet" href="${href}"></noscript>\n`)
    .join('');
  const libsJs = libs.flatMap((l) => CDN[l].js || []).map((src) => `  <script src="${src}" defer></script>\n`).join('');
  const pageScript = meta.script ? `  <script type="module" src="src/js/${meta.script}"></script>\n` : '';

  const head = partials.head
    .replaceAll('{{title}}', escapeAttr(meta.title))
    .replaceAll('{{description}}', escapeAttr(meta.description))
    .replaceAll('{{siteUrl}}', SITE_URL)
    .replaceAll('{{file}}', file === 'index.html' ? '' : file)
    .replace('{{libsCss}}', libsCss + analyticsTag())
    // 404 віддається з будь-якої адреси (/a/b/c), тому відносні шляхи рахуємо від кореня сайту
    .replace('<meta charset="utf-8">', meta.base ? `<meta charset="utf-8">
  <base href="${meta.base}">` : '<meta charset="utf-8">');

  // Активний пункт меню
  const header = partials.header
    .replaceAll(`data-nav="${meta.nav}"`, 'aria-current="page"')
    .replace(/ data-nav="[^"]*"/g, '');

  const html = withSrcset(`${head}${header}\n${body.trimEnd()}\n\n${partials.footer}\n${libsJs}  <script type="module" src="src/js/site.js"></script>\n${pageScript}</body>\n</html>\n`);
  writeFileSync(join(root, file), html);
  console.log(`✓ ${file}`);
}
