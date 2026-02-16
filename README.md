# ChatIQ MVP

Multi-tenant live chat widget platform for websites.

## Features

- 💬 **Real-time Chat Widget** - Embeddable widget for visitor communication
- 👥 **Multi-Tenant Architecture** - Isolated data per site
- 🎨 **Customizable Widget** - Colors, position, messages
- 🤖 **Auto-Replies** - Automated responses based on triggers
- ⏰ **Business Hours** - Offline messages and scheduling
- 📊 **Analytics Dashboard** - Chat metrics and insights
- 🔔 **Telegram Notifications** - Real-time notifications for new chat leads via Telegram bot

## Quick Start

See [README-dev.md](./README-dev.md) for development setup instructions.

## Telegram Integration

ChatIQ supports real-time Telegram notifications for new visitor messages. Site operators can receive instant alerts when visitors start a conversation.

**Key Features:**
- Instant notifications for new leads
- Multiple operators can subscribe
- Direct links to open chats in Admin Panel
- Webhook-based (no polling)

**Setup Guide:** See [docs/TELEGRAM_SETUP.md](./docs/TELEGRAM_SETUP.md) for detailed instructions.

## Project Structure

```
chatiq-mvp/
├── api-server/     # NestJS backend API
├── admin-panel/    # Next.js admin interface
├── widget-cdn/     # Static widget files
└── docs/           # Documentation
```

## Tech Stack

- **Backend:** NestJS, TypeScript, Prisma ORM, Socket.IO
- **Frontend:** Next.js, React, TailwindCSS
- **Database:** PostgreSQL
- **Real-time:** Socket.IO, Telegram Bot API
