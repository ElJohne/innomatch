# QA аудиту 04.10.2026

Checkout `5728d1bdc2a166bc8aeaaabb6bcf9247dedc31e8`, Windows, Node 22.16.0, Next 16.3.8; час Europe/Warsaw. Application code і lockfile не змінені. Це нові результати аудиту, окремо від історичних QA.

## Загальні команди

| Перевірка | Фактичний результат |
|---|---|
| `npm ci --no-audit --no-fund` | PASS: 432 packages, lockfile без змін. Початковий npm shim був зламаний; штатний npm CLI викликано через node. Default cache дав EPERM, локальний cache усередині workspace усунув проблему. |
| `npm run lint` | PASS, exit 0. |
| `npm run typecheck` | PASS, exit 0, після build. |
| `npm test` | PASS: 9 файлів, 68 тестів; 3.99 s. |
| `npm run build` | PASS: Turbopack, TypeScript, static generation; build без ключів/БД. |
| `npm run test:integration` без DB | 3 файли / 8 skipped. Це не PASS інтеграцій. |
| `npm run test:integration` із тимчасовою PostgreSQL | 2 файли PASS, 1 FAIL; **7 тестів PASS, 1 FAIL**, 2.04 s. |
| `npm run test:e2e` default | Усі 26 спроб зупинилися на відсутньому executable Playwright Chromium headless shell. Це проблема середовища, не 26 product defects. Після завершення спроб зависле завершення runner перервано. |
| Повтор E2E на встановленому Chrome | **11 PASS / 15 FAIL із 26**. Тимчасова конфігурація змінює тільки browser channel, робочу директорію та вихід звіту. Класифікація нижче. |
| `npm run data:validate` | PASS: 114 innovations, 69 knowledge, status valid. |
| `git diff --check` | PASS на момент перевірки; фінальне повторення після документації — у загальному STATUS. |

Npm-команди запускалися як `node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" ...`. Залежності не оновлювалися. Deprecated/Vite-config попередження не перетворювалися на тестові помилки і не приховані зміною конфігурації продукту.

## E2E: деталі фактичних результатів

PASS: idempotent innovation contact і відхилення forged role/login; 4 contrast/hover tests на трьох публічних сторінках; головна форма/axe; API idempotency/owner/Origin; Polish reading control; unsupported dictation; navigation; emergency contacts і manual help без JS. Разом 11.

FAIL:

| Сценарій | Причина з error-context |
|---|---|
| Communication need→reply | Старе посилання `Zapytaj koordynatora` відсутнє у короткому UI. |
| Confirmation retry; four steps; no match; mobile complete flow | Старе `Znajdź wsparcie`/попередній confirmation шлях. |
| Above-fold field | **Реальна геометрія:** при 320×800 нижня межа поля 815.953125 > 800. |
| Voice input flow | Кінець тесту натискає старе `Znajdź wsparcie`; це не доказ несправності реального мікрофона. |
| Unavailable retry | Test спочатку очікує старий heading. Водночас snapshot **підтверджує справжній дефект:** одночасно `Spróbuj ponownie`, retry та `W katalogu nie znaleźliśmy odpowiedniej propozycji`. |
| Evidence accessibility та evidence→plan→reply | Старе посилання `Zaplanuj pierwszy krok` відсутнє. Подальший acceptance не виконався. |
| Five-screen responsive | Timeout 120 s на старому `Znajdź wsparcie`; не доводить провалу всіх перевірок reflow. |
| Clarification/urgent input та skip clarification | Старе `Znajdź wsparcie`. |
| Idea editor flow | Старе початкове поле `Tytuł pomysłu` вилучене. |
| Adaptation/recovery flow | Старе поле `Typ instytucji i jej rola`; timeout перед заповненням поточної короткої форми. |

Разом 15 падінь. **Не називати їх 15 окремими дефектами функцій.** Це 13 сценаріїв із застарілою навігацією/селекторами, один сценарій зі старим heading та додатково підтвердженою UI-регресією, один геометричний failure. Водночас такий suite не захищає актуальний реліз і не може бути оголошений зеленим.

Після повідомлень про завершення всіх 26 тестів runner не закінчив teardown і не записав JSON reporter. Його перервано Ctrl+C; процес завершився exit 1. **11/15 — підрахунок фактично завершених test results у stdout, не нормальне завершення всієї команди.** Це додаткове обмеження відтворюваності, не прихований PASS.

Локальні докази: `tmp/audit-e2e-results/*/error-context.md` та trace.zip. У них лише локальні synthetic fixtures; тимчасові credentials не публікуються. Product config `playwright.config.ts` не змінений. Тимчасову config.ts видалено, прочитаний чужий source.ts перейменовано в текст; фінальний `npm run typecheck` після cleanup — PASS.

## PostgreSQL: що пройшло і що ні

Створено **окремий одноразовий** container `innomatch-audit-20261004-pg`, образ `postgres:17.11-alpine`, тільки localhost port 55437, БД `mi_audit`. Тести створювали власні випадкові schema і виконували міграції лише там. Shared/production DSN не використовувався. Після перевірки container зупинений; `--rm` прибрав його. Наявні контейнери не змінені.

Успішні сценарії включають SQL-постійність, приватні діалоги/конкурентні повтори, matchmaking+адаптацію+редакції+заморожений snapshot+відповідь, участь/відгуки/модерацію, recovery rotation/hash/expiry, aggregation/date boundaries, archive/stale update/видалення embeddings. Це mock AI на справжній SQL, не перевірка змісту live-моделі.

Падіння: `tests/integration/workflows.test.ts:143`, сценарій `keeps ideas private, caches assist, rejects stale edits and submits once under concurrency`. Test очікує `assisted.card.canvas` повністю рівним вихідному canvas із порожніми значеннями. Поточний mock заповнює порожні поля текстом `Do ustalenia podczas rozmowy z odbiorcami.`, зберігаючи вже заповнені problemContext/partners. Потрібно узгодити тест із контрактом доповнення порожніх полів. **Не зараховуємо подальші assertions цього тесту як пройдені:** до edit/submit/concurrency після assert виконання не дійшло.

## Production: без записів

- Root: GET `/`, `/api/health`, `/api/ready` → 200, безпечний status ok. Readiness не доводить live-AI доступність або залишок provider quota.
- M2 агент: 10 GET — `/api/innovations` total 114; `/api/knowledge` total 69 (53 REPORT, 9 CHALLENGE, 7 EDUCATION); `/wiedza` 404; anonymous admin analytics 403.
- Multiword regression: `/innowacje?q=seniorzy%20bankomat` → сторінка з Merkury; `/api/innovations?q=seniorzy%20bankomat` → total 0; API `q=Merkury` → 1. Root також підтвердив одну картку на сторінці у браузері.
- M4 агент: catalog/detail 200, GET feedback 200 із порожнім списком, `/admin/opinie` → 307 login.
- Root browser: home, filtered catalog, Merkury detail та розкриття `Testowanie i Twoja opinia`. Видимі пояснення приватності заявки, окремого погодження участі, модерації та згоди на публікацію. Нічого не надсилалося.
- PowerShell HTTPS/TLS не працював у першій спробі M2, але Node fetch працював. Це не записано як недоступність production.

Нових production needs/ideas/plans/threads/feedback, акаунтів або повідомлень не створено. Каталог/конфігурація production не змінені. Нові live AI-запити не виконувалися; попередні smoke у STATUS — історичні докази.

## Актуальна ручна перевірка M3

Ізольований E2E server `127.0.0.1:3100`, DATA_PROVIDER=fixtures, AI_PROVIDER=mock, окрема browser session.

1. `/pomysly/nowy`, синтетичний опис із початком `Np.` → `Sprawdź wymagane pola i dopuszczalną długość tekstu.`; форма лишається, картка не створена. Це відтворений дефект title extraction, не нестача 30 символів.
2. Той самий зміст без `Np.` → приватна картка revision 2, явна `Dane demonstracyjne`, перший крок і editor/Canvas.
3. Перехід у grant → 6/10 prefilled sections, набір позначено закритим, demo явно позначено.
4. `Zapisz szkic grantowy` → `Zapisano szkic grantowy.`; reload → кнопка disabled, prefilled стан збережений, доступний preview. Перезапуск сервера не тестували: fixtures за контрактом непостійні.

Немає підстав зарахувати цей короткий smoke як повне приймання AI, усіх бюджетних правил, офіційного PDF або консультації. Контраст/широкі flows — окремий E2E набір.

## Документи й конкурентні матеріали

- Повний SPEC, STATUS, оригінальний CRITERIA, релевантні §4–5 RULES.
- Вкладений 16-сторінковий PDF витягнутий повністю; перші 5 сторінок оглянуті окремими зображеннями, усі 16 — також contact sheet. Source не змінювався; Poppler попереджав про substitute fonts, але сторінки читабельні.
- П'ять свіжих GitHub README, три файли реалізації/шаблону, metadata PDF/MP4. Три code source повторно звірені з pinned SHA — ідентичні прочитаним. Не запускали чужий код і не перевіряли чужі приватні дані.

## Межі

Не виконані незалежна експертна оцінка live AI на поточній версії, навантаження, повний WCAG manual audit, пентест, browser admin-moderation acceptance, backup restore, офіційний grant submit/export і перевірка наявності конкурсних матеріалів поза workspace. Автоматичний axe не є сертифікацією WCAG. Звіт оцінює готовність із цими межами.
