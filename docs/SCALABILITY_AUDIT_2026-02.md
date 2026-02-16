# ChatIQ MVP — Scalability & AI-Cleanup Audit (2026-02-16)

## 1) Executive summary

Поточний стан: **MVP працює**, але в поточному вигляді система **не готова до 10–100x росту** без суттєвого hardening.

Головні причини:
- порушення tenant isolation у WebSocket/REST;
- in-memory state для presence/automation (не масштабується горизонтально);
- важкі запити без pagination/grouping;
- слабка типізація та fallback-и, що маскують помилки домену;
- прод-безпека (debug/guards/cors/secrets) не доведена до production-grade.

**Вердикт:** брати в роботу "як є" для реального продакшену не можна. Потрібен **цільовий рефакторинг (не повний rewrite)** з P0/P1 roadmap.

---

## 2) Фактична архітектура (as-is)

- Backend: NestJS monolith + Prisma + Postgres + Socket.IO @api-server/src/app.module.ts#18-37
- Realtime: WebSocket gateway з room-based маршрутизацією @api-server/src/chat/chat.gateway.ts#23-33
- Admin: Next.js + NextAuth + direct API calls + socket.io-client @admin-panel/lib/auth.ts#14-129, @admin-panel/lib/socket.ts#1-64
- Widget: один великий `widget.js` (~3.3k lines), без build/type-check @widget-cdn/public/widget.js#1-35
- Deploy: Docker Compose + Nginx reverse proxy @deploy/docker-compose.yml#17-177, @deploy/nginx/nginx.conf#59-123

---

## 3) Critical findings (must fix first)

### C1. WebSocket admin-канал без authN/authZ (tenant breach)

**Що бачу:**
- Будь-який socket може `admin:join` тільки за `siteId` (без JWT) @api-server/src/chat/chat.gateway.ts#224-233
- Admin actions (`admin:message`, `admin:edit_message`, `admin:delete_message`) не прив’язані до user context @api-server/src/chat/chat.gateway.ts#252-365
- Frontend також не передає токен в socket handshake @admin-panel/lib/socket.ts#32-51

**Ризик:** критичний витік/підміна повідомлень між тенантами.

**Що зробити:**
1. Ввести JWT-auth для socket handshake (`auth.token`).
2. На server side валідовувати membership користувача в `siteId` перед join/message.
3. Розділити visitor/admin namespaces + RBAC policy для socket events.

---

### C2. REST endpoints з siteId без перевірки ownership (IDOR)

**Що бачу:**
- Chats API приймає довільний `siteId`, тільки guard jwt @api-server/src/chat/chat.controller.ts#13-16
- Automation endpoints аналогічно @api-server/src/automation/automation.controller.ts#19-90
- Leads read/delete: jwt guard є, але ownership check нема @api-server/src/leads/leads.controller.ts#31-43
- Telegram status/disconnect/subscribers: без перевірки прав на site @api-server/src/telegram/telegram.controller.ts#28-43

**Ризик:** користувач одного сайту може читати/міняти дані іншого.

**Що зробити:**
1. Ввести `SiteAccessGuard` (owner/operator membership).
2. У сервісах дублювати перевірку (defense in depth).
3. Заборонити direct `siteId` operations без resolved allowed-site list.

---

### C3. Поламана модель організації (multi-user org фактично неможливий)

**Що бачу:**
- `User.organizationId` має `@unique` @api-server/prisma/schema.prisma#18-24
- Але є use-case "add user to organization" @api-server/src/organization/organization.service.ts#52-58
- У `WidgetSettings` поле назване `users`, але тип — один `User?` @api-server/prisma/schema.prisma#81-97

**Ризик:** конфлікти у БД, неможливість коректної багатокористувацької організації.

**Що зробити:**
1. Нормалізувати модель org (Organization + OrganizationMember).
2. Забрати `@unique` з `User.organizationId` (або винести зв’язок у M:N таблицю).
3. Перейменувати `users` -> `user` (або зробити справжній список relation).

---

### C4. Fallback-ланцюг, що приховує доменні помилки і створює "сміття" даних

**Що бачу:**
- `organization/resolve` повертає `siteId = organizationId` у fallback @api-server/src/organization/organization.controller.ts#45-52
- При неіснуючому `siteId` chat-service **автостворює Site** @api-server/src/chat/chat.service.ts#28-45

**Ризик:** тихе пошкодження даних, неконтрольовані test-like сутності в проді.

**Що зробити:**
1. При невалідному mapping повертати 4xx/5xx (не підміняти ID).
2. При неіснуючому site — explicit domain error, без auto-create.
3. Зробити migration cleanup для уже створених "auto-created" site.

---

### C5. Неконсистентний контракт upload (feature у widget ламається)

**Що бачу:**
- Upload endpoint вимагає JWT @api-server/src/upload/upload.controller.ts#24-26
- Widget робить upload без Authorization @widget-cdn/public/widget.js#3132-3135

**Ризик:** upload для visitor-сценарію не працює або працює нестабільно через обхідні схеми.

**Що зробити:**
1. Розділити upload endpoints: public signed upload для widget + protected upload для admin.
2. Додати anti-abuse (mime/size/rate-limit/AV hook).

---

## 4) High findings (next wave)

### H1. Неефективні запити для чату (N+1, full history, без pagination)

- N+1 unread count: окремий `count` для кожного chat @api-server/src/chat/chat.service.ts#139-154
- Повна історія чату без pagination @api-server/src/chat/chat.service.ts#159-163
- Leads без pagination @api-server/src/leads/leads.service.ts#36-40
- Widget піднімає всю історію і рендерить цикл по всіх повідомленнях @widget-cdn/public/widget.js#2593-2605, @widget-cdn/public/widget.js#2626-2677

**Що зробити:** cursor pagination + precomputed unread counters + batched queries/groupBy.

---

### H2. Горизонтальне масштабування realtime/automation зараз не працює

- Presence в RAM одного інстансу (`activeVisitors`) @api-server/src/chat/chat.gateway.ts#36-39
- Pending auto-reply timers в RAM (`pendingTimers`) @api-server/src/automation/automation.service.ts#14-15
- Timer-based execution через `setTimeout` @api-server/src/automation/automation.service.ts#652-676

**Що зробити:**
1. Redis adapter для Socket.IO.
2. Черга (BullMQ/SQS) для delayed jobs замість `setTimeout`.
3. Shared presence store (Redis hash/stream).

---

### H3. Security hardening не завершений

- CORS пропускає будь-який origin + credentials @api-server/src/main.ts#27-35
- JWT strategy має fallback secret `"secret"` @api-server/src/auth/jwt.strategy.ts#18-19
- Частина organization endpoints без guard @api-server/src/organization/organization.controller.ts#77-113

**Що зробити:**
- allowlist origins; видалити weak fallback secret;
- уніфікувати guards/authorization policy на всіх protected endpoints.

---

### H4. Type safety відключена саме там, де потрібна

- `noImplicitAny: false` @api-server/tsconfig.json#21-23
- eslint rule `no-explicit-any` вимкнено @api-server/eslint.config.mjs#28-31
- багато `any` у бізнес-коді (напр. telegram notifications) @api-server/src/telegram/telegram-notification.service.ts#10-10
- frontend casts `session as any`, `useState<any[]>` @admin-panel/app/chats/page.tsx#46-47, @admin-panel/app/chats/page.tsx#113-114

**Що зробити:** поетапно прибрати `any` з critical paths (auth/chat/telegram).

---

### H5. Прод-поведінка з debug/test smell

- NextAuth debug фактично завжди `true` @admin-panel/lib/auth.ts#128-128
- у settings використовується `'dummy'` token fallback @admin-panel/app/settings/page.tsx#107-108, @admin-panel/app/settings/page.tsx#155-156

**Що зробити:** прибрати debug/dummy fallback, ввести fail-fast auth flow.

---

## 5) Medium findings (cleanup for maintainability)

### M1. Неконсистентні типи домену у БД

- `Chat.status` і `Message.from` як `String` замість enum @api-server/prisma/schema.prisma#56-69
- `Message.attachment` як Json, але дані зберігаються то string, то object @api-server/src/chat/chat.service.ts#77-83, @api-server/src/chat/chat.service.ts#100-101

**Що зробити:** явні Prisma enum + уніфікований Attachment DTO/serializer.

---

### M2. BusinessHours зберігається як JSON-рядки

- day fields мають string-default JSON @api-server/prisma/schema.prisma#137-143
- update робить `JSON.stringify` @api-server/src/automation/automation.service.ts#445-451
- read-path парсить conditionally @api-server/src/automation/automation.service.ts#503-505

**Що зробити:** або нормалізована таблиця schedule, або typed JSONB без string juggling.

---

### M3. Redis integration формально є, але operationally слабка

- Після 3 retry cache відключається @api-server/src/redis/redis.service.ts#17-21
- При startup fail сервіс живе без cache @api-server/src/redis/redis.service.ts#41-45
- `KEYS` у `delPattern` (blocking O(N)) @api-server/src/redis/redis.service.ts#102-105

**Що зробити:** resilient reconnect + SCAN instead of KEYS + явна telemetry cache hit/miss.

---

### M4. Widget як монолітний script важко підтримувати

- 3300+ lines в одному файлі @widget-cdn/public/widget.js#1-3360
- Періодичний polling кожні 60s на інстанс віджета @widget-cdn/public/widget.js#3350-3350

**Що зробити:** модульна збірка (TS + bundler), розбиття на transport/state/ui modules.

---

### M5. CI/CD quality gates слабкі

- Trigger-и workflow закоментовані @.github/workflows/deploy.yml#11-16
- Lint не блокує pipeline (`|| true`) @.github/workflows/deploy.yml#47-57

**Що зробити:** увімкнути обов’язкові checks + fail-on-lint/type/test.

---

## 6) Масштабованість 10x–100x: оцінка по контуру

### Backend/API
- **10x:** витримає частково після P0 security+query fixes.
- **100x:** без черг, pagination, pre-aggregation і multi-instance realtime — не витримає стабільно.

### Database
- Поточна схема придатна для MVP, але потребує:
  - enum/type cleanup;
  - індексної стратегії під unread/search;
  - нормалізації org і business hours.

### Realtime
- Без shared adapter/store горизонтальне масштабування Socket.IO буде неконсистентним.

### Widget/CDN
- Працює як MVP, але не як довгостроковий SDK (моноліт + runtime script loading + polling).

### Infra/Deploy
- Compose+single-node підходить для раннього етапу.
- Для 100x потрібні: autoscaling, managed DB/Redis, queue workers, observability SLO.

---

## 7) AI-cleanup roadmap (конкретні кроки)

## Quick wins (1–2 дні)

1. [x] **P0:** закрити WebSocket admin authz/authn.
2. [x] **P0:** ввести SiteAccessGuard у chat/automation/leads/telegram.
3. [x] **P0:** прибрати auto-create site fallback.
4. [x] **P1:** прибрати `debug: ... || true` та `dummy` token fallback.
5. [x] **P1:** вимкнути weak JWT fallback secret.

## Medium (1–2 тижні)

1. **P0:** переробити org model (Organization + Membership).
2. **P1:** pagination для chats/messages/leads + оптимізація unread (grouping/materialized counter).
3. **P1:** стандартизувати attachment schema (DTO + serializer).
4. **P1:** замінити BusinessHours string-JSON на typed model.
5. **P1:** прибрати `any` з critical modules (auth/chat/telegram).

## Structural (1–2 спринти)

1. **P0:** Redis adapter для Socket.IO + shared presence.
2. **P0:** delayed automation у чергу (BullMQ/SQS), idempotent jobs.
3. **P1:** widget SDK refactor на TypeScript modules + build pipeline.
4. **P1:** observability stack (structured logs, tracing, metrics, alerting).
5. **P1:** CI/CD gates: lint+type+tests mandatory, progressive rollout.

---

## 8) Definition of Done (production readiness)

Систему можна вважати production-grade, якщо:
- tenant isolation доведена автоматичними integration tests;
- всі site-scoped endpoints мають authz policy;
- realtime працює на 2+ API інстансах консистентно;
- API має pagination і SLA для heavy routes;
- немає `any`/debug fallback у critical paths;
- є error budget, дашборди й алерти по ключових SLO.

---

## 9) Фінальний вердикт

- **Як є:** тільки demo/MVP середовище.
- **Для комерційної експлуатації:** потрібен **цільовий рефакторинг** (P0+P1), а не повний rewrite.
- **Повна переробка:** не потрібна; але модулі `realtime/authz/org-model/widget-sdk` потрібно суттєво переформатувати.

---

## 10) Статус виконання (progress log)

### ✅ Зроблено (2026-02-16)

1. **QW-4 / P1** — прибрано debug/test fallback в admin auth/settings:
   - NextAuth debug більше не примусово ввімкнений у production @admin-panel/lib/auth.ts#125-129
   - прибрано `dummy` token fallback та `session as any` для access token у налаштуваннях @admin-panel/app/settings/page.tsx#67-183
   - для вкладок automation/templates/hours додано fail-fast поведінку при відсутній сесії @admin-panel/app/settings/page.tsx#716-756
   - у chat-view прибрано `dummy` fallback для protected API викликів (history/templates/clear/delete/rename/upload) @admin-panel/components/chat-view.tsx#117-399
   - у тестовій telegram-сторінці прибрано hardcoded `accessToken="dummy"` і додано явний ввід токена @admin-panel/src/app/settings/page.tsx#7-72

2. **QW-5 / P1** — прибрано weak JWT secret fallback:
   - `JWT_SECRET` тепер обов’язковий через `getOrThrow` @api-server/src/auth/jwt.strategy.ts#14-19

3. **QW-3 / P0** — прибрано auto-create site fallback:
   - visitor message більше не створює "Auto-created Test Site" при невалідному `siteId`; замість цього повертається `NotFoundException` @api-server/src/chat/chat.service.ts#23-29

4. **QW-1 / P0** — захищено admin websocket (authn + authz):
   - для `admin:*` подій додано JWT перевірку токена та site-level доступ через owner/operator membership @api-server/src/chat/chat.gateway.ts#59-473
   - `admin:message/edit/delete/mark_read/get_unread_count/join` тепер не довіряють клієнтському `siteId`, а валідують доступ на server side @api-server/src/chat/chat.gateway.ts#291-473
   - у Socket.IO клієнті admin-panel токен передається через handshake `auth.token` @admin-panel/lib/socket.ts#42-60
   - всі місця створення admin socket передають `accessToken` (@sidebar + chats) @admin-panel/components/sidebar-nav.tsx#39-44, @admin-panel/app/chats/page.tsx#148-153

5. **QW-2 / P0** — додано ownership checks для REST:
   - створено `SiteAccessGuard` для site-scoped endpoint'ів (params/body/query `siteId`) @api-server/src/auth/site-access.guard.ts#1-74
   - automation routes захищені `AuthGuard("jwt") + SiteAccessGuard` @api-server/src/automation/automation.controller.ts#20-128
   - chat routes з `siteId` використовують `SiteAccessGuard`, а chat/message routes перевіряють доступ через service-level assert methods @api-server/src/chat/chat.controller.ts#14-76, @api-server/src/chat/chat.service.ts#23-64
   - leads: list route захищено `SiteAccessGuard`, delete route валідує доступ до lead через site ownership @api-server/src/leads/leads.controller.ts#33-49, @api-server/src/leads/leads.service.ts#43-67
   - telegram: setup/status/disconnect/subscribers перевіряють доступ до site @api-server/src/telegram/telegram.controller.ts#20-47

6. **Tenant-isolation tests (in progress):**
   - додано unit/regression tests для `SiteAccessGuard` @api-server/src/auth/site-access.guard.spec.ts#1-98
   - додано tests для service-level access checks у chat module @api-server/src/chat/chat.service.spec.ts#1-121
   - додано tests для secure admin websocket flow у gateway @api-server/src/chat/chat.gateway.spec.ts#1-121
   - додано controller-level tests для перевірки виклику access assertions у chat REST @api-server/src/chat/chat.controller.spec.ts#1-119
   - додано tests для ownership checks у leads service @api-server/src/leads/leads.service.spec.ts#1-70
   - локальний запуск тестів поки не виконано через відсутні локальні dev binaries у середовищі (`jest: not found`, `nest: not found`)

### ⏭️ Наступні кроки (в роботі по черзі)

1. Наступний P0: підняти test runtime (jest/nest) і прогнати додані regression tests
2. Наступний P0: додати повні e2e сценарії tenant isolation (REST + WebSocket)
