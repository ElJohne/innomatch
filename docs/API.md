# API першої ітерації

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
| GET | /api/health | `{status:"ok"}` — стан процесу, не proof доступності залежностей |
| * | /api/admin/* | 403 до реалізації авторизації персоналу |

POST вимагає Origin=APP_URL і Content-Type: application/json. Створення потреби також
Idempotency-Key (16–80 ASCII літер/цифр/дефісів); ключ належить гостьовій сесії.
Тіло до 20 KB; description 30–4000 символів; constraints до 1500.
30 спроб створення/день і 20 запусків пошуку/день на сесію. Це ще не повний anti-abuse:
ліміт за IP та довготривалі staff accounts заплановані наступною ітерацією.

Приватні результати повторно перевіряють статус публікації перед видачею.
У PostgreSQL advisory lock серіалізує запуск пошуку однієї потреби між процесами.
Plans, messages, knowledge API та staff auth ще не реалізовано; їхні маршрути зі SPEC — цільові.
