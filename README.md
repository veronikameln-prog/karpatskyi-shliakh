# Карпатський шлях

Туристична платформа «Мандруй Україною» з фокусом на Українські Карпати.

Сайт допомагає новачкові спланувати похід:
- надихнутися атмосферною головною сторінкою;
- обрати маршрут у каталозі;
- порахувати бюджет у конструкторі походу.

Підсумкова самостійна робота з дисципліни «Технології веб-розробки та дизайну» (НУ «Львівська політехніка»), тема №5.

> Статус: у розробці. Посилання на розгорнутий сайт з'явиться після публікації.

## Сторінки

Дизайн — макети у Figma (8 сторінок), зверстані на Tailwind.

| Сторінка | Що на ній |
|---|---|
| `index.html` | Герой, висотна шкала «від долини до вершини» (GSAP), регіони, популярні маршрути з data.json, відгуки (Swiper) |
| `routes.html` | Каталог: пошук, фільтри (регіон, складність, тривалість), сортування, «Показати ще», стан в адресі |
| `route.html?id=…` | Сторінка маршруту: цифри, як дістатися, схема, сезон, фото, поради, перехід у конструктор |
| `regions.html` | 5 масивів Карпат із фактами й маршрутами регіону |
| `planner.html` | Конструктор походу: бюджет, попередження, підбір маршрутів |
| `tips.html` | Поради новачкам: чек-лист (localStorage, друк у PDF), безпека, FAQ |
| `about.html` | Про проєкт, контакти, форма з RegEx-валідацією |
| `404.html` | Сторінка «стежка загубилася» |

## Технології

- **HTML5** — семантична розмітка.
- **Tailwind CSS 3** — збирається через CLI; тема «день / ніч» через `dark:` і CSS-змінні.
- **JavaScript** — ES-модулі, без фреймворків.
- **GSAP + ScrollTrigger** (CDN) — поява блоків під час прокрутки, висотна шкала, паралакс.
- **Swiper** (CDN) — карусель відгуків.
- **data.json + fetch / async-await** — регіони, маршрути й відгуки.
- **ШІ-ілюстрації** — макети сторінок і частину фото згенеровано в ChatGPT за промптами (`docs/05-image-prompts.md`).

### Фото регіонів

Справжні фото з Wikimedia Commons, обрізані до 4:3 (1200×900). Ліцензії вимагають зазначити автора й ліцензію:

| Файл | Що на фото | Автор | Ліцензія |
| --- | --- | --- | --- |
| `region-chornohora.jpg` | [Говерла та Чорногора](https://commons.wikimedia.org/wiki/File:%D0%93%D0%BE%D0%B2%D0%B5%D1%80%D0%BB%D0%B0_%D1%82%D0%B0_%D0%A7%D0%BE%D1%80%D0%BD%D0%BE%D0%B3%D0%BE%D1%80%D0%B0.jpg) | Nata Mostova | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `region-gorgany.jpg` | [Горгани, кам'яні розсипи](https://commons.wikimedia.org/wiki/File:Gorgany_IF-1.JPG) | Сергій Криниця (Haidamac) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| `region-svydovets.jpg` | [Озеро Ворожеське, Свидовець](https://commons.wikimedia.org/wiki/File:%D0%9E%D0%B7%D0%B5%D1%80%D0%BE_%D0%92%D0%BE%D1%80%D0%BE%D0%B6%D0%B5%D1%81%D1%8C%D0%BA%D0%B5_%D1%82%D0%B0_%D1%81%D0%BD%D1%96%D0%B6%D0%BD%D0%B8%D0%BA%D0%B8.jpg) | Nata Mostova | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `region-borzhava.jpg` | [Полонина Боржава](https://commons.wikimedia.org/wiki/File:Polonina_Borzhava_(Ukraine).jpg) | Stanislav Dusík | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `region-beskydy.jpg` | [Сколівські Бескиди, вид з Парашки](https://commons.wikimedia.org/wiki/File:%D0%A1%D0%BA%D0%BE%D0%BB%D1%96%D0%B2%D1%81%D1%8C%D0%BA%D1%96_%D0%91%D0%B5%D1%81%D0%BA%D0%B8%D0%B4%D0%B8,_%D0%B2%D0%B8%D0%B4_%D0%B7_%D0%9F%D0%B0%D1%80%D0%B0%D1%88%D0%BA%D0%B8.jpg) | Misha Reme | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |

### Фото блоку «Як це працює»

Теж з Wikimedia Commons, обрізані до 16:9 (1600×900):

| Файл | Що на фото | Автор | Ліцензія |
| --- | --- | --- | --- |
| `how-regions.jpg` | [Чорногорський хребет, панорама](https://commons.wikimedia.org/wiki/File:%D0%A7%D0%BE%D1%80%D0%BD%D0%BE%D0%B3%D0%BE%D1%80%D1%81%D1%8C%D0%BA%D0%B8%D0%B9_%D1%85%D1%80%D0%B5%D0%B1%D0%B5%D1%82._%D0%9A%D0%B0%D1%80%D0%BF%D0%B0%D1%82%D0%B8._%D0%9F%D0%B0%D0%BD%D0%BE%D1%80%D0%B0%D0%BC%D0%B0.jpg) | Zysko serhii | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `how-group.jpg` | [Сходження на Говерлу](https://commons.wikimedia.org/wiki/File:%D0%92%D0%BE%D1%81%D1%85%D0%BE%D0%B6%D0%B4%D0%B5%D0%BD%D0%B8%D0%B5_%D0%BD%D0%B0_%D0%93%D0%BE%D0%B2%D0%B5%D1%80%D0%BB%D1%83_(30.09.2021).jpg) | Половко Сергей Николаевич | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `how-camp.jpg` | [Ранок під Піп Іваном](https://commons.wikimedia.org/wiki/File:%D0%A0%D0%B0%D0%BD%D0%BE%D0%BA_%D0%BF%D1%96%D0%B4_%D0%B3.%D0%9F%D1%96%D0%BF-%D0%86%D0%B2%D0%B0%D0%BD.jpg) | Zysko serhii | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |

### Фото маршрутів

Теж з Wikimedia Commons, обрізані до 16:9 (1280×720):

| Файл | Що на фото | Автор | Ліцензія |
| --- | --- | --- | --- |
| `route-hoverla.jpg` | [Говерла з Козьмещика](https://commons.wikimedia.org/wiki/File:%D0%93%D0%BE%D0%B2%D0%B5%D1%80%D0%BB%D0%B0_%D0%B7_%D0%9A%D1%83%D0%B7%D1%8C%D0%BC%D0%B5%D1%89%D0%B8%D0%BA%D0%B0.jpg) | АСивуля | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `route-synevyr.jpg` | [Ранкові промені на Синевирі](https://commons.wikimedia.org/wiki/File:%D0%A0%D0%B0%D0%BD%D0%BA%D0%BE%D0%B2%D1%96_%D0%BF%D1%80%D0%BE%D0%BC%D0%B5%D0%BD%D1%96_%D0%BD%D0%B0_%D0%A1%D0%B8%D0%BD%D0%B5%D0%B2%D0%B8%D1%80%D1%96.jpg) | Misha Reme | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `route-pip-ivan.jpg` | [Обсерваторія «Білий слон» на Попі Івані](https://commons.wikimedia.org/wiki/File:%D0%A1%D1%82%D0%B0%D1%80%D0%B0_%D0%BE%D0%B1%D1%81%D0%B5%D1%80%D0%B2%D0%B0%D1%82%D0%BE%D1%80%D1%96%D1%8F_%D0%91%D1%96%D0%BB%D0%B8%D0%B9_%D1%81%D0%BB%D0%BE%D0%BD_%D0%BD%D0%B0_%D0%B3%D0%BE%D1%80%D1%96_%D0%9F%D1%96%D0%BF_%D0%86%D0%B2%D0%B0%D0%BD_%D0%A7%D0%BE%D1%80%D0%BD%D0%BE%D0%B3%D0%BE%D1%80%D1%81%D1%8C%D0%BA%D0%B8%D0%B9.jpg) | Khoroshkov | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |

## Запуск локально

Потрібен Node.js 18+.

```bash
npm install
npm run build       # зібрати сторінки (src/pages → *.html) і css/main.css
npm run watch:css   # перезбирати під час розробки
npm test            # автотести конструктора і форми
```

Сторінки відкриваються через будь-який локальний сервер, наприклад:

```bash
npx serve .
```

## Структура

```
├── *.html                  зібрані сторінки (не редагувати вручну)
├── src/pages/              вміст сторінок
├── src/partials/           спільні <head>, шапка, футер, логотип
├── scripts/build-html.mjs  збирач сторінок
├── css/main.css            зібраний Tailwind
├── src/input.css           дизайн-токени і компоненти
├── src/js/                 site, theme, menu, data, home, routes, route, regions, planner(-calc), tips, form
├── data/data.json          5 регіонів, 12 маршрутів, відгуки
├── tests/                  автотести логіки конструктора і форми (npm test)
├── assets/img/             логотип, фото з макетів, OG-зображення
└── docs/                   бриф, техопис, промпт-паспорт, дизайн, промпти зображень
```

## Документація

- [Дослідницький бриф](docs/01-brief.md)
- [Технічний опис](docs/02-tech-spec.md)
- [Промпт-паспорт](docs/03-prompt-log.md)
- [Дизайн](docs/04-design.md)
- [Промпти для ШІ-зображень](docs/05-image-prompts.md)

Ціни в конструкторі демонстраційні. Бронювання й оплата не здійснюються.
