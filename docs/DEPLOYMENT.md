# Запуск і підключення

## Production: dev-k3s / GitHub Actions

Власник погодив сервер `dev-k3s` (SSH `eljohne`, k3s node `localserver`),
namespace `innomatch` та `https://innomatch.brandly-io.com`.
На сервері kubectl використовує `KUBECONFIG=$HOME/.kube/config`; sudo не потрібен.

`.github/workflows/deploy.yml` запускається після push у `master` або вручну.
GitHub-hosted Ubuntu + Node 24.19.0 виконує `npm ci` та `npm run build`, пакує
standalone output. Тести навмисно пропущено за дорученням власника.
Namespaced runner `innomatch-prod-k3s` завантажує artifact на PVC `releases`,
виконує SQL-міграції як Job, потім перемикає Deployment на окрему директорію релізу.
OPENAI_API_KEY береться з GitHub repository secret лише в deploy step; у build його немає.
Жодних registry credentials, SSH private keys або kubeconfig у GitHub secrets немає.
Runner має лише Role у namespace `innomatch`, без host mounts і cluster-admin;
для секретів дозволені лише GET/PATCH конкретного `openai-env` (kubectl patch потребує GET), без LIST.
Не додавати `pull_request` / `pull_request_target` запусків на production runner.

`deploy/bootstrap.py` створює інфраструктуру через наявний kubeconfig, приймає
одноразовий registration token GitHub через stdin. Секрети генеруються випадково;
наявні не перезаписуються. Після втрати runner PVC слід оновити registration secret
свіжим токеном і повторно зареєструвати runner. Образ runner зафіксовано на 2.337.0;
версію потрібно оновлювати при релізах GitHub (auto-update вимкнено).

PostgreSQL 17.11: окрема БД `innomatch`, окремий login без superuser, PVC 5 GiB.
БД доступна лише всередині namespace через ClusterIP + NetworkPolicy.
`app-env` містить DATABASE_URL, AUTH_SECRET, APP_URL та режими; значення не друкувати.
Production використовує postgres; OpenAI-конфігурація накладається через окремий secret
`openai-env`, який Actions оновлює через stdin без запису ключа на диск або в argv.
Каталог порожній, demo seed відсутній. Імпорт та індексацію виконувати лише для дозволених матеріалів.

Ingress очікує Cloudflare Tunnel public hostname `innomatch.brandly-io.com`
із service `http://localhost:80` і оригінальним Host header. TLS завершується на Cloudflare.
`/api/health` перевіряє процес, `/api/ready` також перевіряє доступ до БД та міграцію.

```sh
export KUBECONFIG=$HOME/.kube/config
kubectl -n innomatch get pods,pvc,ingress
kubectl -n innomatch rollout status deployment/innomatch
kubectl -n innomatch rollout undo deployment/innomatch
kubectl -n innomatch create job --from=cronjob/postgres-backup backup-manual-$(date +%s)
```

Невдалий rollout автоматично відкочується до попередньої revision; міграції БД автоматично
не відкочуються, тому вони мають зберігати сумісність із попереднім застосунком.
Релізи залишаються на PVC для rollback; оператор видаляє лише директорії, які більше не
використовуються Deployment/ReplicaSet/Job. Recreate означає коротку перерву під час деплою.
Backup о 02:00 UTC щодня: custom-format pg_dump, retention 7 днів, окремий локальний PVC.
Перед майбутніми змінами схеми запускати ручний backup і чекати Complete.
Один вузол, локальні диски й backup не захищають від втрати сервера;
off-host backup та перевірку відновлення ще треба налаштувати.

## Локальна розробка та операторські команди

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

## OpenAI API — поточний production провайдер

`AI_PROVIDER=openai`, `DATA_PROVIDER=postgres`, `OPENAI_API_KEY` — єдиний обов'язковий
OpenAI secret. За замовчуванням `OPENAI_CHAT_MODEL=gpt-6-luna`,
`OPENAI_EMBEDDING_MODEL=text-embedding-3-small`. У GitHub це необов'язкові repository Variables;
після зміни secret/Variables запустити Deploy production вручну або зробити push у master.
Відсутній OPENAI_API_KEY зупиняє deploy; автоматичного переходу на mock немає.

Генерація: Responses API, strict JSON Schema, Zod + серверна allowlist джерел, `store:false`.
GPT-5/6 використовують reasoning effort `none` для швидкого короткого пояснення.
Embeddings мають provider-qualified ID `openai:<model>`; зміна моделі потребує переіндексації.
Квоти, concurrency, timeout і usage залишаються серверними. Порожній каталог не викликає API.

```sh
npm run doctor
npm run doctor -- --live
npm run data:index
# У production pod; дві короткі синтетичні операції, без retries:
kubectl -n innomatch exec deployment/innomatch -- node scripts/check-openai.mjs --live
```

Live diagnostic запускається лише явно оператором, не автоматично у workflow.
Він перевіряє Responses із JSON Schema та embeddings, не друкує текстів/ключів.
Вартість двох діагностичних запитів не потрапляє в application ai_usage.
Потрібні активні API billing/кредити та права ключа на Responses і Embeddings.

## Azure — збережений опційний адаптер

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
Статус фактичного production rollout та зовнішньої доступності див. STATUS.md / QA.md.

## Автоматичний імпорт ROPS

Release включає перевірений `data/rops/corpus.json` та server-only `scripts/manage.cjs`.
Actions: build → validation/package → migrations → sync OpenAI secret → corpus Job → rollout.
Corpus Job імпортує дані та індексує зміни пакетами до 16 записів. Початково 166 векторів,
11 embedding-запитів. Повторний запуск із незміненими даними не викликає OpenAI.
Статуси вже прихованих записів зберігаються. Дані поза snapshot не видаляються.
Помилка імпорту/індексації блокує rollout; повторний workflow продовжить незавершену індексацію.
Міграція 0002 додає лише knowledge_resources і knowledge_embeddings; старий app сумісний.
Для ручної синхронізації у production pod: `node scripts/manage.cjs sync-corpus`.
Для локальної перевірки без DB/AI: `npm run data:validate`.
