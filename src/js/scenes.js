// Сцени головної сторінки.
// 1) IntersectionObserver визначає активну сцену — працює навіть без GSAP.
// 2) GSAP + ScrollTrigger (CDN) додають рух: паралакс шарів, плавну появу тексту,
//    «доводку» до сцени (snap) і анімацію висотоміра.
// Якщо людина вимкнула анімації (prefers-reduced-motion) — руху немає, сцени просто змінюються.

const sections = [...document.querySelectorAll('[data-scene]')];
const arts = [...document.querySelectorAll('.scene-art')];
const dots = [...document.querySelectorAll('.scene-dots a')];
const altValue = document.querySelector('[data-alt-value]');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const hasGsap = Boolean(gsap && ScrollTrigger);

let current = 0;
const altitude = { value: Number(sections[0]?.dataset.alt) || 0 };

function showAltitude(target) {
  if (!altValue || !Number.isFinite(target)) return;
  if (hasGsap && !reduceMotion) {
    gsap.to(altitude, {
      value: target,
      duration: 1.2,
      ease: 'power2.out',
      overwrite: true,
      onUpdate: () => {
        altValue.textContent = String(Math.round(altitude.value));
      },
    });
  } else {
    altitude.value = target;
    altValue.textContent = String(target);
  }
}

function setScene(index) {
  if (index === current) return;
  current = index;
  arts.forEach((art, i) => art.classList.toggle('is-active', i === index));
  dots.forEach((dot, i) => {
    if (i === index) dot.setAttribute('aria-current', 'true');
    else dot.removeAttribute('aria-current');
  });
  showAltitude(Number(sections[index].dataset.alt));
}

// Активна сцена — та, що перетинає середину екрана
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setScene(sections.indexOf(entry.target));
    });
  },
  { rootMargin: '-50% 0px -50% 0px' },
);
sections.forEach((section) => observer.observe(section));

if (hasGsap && !reduceMotion) {
  gsap.registerPlugin(ScrollTrigger);

  sections.forEach((section, i) => {
    const art = arts[i];
    if (!art) return;

    // Паралакс: ближні шари рухаються швидше за дальні
    art.querySelectorAll('.layer').forEach((layer) => {
      const depth = Number(layer.dataset.depth) || 0;
      gsap.fromTo(
        layer,
        { y: depth * 260 },
        {
          y: -depth * 260,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    });

    // Легке «наближення» сцени — відчуття руху вглиб
    gsap.fromTo(
      art,
      { scale: 1.06 },
      {
        scale: 1,
        ease: 'none',
        transformOrigin: '50% 100%',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );

    // Поява тексту сцени: перша — одразу після завантаження, решта — під час гортання
    const reveal = section.querySelectorAll('.reveal');
    gsap.from(reveal, {
      y: 40,
      opacity: 0,
      duration: 0.9,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger:
        i === 0
          ? undefined
          : { trigger: section, start: 'top 60%', toggleActions: 'play none none reverse' },
    });
  });

  // «Доводка» до найближчої сцени — лише на широких екранах, на телефоні гортання вільне
  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    ScrollTrigger.create({
      trigger: '#main',
      start: 'top top',
      end: 'bottom bottom',
      snap: {
        snapTo: 1 / (sections.length - 1),
        duration: { min: 0.3, max: 0.8 },
        delay: 0.15,
        ease: 'power1.inOut',
      },
    });
  });
}
