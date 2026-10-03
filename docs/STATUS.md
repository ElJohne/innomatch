# Стан — 2026-10-03

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
