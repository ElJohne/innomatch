# M7 — функціональні виправлення 2026-10-04

Реалізовано локально, без deploy/міграцій/production-запитів.

- **M7-01 виправлено:** редактор зберігає установу, ресурси, охоплення, бюджет і строк разом із текстом і expectedRevision. Застаріла revision → 409; чужий owner → 404. Старі API-клієнти без constraints працюють як раніше. Copy включає умови; preview, перший крок і snapshot беруть збережені значення. Зміна умов не перезаписує авторський текст автоматично; пояснення просить звірити текст із новими умовами.
- **M7-03 основний dead end усунуто:** застарілий/прихований план лишається у списку власника. Його сторінка та preview показують безпечний recovery-стан, revision й власні умови. При зміненому опублікованому джерелі можна створити окремий план із перенесеними умовами; при прихованому — обрати інше опубліковане рішення. Передання чужого fromPlan заборонено сервером. Старий record і ручні правки не видаляються.
- **Publication/ownership збережено:** strict getPlan не змінює правил доступу; прямий API, edit і sharing не починають повертати застарілий план. Recovery DTO не містить AI draft, title/source text/URL; джерело, зняте з публікації, не витікає. Після edit координатор бачить попередні умови до явного re-share.

Файли: `src/lib/contracts/adaptation.ts`, `src/server/services/adaptations.ts`, `src/components/adaptation-{editor,form,recovery}.tsx`, сторінки `src/app/adaptacje`, `tests/unit/adaptation-recovery.test.ts`.

Перевірено:

- `node node_modules/vitest/vitest.mjs run tests/unit/adaptation-recovery.test.ts` — **PASS, 1 наскрізний service regression**: constraints edit/read; stale revision/чужий owner; frozen snapshot/re-share; changed/hidden source; recovery без draft; заборона нового share/create на прихованому; збереження старих правок при відновленні джерела.
- `node node_modules/typescript/bin/tsc --noEmit` — **PASS**.
- Targeted ESLint для змінених M7 файлів — **PASS**.
- Початковий npx не стартував через відсутній глобальний npm/npx-cli; запущено локальні встановлені CLI через Node. Початковий typecheck виявив неповний synthetic Need у новому тесті; fixture виправлено, повтор PASS.

Залишається: новий UI не пройшов окремий browser smoke цією підзадачею; повний build/E2E/PG не повторювався за запитом швидкої функціональної роботи. Застарілий широкий E2E M7 (M7-02) й незалежний AI quality benchmark (M7-04) не виправлялись. Автоматичний перенос старого draft не реалізовано: в ньому змішані source/AI/author тексти без детальної provenance, тому показ прихованого змісту через recovery не дозволено. Оригінал збережений у БД; новий план переносить лише умови автора.
