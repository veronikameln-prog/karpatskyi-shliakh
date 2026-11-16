// Генерує векторні ілюстрації для карток маршрутів (assets/img/routes/<id>.svg).
// Кожна ілюстрація унікальна: форма хребтів залежить від id маршруту (детермінований «випадок»),
// висота вершини — від peakM, озеро — для маршрутів до озер.
// Це тимчасові ШІ-ілюстрації: коли з'являться фото (docs/05-image-prompts.md),
// у data.json достатньо замінити шлях до файлу.
//
// Запуск: node scripts/generate-route-art.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const W = 600;
const H = 400;
const data = JSON.parse(readFileSync(new URL('../data/data.json', import.meta.url), 'utf8'));
const outDir = new URL('../assets/img/routes/', import.meta.url);
mkdirSync(outDir, { recursive: true });

// Палітра «Туман і хвоя» + відтінок неба для кожного регіону
const SKY = {
  chornohora: ['#E9ECE8', '#E7C29A'],
  gorgany: ['#E4E7E3', '#C9D2CC'],
  svydovets: ['#E6ECEC', '#D8C3A5'],
  borzhava: ['#EDE9E1', '#E8B98C'],
};
const RIDGES = ['#B9C2BC', '#7F9185', '#2F4A3A', '#1F3428'];

function seeded(str) {
  let h = 1779033703 ^ str.length;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 3432918353);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function ridge(rand, baseY, amp, steps, peakX = null, peakY = null) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const x = (W / steps) * i;
    let y = baseY + (rand() - 0.5) * amp;
    if (peakX !== null && i === Math.round(peakX / (W / steps))) y = peakY;
    pts.push(`${x.toFixed(0)},${y.toFixed(0)}`);
  }
  return `M0,${H} L${pts.join(' L')} L${W},${H} Z`;
}

for (const route of data.routes) {
  const rand = seeded(route.id);
  const [top, bottom] = SKY[route.region] || SKY.chornohora;
  const lake = /озеро|nesamovyte|synevyr/i.test(route.id + route.name);
  // Чим вища вершина, тим вище пік на ілюстрації
  const peakY = 230 - ((route.peakM - 900) / (2100 - 900)) * 140;
  const peakX = 120 + rand() * 360;
  const sunX = 80 + rand() * 440;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Ілюстрація: ${route.name}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
    <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6F7F4" stop-opacity="0"/><stop offset=".5" stop-color="#F6F7F4" stop-opacity=".85"/><stop offset="1" stop-color="#F6F7F4" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <circle cx="${sunX.toFixed(0)}" cy="${(70 + rand() * 40).toFixed(0)}" r="${(26 + rand() * 12).toFixed(0)}" fill="#C8743A" opacity=".55"/>
  <path d="${ridge(rand, 210, 70, 7)}" fill="${RIDGES[0]}"/>
  <path d="${ridge(rand, 250, 60, 6, peakX, peakY)}" fill="${RIDGES[1]}"/>
  <rect y="240" width="${W}" height="70" fill="url(#mist)"/>
  ${lake ? `<ellipse cx="${W / 2}" cy="330" rx="230" ry="34" fill="#A8BAB8"/><ellipse cx="${(sunX * 0.6 + 120).toFixed(0)}" cy="330" rx="40" ry="5" fill="#E7C29A" opacity=".7"/>` : ''}
  <path d="${lake ? `M0,${H} L0,300 C120,320 140,370 300,372 C460,370 480,320 ${W},300 L${W},${H} Z` : ridge(rand, 320, 40, 5)}" fill="${RIDGES[2]}"/>
  <path d="${ridge(rand, 375, 20, 4)}" fill="${RIDGES[3]}"/>
</svg>
`;
  writeFileSync(new URL(`${route.id}.svg`, outDir), svg);
  route.image = `assets/img/routes/${route.id}.svg`;
}

writeFileSync(new URL('../data/data.json', import.meta.url), `${JSON.stringify(data, null, 2)}\n`);
console.log(`Згенеровано ${data.routes.length} ілюстрацій`);
