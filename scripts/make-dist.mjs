// Складає теку _site — тільки те, що потрібно браузеру (без node_modules, тестів і вихідних сторінок).
// Запуск: npm run dist (після npm run build).
import { cpSync, rmSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, '_site');

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const file of readdirSync(root).filter((f) => f.endsWith('.html'))) cpSync(join(root, file), join(out, file));
for (const dir of ['css', 'assets', 'data', 'src/js']) cpSync(join(root, dir), join(out, dir), { recursive: true });
cpSync(join(root, 'netlify.toml'), join(out, 'netlify.toml'));
cpSync(join(root, 'favicon.ico'), join(out, 'favicon.ico')); // браузери самі запитують /favicon.ico — без нього в консолі 404
console.log('✓ _site готова');
