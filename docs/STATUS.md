# Стан — 2026-10-03

## Джерела ROPS — DONE, production підтверджено

За наданими власником QR-посиланнями зібрано 114 інновацій із 115 унікальних карток / 9 категорій.
69 матеріалів знань: 44 описи, 8 фрагментів карти викликів, 17 посилань на портали або документи без опису.
Картка «Lekki wózek aktywny» пропущена: порожній опис рішення у джерелі.
Додано PostgreSQL KnowledgeResource, /wiedza, /api/knowledge, пов’язані матеріали в matching,
батчеву індексацію та idempotent sync у deployment Actions.
Перевірено: lint, typecheck, schema validation 114/69, production CLI bundle.
Тести пропущено за вказівкою власника. Build/migration/import/index/rollout — PASS.
Actions: https://github.com/ElJohne/innomatch/actions/runs/37123389180 (6b9b702).
Production API: 114 інновацій, 69 ресурсів; 166 векторів (114 + 52), 11 embedding-запитів.
HTTPS readiness, каталог і /wiedza — HTTP 200. Один синтетичний запит: matched, semantic/openai/source_backed, BaWita + Therapy Set, 3 пов’язані ресурси, без warnings.
Перевірочне звернення видалено. Повторний sync: upserted 0, indexed 0, unchanged 166.
Backup перед імпортом — Complete. Це операційна перевірка, не незалежна оцінка retrieval quality.
Повні тексти звітів, числові дані обсерватора й інтерактивний Canvas не імпортовані.
Наступна функціональна робота за SPEC: staff auth, модерація й приватні діалоги M6/M5.


## OpenAI API — DONE, live підтверджено

Власник дозволив реалізацію прямого OpenAI API замість Azure та надав GitHub secret.
Додано Responses strict JSON Schema, embeddings, server-only credential wiring, doctor/index
для обох live провайдерів. Моделі: gpt-6-luna / text-embedding-3-small.
Production тепер `AI_PROVIDER=openai`; ключ доставлено через Actions → openai-env.
Два явні синтетичні запити з production pod успішні: Responses із strict JSON Schema
та embeddings. HTTPS readiness — 200 / ok, головна — 200, mock-banner відсутній.
Локальні lint/typecheck пройшли; фінальний Linux build і rollout — SUCCESS:
https://github.com/ElJohne/innomatch/actions/runs/37121047658 (коміт 032506d).
Збережені mock-результати залишаються явно позначеними навіть після перемикання провайдера.
Unit/integration/E2E не запускались за дорученням власника.
Каталог досі порожній: live AI-підключення підтверджено, якість пошуку на реальному корпусі — ні.
Наступний крок: імпортувати дозволені джерельні записи та виконати `npm run data:index`.

## Production deployment — попередня успішна версія

Власник дозволив production на `dev-k3s`, GitHub Actions і пропуск тестів.
Створено окремий namespace `innomatch`, PostgreSQL 17.11 з PVC 5 GiB,
секрети БД/сесій, ingress `innomatch.brandly-io.com`, Actions runner та щоденний локальний backup.
Actions run https://github.com/ElJohne/innomatch/actions/runs/37119025421 — SUCCESS,
build + deploy для коміту `26750d4ea6afc946c675262217e7289d1bafd705`.
Deployment `innomatch` 1/1 Ready; migration Job Complete; ingress головна HTTP 200;
`/api/ready` повертає `ok` із реальною БД; каталог повертає 0 записів.
Backup до і після міграції (`backup-network-ready`, `backup-deployed`) — Complete.
Зовнішній HTTPS ще не перевірений: DNS `innomatch.brandly-io.com` поки не визначається.
Власник узяв на себе додавання public hostname до наявного Cloudflare Tunnel.
Azure і source-backed corpus відсутні:
production конфігурація — `postgres`, явно позначений `mock`, без автоматичного demo seed.
Unit/integration/E2E пропущено за прямою вимогою власника. Наступний крок: маршрут Cloudflare,
потім Azure та дозволені джерельні записи. Локальний npm у цьому checkout несправний;
Linux production build пройшов у Actions.
Історичні результати нижче стосуються попередньої локальної ітерації.

Початок: 11:48 Europe/Warsaw; дедлайн за наданим регламентом — 2026-10-04 11:00.
Етап A: DONE. Етап B: PARTIAL — локальний M1 працює, live ще не перевірений.
Стек: Next.js / React / TypeScript / Tailwind / Drizzle / PostgreSQL / Azure OpenAI SDK.
Режими за замовчуванням: fixtures (непостійна пам'ять процесу), mock AI.
Наявних AGENTS.md, коду, env-файлів або конфігурації БД/Azure не виявлено.
DONE: Next.js-каркас, польські екрани, форма → приватна потреба → результати → джерела/деталі;
каталог із фільтрами, мої справи, no-match, повторне відкриття без повторної генерації;
12 synthetic fixtures; контракти Zod; SQL-міграція і Drizzle repository;
Azure adapter, JSON import, embedding index, doctor; Dockerfile і standalone build.
Працюючий локальний production server: http://localhost:3000 (`npm run start`).

Перевірено: build, typecheck, lint, 13 unit-тестів; browser flow та axe — див. QA.
PostgreSQL integration test написано, але пропущено без TEST_DATABASE_URL.
Немає live AI-запитів, справжнього імпорту або deployment.

BLOCKED / потрібно від власника для live:
1. DATABASE_URL PostgreSQL; підтвердження виділеної проєкту БД через DATABASE_CONFIRMED_FOR_PROJECT=true.
2. AUTH_SECRET (щонайменше 32 випадкові символи) у приватній конфігурації.
3. AZURE_OPENAI_BASE_URL, AZURE_OPENAI_API_KEY, AZURE_OPENAI_CHAT_DEPLOYMENT, AZURE_OPENAI_EMBEDDING_DEPLOYMENT.
4. Опційно DATABASE_DIRECT_URL, окремі EMBEDDING_BASE_URL / EMBEDDING_API_KEY; TEST_DATABASE_URL для integration QA.
5. Дозволений корпус інновацій із джерелами; звіти/карта/описи випадків; Canwy і шаблон гранту для пізніших модулів.

Значення секретів не передавати в чат. Налаштування описані в DEPLOYMENT.md.
Відомі межі: fixtures непостійні; staff login, moderation, knowledge retrieval, діалоги,
адаптація та M3/M4 ще не реалізовані; ліміт IP і розподілений concurrency потребують розширення.
Dev-only lint advisory є в DEPENDENCIES.md; production audit — 0 знайдених вразливостей.

Наступна конкретна дія: після конфігурації — doctor → migrate → дозволений import → index → live M1.
Незалежна наступна розробка: staff auth і workflow модерації/діалогу M6/M5.

## Локальний дизайн за референсом — 2026-10-03

Гілка `codex/local-design`, база `origin/master` = `8e2ea3f`. Лише локальні зміни.
Чотири екрани: головна з описом без категорій → підтвердження / редагування
→ вибір організації → `/potrzeby/[id]/plan?organizacja=...` із наступними кроками.
Каталог інновацій, серверний matching, джерела, no-match і перевірки власника збережено.
На екрані плану є редагований текст для копіювання та розкривні пояснення / обмеження.
Підтвердження повторює введений текст, без удаваного AI-аналізу.
Три організації та їх зв'язки — явно синтетичні, тільки в fixtures + DEMO_DATA_ENABLED=true.
У postgres вони не з'являються; без перевіреного довідника показуємо доступні інновації.
Контакти не вигадані, повідомлення не надсилаються. M5/M6 та повний M7 цим не реалізовані.
Додано панель доступності: текст 100–200%, контраст, браузерне читання / зупинка,
підказка клавіатури. Голосовий ввід додано наступною ітерацією за запитом власника.
Фото — згенерована ілюстрація; prompt та походження в DEPENDENCIES.md.

Перевірено: build, typecheck, lint; 16 unit; 6 E2E; axe на головній, підтвердженні,
виборі, плані й деталях; 320px і збільшення 200%. Integration skipped без TEST_DATABASE_URL.
Локальне прев'ю: http://127.0.0.1:3001. Запуск у PowerShell з директорії застосунку:
`$env:APP_URL='http://127.0.0.1:3001'; node .tools/package/bin/npm-cli.js run dev -- --port 3001`.
Для звичайного npm: `npm run dev -- --port 3001` з тим самим APP_URL.
Наступне: тестування дизайну власником; підключення дозволених організацій/контактів окремою ітерацією.

Оновлення головної: назва Pomocny Punkt; зовнішнє посилання на https://www.malopolska.pl.
Панель доступності постійно видима вгорі праворуч: 4 палітри контрасту,
розміри 100/125/150/200%, Czytaj / Stop. Поле опису видно без прокручування
при 1280×720, 1008×600, 390×844 і 320×800 зі стандартним розміром тексту.
Оновлений набір: 8 E2E PASS; усі 4 палітри перевірено axe.

Наступне уточнення власника: прибрано верхній demo-banner, підпис AI на фото,
приклад у полі, підказку про 30–4000 символів і фразу Bez konta. Серверна
валідація й позначення синтетичних результатів збережені; режим залишається fixtures/mock.
Це явний запит власника, що змінює попереднє правило про глобальний demo-banner.
Оновлено заголовок і додано Silniejsza Małopolska — razem.
Powiedz głosem: браузерне польське диктування, Stop, доповнення редагованого тексту,
обробка відмови мікрофона / непідтримуваного браузера, припинення при виході з форми.
Перевірки: build, lint, typecheck, 16 unit, 10 E2E PASS; integration skipped без БД.
Реальний запис мікрофона не перевірявся; мовний сервіс залежить від браузера.

## Об'єднання дизайну з master — 2026-10-03

За запитом власника зміни підготовлено до push у master. Об'єднано актуальний
origin/master a22f390 (OpenAI та ROPS) із дизайном Pomocny Punkt.
Збережено knowledge resources і коректні позначення OpenAI/mock у результатах;
матеріали третього кроку доступні в розкривному блоці. Фото включено до CI release.
Build, lint, typecheck, 16 unit і 10 E2E PASS. Corpus validation PASS: 114 innovations,
69 knowledge resources. Integration: 1 skipped без TEST_DATABASE_URL.
Push master запускає існуючий production workflow; результат деплою перевіряється окремо.
