/** @type {import('tailwindcss').Config} */
// Кольори беруться з CSS-змінних (src/input.css), тому тема «день / ніч»
// перемикається одним класом .dark на <html>.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ['./*.html', './src/js/**/*.js'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        ink: v('text'),
        muted: v('text-muted'),
        stone: v('stone'),
        forest: v('forest'),
        accent: v('accent'),
        'accent-soft': v('accent-soft'),
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        scene: ['clamp(2.75rem, 8vw, 7rem)', { lineHeight: '1' }],
        page: ['clamp(2.25rem, 5vw, 3.75rem)', { lineHeight: '1.05' }],
      },
      maxWidth: { site: '75rem' },
    },
  },
  plugins: [],
};
