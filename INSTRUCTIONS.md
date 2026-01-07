# 📘 INSTRUCTIONS.md — ChatIQ MVP

> Повний гайд для AI-агентів та розробників по роботі з проектом

**Версія:** 1.0  
**Дата:** 2026-01-07  
**Мова документа:** Українська

---

## 🎯 Про проект

**ChatIQ** — це SaaS-платформа для live-чату на сайтах (альтернатива JivoChat, Intercom).

### Основні компоненти:

| Компонент | Технологія | Порт | Призначення |
|-----------|------------|------|-------------|
| `api-server` | NestJS + Prisma | 3000 | Backend API + WebSocket Gateway |
| `admin-panel` | Next.js 14 | 3001 | Адмін-панель для операторів |
| `widget-cdn` | Static JS | 3002 | Чат-віджет для вбудовування на сайти |

---

## 📁 Структура проекту

```
chatiq-mvp/
├── api-server/                 # Backend (NestJS)
│   ├── prisma/
│   │   ├── schema.prisma       # ⭐ Головна схема бази даних
│   │   ├── migrations/         # Міграції PostgreSQL
│   │   └── seed.ts             # Seed дані для розробки
│   ├── src/
│   │   ├── main.ts             # Точка входу (Port 3000)
│   │   ├── app.module.ts       # Головний модуль
│   │   ├── auth/               # JWT + Google OAuth
│   │   ├── chat/               # WebSocket Gateway + Chat CRUD
│   │   ├── sites/              # Multi-tenant Sites CRUD
│   │   ├── automation/         # Auto-replies, Templates, Business Hours
│   │   ├── widget-settings/    # Налаштування віджету
│   │   ├── organization/       # Організаційні налаштування
│   │   ├── upload/             # File upload (до 10MB)
│   │   └── prisma/             # Prisma Service
│   └── .env                    # ⚠️ Секрети (не в git!)
│
├── admin-panel/                # Frontend (Next.js 14)
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Головна сторінка
│   │   ├── login/              # Сторінка логіну
│   │   ├── chats/              # Live chat інтерфейс
│   │   ├── sites/              # Управління сайтами
│   │   ├── settings/           # Налаштування
│   │   ├── analytics/          # Аналітика
│   │   └── api/                # NextAuth API routes
│   ├── components/
│   │   ├── chat-list.tsx       # Список чатів
│   │   ├── chat-view.tsx       # Вікно чату
│   │   ├── sidebar-nav.tsx     # Навігація
│   │   ├── automation-settings.tsx
│   │   ├── business-hours-settings.tsx
│   │   ├── templates-settings.tsx
│   │   └── ui/                 # shadcn/ui компоненти
│   ├── lib/
│   │   ├── auth.ts             # NextAuth конфігурація
│   │   └── utils.ts            # Утиліти
│   ├── contexts/               # React Context (i18n)
│   └── .env.local              # ⚠️ Секрети (не в git!)
│
├── widget-cdn/                 # Chat Widget
│   ├── public/
│   │   ├── widget.js           # ⭐ Головний файл віджету (2800+ рядків!)
│   │   └── index.html          # Demo сторінка для тестування
│   ├── docs/                   # Документація (11 файлів)
│   └── vercel.json             # Vercel deployment config
│
├── start.sh                    # Запуск всіх сервісів
├── stop.sh                     # Зупинка всіх сервісів
├── status.sh                   # Перевірка статусу
├── README-dev.md               # Quick Start для розробників
└── TASKS-DID.md                # Виконані задачі
```

---

## 🔌 Взаємозв'язки компонентів

### Потік даних:

```
┌─────────────────┐         WebSocket          ┌──────────────┐
│   widget.js     │ ◄──────────────────────────►│              │
│  (на сайті      │      visitor:join          │   API        │
│   клієнта)      │      visitor:message       │   Server     │
└─────────────────┘      admin:message         │  (NestJS)    │
                                               │              │
┌─────────────────┐         REST API           │              │
│  Admin Panel    │ ◄──────────────────────────►│              │
│  (Next.js)      │         WebSocket          └──────┬───────┘
└─────────────────┘      admin:join                   │
                         admin:message                │
                                                      │
                          ┌───────────────────────────┘
                          ▼
                   ┌──────────────┐
                   │  PostgreSQL  │
                   │  (Prisma)    │
                   └──────────────┘
```

### WebSocket Events:

**Widget → Server:**
- `visitor:join` — підключення відвідувача
- `visitor:message` — повідомлення від відвідувача
- `visitor:typing` — індикатор набору
- `visitor:read` — підтвердження прочитання

**Server → Widget:**
- `admin:message` — повідомлення від адміна
- `welcome:message` — привітальне повідомлення
- `settings:update` — оновлення налаштувань
- `business:status` — статус робочих годин

**Admin → Server:**
- `admin:join` — підключення адміна до чату
- `admin:message` — відповідь на чат

---

## 🗄️ База даних (Prisma)

### Моделі:

| Модель | Призначення | Ключові поля |
|--------|-------------|--------------|
| `User` | Адміни/Оператори | email, role (OWNER/OPERATOR), organizationId |
| `Site` | Сайти клієнтів | domain, apiKey, ownerId |
| `SiteUser` | Many-to-Many Sites↔Users | siteId, userId |
| `Chat` | Чат-сесії | siteId, visitorId, status |
| `Message` | Повідомлення | chatId, from, text, attachment |
| `WidgetSettings` | Налаштування віджету | organizationId, color, welcomeMessage |
| `AutoReply` | Автовідповіді | siteId, trigger, message |
| `QuickTemplate` | Швидкі відповіді | siteId, shortcut, message |
| `BusinessHours` | Робочі години | siteId, timezone, monday-sunday |

### Команди Prisma:

```bash
# Генерація клієнта
npx prisma generate

# Міграції
npx prisma migrate dev --name <name>
npx prisma migrate deploy  # Production

# Перегляд БД
npx prisma studio
```

---

## ⚙️ Змінні середовища

### `api-server/.env`:

```env
DATABASE_URL="postgresql://user:pass@host:5432/chatiq?schema=public"
JWT_SECRET="your-jwt-secret"
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"
PORT=3000
```

### `admin-panel/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-nextauth-secret"
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"
```

---

## 🚀 Швидкий старт

### Локальна розробка:

```bash
# Запустити всі сервіси одночасно
./start.sh

# Або вручну:
cd api-server && npm run start:dev      # Terminal 1
cd admin-panel && npm run dev           # Terminal 2
cd widget-cdn && npm run dev            # Terminal 3
```

### Перевірка статусу:

```bash
./status.sh
```

### Зупинка:

```bash
./stop.sh
```

---

## 🎨 Widget Integration

### Нова конфігурація (рекомендовано):

```html
<script async src="https://cdn.chtq.ink/widget.js"></script>
<script>
  window.chtq = {
    organizationId: "your-uuid",
    language: "uk",        // uk | en
    color: "#6366F1",      // Primary color
    position: "right",     // right | left
    size: "standard"       // compact | standard | large
  }
</script>
```

### Legacy конфігурація:

```html
<script src="https://cdn.chatiq.io/widget.js" data-site-id="YOUR_SITE_ID"></script>
```

---

## 📝 Важливі поради для AI-агентів

### ⚠️ Критичні файли:

1. **`api-server/prisma/schema.prisma`** — зміни тут впливають на всю систему
2. **`widget-cdn/public/widget.js`** — 2800+ рядків, Shadow DOM, Socket.io
3. **`admin-panel/lib/auth.ts`** — NextAuth конфігурація

### 🔧 При роботі з API:

- Всі endpoints захищені JWT (крім `/auth/login`, `/auth/register`)
- WebSocket працює на тому ж порті що і REST API
- CORS відкритий для development (`origin: true`)

### 🎭 Multi-tenant логіка:

- Кожен `User` має `organizationId`
- `Site` належить `User` через `ownerId`
- `WidgetSettings` прив'язані до `organizationId`
- Фільтрація даних по `siteId` обов'язкова!

### 📱 Widget особливості:

- **Shadow DOM** — повна ізоляція стилів
- **Vanilla JS** — без React/Vue залежностей
- **Socket.io** — завантажується з CDN
- **localStorage** — зберігає `chatiq_visitor_id`

### 🔐 Безпека:

- Паролі хешуються через `bcrypt`
- JWT токени з терміном дії 7 днів
- `apiKey` генерується для кожного сайту

---

## 📚 Документація

Детальна документація в `widget-cdn/docs/`:

| Файл | Зміст |
|------|-------|
| `00_OVERVIEW.md` | Огляд архітектури |
| `01_WIDGET_CDN.md` | Документація віджету |
| `02_API_SERVER.md` | API endpoints |
| `03_ADMIN_PANEL.md` | Адмін-панель |
| `04_MULTI_TENANT.md` | Multi-tenant архітектура |
| `05_DEPLOYMENT.md` | Інструкції з деплою |
| `06_ACCEPTANCE.md` | Acceptance criteria |
| `07_SOCKET_PAYLOADS.md` | WebSocket payloads |
| `08_PRISMA_SCHEMA.md` | Схема бази даних |
| `09_UX_WIREFRAME.md` | UX wireframes |
| `10_SECURITY_NOTES.md` | Нотатки з безпеки |

---

## 🌐 Production URLs

| Сервіс | URL |
|--------|-----|
| Widget CDN | `https://cdn.chtq.ink` |
| Admin Panel | `https://admin.chtq.ink` |
| API Server | `https://api.chtq.ink` |

---

## 🐛 Відомі обмеження

1. **Google OAuth** — потребує правильних redirect URIs в Google Console
2. **WebSocket** — потребує sticky sessions на load balancer
3. **File uploads** — максимум 10MB, зберігаються локально в `/uploads`

---

## ✅ Чек-лист перед деплоєм

- [ ] Налаштувати `DATABASE_URL` для production PostgreSQL
- [ ] Згенерувати унікальні `JWT_SECRET` та `NEXTAUTH_SECRET`
- [ ] Налаштувати Google OAuth credentials для production URLs
- [ ] Запустити `npx prisma migrate deploy`
- [ ] Змінити `API_URL` в `widget.js` на production URL
- [ ] Перевірити CORS налаштування

---

*Створено для спрощення роботи AI-агентів та розробників з проектом ChatIQ MVP*
