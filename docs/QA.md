# Перевірки — 2026-10-03, Windows / Node 24.19.0

## Поточна production-ітерація

- `node --check` для `deploy/render.mjs`, `scripts/migrate.mjs`: PASS.
- `git diff --check`: PASS.
- Unit, integration та E2E не запускались на пряму вимогу власника.
- k3s bootstrap: PASS; ресурси БД, storage, runner, ingress і backup створені.
- Actions build, migration, rollout та зовнішній HTTPS: перевірка триває.
- Локальний `npm run lint`: BLOCKED — системний npm посилається на відсутній npm-cli.js,
  а node_modules і попередній `.tools` у цьому checkout відсутні. Linux build виконує Actions.

## Попередня локальна ітерація

Команди виконано в `innomatch/`. Через відсутність npm у PATH використано
`node .tools/package/bin/npm-cli.js` замість `npm`.

| Перевірка | Фактичний результат |
|---|---|
| npm run build | PASS, production compilation і 15 dynamic routes, без БД/Azure |
| npm run typecheck | PASS |
| npm run lint | PASS |
| npm test | PASS, 13 тестів у 2 файлах |
| npm run test:e2e | PASS, 7 Chromium-тестів, фінальний запуск 12:22 Europe/Warsaw |
| npm run start | PASS, standalone server localhost:3000 |
| npm run doctor | PASS, шість обов'язкових live env позначено missing |
| npm run test:integration | SKIPPED, 1 PostgreSQL-тест; TEST_DATABASE_URL відсутній |
| npm audit --omit=dev | 0 vulnerabilities |
| npm audit | 5 high dev-only findings, одна root advisory; DEPENDENCIES.md |
| Client .next/static JS scan | Немає AZURE_OPENAI_API_KEY, AUTH_SECRET або тестового ключа |

Unit: валідація, provenance, import validation, Polish normalization, no-match,
publication filter, vector compatibility, allowlist AI sources, ownership,
idempotent need creation, rate limit, явний Azure fallback і відхилення вигаданих джерел.

Browser Chromium: форма → результати → деталі; reload; інша сесія відхиляється;
no-match, пустий каталог; 320px без horizontal overflow; skip-link keyboard focus;
admin API та cross-origin writes заборонено. Axe WCAG2A/AA/2.1AA на головній,
формі та деталях: 0 violations. Скріншоти головної й мобільної форми оглянуто — без обрізання контенту.
Додаткові E2E перевіряють збереження тексту при 503, retry та API idempotency.
Це не повний WCAG аудит: 200% browser zoom, screen reader і весь keyboard-only flow ще не перевірено.

Виправлено початкову JSX-помилку select. Розширений E2E спочатку мав неоднозначний
локатор alert через вбудований Next route announcer; локатор обмежено формою.
Doctor потребував виконання поза sandbox: tsx userInfo повертав системну помилку в sandbox.
Жодних live AI-запитів не зроблено. Docker build, справжній імпорт, migrations і embeddings live — NOT RUN.
Retrieval евристики перевірені тільки на synthetic, не є незалежною оцінкою якості.
