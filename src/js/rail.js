// Горизонтальна стрічка карток на телефоні (клас .m-rail у CSS): крапки під стрічкою й, за бажанням, автопрокрутка.
// На планшеті й десктопі стрічки немає (звичайна сітка), тому крапки сховані, а автопрокрутка не запускається.
//
// initRail(list)                     — крапки показують, яка картка зараз, і перемикають на потрібну
// initRail(list, { autoplay: 3000 }) — ще й сама гортає кожні 3 с; зупиняється назавжди,
//                                      щойно людина торкнулась стрічки, крапок чи клавіатури

const mobile = window.matchMedia('(max-width: 767.98px)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initRail(list, { autoplay = 0 } = {}) {
  if (!list) return;
  const dots = list.nextElementSibling?.classList.contains('rail-dots') ? list.nextElementSibling : document.createElement('div');
  if (!dots.isConnected) {
    dots.className = 'rail-dots';
    dots.setAttribute('role', 'group');
    dots.setAttribute('aria-label', 'Перемикання карток');
    list.after(dots);
  }

  const items = () => [...list.children];
  const offsetOf = (item) => item.offsetLeft - (list.firstElementChild?.offsetLeft ?? 0);

  // Яка картка зараз перша на екрані (остання — коли стрічку догорнуто до кінця)
  function current() {
    const all = items();
    if (list.scrollLeft >= list.scrollWidth - list.clientWidth - 2) return all.length - 1;
    let best = 0;
    all.forEach((item, i) => {
      if (Math.abs(offsetOf(item) - list.scrollLeft) < Math.abs(offsetOf(all[best]) - list.scrollLeft)) best = i;
    });
    return best;
  }

  function goTo(index) {
    const item = items()[index];
    if (item) list.scrollTo({ left: offsetOf(item), behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function renderDots() {
    const count = items().length;
    dots.hidden = count < 2;
    dots.replaceChildren(
      ...items().map((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'rail-dot';
        dot.setAttribute('aria-label', `Картка ${i + 1} з ${count}`);
        dot.addEventListener('click', () => goTo(i));
        return dot;
      }),
    );
    markDot();
  }

  function markDot() {
    const active = current();
    [...dots.children].forEach((dot, i) => dot.setAttribute('aria-current', String(i === active)));
  }

  let frame = 0;
  list.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(markDot);
  }, { passive: true });

  // Картки підвантажились або змінились (популярні маршрути приходять з data.json) — оновлюємо крапки
  new MutationObserver(renderDots).observe(list, { childList: true });
  renderDots();

  if (!autoplay || reduceMotion) return;

  // ---------- Автопрокрутка ----------
  let stopped = false;
  let onScreen = false;
  let timer = 0;

  function tick() {
    if (stopped || !onScreen || !mobile.matches || document.hidden) return;
    const count = items().length;
    if (count > 1) goTo((current() + 1) % count);
  }
  const restart = () => {
    clearInterval(timer);
    if (!stopped) timer = setInterval(tick, autoplay);
  };
  // Людина сама вибирає картку — більше не заважаємо
  const stop = () => {
    stopped = true;
    clearInterval(timer);
  };
  for (const target of [list, dots]) {
    for (const type of ['pointerdown', 'touchstart', 'wheel', 'keydown', 'focusin']) {
      target.addEventListener(type, stop, { passive: true });
    }
  }

  // Гортає лише тоді, коли стрічку видно на екрані
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) restart();
  }, { threshold: 0.5 }).observe(list);
}
