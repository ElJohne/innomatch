# Залежності та походження

Точні версії й integrity: package-lock.json. Інвентар усіх package entries, ліцензій
і registry URL: dependencies.json. Відтворення: `node scripts/dependencies.mjs`.
Наявну кореневу LICENSE не змінено; це не нове рішення про ліцензування проєкту.
Код і synthetic fixtures створено в цій ітерації. Зображень, шрифтів із CDN чи приватного стороннього коду немає.
Конкурсні PDF надані власником; їхній вміст не перевидавався як власна інноваційна бібліотека.

`npm audit` 2026-10-03: 5 high findings у ланцюжку dev-only ESLint → fast-glob →
micromatch → braces (одна root advisory GHSA-vfj7-8cjw-p6xm).
Запропонований npm downgrade eslint-config-next до 14 не застосовано до Next 16.
Production audit перевіряється окремо; перед публічним CI слід оновити lint toolchain
після виходу сумісного виправлення. Не обробляти недовірені glob-шаблони через цей інструмент.
