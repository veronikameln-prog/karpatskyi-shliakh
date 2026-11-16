/** @type {import('tailwindcss').Config} */
// Кольори беруться з CSS-змінних (src/input.css), тому тема «день / ніч»
// перемикається одним класом .dark на <html>.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  // Сторінки збираються з src/pages + src/partials (scripts/build-html.mjs)
  content: ['./src/pages/*.html', './src/partials/*.html', './src/js/**/*.js'],
  // Класи складності JS складає з рядка (badge-${route.difficulty}), Tailwind їх у коді не бачить — додаємо явно
  safelist: ['badge-easy', 'badge-medium', 'badge-hard'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        'surface-2': v('surface-2'),
        ink: v('text'),
        muted: v('text-muted'),
        line: v('line'),
        heading: v('heading'),
        primary: v('primary'),
        'on-primary': v('on-primary'),
        accent: v('accent'),
        sun: v('sky'),
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        hero: ['clamp(2.5rem, 6vw, 4.5rem)', { lineHeight: '1.05' }],
        page: ['clamp(2.25rem, 5vw, 3.5rem)', { lineHeight: '1.1' }],
      },
      maxWidth: { site: '80rem' },
    },
  },
  plugins: [],
};
