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
Не вводити справжні персональні дані. Production: https://innomatch.brandly-io.com
(PostgreSQL; AI-конфігурація й фактичні live-перевірки — у STATUS/QA).

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

Якщо Windows npm wrapper посилається на відсутній npm-cli.js, використовуйте npm-cli.js
із установленого Node.js (`C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js`).

Налаштування PostgreSQL/OpenAI/Azure, міграції та Actions: [DEPLOYMENT](docs/DEPLOYMENT.md).
Оригінальну LICENSE збережено без зміни. Походження залежностей: [DEPENDENCIES](docs/DEPENDENCIES.md).
