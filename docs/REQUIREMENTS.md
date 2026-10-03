# Покриття вимог

| Вимога | Реалізація | Перевірка | Стан |
|---|---|---|---|
| M1 потреба → результати → джерела | app/potrzeby, server/services/matching, contracts | unit + browser flow | PARTIAL: локальний сценарій, live заблокований |
| M1 no-match, власник, повторне відкриття | ranking, auth/session, API | unit / E2E | Реалізовано, див. QA |
| M1 семантика й пояснення Azure | ai/provider, embeddings, data:index | unit сумісності; live очікується | PARTIAL |
| M1 схожі випадки / матеріали | relatedResources контракт | Немає корпусу | NOT IMPLEMENTED |
| M2 каталог, фільтри, деталі | app/innowacje | E2E | PARTIAL: лише synthetic |
| M2 карта, звіти, освіта, адмін-аналітика | /wiedza повідомляє про відсутність | Не реалізовано | NOT IMPLEMENTED |
| M3 картка, AI, Canwy, гранти | Немає активних кнопок | Не реалізовано | NOT IMPLEMENTED |
| M4 тестування/відгуки | Повідомлення на деталях | Не реалізовано | NOT IMPLEMENTED |
| M5 приватний діалог/відповідь/партнерство | Не реалізовано | Немає | NOT IMPLEMENTED |
| M6 модерація/оновлення/аналітика | admin API fail-closed | E2E 403 | NOT IMPLEMENTED |
| M7 адаптація | Не реалізовано | Немає | NOT IMPLEMENTED |
| Польський UI | Усі реалізовані екрани | E2E / огляд | Реалізовано |
| WCAG 2.1 AA | labels, focus, skip, responsive | axe + частковий keyboard | PARTIAL, не сертифікація |
| Постійна БД | Drizzle repository, SQL migration | PostgreSQL integration | BLOCKED: відсутня БД |
| PDF ≤10 слайдів + MP4 ≤3 хв | Не створено на етапі A/B | Немає | NOT IMPLEMENTED |
| Demo URL / команда / кошторис | COSTS з припущеннями, без вигаданих значень | Немає | PARTIAL |
