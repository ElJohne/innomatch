# Перевірки — 2026-10-03, поточна ітерація та історія

## Live grant resources / QA cleanup — 2026-10-04, 03:57

- 2d0bc9d / Actions 37169054931 SUCCESS. Manual production seniorzy → Mapa
  Wyzwań page 41 → explicit append → save → reload: попередній diagnosis і URL
  збережено PASS. Повторне додавання того самого URL disabled.
- Screenshot лише власної синтетичної чернетки: live-grant-resources-20261004.jpg.
- Cleanup підтверджено SQL transaction: тільки власні known IDs — 1 need,
  2 ideas, 3 threads, 1 adaptation та їхні messages/idea_assists. Guards:
  synthetic назви, owner equality, exact IDs, немає STAFF replies. AI accounting
  і сторонні записи не змінено. Попередні «QA ще чекає» нижче — історія.
- Наступний catalog search: lint/build PASS; live ручна перевірка ще очікує.

## Live мета звернення / бюджет; джерела локально — 2026-10-04, 03:50

- c697f0c / Actions 37168777448 SUCCESS. Власна синтетична ідея → MENTORSHIP
  → thread 5f8b2f63… → Moje sprawy: title + «Wsparcie mentora» PASS у PostgreSQL.
  Screenshot містить лише синтетичну картку: live-contact-purpose-20261004.jpg.
- Live grant AI з budgetContext описав підготовку інструментів і два тестові
  зустрічі з уже введеними строками; не повторив «витрати до уточнення».
  Explicit apply/save PASS. Авторська сума 175,50 PLN не змінена AI.
- Новий пошук матеріалів diagnosis: lint/build PASS. Ручна перевірка пошуку,
  append і persistence ще очікує rollout; нових автоматичних тестів немає.

## Live compare та локальна мета звернення — 2026-10-04, 03:43

- 2c5f0bc / Actions 37167868599 SUCCESS. Ручний live compare цифрових занять:
  Merkury, спільні функції/відмінності, точний фрагмент, append → grant reopen PASS.
  Screenshot: screenshots/live-idea-comparison-section-20261004.jpg.
- Ручний local fixtures/mock idea → «Wsparcie mentora» → submit → видимий
  префікс мети у thread → назва і мета у Moje sprawy PASS. Новий SQL для списку
  справ ще не перевірено production; без міграції. Lint/build PASS.
- Повтор live grant AI після costsEnteredByAuthor залишив старе речення про
  невизначені кошти; бюджет 175,50 PLN незмінний. Посилено prompt і передано
  budgetContext; перевірка цієї останньої зміни ще очікує deployment.
- Нових тестів/пайплайнів не додавали; основний контроль — ручний user journey.

## Live grant і локальне порівняння — 2026-10-04, 03:24

- 3193da5, Actions 37167103864 SUCCESS. Ручний production create idea →
  prefill grant → бюджет 125,50 + 50 + 0 = 175,50 PLN → save → live OpenAI
  preview → explicit apply → save → reload → preview → submit → у розмові
  idea revision 4 і grant зі збереженим бюджетом PASS.
- AI позначив діагноз як спостереження автора, ефект як гіпотезу, відсутні дані
  для новизни/досвіду/джерел — до уточнення. Не було вигаданих статистичних
  посилань. Один контрольний випадок, не загальна оцінка якості генератора.
- Скриншот owner-only синтетичної чернетки:
  screenshots/live-grant-preview-20261004.jpg. Виявлено текстову неузгодженість:
  у підготовці згадано потребу визначити кошти, хоча ручні витрати вже є.
  У наступному локальному коді costsEnteredByAuthor передається в AI input;
  live повтор цієї зміни ще очікує. AI не може редагувати рядки витрат.
- Нове локальне compare: synthetic idea про телефон/інтернет → Cyfrowy duet
  top-1 у keyword/mock, видимі demo labels → append comparison notes →
  відкриття grant novelty зі збереженим текстом PASS. Mock інші результати
  є збіжністю слів, не функціональним AI-рейтингом; це явно підписано.
- Lint/build compare PASS; після ручного проходу скориговано повідомлення
  після append, щоб запис нотаток не показував помилково «картку змінено».
  Фінальні lint/build PASS; live compare ще очікує rollout.

## Ручний production і нова грантова частина — 2026-10-04, 03:07

- bc82c12 / Actions 37165955711 SUCCESS; migration 0008 та release mount
  підтверджені rollout. Ручний браузер production: синтетична потреба бібліотеки
  про bankomat/paczkomat → Merkury → live AI plan → ручний firstStep edit →
  revision 2 → send → thread із shared plan revision 2 PASS.
- Знімок тільки власного синтетичного сценарію:
  screenshots/live-shared-plan-20261004.jpg. Розмова явно позначена QA;
  production-записи ще чекають прибирання після завершення перевірки.
- Новий grant draft локально: create idea → prefill → три витрати
  125,50 + 50 + 0 PLN → сума 175,50 → save → mock AI preview → explicit apply
  → save → reload → owner preview PASS. Бюджет не змінюється AI.
- Lint/typecheck/build PASS; 68 наявних unit PASS. Нових тестів/пайплайнів немає;
  PostgreSQL integration та повний E2E цього пакета не повторювали за пріоритетом
  власника на короткі ручні сценарії. Live grant AI, консультація/SQL persistence
  цього доповнення ще не підтверджені.
- Повторний build спочатку EBUSY через запущений локальний standalone server.
  Після його зупинки фінальний build PASS; це lock середовища, не збій форми.

## Конкурентний пакет / Canvas — 2026-10-04, 02:30 Europe/Warsaw

- `npm run lint`, `npm run typecheck`, `npm test`: PASS, 66 unit / 8 файлів.
  Системний npm shim несправний; ті ж npm scripts виконано через
  `node C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js`.
  Залежності скопійовано з основного checkout після невдалого offline npm ci;
  lock-файли ідентичні, package/lock не змінені.
- `npm run test:integration`: PASS, 8 тестів / 3 файли, окремий локальний PostgreSQL 14,
  порт 6544, тимчасові схеми. Перевірено snapshot плану, явне оновлення/повтор,
  backfill 0008 і повторне застосування без перезапису snapshot; Canvas JSONB
  create → assist → edit → get → consultation. Production міграцій не було.
- `npm run build`: PASS. `npm run test:e2e -- --config tmp/playwright.local.config.ts`:
  26/26 PASS, встановлений Chrome, fixtures/mock. На Windows teardown Next зависав
  після завершення тестів; зупинено лише PID WebServer цього запуску, exit 0 отримано.
- Новий Canvas перевірено наскрізно: розкрити → частково заповнити → save → reload →
  mock assist/apply/save без втрати нотаток → preview → print CSS → консультація.
  Мобільний preview 390 px оглянуто; немає горизонтального overflow, print приховує
  навігацію/кнопки, зберігає вміст. Це HTML для браузерного друку, не окремий PDF-файл.
- П'ять основних екранів перевірені при 320/390/1280 px × 100/200% текст; axe на
  чотирьох темах для кожного екрана. Первісно тест виявив overflow на 390 px/200%
  у довгому слові заголовка «koordynatorem»; після overflow-wrap повтор PASS.
- Після явних дозволів власника live shadow runner (не deployment): 30 + 10 кейсів,
  3 повтори після зміни довжини/інструкції AI-пояснень. Основний набір: 12/12 прямих,
  6/6 коротких, 3/4 часткових Hit@3; 4/4 сторонніх no_match; 4/4 неясних по одному
  питанню. Holdout: 8/8 позитивних Hit@3, 2/2 сторонніх no_match.
  Усі позитивні — semantic/openai/source_backed. Результати в quality-live*.json.
- `direct-bathroom` у першому проході мав урване limitations і слово sourceIds.
  Збільшено жорстку межу 220 → 400, запитано коротке повне речення до ~150 символів;
  повтор bathroom/ATM/parcel — 3/3, нормальні повні пояснення. Повні 40 після цього
  малого виправлення не повторювалися; статистика початкового проходу збережена.
- Live Canvas: реальний OpenAI зберіг невідомі витрати та потенційний статус партнера;
  create/assist/edit/read PASS, stage CONCEPT. Первісний QA-runner помилково порівнював
  JSON.stringify з порядком ключів JSONB та не видаляв дочірній idea_assists перед
  ideas. Повторне читання того ж exact synthetic record підтвердило deep equality;
  дочірній і батьківський записи прибрано транзакційно, без нового AI-виклику.
  Доказ: tests/search-quality/canvas-live-2026-10-04.json (cleanup=true).
- Дозволи: auto-review спершу заблокував передавання пошукового скрипту, потім окремого
  Canvas-скрипту. Обидва запущено тільки після окремих явних підтверджень власника.
  Загальний counter OpenAI: 0 → 106, QA cap 120, production cap 300 незмінний.
  Synthetic needs/idea прибрані; власні remote /tmp bundles/reports прибрані після
  копіювання звітів; лічильник usage збережений. Жодного push/deploy/production migration.
- Оцінка попередня: очікування сформульовані агентом до запуску, без експерта.
  Exact source slices підтверджують походження тексту, але не доводять релевантність.
  `partial-lonely` дав слабке суміжне рішення; це залишається відомим недоліком.

## Конкурентний аудит: браузерний повтор після deployment — 2026-10-04

- Публічний `https://pomocnypunkt.pl`, свіжі синтетичні описи через UI, після
  повідомлення власника про deployment; 3 сценарії / 4 пошуки.
- `Osoba niewidoma ma problem z bankomatem`: кінцевий результат без уточнення.
  Попередній загальний допит не відтворено. Залишено зауваження: повідомлення
  про неможливість перевірки показано разом із твердженням про no-match.
- `Jestem samotny`: короткий текст прийнято; кінцевий результат без уточнення.
- `Potrzebuję pomocy`: одне питання; відповідь `Nie wiem` → кінцевий результат
  без нового питання. Reload зберігає завершений стан. Перевірка цього циклу PASS.
- У звичайних кінцевих результатах UI явно повідомляє недоступність semantic
  search і keyword/template fallback. Live AI-релевантність не підтверджено.
  Лічильники квоти в цьому аудиті незалежно не читалися; значення 300/375
  походять з окремого rollout нижче.
- UX: «Nie musisz ponownie opisywać potrzeby» суперечить «Opisz potrzebę ponownie».
  Додатково stepper обіцяє організацію, хоча реальна гілка показує інновації.
- П'ять синтетичних приватних needs цього аудиту (один первісний, чотири після
  deployment, включно з відповіддю на питання) не видалялися й не передавалися
  координатору. Це не записи runner, для якого нижче зазначено cleanup PASS.
- Desktop UI оглянуто; mobile не підтверджено. Suite lint/typecheck/unit/build/
  integration/E2E повторно не запускалися: змінено лише документацію аналізу.

## Відновлення live AI — production, 2026-10-04

- Власник явно підтвердив видалення ліміту та push з production auto-deploy.
  Реліз `4e5554c78275e0fedc1db155f437efb0e0efe7d7-37159479316-1`.
- Release mount містить цей SHA/run ID; rollout успішний, jobs
  migrate-37159479316-1 і corpus-37159479316-1 мають succeeded=1. Readiness ok.
  GitHub CLI Actions lookup давав 404; фінальний статус workflow через API
  не отримано, результат перевірено безпосередньо в кластері та через HTTPS.
- 3 live HTTP пошуки: short-medicine → Cold Box / matched / 8719 ms;
  one-hand → Biustspinka / matched / 7019 ms; deaf-library → Głuchy czytelnik
  w bibliotece / partial / 5764 ms. Усі semantic/openai/source_backed,
  matchingVersion=4, questions=[], warnings=[]. Це справжні AI-відповіді після
  видалення внутрішньої квоти, не keyword/template fallback.
- Докази: tests/search-quality/quota-removed-live-2026-10-04.json. Синтетична
  агентська перевірка, не незалежне приймання. Runner cleanup PASS; його needs
  видалено, фактичні ai_usage збережено. Shared corpus і чужі needs не змінено.

## Вилучення глобальної AI-квоти — 2026-10-04, локальна перевірка

- Production read-only підтвердив внутрішню квоту 300 і використання 375.
- Ізольований реліз видаляє consumeLimit для AI, не облік usage. Стара env
  AI_DAILY_REQUEST_LIMIT і старі request_counters більше не блокують провайдера.
- 2 нові unit-кейси (OpenAI/Azure): стара квота=1, reservation повертав би false;
  3 послідовні виклики успішні, reservation не викликається, usage записано 3 рази.
- Фінальні lint/typecheck/build PASS, 60 unit PASS, 8 PostgreSQL integration PASS
  на окремому postgres:17.11-alpine (після тестів прибрано), 22 Chrome E2E PASS.
  Live production-перевірку буде записано після rollout. Нових міграцій немає.

## Production rollout — 2026-10-04

- Власник явно дозволив push з автоматичним deployment. Коміт виправлення
  a2b2bc5, об'єднаний із навігацією origin/master 74bcd42 у реліз 09e0f95.
  Повтор після merge: lint/build (із TypeScript) PASS, 22/22 Chrome fixtures/mock E2E PASS.
- Backup job `backup-clarify-20261004` Complete; Actions build/deploy SUCCESS:
  https://github.com/ElJohne/innomatch/actions/runs/37157218895.
  Поточний mount /app підтверджує точний реліз
  `09e0f956e741eaa9fdf339baf02c9169ffa4cd09-37157218895-1`.
- Публічні `/` → 200, `/api/ready` → 200/ok. Production API: skip-vague → 0 питань;
  urgent → emergency; vague-dialogue → 1 питання, після «не знаю» → 0 питань.
  Усі 4 відповіді мають matchingVersion=3, expectationMet=true.
  Доказ: `tests/search-quality/clarification-deployed-2026-10-04.json`.
- AI-квота: configured=300, used=375, без змін. Тому звичайний smoke пройшов
  keyword/template fallback, не live AI. Квота оновлюється за UTC-добою; readiness
  не свідчить про наявність AI-квоти. Live-поведінка нового коду перевірена раніше
  окремим shadow runner, як задокументовано нижче.
- Runner cleanup PASS: лише його синтетичні needs; AI usage/квоти збережені.
  Тимчасові smoke-файли SSH host/pod прибрано після збереження доказів.

## Цикл уточнень — 23:56 Europe/Warsaw

- **Production baseline:** публічний HTTPS `pomocnypunkt.pl`, 18 синтетичних кейсів,
  34 matches POST із послідовними відповідями. 25 відповідей із питаннями, з них
  15 після вже наданої відповіді; самотність і «не знаю» доходять до шести відповідей
  без завершення опитування. Усі 4 короткі зрозумілі описи заблоковані правилом <30.
  2 emergency сценарії повернули контакти без AI. Наприкінці лічильник досяг 300;
  останні 3 пошуки вже використали fallback. Це не 34 успішні live AI-відповіді.
- **Перший shadow:** 18 кейсів / 20 запусків поточного сервісу, реальні PostgreSQL
  та OpenAI, без deployment. Питання лише у 2 початкових неясних описах, після
  відповіді — 0 питань. У 2 ясних senior кейсах INVALID_RESOURCES відкинув усю
  відповідь; окремо виправлено відбір необов'язкових матеріалів.
- **Фінальний shadow:** 10 кейсів / 12 запусків: skip-vague, skip-urgent,
  short-lonely, short-mobility, senior-detail, no-money, loneliness-dialogue,
  paper-dialogue (2 кроки), vague-dialogue (2 кроки), six-answers-already.
  Усі завершуються без повторного уточнення; 2 питання лише на першому кроці.
  senior-detail/no-money/six-answers повернули partial, у no-money відкинуто
  непідтверджений матеріал зі збереженням перевіреної рекомендації. Skip не
  вимикає emergency. 75 додаткових AI-викликів із дозволених власником 80,
  загальний лічильник 300 → 375; production limit залишився 300.
- Разом **20 різних сценаріїв, 66 пошукових запусків**, з них лише 34 — production
  HTTP, решта 32 — shadow. `expectationMet` перевіряє маршрут/відсутність циклу,
  **не Hit@3 або корисність рекомендацій**. Є no_match для широкої самотності й
  слуху; короткий поштомат отримав Zakupy bez barier з явним застереженням, що це
  асиста в магазині, не біля поштомата. Релевантність цього суміжного результату
  слабка; не зараховуємо його як пряме попадання Merkury. Експертного приймання немає.
- Докази: `tests/search-quality/clarification-cases.json`,
  `clarification-baseline-2026-10-03.json`, `clarification-shadow-first-2026-10-03.json`;
  runner `scripts/evaluate-clarifications.ts`. Фінальний повтор підтверджений
  stdout із 12 summary та cleanup PASS. Його повний JSON втрачено: pod був замінений
  зовнішньою операцією до копіювання /tmp. Не видаємо його за збережений повний запис.
- Кожен runner видалив лише needs зі своїми UUID request keys. AI usage і квоти
  залишені; каталог не змінювався. Наші файли /tmp на SSH host прибрано; pod tmp
  зник разом зі старим pod. `/api/ready` наприкінці → 200 / ok. Нашого deploy/push немає.
- **Локальні перевірки:** npm lint/typecheck/build PASS, 58 unit PASS, 8 integration
  PASS на новому одноразовому postgres:17.11-alpine; контейнер прибрано. Unit перевіряє
  1–6 відповідей навіть при наполяганні AI, skip, короткі змістовні описи, кеш,
  emergency/support, timeout/AI_LIMIT, fabricated optional resource і fake sourceId.
- **E2E:** 21/21 PASS у встановленому Google Chrome, fixtures/mock. Команда
  `npm run test:e2e -- --config tmp/playwright.local.config.ts`; тимчасова конфігурація
  імпортує штатну, змінюючи channel=chrome і абсолютні testDir/cwd. Перевірено skip,
  збереження відповідей, reload, ownership, контакт emergency після вичерпання
  пошукової квоти, keyboard/mobile/200%/контраст, основні M3/M5/M7 сценарії.
- Початкові проблеми середовища: typecheck посилався на застарілий generated
  `/wiedza` route, штатний build відновив types; integration timestamp із DB був
  поза Node report.through — fixture прив'язано до початку тестового періоду.
  Звичайний E2E не стартував без Chromium revision 1243; install із CDN завершився
  timeout, тому suite пройдено в Chrome. Перша тимчасова конфігурація мала
  неправильний cwd; виправлено до повтору. Це не приховані успішні запуски.

## Перемикання на pomocnypunkt.pl — 23:20 Europe/Warsaw

- dev-k3s: Ingress і APP_URL оновлено, rollout PASS, Ready 1/1; підтверджено
  незмінність релізу `4e969253ddbebe61e1172f3d7bac7dda34382d79-37153929340-1`.
- curl через публічний HTTPS/Cloudflare: `/` HTTP 200, `/api/ready` HTTP 200 / ok.
  Локальний Ingress із Host нового домену також повертає readiness ok.
- POST `/api/needs`, порожній `{}`: новий Origin → 400 VALIDATION,
  старий → 403 ORIGIN; без створення даних і без AI-запитів.
- Початкова HTTPS-перевірка через Python urllib отримала 403; наступні curl
  GET/POST пройшли очікувано. Причину відмінності клієнтів не встановлено.
- Код програми й міграції не змінювались; npm suites/build не запускались.

## Виправлення M1 — 21:43 Europe/Warsaw

- Мінімум 3 після trim: unit перевіряє 2 reject/3 accept, короткий emergency accept.
  Unit 40/40: 8 попередніх термінових, контраст історія/навчання/заперечення,
  звичайні ліки, телефон без відповіді; persisted contacts без AI конфігурації,
  сигнал небезпеки у clarification; fail-closed при відмові reranker.
- Lint/typecheck/build PASS. PostgreSQL integration 8/8 на одноразовій
  postgres:17.11-alpine, TCP readiness перед тестами, контейнер прибрано.
- Chromium E2E 16/16 PASS: початковий текст + уточнення збережені після
  навігації/reload; чужий GET 404; контакти до submit; server guidance не показує
  інновацій/координатора; /pilna-pomoc працює з javaScriptEnabled:false.
  Додатково той самий emergency тест після вичерпання 20 пошуків PASS.
  Desktop screenshot термінової картки переглянуто, читабельна; існуючі
  axe/mobile/keyboard/200% перевірки пройшли в повному suite.
- Перший E2E нового уточнення знайшов відсутнє поле clarifications у GET DTO:
  дані зберігалися, але API їх не повертав. DTO доповнено, повний повтор PASS.
- Shadow runner виконує поточний matchNeed bundle на синтетичних records у
  production PostgreSQL зі штатним live provider/usage/quota. Це **не** HTTP
  тест нового deployment. UI/API нового коду перевірені локально; production
  застосунок не замінений. CommonJS bundle потрібний для Next runtime;
  дві ESM спроби впали при імпорті до створення needs/AI-викликів.
- Перший повний shadow run: 43 кейси; 17/20 positive Hit@3, 1 уточнення про
  поштомат, 2 fallback (deaf-library, one-hand-bra). Точна причина початкових
  AI-відмов не зафіксована. Додано лог тільки allowlisted категорії помилки,
  компактніша схема відповіді. Повтор 2/2 PASS, далі по 3 повтори — 6/6 PASS.
- 9/9 emergency (8 довгих + короткий) → контакти 112/999, без AI/матеріалів;
  6/6 ambiguous → уточнення/support без рекомендацій; 4/4 negative → no_match
  без матеріалів; 2 короткі неясні фрази → уточнення. Питання переглянуто:
  домислу про суд немає. Поштомат після підтвердження → Merkury.
- 7 додаткових сценаріїв: уточнений поштомат, навчання першої допомоги,
  телефон, поточна небезпека після історичного контексту, небезпека у відповіді,
  повернення до пошуку після support — очікувана поведінка. Звичайні ліки
  спершу хибно класифіковані AI як emergency; інструкцію уточнено, 3/3
  повтори дали Cold Box без emergency. Це вузький регресійний тест, не гарантія
  точності розпізнавання всіх небезпечних або безпечних ситуацій.
- Докази: revision-first-2026-10-03.json, revision-followups-2026-10-03.json
  у tests/search-quality. Усі дані синтетичні. П'ять /tmp доказів і всі needs
  поточних запусків прибрані; AI usage/global quota збережені, readiness 200.
  Push/deploy, нові міграції й зміни спільного каталогу не виконувалися.

## Нечіткі та незвичні звернення — 21:06 Europe/Warsaw

- Новий синтетичний набір: 20 matching POST + 3 короткі потреби. Той самий
  hash production каталогу з 114 інновацій, gpt-6-luna. Позитивні 4/6 Hit@3,
  технічні поза каталогом 2/2 no_match, контакти при небезпеці 0/4.
- Неясні 6/6 no_match, але лише 4/6 з питаннями: 3 однакові шаблонні,
  1 із необґрунтованим припущенням про суд. Змішані 2/2 partial з уточненнями,
  без автоматичного зарахування їх рекомендацій як релевантних.
- «Pomocy», «Nie daję rady», «Mąż nie oddycha» — HTTP 400 VALIDATION.
  Це підтвердження бар'єра поточного контракту, не успіх UX/безпеки.
- Діагностика одним embedding batch: Merkury rank 1 / score 0,4114 для
  «bank o mat», rank 6 / score 0,3702 для «металевої шафи», обидва нижче 0,45.
- Повні відповіді й очікування: tests/search-quality/unusual-*.json;
  змістовний огляд і методика: SEARCH-UNUSUAL.md. Розмітка до запуску,
  огляд агентом; реальні описи користувачів не використовувались.
- Cleanup PASS: власні needs/counters, два /tmp JSON прибрані; фактичні
  AI usage/global quota залишені. Readiness 200. Lint/typecheck PASS.
  Application code не змінювався, build/unit/integration/E2E з попередньої
  ітерації повторно не запускалися. Push/deploy не виконувались.

## Пошукова якість — 20:47–20:57 Europe/Warsaw

- 20 синтетичних кейсів через публічний production API a2f5c64; 114 інновацій,
  справжній OpenAI gpt-6-luna. Hit@3 13/14, negative no_match 2/2,
  emergency contact mention 0/4. Медіана повного matches POST 4,012 с.
- Очікувані ID розмічені агентом до запуску. Це не незалежний benchmark,
  метрика попадання не підтверджує релевантність усіх додаткових рекомендацій.
- Діагностика embedding/keyword: Senior CUDER rank 38/1, не потрапляє у top-8.
  Окремий shadow-варіант 6 semantic + 2 нових lexical і строгіший prompt:
  14/14 позитивних, 2/2 негативних. Термінові кейси не включались у варіант;
  він не має emergency routing. Holdout і повтори не виконувались.
- Повні синтетичні докази в tests/search-quality/*.json; методика,
  кейси, проблеми й перевірені офіційні контакти — SEARCH-QUALITY.md.
- Production cleanup PASS: лише створені цим benchmark needs/counters;
  жодних публікацій, staff accounts чи редагування чужих записів. AI usage
  і глобальні квоти збережені. Три /tmp JSON докази прибрано після копіювання;
  readiness HTTP 200. Application code не змінювався, deployment не виконувався.
- Lint, typecheck, build — PASS; unit 22/22, integration 8/8 (локальний
  одноразовий postgres:17.11-alpine), E2E Chromium fixtures/mock 14/14 — PASS.
- Перший integration запуск почався до готовності PostgreSQL: 2 failed,
  6 skipped через `database system is starting up`. Після очікування TCP
  pg_isready повтор повністю PASS, обидва одноразові контейнери прибрано.
- Перший standalone diagnostic bundle не містив server-only: import failed
  до AI-виклику. Повний bundle з react-server condition запущено успішно.
  Typecheck знайшов union JSON масивів у скрипті експерименту; виправлено
  типізацію через Set<string>, повтор typecheck/build PASS.

## Production a2f5c64: rollout і живі сценарії — 2026-10-03

- Власник явно дозволив push/deploy та production QA. Локальний коміт виправлення
  41c560e об'єднано з origin/master ef6954e (лише оновлення SVG-логотипа).
  Збірка після merge — PASS, push master a2f5c64 — SUCCESS.
- Backup `backup-qa-release-20261003` — Complete перед deployment.
  Actions https://github.com/ElJohne/innomatch/actions/runs/37144087261:
  build, corpus validation/operator package, migrate/deploy — SUCCESS.
  Зовнішній `https://innomatch.brandly-io.com/api/ready` — HTTP 200 / ok.
- Одноразовий QA-скрипт запущено всередині app pod; він звертався до публічного
  HTTPS API з окремими cookies автора/іншого автора/тимчасового ADMIN/recovery.
  У логах тільки статуси, режими та source IDs; credentials і тексти потреб
  не друкувалися. Staff account створено з випадковим salted scrypt password.
- M1: перша спроба для загальної потреби про соціальні зустрічі seniorów
  не пройшла критерій позитивного live попадання (детальний режим не виводився).
  У діагностичному повторі зафіксовано no_match при semantic/openai/source_backed,
  warnings=0. Це сигнал щодо якості пошуку; не зарахований як позитивне попадання.
- Джерельно обґрунтований синтетичний сценарій «немобільні seniorzy, терапія
  при ліжку в DPS» повернув Therapy Set (`rops-therapy-set-76f33283`), matched,
  semantic/openai/source_backed, warnings=0. Перша перевірка кешу в QA-скрипті
  помилково порівнювала JSON рядки: JSONB змінює порядок ключів. Після переходу
  до структурного порівняння повторний запит — PASS; код застосунку не змінювався.
- M7: live OpenAI → збережений план → повторний POST з тим самим ключем →
  той самий ID; PATCH revision 1 → 2; чужий owner → 404. Джерело плану —
  `rops-therapy-set-76f33283-source`. Перегляд синтетичного результату підтвердив
  відділення фактів від пропозицій, невідомі бюджет/строки як питання, ролі,
  ризики й пропоновані метрики без вигаданих результатів. Це огляд одного
  зразка агентом, не незалежне приймання експертом.
- M5: sharing цього плану → GET координатором → відповідь → unread=1 → read
  receipt; чужий owner → 404. Перевірено реальні HTTP-записи/читання PostgreSQL.
- M3: приватна картка → live AI assist → ідентичний кеш → stage CONCEPT
  збережено → явне submit → координатор читає картку через створену розмову.
- M4: повторний test-interest повертає той самий ID; feedback зберігається
  IN_REVIEW. Синтетичний відгук не публікувався в реальному каталозі.
- Recovery: нова сесія відновлює власний план; ADMIN analytics має source=postgres,
  авторський запит до аналітики — 403.
- У finally кожної спроби транзакційно видалені лише записи її owner IDs:
  повідомлення/розмови, участь/відгук, AI-поради/ідеї, плани, recovery, потреби,
  персональні тестові counters та тимчасовий staff account. Cleanup — PASS
  у всіх 4 спробах. Production corpus і чужі записи не редагувалися.
  Глобальні AI-квоти й usage залишені як облік фактичних викликів.

Межі: production перевірено через API, локальний браузерний PostgreSQL flow
описано нижче. 12 незалежно розмічених retrieval cases, експертна оцінка
планів, backup restore/off-host, навантаження й повний WCAG-аудит ще не виконані.

## Стабілізація з реальною PostgreSQL — 20:19 Europe/Warsaw

Середовище: Windows, Node 22.16.0, npm 10.9.2, Chromium; одноразовий контейнер
`postgres:17.11-alpine`, лише localhost:15432, окрема БД `innomatch_qa`.
Жодних production-записів, live AI-викликів, push або deployment у цій ітерації.

- Системний npm shim несправний (MODULE_NOT_FOUND). Ті самі npm scripts виконано
  через `node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js'`.
- Початковий unit: 20 PASS / 2 FAIL через непідмінену БД у новій перевірці
  publication. Ізольовано лише lookup локально змінених записів, реальний hash
  і перевірку дозволених джерел збережено. Фінально: **22/22 PASS**.
- Початковий integration підтвердив застарілий setup 0001–0003. Після застосування
  всіх міграцій нові сценарії відтворили помилку JSON/Date через мутацію клієнта
  Drizzle. Виправлено окремими пулами ORM/raw SQL і закриттям обох у CLI.
- Фінально `npm run test:integration`: **8/8 PASS**, без skipped. Нові 6 сценаріїв:
  concurrent idea creation/submit, assist cache, stale revisions, приватність;
  M1 → план → редагування → sharing → staff reply/read;
  4 одночасні pilot requests → один запис/повідомлення, moderation/edit race;
  recovery rotation/hash/expiry; ADMIN-only SQL aggregates, date boundary,
  унікальні групи й відсутність приватного тексту; catalog hide/stale writes →
  вилучення старого embedding, результату й плану. Pool у новому наборі допускає
  реальні одночасні SQL-транзакції, кожен набір прибирає свою випадкову schema.
- Штатні `db:migrate` двічі, `db:seed:demo -- --demo`, `auth:staff` — PASS
  лише на локальній QA-БД; пароль випадковий, у журнали не потрапляв.
- `npm run test:e2e`: **14/14 PASS**, 18.9 s, fixtures/mock. Виправлено старий
  origin localhost:3000 у тестах діалогів та очікування збереження відповіді:
  текст у textarea не є підтвердженням появи повідомлення в історії.
  Додано UI create/assist/apply/save/reload/submit ідеї та create/reload/recovery
  адаптації. Anonymous 401 відрізняється від 404 для чужої справи у власній сесії.
- Ті самі communication/workflows specs із тимчасовою локальною конфігурацією
  PostgreSQL/mock: **4/4 PASS**, 8.5 s. Відповідь координатора, unread/read,
  нові ідеї/плани й recovery перевірено через HTTP та браузер з реальною БД.
- Axe WCAG 2 A/AA + 2.1 AA на перевірених екранах — без порушень; адаптація
  перевірена на 320px. Це не повна сертифікація доступності.
- Фінальні lint, typecheck, production build (52 маршрути), operator bundle
  і `git diff --check` — PASS. Перший operator bundle блокував sandbox-доступ
  esbuild до батьківського каталогу; запуск із дозволеним доступом пройшов.

Межі: AI у всіх цих тестах mock. Live M3/M7, незалежна retrieval evaluation,
довготривале навантаження, off-host backup/restore та повний accessibility audit
не виконані. Виправлення з'єднань ще не розгорнуте. У попередній read-only
перевірці GitHub workflow 37139928817 і HTTPS readiness production — PASS;
це не перевірка нової локальної зміни або всіх production-сценаріїв.

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

Inclusive hero: перевірено у вбудованому браузері 1008×600 — люди не перекриті
формою, поле і кнопки видимі на першому екрані. Нові тести для заміни фото не додавалися.

## Mam pomysł: перевірка дизайну

Build, typecheck, lint PASS; 22 unit PASS. 10 flow E2E PASS; 2 communication E2E
PASS після виправлення старого origin localhost:3000 у тестах. Azure unit mock
доповнено locallyManagedRecords, щоб ізолювати його від PostgreSQL після upstream змін.
Integration: 2 skipped без TEST_DATABASE_URL. Desktop і viewport 390px перевірено
у вбудованому браузері; горизонтального переповнення не виявлено.

Каталог: typecheck і git diff --check PASS; візуально перевірено у вбудованому браузері. Додаткові тести для оформлення не додавалися.

Wiedza design: typecheck i git diff --check PASS. Wbudowany przegląd lokalnego fixtures potwierdza nagłówek, filtry i stan pusty (0 materiałów); nie dodawano sztucznych materiałów do prezentacji kart.

Контраст: build/typecheck PASS. Нові 4 E2E перевіряють головну, каталог, Wiedza, Mam pomysł у стандартній і трьох контрастних палітрах (16 axe аудитів без порушень), placeholder, focus та 200% текст на 390px без overflow. Це автоматичні перевірки, не повний WCAG аудит.

Hover: build PASS; 4 contrast page scenarios PASS. Новий hover E2E перевірив зміну фону кнопок, рамки, підкреслення посилань, поля та axe в усіх 4 палітрах — PASS після виправлення specificity старого підкреслення карток.

Видалення Wiedza: перевірено відсутність /wiedza та KnowledgeCard у src і E2E; навігацію переглянуто у браузері; git diff --check PASS.

Після merge origin/master 2356087: build/typecheck/lint PASS, unit 40 PASS, E2E 20 PASS включно з contrast/hover, уточненням, urgent help, ideas та adaptations/recovery. Integration: 8 skipped (немає TEST_DATABASE_URL).

## Bright homepage — 2026-10-03
Build, lint, typecheck PASS; 40 unit and 20 E2E PASS. Axe across all four contrast palettes, hover, mobile reflow at 200%, and description field above the fold at 1280/1008/390/320px checked by existing E2E. Eight PostgreSQL integration tests skipped without TEST_DATABASE_URL. Local built-in browser visually reviewed; no live AI, deployment or push.

Header refresh — 2026-10-03: blue/mint masthead, framed logo, grouped accessibility controls, colourful navigation and step indicators. Built-in browser reviewed. Build, lint, typecheck, 40 unit and 20 E2E PASS; 8 integration skipped without TEST_DATABASE_URL. Four contrast modes, mobile/200% reflow and above-fold request field PASS. Local only.

Steps 2–4 visual refresh — 2026-10-03: bright confirmation header, mint description, mint/yellow/blue organization cards, numbered plan cards and highlighted conversation draft. Existing behavior retained. Build, lint, typecheck, 40 unit and 20 E2E PASS; 8 integration skipped without TEST_DATABASE_URL. Desktop screenshots reviewed for all three steps; mobile flow and accessibility checks PASS. Local only.

Bright catalog — 2026-10-03: blue/mint heading, yellow eyebrow, clearer filters and blue/mint/yellow cards with hover/focus. Search unchanged. Build, lint, typecheck, 40 unit and 20 E2E PASS; 8 integration skipped without TEST_DATABASE_URL. Four contrast modes, hover, mobile/200% reflow checked. Built-in browser reviewed. Local only.

Header navigation — 2026-10-03: added Strona główna; Mam pomysł now shares standard catalog-link styling. Built-in browser home-link verified. Build, lint, typecheck, 40 unit and 20 E2E PASS; 8 integration skipped without TEST_DATABASE_URL. Local only.

Yellow accent cleanup — 2026-10-03: unified home heading colour, removed underline and yellow backgrounds behind Małopolska / Biblioteka inspiracji; removed confirmation decorative symbol. Build, lint, typecheck, 40 unit and 20 E2E PASS; 8 integration skipped without TEST_DATABASE_URL. Local browser reviewed. Local only.

Active header navigation — 2026-10-03: pathname-aware client navigation with persistent underline and aria-current (page/location), including nested catalog/idea pages. Build, lint, typecheck, 40 unit and 21 E2E PASS; 8 integration skipped without TEST_DATABASE_URL. Added navigation regression covering client transitions, filtered catalog, details and four contrast palettes. Local only.

Mam pomysł guidance — 2026-10-04: homepage-style blue/mint hero and form, single-colour heading, social-initiative explanation with two examples, help-for-yourself link to home, field-specific accessible hints, audience/stage explanation and explicit private-until-consultation guidance. Save/AI/consultation behavior unchanged. Build, lint, typecheck, 40 unit and 21 E2E PASS; 8 integration skipped without TEST_DATABASE_URL. Built-in browser reviewed; contrast and mobile 200% checks PASS. Local only.

Mam pomysł cleanup — 2026-10-04: removed initial draft notice, reassurance tip and resources/grants panel from new-idea page at owner request. Saved-idea status messaging remains. Build, lint, typecheck, 40 unit and 21 E2E PASS; 8 integration skipped without TEST_DATABASE_URL. Absence of requested blocks verified in built-in browser. Local only.

Release verification — 2026-10-04: merged origin/master 9a0f8ba with Mam pomysł design and content cleanup. Build, lint, typecheck, 58 unit and 22 E2E PASS. Eight integration tests skipped without TEST_DATABASE_URL. No live AI or database changes.
