# Промпти для ШІ-зображень

**Генератор:** будь-який (ChatGPT / Gemini / Midjourney). У звіті вказати, який саме.

**Як зберігати:**
- WebP, ширина 1200px;
- назва файлу — як у таблиці;
- папка `assets/img/routes/`.

**Формат:**
- картки маршрутів — 3:2;
- Open Graph — 1200×630.

## Спільний стиль

Додається в кінець кожного промпту, щоб усі фото виглядали як одна серія:

> **STYLE:** cinematic landscape photography, Ukrainian Carpathian mountains, soft natural light, light morning mist, muted natural palette of fog grey, deep spruce green and warm sunset orange, calm and quiet mood, no people in the foreground, no text, no logos, no watermark, realistic, high detail, 3:2

## Маршрути

| № | Файл | Маршрут | Промпт (+ STYLE) |
|---|---|---|---|
| 1 | `hoverla.webp` | Говерла від Заросляка | The summit of Hoverla, the highest peak of Ukraine, a wide grassy ridge with a small stone summit marker, mist in the valleys below, early morning |
| 2 | `pip-ivan.webp` | Піп Іван Чорногірський | A lonely stone ruin of an old observatory on top of a rocky mountain peak, rolling ridges in layers of fog, golden hour |
| 3 | `petros.webp` | Петрос | A steep pyramid-shaped green mountain peak above a spruce forest, a narrow hiking trail climbing its slope, clouds clinging to the summit |
| 4 | `chornohora-ridge.webp` | Чорногірський хребет | A long panoramic mountain ridge with a hiking path running along the crest, a small tent pitched on an alpine meadow, sunset light |
| 5 | `nesamovyte.webp` | Озеро Несамовите | A small dark glacial lake high in the mountains surrounded by grassy slopes and rocks, still water reflecting the sky, thin mist |
| 6 | `synevyr.webp` | Озеро Синевир | A calm mountain lake surrounded by dense dark spruce forest, a tiny forested island in the middle, morning fog over the water |
| 7 | `syvulia.webp` | Сивуля (Горгани) | Wild mountain slopes covered with grey stone scree fields and dwarf pine, a rocky summit, dramatic overcast sky |
| 8 | `khomiak.webp` | Хом'як і Синяк | A forested mountain with a rocky top, view over endless wavy forested ridges fading into blue haze |
| 9 | `blyznytsia.webp` | Близниця (Свидовець) | A twin-peaked grassy mountain above an alpine meadow with blueberry bushes, small glacial lake below, late afternoon sun |
| 10 | `svydovets-ridge.webp` | Свидовецький хребет | A wide open mountain ridge with a long winding trail, wooden hut (kolyba) in a meadow far below, clouds at eye level |
| 11 | `borzhava.webp` | Боржавський хребет | Rolling soft green grassy hills (polonyna) without trees, gentle curves, a single hiker silhouette far away on the ridge, golden light |
| 12 | `hymba.webp` | Гимба (Боржава) | A gentle grassy summit with a view of sunset over the polonyna, warm orange sky, low clouds in valleys |

## Open Graph

| Файл | Промпт |
|---|---|
| `assets/img/og-image.webp` (1200×630) | Wide panoramic view of layered Carpathian mountain ridges fading into morning mist, the sun rising behind the furthest ridge, large calm empty sky in the upper left for a title, + STYLE (замінити 3:2 на 1200x630) |

Текст «Карпатський шлях» на OG-картинку накладемо самі в коді або редакторі: генератори часто псують кирилицю.

## Після генерації

Для кожного фото записати в промпт-паспорт:
- генератор;
- скільки спроб знадобилося;
- що довелося змінити в промпті.

Якщо фото не вийшло: прибрати зайвих людей, виправити «неукраїнські» гори, зняти надто яскраву насиченість.
