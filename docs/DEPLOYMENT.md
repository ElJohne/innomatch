# Запуск і підключення

Локально: `npm ci`, `npm run dev`, http://localhost:3000.
Production перевірка: `npm run build`, `npm run start` (localhost).
Для іншого інтерфейсу встановити MI_BIND_HOST=0.0.0.0 у погодженому середовищі.
APP_URL має точно відповідати origin браузера, включно з портом; це захист записувальних запитів.

## Приватна конфігурація

Скопіювати `.env.example` в `.env.local`, заповнювати значення лише локально.
Для PostgreSQL: DATABASE_URL, опційно DATABASE_DIRECT_URL (міграції), DATA_PROVIDER=postgres.
AUTH_SECRET — випадковий секрет щонайменше 32 символи. Не вставляти його в чат або Git.
Підтвердження, що БД виділена цьому проєкту: DATABASE_CONFIRMED_FOR_PROJECT=true.
Значення не слід встановлювати для невідомої або спільної БД.

```sh
npm run doctor
npm run db:migrate
npm run db:seed:demo -- --demo
```

Seed вимагає DEMO_DATA_ENABLED=true, виконує upsert без видалення записів.
Для реальних матеріалів: `npm run data:import -- --file data/import/records.json`.
Вхід — масив за innovationSchema у `src/lib/contracts/index.ts`; невідомі поля,
дублікати ID та synthetic без demo відхиляються до транзакції. CSV наразі не підтримано.
Джерельні записи вимагають evidenceExcerpt; імпортувати лише дозволені дані без ПД.
Операція доступна тільки оператору CLI із серверними обліковими даними; публічного import API немає.

## Azure

AI_PROVIDER=azure; DATA_PROVIDER=postgres. Потрібні AZURE_OPENAI_BASE_URL
(`https://…/openai/v1/`), API_KEY, CHAT_DEPLOYMENT, EMBEDDING_DEPLOYMENT.
Якщо embedding у іншому ресурсі — також EMBEDDING_BASE_URL / EMBEDDING_API_KEY.
Адаптер використовує OpenAI SDK, Chat Completions, store:false та валідований JSON.
Live сумісність deployment поки не перевірена. Немає прихованого переходу на mock при відсутніх ключах.

```sh
npm run doctor -- --live
npm run data:index
```

Doctor --live робить один короткий текстовий та один embedding запит без retry.
Індексація має витрати Azure; запускається вручну. Незмінені записи пропускаються.
Зміна контенту/deployment виключає несумісні старі вектори.
JSONB-вектори й точний cosine — стартовий fallback для малого каталогу без pgvector.
Глобальна денна квота запитів у PostgreSQL; concurrency — у процесі, тому для MVP один Node worker.
Семантичний поріг 0.45 — початкова евристика, потребує оцінки на справжньому корпусі.

## Перевірки й відкат

`TEST_DATABASE_URL=... npm run test:integration` (у PowerShell задається через `$env:TEST_DATABASE_URL`).
Тест створює власну випадкову schema і видаляє тільки її. Не використовувати production DSN.
`npm run build`, потім `npm run test:e2e`.
Dockerfile готує standalone Node образ; Docker build у цій сесії не перевірений.
Перед міграцією production зробити backup силами обраного провайдера.
0001 — лише створення нових таблиць; rollback застосунку — попередній образ, дані не видаляти.
Немає автоматичної destructive down-міграції. Відновлення backup перевірити на окремій БД.
Хостинг не обрано. Застосунок не опублікований.
