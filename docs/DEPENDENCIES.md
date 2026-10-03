# Залежності та походження

Точні версії й integrity: package-lock.json. Інвентар усіх package entries, ліцензій
і registry URL: dependencies.json. Відтворення: `node scripts/dependencies.mjs`.
Наявну кореневу LICENSE не змінено; це не нове рішення про ліцензування проєкту.
Код і synthetic fixtures створено в початковій ітерації. Шрифтів із CDN чи приватного стороннього коду немає. Походження доданого зображення описано нижче.
Конкурсні PDF надані власником; їхній вміст не перевидавався як власна інноваційна бібліотека.

`npm audit` 2026-10-03: 5 high findings у ланцюжку dev-only ESLint → fast-glob →
micromatch → braces (одна root advisory GHSA-vfj7-8cjw-p6xm).
Запропонований npm downgrade eslint-config-next до 14 не застосовано до Next 16.
Production audit перевіряється окремо; перед публічним CI слід оновити lint toolchain
після виходу сумісного виправлення. Не обробляти недовірені glob-шаблони через цей інструмент.

## Візуальний матеріал — 2026-10-03

`public/images/community-hero.png` — створено вбудованим ImageGen для цього проєкту.
Це синтетична ілюстрація, не фотографія отримувача послуг. UI-підпис прибрано за запитом власника.
Референс власника використано для напряму дизайну, сам файл не включено у сайт.
Логотип-гори — простий SVG для прототипу; не офіційний знак ROPS.

Фінальний prompt ImageGen:
> Create a photorealistic-natural editorial website hero photograph. A warm, dignified smiling elderly Polish woman with short silver hair in a cream knit cardigan, waist-up, in a sunny leafy Krakow garden with softly blurred historic brick towers in the distance. Gentle natural daylight, restrained pale blue and sage green palette, hopeful and authentic community support atmosphere. Subject in right half of a horizontal composition, soft pale blue sky and foliage negative space on left. No lettering, logos, UI, watermark, or text. Image for a Polish social innovation help website. Save project-ready image.

Імпорт ROPS додав operator-only devDependencies: cheerio 1.2.0 (MIT), esbuild 0.28.2 (MIT).
cheerio не включено у сервер застосунку; esbuild пакує operator CLI для deployment Job.

## Inclusive community hero — 2026-10-03

Asset: `public/images/community-inclusive.png`. Generated with built-in ImageGen;
fictional people, not actual service users. Replaces the senior-only image in the homepage.
Prompt: A photorealistic editorial photograph for Pomocny Punkt in Małopolska.
Five people chatting in an accessible Krakow community garden: an older woman,
a mother with school-age child, a young adult man in a manual wheelchair and an
adult of different ethnic background. Dignity and mutual support, everyday clothes,
soft blue and sage green palette. Landscape 3:2; people on the right two thirds,
airy left third for the form. Wheelchair visible, realistic anatomy, no lettering,
logos or watermark. Avoid stereotypes of homelessness, migration, disability or illness.

### Уточнення фото

`public/images/community-inclusive-v2.png` — edit через built-in ImageGen.
Prompt: Remove only the standing bearded man wearing a knit cap. Naturally fill
his area with the same garden and blurred Krakow architecture. Preserve all four
other people, their identities, poses, clothes and wheelchair, lighting and colors.
Add subtle soft-focus feathering at the outer edges, especially left and bottom;
keep faces sharp. No words or logos.
Поле форми розширено до 63%; CSS feathering пом'якшує межі фото.


### Community conversation — latest hero

`public/images/community-conversation.png`, built-in ImageGen. Prompt: Natural editorial photograph of four people in a candid conversation around an accessible garden table in Krakow: older woman, mother, school-age daughter and a young man in a manual wheelchair. Comparable eye level, plausible eye lines and hands, everyday clothing, no hats, no extra people. Soft daylight, blue and sage palette, landscape 3:2, group on right 70%, airy left space for layout. Keep all faces inside frame; show table and wheelchair. No text, logos or watermark.
