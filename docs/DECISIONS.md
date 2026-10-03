# Рішення

2026-10-03, OpenAI API:
- Власник замінив вимогу Azure на прямий OpenAI API та додав repository secret OPENAI_API_KEY.
- OpenAI Responses + strict JSON Schema; моделі gpt-6-luna / text-embedding-3-small,
  вибір можна змінити repository Variables. Azure адаптер збережено для сумісності.
- Ключ отримує тільки deploy step; namespaced runner патчить тільки openai-env через stdin.
- Порожній production каталог не надсилає опис потреби до AI без кандидатів.
- Офіційні джерела: https://developers.openai.com/api/docs/models/gpt-6-luna,
  https://developers.openai.com/api/docs/models/text-embedding-3-small,
  https://developers.openai.com/api/docs/guides/structured-outputs.

2026-10-03, production за дорученням власника:
- Ціль: наявний `dev-k3s` / `localserver`, окремий namespace `innomatch`;
  це уточнення попереднього обмеження SPEC щодо Kubernetes.
- Власник дозволив деплой через Actions, нову проєктну БД, пропуск тестів
  та домен `innomatch.brandly-io.com`. Після відхилення push автоматичною перевіркою
  власник окремо підтвердив: «Дозволяю пуш». Push та production workflow виконано.
  Маршрут Cloudflare Tunnel власник додає самостійно.
- GitHub-hosted Linux build → standalone artifact → namespaced runner → міграція → rollout.
  Registry і нові платні сервіси не потрібні. Workflow лише для master, без pull_request.
- PostgreSQL 17.11, окремий несуперкористувацький login, PVC, ClusterIP і NetworkPolicy.
  Backup щодня на окремий локальний PVC; off-host backup і restore drill ще не налаштовано.
- AI залишається явно mock, demo seed автоматично не запускається; нова БД має порожній каталог.

Deployment references:
- https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners
- https://hub.docker.com/_/postgres

2026-10-03:
- Зберегти вкладений Git-репозиторій `innomatch`, наявну LICENSE та PDF без змін.
- Передбачений SPEC стек, npm і один package-lock. Next 16.3.8 / React 19.3.0 перевірено через npm registry; Node 24.19.0 у середовищі.
- Гостьові сесії iron-session, HttpOnly + SameSite=Lax; Secure залежить від HTTPS APP_URL.
- Fixtures — мінімальна пам'ять процесу, не альтернативна production БД. В UI є повідомлення про втрату записів після рестарту.
- PostgreSQL JSONB для початкових векторів: немає залежності від дозволу на pgvector; dimensions/deployment/hash зберігаються.
- Azure OpenAI v1 через OpenAI SDK, Chat Completions JSON mode із Zod і allowlist ID. Підтримку deployment перевірити live.
- Збережений результат не перезапускає AI при refresh. Приховані джерела відфільтровуються повторно.
- 12 вигаданих концепцій; не називати їх ROPS або перевіреними рішеннями. Реальних джерельних записів — 0.
- Поки немає staff auth, admin API відмовляє всім. Не створювати публічний перемикач ролі.
- Навички PDF/OpenAI Docs використані для читання наданих джерел та API. Нових дозволів на публікацію не отримано.

Технічні джерела, відкриті 2026-10-03:
- https://learn.microsoft.com/en-us/azure/foundry/openai/api-version-lifecycle
- https://nextjs.org/docs/app/getting-started/installation
- https://developers.openai.com/api/docs/libraries

Уточнень власника/організаторів понад SPEC немає.

## 2026-10-03 — локальний сценарій за дизайн-референсом власника

Головна містить поле опису без категорій; далі підтвердження, лише вибір організації
та негайний перехід до наступних кроків. Польську мову, приватність, джерела
й обов'язкове зіставлення з інноваціями збережено.
Реальні організації не надані: UI працює з окремими явно синтетичними fixtures,
дозволеними тільки в локальному fixtures-режимі. Не перейменовуємо інновації на організації.
Довідник з контактами й перевіркою залишається наступною інтеграцією.
План — загальні інструкції до розмови, а не реалізація M7. Підтвердження — оригінальний
текст, а не AI-резюме. Редагований текст для копіювання не зберігається після reload;
ця межа явно показана. Ніяких зовнішніх повідомлень, push або deployment у цій ітерації.
