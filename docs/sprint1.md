Комплексний план розробки live chat widget за 7 днів з Vercel deployment.

[Сертифікати паролі](https://www.notion.so/2e14ecbdc73380aa9059f1befcbb5ff9?pvs=21)

[Спринт Перший основи](https://www.notion.so/2ea4ecbdc73380bfb958f875eba3a289?pvs=21)

[Спринт Другий](https://www.notion.so/2ea4ecbdc73380abb27ee92a45599293?pvs=21)

## 🔗Посилання

адмін

[https://admin.chtq.ink](https://admin.chtq.ink/chats)

сторінка демо:

https://cdn.chtq.ink/

## 🎯 Ціль проєкту

Створити робочий MVP альтернативи JivoChat/Intercom з:

- **Widget CDN** (завантажується на сайті клієнта)
- **API Server** (NestJS з WebSocket)
- **Admin Panel** (Next.js для операторів)
- **Multi-tenant** архітектура

---

## 📊 Статистика

**Загально задач:** 57

### За днями

- **Day 0 - Підготовка:** 4 задачі (30-60 хв)
- **Day 1 - CDN Widget:** 4 задачі (~1.5 год)
- **Day 2 - API Server:** 6 задач (~3 год)
- **Day 3 - Widget ↔ API:** 6 задач (~2.5 год)
- **Day 4 - Admin Panel:** 11 задач (~7 год)
- **Day 5 - Multi-tenant:** 10 задач (~5 год)
- **Day 6 - Полірування:** 8 задач (~7 год)
- **Day 7 - Demo & Launch:** 8 задач (~5 год)

### За компонентами

- 🎨 **Widget CDN:** 13 задач
- ⚙️ **API NestJS:** 8 задач
- 🖥️ **Admin Panel:** 13 задач
- 🗄️ **Database:** 5 задач
- 🔐 **Auth:** 2 задачі
- 📦 **DevOps:** 16 задач

### За пріоритетом

- 🔴 **Critical:** 28 задач
- 🟡 **High:** 14 задач
- 🟢 **Medium:** 11 задач
- ⚪ **Low:** 4 задачі

---

## 🗂️ Структура репозиторіїв

```
chat-mvp/
├─ widget-cdn/        → Vercel (static CDN)
├─ admin-panel/       → Vercel (Next.js)
└─ api-server/        → NestJS (Render/Fly/VM)
```

---

## 🚀 Деталі по днях

### Day 0: Підготовка (30-60 хв)

**Ціль:** Налаштувати інфраструктуру проєкту

- Створити 3 GitHub репозиторії
- Зареєструватися на Vercel
- Визначити назву сервісу
- Намалювати архітектуру

### Day 1: CDN Widget (~1.5 год)

**Ціль:** Отримати URL [`https://chat-widget.vercel.app/widget.js`](https://chat-widget.vercel.app/widget.js)

- Створити `public/widget.js`
- Мінімальний widget з `console.log`
- Deploy на Vercel
- Перевірити CDN

### Day 2: API Server (~3 год)

**Ціль:** Сервер що приймає siteId та повідомлення

- NestJS проєкт
- CORS
- WebSocket Gateway
- `visitor-join` та `visitor-message` евенти
- Логування

### Day 3: Widget ↔ API (~2.5 год)

**Ціль:** Повідомлення з сайту → сервер

- [Socket.io](http://Socket.io)-client
- Зчитування `siteId`
- Генерація `visitorId`
- Надсилання повідомлень
- Test HTML
- E2E тестування

### Day 4: Admin Panel (~7 год)

**Ціль:** Адмінка що бачить повідомлення

- Next.js + Tailwind + shadcn/ui
- `/login` та `/chats` сторінки
- WebSocket client
- UI: список чатів, активний чат, поле відповіді
- Deploy на Vercel

### Day 5: Multi-tenant (~5 год)

**Ціль:** Кожен бачить тільки свої чати

- Prisma schema (User, Site, Chat, Message)
- JWT аутентифікація
- `userId` в контексті
- `siteId` ownership перевірка
- Валідація widget

### Day 6: Полірування (~7 год)

**Ціль:** "Вау, це реально працює!"

- Історія повідомлень
- Auto-scroll
- Online/Offline статус
- Loader
- Avatar & Name
- UI/UX полірування
- Анімації
- Оптимізація

### Day 7: Demo & Launch (~5 год)

**Ціль:** Показати людям

- Підключити на власний сайт
- E2E тестування
- GIF/відео demo
- [README.md](http://README.md)
- GitHub publish
- Deployment інструкції
- Перевірка критичних флоу
- Feedback

---

## 💻 Технологічний стек

### Frontend

- **Widget:** Vanilla JS + [Socket.io](http://Socket.io)-client
- **Admin:** Next.js 14 + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **State:** React Context / Zustand

### Backend

- **Framework:** NestJS
- **WebSocket:** [Socket.io](http://Socket.io)
- **Database:** PostgreSQL + Prisma
- **Auth:** JWT

### Infrastructure

- **CDN:** Vercel (widget)
- **Frontend:** Vercel (admin)
- **Backend:** Render / [Fly.io](http://Fly.io) / Railway
- **Database:** Supabase / Neon / Railway

---

## ✅ Що маємо через 7 днів

1. ✅ CDN widget що завантажується на будь-якому сайті
2. ✅ Реальний live chat з WebSocket
3. ✅ Адмінка для операторів
4. ✅ Multi-tenant архітектура
5. ✅ Готово для demo та перших клієнтів

---

## 🔄 Наступні кроки

### Можливі напрямки розвитку:

1. **Код widget.js** (production-ready)
2. **NestJS Gateway** (повна імплементація)
3. **Prisma schema** (повна структура DB)
4. **UX адмінки** (дизайн + компоненти)
5. **Назви продукту** (брендинг)

---

## 📚 Ресурси

- [Vercel Documentation](https://vercel.com/docs)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [Socket.io](http://Socket.io)
- [Prisma](https://www.prisma.io/docs)
- [shadcn/ui](https://ui.shadcn.com/)

---