# Перевірки — 2026-10-03, поточна ітерація та історія

## Merge функцій із origin/master 46019bd

- Після усунення конфліктів: lint, typecheck і production build — PASS (52 маршрути).
- Автоматичний merge продублював `listKnowledge` у mock Azure fallback;
  typecheck виявив проблему, після виправлення повторна перевірка — PASS.
- Corpus validation: 114 інновацій, 69 матеріалів — valid.
- Operator bundle — PASS поза sandbox; перший запуск блокувався доступом esbuild
  до батьківського каталогу. GitHub CLI також потребував доступу до своєї конфігурації.
- Разова localhost HTTP-перевірка fixtures/mock: головна 200, hero image 200,
  навігація ідей/моїх справ присутня; створення потреби 201; matching, results,
  plan 200; переходи до адаптації й координатора збережено; чужий plan 404.
- Unit/integration/E2E suites і live AI не запускались. Нові SQL-міграції локально
  не виконувались. Результат production workflow перевіряється після push окремо.

## Підсумковий огляд — 2026-10-03, 18:34 Europe/Warsaw

- Статично оглянуто auth/session/recovery, ideas/adaptations, communication/pilots,
  catalog/importer, matching, analytics, маршрути доступу та міграції 0003–0007.
- Виправлено: відсутній thread lock при pilot message; перший M1 response без
  повторної перевірки публікації; вичерпання pool через вкладені M1 SQL-запити;
  LIMIT 50 до перевірки актуальності/походження відгуків.
- Фінальні npm lint, typecheck, build — PASS, 51 dynamic routes.
  `git diff --check` — PASS. Client scan не знайшов pg_advisory_xact_lock,
  DEMO_STAFF_PASSWORD_HASH або password_hash. Це вузький scan, не повний security audit.
- Разова localhost HTTP-перевірка fixtures/mock, без тестового runner:
  дві незалежні сесії створили потреби (201/201), перший M1 отримав 200 і очікуване
  synthetic джерело. Чужа потреба → 404. Заявка → 200, повтор повернув той самий ID.
  Чужа розмова → 404. Anonymous analytics → 403. ADMIN hide → 200; cached M1 → 200
  без прихованого source. У stdout тільки статуси/булеві підсумки, без cookies/описів.
- HTTP-перевірка виконана після перших трьох виправлень; останню зміну LIMIT 50
  перевірено фінальними lint/typecheck/build, без повторного runtime сценарію.
- Unit/integration/E2E suites, live AI та SQL concurrency/aggregation/migrations —
  NOT RUN. `.env.local` відсутній, DATABASE_URL і TEST_DATABASE_URL не задані,
  psql/postgres не знайдені в PATH, Docker daemon socket відсутній.
- Схеми SQL лише прочитані: це не підтвердження застосовності міграцій на production.
  Не перевірено runtime race приховування саме під час AI та навантаження на pool.
- Demo-сервер завершено. У цій перевірці production, push, deployment і зовнішні
  сервіси не змінювались. Окрему операцію з доменом збережено в історії нижче.

## Тимчасове повернення домену — 2026-10-03

- dev-k3s: Ingress і runtime APP_URL повернуто на `https://innomatch.brandly-io.com`.
- Перезапуск поточного релізу: rollout successfully rolled out.
- Публічний HTTPS: головна HTTP 200, `/api/ready` → `{"status":"ok"}`.
- Код, реліз і міграції не змінювались; npm suites у цій операції не запускались.

## Аналітика потреб — 2026-10-03 близько 18:22 Europe/Warsaw

- npm lint/typecheck/build — PASS; 51 dynamic routes. `git diff --check` — PASS.
  Client bundle scan не знайшов SQL CTE `selected as materialized`,
  DEMO_STAFF_PASSWORD_HASH або password_hash.
- Unit/integration/E2E suites не запускались за побажанням власника.
- Anonymous `/admin/statystyki` перенаправляє на login. Прямий HTTP GET
  `/api/admin/analytics?days=7` без cookies: 403 FORBIDDEN, private/no-store.
  Browser navigation до API блокувалась клієнтом, тому статус перевірено через HTTP.
- ADMIN: порожній звіт із нулями, зміна 30 → 7 днів; створено дві синтетичні потреби
  через UI: одна Seniorzy + гміна, друга без обох полів. Обидві запустили mock пошук.
- Звіт після повторного входу: total=2, withMunicipality=1, Seniorzy=1,
  unspecified=1, partial=1, no_match=1; сьогодні=2, попередні шість днів=0.
  Текстів потреб і назви гміни у звіті немає.
- Перший повторний вхід повернув помилку credentials; після повторного заповнення
  тих самих синтетичних credentials вхід пройшов. Причину одиничної помилки не встановлено.
- `days=8` показує «Nieprawidłowy okres» і посилання на допустимий звіт.
- Responsive: viewport=320, scrollWidth=305. Знімок `tmp/analytics-review.jpg`
  (ignored), без повного WCAG/keyboard аудиту. Demo-сервер завершено.
- PostgreSQL aggregation, SQL/fixtures parity на нестандартних групах, EXPERT role,
  межі дат/довгі періоди та велике навантаження у runtime — NOT RUN.
  SQL повертає агрегати одним statement; серверні guards і DTO переглянуто в коді.
- Нових міграцій, AI-викликів до зовнішнього провайдера, deployment або push не було.

## M4 — участь і відгуки, 2026-10-03 близько 18:10 Europe/Warsaw

- Фінальні lint/typecheck/build — PASS; 49 dynamic routes. Початкову помилку типізації
  SQL RowList/Array виправлено явними типами. Повторний build спочатку отримав EBUSY
  від відкритого demo-сервера; після завершення точного PID збірка пройшла.
- `git diff --check` — без whitespace errors; лише попередження Git щодо CRLF.
  Client bundle scan не знайшов pilot_participations, innovation_feedback,
  DEMO_STAFF_PASSWORD_HASH чи password_hash.
- Unit/integration/E2E suites не запускались за побажанням власника.
- Ручний localhost fixtures/mock: синтетична заявка → збереження після reload,
  одна розмова у «Moje sprawy», unread=1 у staff inbox. Повторного POST/concurrency
  не перевіряли; дедуплікацію переглянуто в коді (unique + transaction/lock у SQL).
- Відгук 4/5 із пропозицією покращення: IN_REVIEW/версія 1, публічний список порожній.
  ADMIN moderation: публікація disabled без checkbox, після підтвердження — версія 2
  і публічний відгук з позначкою SYNTHETIC та основою «на підставі опису».
- Logout staff зберіг owner; автор змінив текст → IN_REVIEW/версія 3, публічний
  відгук прибрано. Перемикання ролей було в одній сесії, не перевірка чужого owner.
- 320px: viewport=320, scrollWidth=305. Знімок `tmp/pilot-review.jpg` (ignored).
  Це часткова responsive перевірка, не повний WCAG-аудит.
- Останнє уточнення статусу за зміненим джерелом і перенесення довгого тексту
  перевірено lint/typecheck/build; source-change/hide runtime сценарій не виконано.
- PostgreSQL 0003–0007, race/concurrency, cross-owner та EXPERT moderation runtime —
  NOT RUN. Міграції, зовнішні повідомлення, production deploy/push не виконувались.
  Тимчасовий demo-сервер завершено.

## Зміна домену production — 2026-10-03

- SSH dev-k3s: Ingress `innomatch` → `pomocnypunkt.pl`; runtime APP_URL →
  `https://pomocnypunkt.pl`. Deployment restart завершився, Ready 1/1.
- Перевірено незмінність директорії релізу:
  `6b9b702b02542cba243e3410b3c31724c646b40e-37123389180-1`.
- HTTP через 127.0.0.1 із Host нового домену: головна 200, `/api/ready` → ok.
- POST `/api/needs` із порожнім `{}`: новий Origin → 400 VALIDATION,
  старий Origin → 403 ORIGIN. Дані не створювались, AI не викликався.
- Зовнішній `https://pomocnypunkt.pl/api/ready`: curl exit 6 (DNS не визначається).
  TLS і Cloudflare маршрут ще не підтверджені; домен додає власник.
- npm lint/typecheck/unit/build/E2E/integration у цій операційній зміні не запускались:
  код застосунку не змінювався, новий реліз і міграції не виконувались.

## M3 — картка ідеї, 2026-10-03 близько 17:35 Europe/Warsaw

- lint/typecheck/build — PASS. Unit/integration/E2E suites не запускались за побажанням власника.
- Фінальні lint/build/typecheck після Canvas-зв'язку — PASS, 45 dynamic routes.
  `git diff --check` — PASS. Client bundle scan не знайшов idea_assists, input_hash,
  attempt_id, DEMO_STAFF_PASSWORD_HASH або password_hash.
- Ручний localhost fixtures/mock: заповнено синтетичну картку → приватна версія 1;
  mock-пропозиція з'явилася окремо, початковий текст у формі не змінився.
- «Zastosuj propozycję» змінює лише форму; submit disabled до збереження. Збережено
  версію 2; reload підтвердив текст пропозиції. Подання створило SUBMITTED/версію 3 і розмову.
- Локальний ADMIN login → unread=1, «Rozmowa o pomyśle» → повна картка версії 3.
  Ролі перемикалися в одній браузерній сесії; це не перевірка двох різних власників.
- 320px на сторінці розмови: scrollWidth=305, viewport=320; overflow відсутній.
  Не повний WCAG/keyboard аудит. Знімок: `tmp/idea-review.jpg` (ignored artifact).
- Canvas-зв'язок перевірено за `data/rops/corpus.json`; у fixtures цей ресурс відсутній.
  UI зв'язку з PostgreSQL-каталогом не перевірений. Історичний запис DATA.md про
  відсутність Canvas уточнено; повний інтерактивний Canvas не реалізовано.
- Live M3 AI, PostgreSQL 0003–0006, одночасні create/edit/submit/assist, відновлення
  reservation після збою та доступ іншого owner — NOT RUN; серверні умови переглянуті в коді.
- Жодних зовнішніх повідомлень, міграції production чи deployment. Demo-сервер завершено.

## M7 — адаптація, 2026-10-03 близько 17:20 Europe/Warsaw

- `npm run lint`, `npm run typecheck`, `npm run build`: PASS (39 dynamic routes).
- `git diff --check`: PASS. Client bundle scan не знайшов adaptation-v1,
  INVALID_PLAN_SOURCES, input_hash, attempt_id або DEMO_STAFF_PASSWORD_HASH.
  Тимчасовий localhost сервер після перевірки завершено.
- Unit/integration/E2E suites не запускались за побажанням власника.
- Ручний браузер на localhost, fixtures/mock: синтетична потреба → «Sąsiedzki stół» →
  умови установи → збережена адаптація; усі розділи та синтетичне походження видимі.
- Редагування мети → версія 2; reload зберігає правку. Текст для копіювання включає
  правку, джерела, номер версії й mock-позначку; системний clipboard не змінювався.
- Явний запит про план → окрема розмова → localhost ADMIN login → unread у скриньці →
  читання плану версії 2 та синтетична відповідь. Справжніх повідомлень назовні немає.
  Це перемикання ролі в одній браузерній сесії, не перевірка ізоляції двох власників.
- 320px: document scrollWidth 305, viewport 320; горизонтального overflow немає;
  верхню частину сторінки оглянуто. Це не повний WCAG аудит.
- Знімок результату: `tmp/adaptation-review.jpg` (ignored artifact).
- Live AI M7, PostgreSQL 0003–0005, конкурентні create/PATCH, чужий owner та
  source invalidation у браузері — NOT RUN; відповідні обмеження перевірені читанням коду.
- Production не змінювався. Нижче — результати попередніх ітерацій.

## Модерація та відновлення — локально, 2026-10-03

- lint/typecheck/build: PASS. Автоматичні unit/integration/E2E suites не запускались
  за побажанням власника; результати нижче належать попереднім ітераціям.
- Фінальний build після останніх правок: PASS, 35 dynamic routes.
  `node scripts/build-operator.mjs`: PASS (поза Windows sandbox для esbuild).
  `git diff --check`: PASS. У client bundle не знайдено DEMO_STAFF_PASSWORD_HASH,
  password_hash, scrypt-v1 або token_hash. Тимчасовий локальний сервер завершено.
- Ручний браузер localhost / fixtures / mock: ADMIN login; приховати синтетичну
  інновацію → відсутня у каталозі; змінити назву й опублікувати з підтвердженням → збережено.
- Створити синтетичний матеріал із джерельним фрагментом → видимий у `/wiedza`
  із явною позначкою, що це не джерело ROPS. Знімок: `tmp/catalog-review.jpg` (ignored).
- Код відновлення / 90-денна гостьова сесія / 8-годинні staff права: читання коду та
  TypeScript; наскрізне відновлення в іншому браузері не виконано.
- PostgreSQL 0003/0004, конкурентні записи, SQL-аудит, збереження правок при реальному
  імпорті й live AI reindex: NOT RUN. БД і production не змінювалися.

## Персонал і діалоги — 2026-10-03, Windows / Node 22.16.0

- `npm run lint`, `npm run typecheck`: PASS.
- `npm test`: PASS, 19 тестів у 4 файлах: scrypt, відсутні credentials, відкликання прав,
  ownership, відхилення клієнтської ролі, контекст, idempotency і unread з пізнішими відповідями.
- Перший unit run знайшов 2 застарілі mocks у azure-fallback після knowledge import.
  Додано listKnowledge/listKnowledgeEmbeddings mocks; повторний run — усі PASS.
- `npm run build`: PASS, 28 dynamic routes без БД/live AI.
- `npm run test:e2e`: PASS, 9 Chromium-тестів, фінальний exit 0.
  Новий сценарій: потреба → контакт → вхід координатора в іншій сесії → скринька →
  відповідь → unread автора → reload; чужій сесії заборонені читання, запис і read receipt.
  Також перевірені logout, контакт щодо інновації, повторне створення, підроблена роль,
  неправильний пароль, CSRF та попередні 7 E2E ядра.
- axe WCAG2A/AA/2.1AA розмови: 0 violations; 320px без horizontal overflow.
  `test-results/conversation-mobile.png` оглянуто: текст, форма й кнопки не обрізані.
  Це не повний WCAG аудит.
- E2E має окремий fixtures/mock сервер, не перевикористовує наявний сервер;
  credentials випадкові й тимчасові. Живі AI/production дані не використовувались.
- `npm run test:integration`: 2 SKIPPED, TEST_DATABASE_URL відсутня; Docker daemon недоступний.
  Новий тест перевіряє міграції 0001–0003, staff password, persistence, deduplication,
  unread і ownership. Його написання не є підтвердженням роботи PostgreSQL.
- `node scripts/build-operator.mjs`: PASS поза Windows sandbox, який блокував esbuild.
- Системний npm wrapper несправний; npm scripts виконані через
  `node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js"`.
- Перший E2E run не мав Chromium. Встановлено у tmp/playwright; повторний run пройшов.
  Windows sandbox не завершував дочірній сервер; після всіх тестів завершено тільки його
  перевірений PID. Один build до завершення сервера впав із EBUSY; повторний build — PASS.
- Міграція 0003, provisioning реального персоналу, deployment та live AI — NOT RUN.
- `git diff --check`: PASS. У `.next/static` немає STAFF_PASSWORD,
  DEMO_STAFF_PASSWORD_HASH, password_hash або scrypt-v1; серверні credentials не потрапили в client JS.

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
