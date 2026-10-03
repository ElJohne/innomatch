# Перевірки — 2026-10-03, Windows / Node 24.19.0

## Імпорт ROPS — поточна ітерація

- Collection: 9 категорій, 115 унікальних URL, 114 валідних записів, 1 пропуск.
- data:validate: PASS, 114 інновацій + 69 ресурсів.
- lint / typecheck: PASS. Production operator bundle + validate-corpus: PASS.
- Unit/integration/E2E не запускались за дорученням власника.
- Production build, migration 0002, import, index, rollout: PASS.
- Actions: https://github.com/ElJohne/innomatch/actions/runs/37123389180 (6b9b702).
- Import Job: 114 innovations upserted; 69 knowledge validated; 166 indexed у 11 пакетах.
- Повторний sync: innovations upserted 0, indexed 0, unchanged 166; без повторних embedding calls.
- /api/ready: 200 ok; /api/innovations: total 114; /api/knowledge: total 69.
- /innowacje, /wiedza, /wiedza?type=CHALLENGE: 200.
- Одна явно синтетична production-потреба: matched; semantic/openai/source_backed; BaWita і Therapy Set, 3 related resources, warnings []. Дві AI-операції для підбору.
- Перевірочне звернення видалено за його точним ID; видалено 1 запис.
- backup-before-rops: Complete.
- Повна незалежна оцінка якості пошуку, no-match та browser E2E у цій ітерації не виконувалися.


## OpenAI API — поточна ітерація

- Публічний `https://innomatch.brandly-io.com/api/ready`: HTTP 200, ok перед змінами.
- Наявність repository secret OPENAI_API_KEY підтверджено без читання значення.
- npm ci: PASS (409 пакетів), системний npm-cli.js викликано напряму через Node 22.16.0.
- npm run lint: PASS; npm run typecheck: PASS.
- node --check для нових deployment/diagnostic scripts і git diff --check: PASS.
- Unit/integration/E2E не запускались, як наказав власник.
- Linux production build та rollout: PASS, Actions run 37120987952 (коміт 4a5a333).
- Фінальний build + deploy після позначення старих mock-результатів: PASS,
  https://github.com/ElJohne/innomatch/actions/runs/37121047658 (коміт 032506d).
- `node scripts/check-openai.mjs --live` у production pod: PASS для Responses strict JSON Schema
  та embeddings; рівно дві короткі синтетичні API-операції, без retries.
- Runtime: AI_PROVIDER=openai, gpt-6-luna / text-embedding-3-small; значення ключа не виводилось.
- Після перемикання HTTPS readiness — 200 / ok, головна — 200, global mock-banner відсутній.
- Перший OpenAI deploy зупинився через Node socket stdin → kubectl /dev/stdin (ENXIO).
  Передачу виправлено через POSIX pipe, перевірено без секрету, повторний workflow успішний.
- Каталог порожній; фактичне зіставлення з source-backed corpus і якість retrieval ще не перевірено.

## Поточна production-ітерація

- `node --check` для `deploy/render.mjs`, `scripts/migrate.mjs`: PASS.
- `git diff --check`: PASS.
- Unit, integration та E2E не запускались на пряму вимогу власника.
- k3s bootstrap: PASS; ресурси БД, storage, runner, ingress і backup створені.
- Actions run `37119025421`: SUCCESS, build + deploy; коміт `26750d4`.
- `npm ci`, `npm run build` із TypeScript та імпорт postgres зі standalone artifact: PASS у Linux Actions.
- Migration Job: Complete (7 секунд); Deployment innomatch: 1/1 Ready.
- Через локальний Traefik ingress із правильним Host: головна HTTP 200;
  `/api/ready` → `{ "status": "ok" }`; `/api/innovations` → порожній каталог, total 0.
- PostgreSQL login innomatch: rolsuper=false, rolcreatedb=false.
- Runner online; `kubectl auth can-i get secrets -n default` від його ServiceAccount: no.
- Backup `backup-network-ready` та `backup-deployed` після міграції: Complete (по 6 секунд).
- Public HTTPS: PENDING, DNS домену ще відсутній; власник сам додає Cloudflare Tunnel route.
- Перші deployment спроби виявили readonly mountpoint для cache та відсутній postgres
  у standalone artifact. Обидві причини усунуто і підтверджено успішним run.
- Перші backup Jobs падали через раннє підключення до мережі нового pod; додано bounded wait,
  повторний backup успішний. Відновлення з backup не виконувалось.
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

## Локальний дизайн — 2026-10-03, codex/local-design

- Переглянуто SPEC.md та конкурсні PDF: CRITERIA (8 сторінок), польська частина RULES (1–7).
- `npm run build`, `npm run typecheck`, `npm run lint`: PASS.
- `npm test`: PASS, 16 тестів у 3 файлах. Нові перевірки виключають synthetic організації
  у postgres, для прихованих / несинтетичних інновацій і для no-match.
- `npm run test:e2e`: PASS, 6 Chromium-сценаріїв. Окрема production-збірка на 127.0.0.1:3100, fixtures/mock.
- Перевірено шлях: опис → редагування підтвердження → вибір організації → прямий план;
  повторне відкриття, приватність need і plan, невідомий organization ID → 404,
  джерела / деталі, no-match, порожній каталог, помилка 503 / retry, idempotency, CSRF і admin deny.
- Axe WCAG2A/AA/2.1AA: 0 violations на головній, підтвердженні, організаціях,
  плані, деталях; також мобільній головній / плані та високому контрасті.
- 320 CSS px, 200% текст, skip-link focus, Escape у панелі: PASS.
- Copy перевірено з fallback: коли clipboard недоступний, текст виділяється й показується Ctrl+C.
- Вбудований браузер: ручний прохід усіх 4 екранів. Desktop/mobile screenshots у test-results/.
- Початковий запуск виявив contrast 4.38:1 на підписі й overflow логотипу при 200%; виправлено.
- Старий server на 3000 блокував standalone build (EBUSY); зупинено тільки цей локальний процес.
  E2E під sandbox не завершував свій server; запуск поза sandbox завершився успішно.
- `npm run test:integration`: 1 skipped, немає TEST_DATABASE_URL. Live PostgreSQL/Azure не перевірялися.
- Browser speech залежить від польського голосу; акустична перевірка не виконувалася.
  Screen reader і повний keyboard-only аудит не виконані; це не сертифікація WCAG.
- public assets додані в standalone start та Dockerfile; Docker-збірка окремо не запускалася.

### Pomocny Punkt: відкрита доступність і перший екран

- Production build PASS; 8 E2E PASS (оновлений набір вище).
- Поле опису повністю в першому viewport: 1280×720, 1008×600, 390×844, 320×800.
- Чотири палітри, aria-pressed, axe та 200% текст: PASS.
- Назва сторінки й посилання на malopolska.pl: PASS.
- Виклик browser speech із pl-PL і текстом main, стан початку й Stop: PASS з mock API.
- Фактичне звучання встановленого голосу не перевірено.
- Панель більше не розкривається кнопкою: старий тест Escape замінено перевіркою постійної видимості.

### Очищення головної та диктування

- Build, lint, typecheck: PASS. Unit: 16 PASS; E2E: 10 PASS; integration: 1 skipped без TEST_DATABASE_URL.
- Нові E2E з mock SpeechRecognition: pl-PL, доповнення введеного тексту,
  Stop, редагування перед підтвердженням, відмова доступу, відсутній API.
- Перший екран на чотирьох viewport, 200% текст, чотири контрасти й axe: PASS.
- Реальне аудіо мікрофона / зовнішній сервіс транскрипції не тестувалися.
- За прямою вказівкою власника видалено глобальний demo-banner і AI-підпис фото;
  походження фото зафіксоване у DEPENDENCIES.md, backend залишився fixtures/mock.

## Перевірка merge з origin/master a22f390

Build, lint, typecheck: PASS. Unit: 16 PASS; E2E: 10 PASS; corpus: 114/69 valid.
Оновлено mock repository у тесті Azure fallback для нового listKnowledge.
Integration: 1 skipped (TEST_DATABASE_URL відсутній). Реальні AI-виклики не виконувалися.
Пакет GitHub Actions доповнено public, щоб зберегти hero image у standalone release.
