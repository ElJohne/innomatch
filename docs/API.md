# API — поточна реалізація

Zod DTO: `src/lib/contracts/index.ts`. Всі JSON-відповіді — Cache-Control: private, no-store.
Помилки: `{code,message,requestId}` без приватних даних або помилок SDK.

| Метод | Маршрут | Результат / доступ |
|---|---|---|
| POST | /api/needs | NeedInput → `{id,createdAt}`; створює HttpOnly гостьову сесію |
| GET | /api/needs | Лише власні `{id,description,createdAt}` |
| GET | /api/needs/:id | Власна потреба й збережений MatchResponse; іншим 404 |
| POST | /api/needs/:id/matches | MatchResponse; власник, повторне читання без AI |
| GET | /api/innovations | `{items,total,page}`, по 12; q/group/category/stage/page |
| GET | /api/innovations/:id | Опублікований Innovation; прихований/невідомий → 404 |
| POST | /api/innovations/:id/test-interest | Одна Participation на owner/innovation; атомарно додає повідомлення до розмови; staff заборонено |
| POST | /api/innovations/:id/feedback | rating/comment/improvements/experience/consentToPublish/expectedRevision → власний Feedback; зміна → IN_REVIEW |
| GET | /api/innovations/:id/feedback | До 50 опублікованих відгуків із поточною sourceVersion; без owner_id, revision і sourceVersion у відповіді |
| PATCH | /api/admin/feedback/:id | ADMIN; status=PUBLISHED/ARCHIVED, expectedRevision, reviewed; публікація потребує перевірки та актуального джерела |
| GET | /api/knowledge | Опубліковані матеріали, фільтри q/type |
| POST | /api/ideas | `{card,requestKey}` → приватний DRAFT; створює owner session, 20 спроб/день |
| GET | /api/ideas | Власні `{items}`, до 100 у PostgreSQL |
| GET | /api/ideas/:id | Власна картка; чужа → 404 |
| PATCH | /api/ideas/:id | `{card,expectedRevision}`; optimistic update, conflict → 409 |
| POST | /api/ideas/assist | `{id,expectedRevision}` → `{card,questions,mode}` без зміни картки; 10 спроб/день |
| POST | /api/ideas/:id/submit | `{expectedRevision}` → SUBMITTED і одна розмова; лише автор без staff ролі |
| POST | /api/adaptations | `{needId,innovationId,constraints,requestKey}`; власна потреба, опублікована інновація → приватний план |
| GET | /api/adaptations | `{items}`; лише власні доступні плани, до 100 у PostgreSQL |
| GET | /api/adaptations/:id | Власник; змінене/приховане джерело або чужий owner → 404 |
| PATCH | /api/adaptations/:id | `{draft,expectedRevision}`; власник, optimistic conflict → 409; без AI |
| POST | /api/auth/login | `{login,password}`; активний ADMIN/EXPERT, сесія персоналу |
| POST | /api/auth/logout | Видаляє staff identity, зберігає власні гостьові справи |
| GET | /api/threads | `{items}`; власні або спільна скринька персоналу; до 200 у PostgreSQL |
| POST | /api/threads | `{needId або innovationId або adaptationId,body,requestKey}` → `{id}`; один дозволений контекст |
| GET | /api/threads/:id | Повідомлення й дозволений контекст; автор / активний персонал |
| POST | /api/threads/:id/messages | `{body,requestKey}`; лише автор розмови / персонал |
| POST | /api/threads/:id/read | `{through}` — sequence побаченого повідомлення; лише автор / персонал |
| GET | /api/admin/threads | Спільна скринька ADMIN/EXPERT; стороннім 403 |
| GET | /api/admin/analytics?days=7\|30\|90 | Лише ADMIN; період (default 30), total, withMunicipality, daily, audiences, searchStatuses, source, generatedAt; агрегати без приватного тексту |
| GET | /api/admin/catalog/:kind | ADMIN; kind=innovation/knowledge; усі статуси, версія, стан індексації |
| PUT | /api/admin/catalog/:kind/:id | ADMIN; `{kind,record,expectedVersion,reviewed}`; конфлікт версії → 409 |
| POST | /api/admin/catalog/:kind/:id/index | ADMIN; явна live AI індексація; 30/годину на staff |
| POST | /api/session/recovery | Гостьовий власник; новий секретний код, 10/добу |
| POST | /api/session/restore | `{token}`; відновлює owner і знімає staff права; 30 спроб/хв глобально |
| GET | /api/health | `{status:"ok"}` — стан процесу, не proof доступності залежностей |
| GET | /api/ready | Стан БД/міграції та наявності AI конфігурації; 503 при недоступності, без live AI-запиту |
| * | решта /api/admin/* | 403; невідомі адміністративні маршрути закриті |

POST/PUT/PATCH вимагають Origin=APP_URL і Content-Type: application/json. Створення потреби також
Idempotency-Key (16–80 ASCII літер/цифр/дефісів); ключ належить гостьовій сесії.
Тіло до 20 KB (редактор каталогу до 160 KB, PATCH плану до 100 KB); description 30–4000 символів; constraints потреби до 1500.
30 спроб створення/день і 20 запусків пошуку/день на сесію. Це ще не повний anti-abuse:
ліміт за IP ще не реалізовано; staff accounts зберігаються у PostgreSQL.

M4 контракти: `src/lib/contracts/pilot.ts`. Оцінка 1–5, текст 20–2000 символів,
пропозиції до 1500, experience=DESCRIPTION/USED (заява автора, не перевірений факт).
consentToPublish=true обов'язкове. Нова думка має expectedRevision=null; зміна —
поточну revision. Незмінений повтор не скидає рішення модерації. Ліміти: 20 нових
заявок і 30 спроб збереження відгуку/добу на owner. Повторна заявка повертає наявну.
UI власних записів читає серверні getParticipation/getOwnFeedback/listPilotCases;
модерація — moderationFeedback після ADMIN guard. Список адміністратора — до 200
останньо змінених відгуків. SQL-аудит зберігає тільки метадані рішення, не текст.

Аналітика: `src/lib/contracts/analytics.ts`. Дні UTC: від 00:00 першого дня періоду
до generatedAt включно; сьогодні неповний. Підраховуються потреби за created_at,
а status — їхній поточний збережений результат. Це не актуальна оцінка каталогу
і не число AI-запитів чи унікальних людей. Нестандартні аудиторії зведено до Other,
порожні — Unspecified; по одній появі кожної нормалізованої групи на потребу.
Невідомі параметри/недозволений days → 400, сторонній/EXPERT → 403.
PostgreSQL використовує один aggregate statement, без fallback у fixtures.

Приватні результати повторно перевіряють статус публікації та catalogVersions перед видачею.
Старі результати без версій відкидають записи, які адміністратор уже змінив.
`MatchResponse.mode.explanation`: `openai`, `azure`, `template` або `mock`.
OpenAI повертає strict structured output; ID додатково перевіряються за переданими кандидатами.
У PostgreSQL advisory lock серіалізує запуск пошуку однієї потреби між процесами.
Нові PostgreSQL M1-запуски обмежено двома на процес, щоб lock-транзакції залишали
з'єднання для вкладених запитів. Перевищення → 429 BUSY, без списання добової квоти.
Перший результат також повторно перевіряє доступність і версії джерел після генерації.
Контракти комунікації: `src/lib/contracts/communication.ts`. body 1–4000 символів,
requestKey — UUID; невідомі поля/передані клієнтом ролі відхиляються.
Одна розмова на автора/контекст; повторне створення повертає її без нового повідомлення.
Повторна відповідь із тим самим requestKey не дублюється.
Ліміти: 30 створень розмов/добу на сесію, 200 повідомлень/добу на автора;
логін — 30/хв глобально та 10/15 хв на хеш нормалізованого login.
Активність, роль і auth_version персоналу перечитуються з БД на кожному запиті.
Unread обчислюється за persisted messages і user_read/staff_read; staff_read спільний для команди.
GET не змінює unread: браузер POST-ить sequence побаченого повідомлення.
Публікація інновації повторно перевіряється при читанні контексту розмови.
Гостьова сесія — до 90 днів, staff права — до 8 годин. Recovery code має 256 біт
випадковості й строк 90 днів; зберігається SHA-256, новий код відкликає попередній.
Код не передається через URL. Втрата всіх сесій і коду означає втрату доступу;
відкликання коду не закриває вже відкритих сесій.
Adaptation DTO: contracts/adaptation.ts. constraints містить institution/resources/scope/timeline/budget.
10 спроб генерації/день на власника плюс глобальний AI quota. requestKey UUID прив'язаний
до власника й хешу вводу; повтор ready повертає збережений план, інший ввід → 409.
Генерація в процесі → 409; failed можна повторити, завислу reservation — після 5 хвилин.
Attempt ID захищає збереження від старого worker; транзакція не утримується під час AI.
Це не exactly-once billing при аварії після відповіді провайдера до запису в БД.
sourceIds — лише з обраної інновації. sourceVersion перевіряється на create/read/edit;
зміна/приховування джерела виключає старий план із видачі. Живий збій не дає mock fallback.
Персонал бачить план лише через авторизовану розмову з adaptationId; прямий API залишається
тільки для власника. Надсилання явно відкриває також майбутні збережені версії плану.
Idea DTO: contracts/idea.ts; поля title/problem/essence/targetGroups/stage/resources/pilotOutline.
POST/PATCH картки — до 60 KB. Збереження не публікує й не передає картку персоналу.
Статуси DRAFT/SUBMITTED; PUBLIC catalog moderation — окремий workflow, ідеї туди не додаються.
Подання у PostgreSQL в одній транзакції з row lock створює Thread з idea_id, перше повідомлення
й оновлює картку. Повтор повертає існуючу розмову. Пізніші записані правки доступні персоналу.
Прямий GET/PATCH лише для власника, персонал читає ідею через дозволений GET thread.
AI suggestion кешується за idea/revision, має reservation/attempt ID, failed retry і timeout 5 хв.
Вона не змінює збережену картку; стадія примусово зберігає авторське значення.
GrantCall — тільки контракт даних (строки, версія полів, джерело), без налаштованих наборів/API.
Pilots поки залишаються цільовими маршрутами зі SPEC.
