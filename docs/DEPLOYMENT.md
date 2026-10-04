# Запуск і підключення

## Перший пріоритет — підготовка production, 2026-10-04

Пакет навігації та прямих звернень об'єднано з `origin/master` 1c1bf41;
функціональні виправлення та пагінація черг збережені. Потрібна міграція
`0009_support_entry`, readiness перевіряє її. Контекст старих розмов збережено,
нові приватні coordinator requests можуть мати лише мету підтримки.
Перед міграцією `deploy/release.sh` тепер створює окремий backup Job через
`deploy/render.mjs backup`, зберігає custom-format pg_dump у чинний backups PVC,
перевіряє читання його змісту через pg_restore --list й чекає Complete.
Невдалий backup зупиняє реліз до зміни схеми; нові права runner не потрібні.
Цей backup доповнює чинний щоденний CronJob. Синтаксис bash та JSON manifest
перевірено локально; фактичний backup підтверджується лише production Job.

Актуальний функціональний реліз 04.10.2026 09:33: `d16ed07`,
[Actions37185993820](https://github.com/ElJohne/innomatch/actions/runs/37185993820)
SUCCESS. Збережено актуальний redesign master; нових migrations немає.
Backup `backup-functional-20261004` Complete. Production mount
`d16ed07e00795e1ce5dd7a3f8a69abdbcce12f06-37185993820-1`, rollout та HTTPS
health/ready200 підтверджено. Короткий public smoke PASS; деталі в QA/STATUS.

Наступні production релізи без міграцій: 3193da5 / Actions 37167103864 SUCCESS
(grant JSONB) і 2c5f0bc / Actions 37167868599 SUCCESS (idea comparison).
Live grant persistence/AI/consultation та compare/append/reopen підтверджені.

Production оновлення 2026-10-04: bc82c12 / GitHub Actions 37165955711 SUCCESS.
Deployment mount bc82c12b4b054f1a5a11688bc6fb618c2d2ffc1a-37165955711-1
підтверджено SSH. Backup backup-quality-20261004-0246 Complete перед rollout;
0008 пройшла migration job. Ручний HTTPS M1 → M7 → M5 PASS на синтетичному
сценарії. Попередні записи «ще не deployed» нижче — історія цього пакета.

## Пакет якості 2026-10-04 — ще не deployed

Поточні зміни потребують `0008_shared_plan_snapshot`; readiness перевіряє саме її.
Міграція додає nullable JSON snapshot до threads та фіксує поточну готову версію
планів старих діалогів. Нові редагування не змінюють snapshot без явного sharing.
0001–0008 перевірені в окремій локальній PostgreSQL 14; схему production БД не змінено.
Перед погодженим rollout: backup, штатний мігратор, нова збірка, readiness і smoke
передавання/редагування/повторного передавання версії. Старий клієнт без
adaptationRevision має оновити сторінку, щоб створити нову розмову про план.
Нових залежностей або сервісів не потрібно. Історичні релізи нижче — не статус цього пакета.

Canvas використовує існуючий ideas.record JSONB, нової міграції не потребує.
Shadow QA цього пакета після дозволу власника записував лише власні синтетичні
needs/idea, після перевірки вони прибрані. 106 AI-операцій, production cap 300
незмінний. Останній документований попередній rollout — 09e0f95, Actions 37157218895
(STATUS.md); згадка a2f5c64 нижче описує ще раніший реліз.

Актуальний підтверджений реліз: `a2f5c64a0b11edd8b4da191e936ccb63e10a1911`,
Actions 37144087261 — SUCCESS (2026-10-03). Виправлення окремих ORM/raw SQL
pools уже в production. Backup перед rollout — Complete, HTTPS readiness — ok;
live API сценарії M1/M3/M4/M5/M7, recovery й analytics підтверджено в QA.md.
Згадки нижче «локально / очікує rollout» є історичними.

## Уточнення після PostgreSQL QA — 2026-10-03, 20:19

Локальне виправлення розділяє postgres-js для Drizzle і прямого SQL: по 5
з'єднань у кожному lazy pool, разом до 10 на Node-процес. Drizzle змінює
парсери/серіалізатори клієнта, тому pools не можна знову об'єднувати.
CLI використовує `closeDatabase()` для завершення обох pools. Нових міграцій немає.
Повний набір 0001–0007 та повторний запуск мігратора підтверджено на локальній
PostgreSQL 17.11. Виправлена версія ще очікує погодженого rollout.
Production workflow 37139928817 (ef6954e) уже успішний; згадки нижче про
нерозгорнуті попередні модулі/міграції описують історичні ітерації.

## Поточний локальний реліз: M4, потрібна міграція 0007

0007_pilots_feedback додає pilot_participations і innovation_feedback; unique(owner_id,
innovation_id) у кожній. Readiness вимагає 0007. Перед запуском поточного checkout
потрібні всі накопичені 0003–0007; у цій ітерації жодна не виконувалась.
Нових secrets, AI-викликів або зовнішніх сервісів для M4 немає.
Спочатку перевірити ізольовану БД: атомарність заявки/повідомлення, дедуплікацію,
owner isolation, ADMIN-only moderation, revision conflict, edit → IN_REVIEW,
source change/hide → виключення публічного відгуку. Локальний fixtures flow цього
не замінює. Потім backup та окремо погоджений rollout.

## Попередня ітерація: M3, міграція 0006

0006_ideas додає ideas/idea_assists і nullable threads.idea_id. CHECK контексту розмови
змінюється: рівно одна з need_id/innovation_id/idea_id; адаптації зберігають need_id.
Міграція транзакційна через наявний runner. У тій ітерації readiness вимагав 0006;
поточну вимогу див. вище. 0003–0006 ще не виконувались.
Нових зовнішніх сервісів або secrets немає. M3 використовує наявний AI_PROVIDER.
Перевірити ізольовану БД: private drafts, atomic submit, edit/submit races, assist cache,
доступ персоналу лише через Thread. Live AI M3 перевірити окремо на синтетичній картці.
Canvas у картці береться лише з опублікованого knowledge record; fixtures його не містять.
Грантових наборів, генератора заявок та публічної публікації ідей немає.

## Попередня ітерація: міграції до 0005

Новий checkout ще не deployed. 0005_adaptations додає приватні плани, reservation для
генерації, revision у JSON і nullable threads.adaptation_id. Існуючі діалоги зберігаються.
У тій ітерації readiness вимагав 0005; поточну вимогу див. вище.
Для M7 використовується наявний AI_PROVIDER і ті самі secrets/quotas, нових сервісів немає.
Спочатку перевірити 0003–0005 на ізольованій БД: owner permissions, reservation/retry,
revision conflict, source invalidation, явне sharing і читання персоналом.
Live M7 перевірити окремою синтетичною потребою; попередній live M1 не доводить якість M7.
Потім backup та погоджений rollout. У цій ітерації ці операції не виконувались.

## Production: dev-k3s / GitHub Actions

Власник погодив сервер `dev-k3s` (SSH `eljohne`, k3s node `localserver`),
namespace `innomatch` та `https://pomocnypunkt.pl` (перемкнуто після налаштування Tunnel власником 2026-10-03).
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
У попередньому rollout імпортовано 114 інновацій і 69 матеріалів ROPS, автоматичного demo seed немає.
Імпорт та індексацію виконувати лише для дозволених матеріалів.

Ingress очікує Cloudflare Tunnel public hostname `pomocnypunkt.pl`
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

## Персонал і діалоги — міграція 0003

Зміна ще не розгорнута. Спочатку `npm run test:integration` на виділеній тестовій PostgreSQL,
потім backup і погоджена міграція/rollout. 0003 додає staff_users, threads, messages без зміни
старих даних. Поточна readiness вимагає також 0004_catalog_recovery; попередня версія сумісна з новими таблицями.

Для account приватно задати лише операторському процесу: STAFF_LOGIN (email), STAFF_ROLE
(ADMIN або EXPERT), STAFF_PASSWORD (14–200 символів), DATABASE_URL, DATA_PROVIDER=postgres,
DATABASE_CONFIRMED_FOR_PROJECT=true. Пароль не передавати через argv, чат або журнали.

```sh
npm run auth:staff
# Еквівалент у production artifact:
node scripts/manage.cjs staff
```

Після команди прибрати STAFF_PASSWORD з конфігурації/оточення оператора. Runtime не потребує
STAFF_PASSWORD. У БД salted scrypt (N=32768, r=8, p=1); повторна команда змінює пароль/роль,
активує account і збільшує auth_version, відкликаючи попередні staff sessions.
Відключення account: оператор БД встановлює active=false. Вхід `/personel/logowanie`, скринька `/admin`.

Fixtures персонал працює лише з явними DEMO_STAFF_LOGIN / DEMO_STAFF_PASSWORD_HASH
(scrypt-v1), без стандартного пароля; PostgreSQL ігнорує ці значення.
E2E сам генерує випадкові тимчасові credentials і запускає окремий fixtures/mock сервер.
Потрібні вільний localhost:3000 та Chromium (`npx playwright install chromium`).
У поточному Windows checkout браузер у tmp/playwright; перед тестами:
`$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) 'tmp\playwright'`.

Сповіщення внутрішні, без email/push; оновлення вручну, staff_read спільний для команди.
Гостьовий cookie TTL — 90 днів; `/moje-sprawy` дозволяє зберегти код відновлення.
Staff права — окремі 8 годин; старі staff cookies після оновлення потребують нового входу.

## Редактор та відновлення — міграція 0004

0004 додає catalog_controls, audit_events та owner_recovery. Виконувати до import/index
і запуску нової версії; readiness відхилить БД без неї. У цій ітерації міграції не виконано.
ADMIN має редактор, EXPERT — лише скриньку. Ручна правка робить запис managed_locally:
імпорт більше не перезаписує його навіть при зміні джерела. Походження запису незмінне.
Збереження вилучає embedding і ставить index_pending; явна кнопка оновлення AI або
data:index перебудовує вектор. До цього залишається пошук за словами.
Аудит містить actor/action/object/time, без приватних текстів чи кодів. У БД — лише
хеш коду відновлення. Ротація AUTH_SECRET закриває cookie сесії, але не відкликає
коди: це окремі записи owner_recovery.
До rollout перевірити на ізольованій БД міграції, права ADMIN/EXPERT, конкурентні
записи, збереження правок при імпорті, reindex і відновлення в іншій сесії.
Після цього backup, погоджений rollout та provisioning персоналу.
