# MI Connect

Прототип за SPEC.md. Застосунок знаходиться саме в `innomatch/`, вкладеному Git-репозиторії.

## Локальний запуск

Node.js 22+ (перевіряється на 24), npm. Із цієї директорії:

```sh
npm ci
npm run dev
```

Відкрити http://localhost:3000. Без env застосунок запускається у fixtures/mock:
12 явно синтетичних інновацій, непостійне збереження звернень у пам'яті процесу.
Перезапуск сервера скидає записи та гостьові сесії, якщо AUTH_SECRET не встановлено.
Не вводити справжні персональні дані. Публічного розгортання ще немає.

Працює: форма → приватне звернення → пошук → джерела → деталі → повторне відкриття.
Додаткові модулі ще не реалізовані; [стан](docs/STATUS.md), [перевірки](docs/QA.md).

```sh
npm run doctor
npm run lint
npm run typecheck
npm test
npm run build
npm run start
npm run test:integration
npm run test:e2e
```

Playwright потребує `npx playwright install chromium`. `test:e2e` використовує production build.
Integration тести пропускаються без TEST_DATABASE_URL; це не успішна live-перевірка.

У цьому середовищі Codex є Node, але npm не був у PATH. Локально завантажений npm
доступний через `node .tools/package/bin/npm-cli.js` замість `npm`.
`.tools` ігнорується Git; звичайне встановлення Node із npm цього обходу не потребує.

Налаштування PostgreSQL/Azure, міграції та Docker: [DEPLOYMENT](docs/DEPLOYMENT.md).
Оригінальну LICENSE збережено без зміни. Походження залежностей: [DEPENDENCIES](docs/DEPENDENCIES.md).
