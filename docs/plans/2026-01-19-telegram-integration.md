# Telegram Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable site owners to configure personal Telegram bots and receive real-time notifications for new chat leads with first message.

**Architecture:** Multi-tenant webhook-based integration. Each site has its own bot token. Operators subscribe via `/start CONNECT_CODE` command. New chat + first message triggers notification to all subscribed operators via Telegram Bot API. No separate bot process needed - webhooks handled in existing NestJS server.

**Tech Stack:** NestJS, Prisma ORM, PostgreSQL, Telegram Bot API, Next.js, React, TailwindCSS

---

## Prerequisites

**Environment Setup:**
- Working directory: `/home/ubuntuvm/Projects/ruslap/chatiq-mvp/.worktrees/telegram-integration`
- Database must be running and accessible
- Node.js packages already installed
- This project gitignores `*.spec.ts` files (no unit tests in repo)

**Testing Strategy:**
Since unit tests are gitignored, we'll use:
1. Manual testing with Postman/curl for API endpoints
2. Integration testing with real Telegram bot
3. ngrok for local webhook testing

---

## Task 1: Database Schema - Create Telegram Tables

**Files:**
- Create: `api-server/prisma/migrations/YYYYMMDDHHMMSS_add_telegram_integration/migration.sql`
- Modify: `api-server/prisma/schema.prisma`

**Step 1: Add TelegramIntegration model to schema**

Open `api-server/prisma/schema.prisma` and add after the `Site` model:

```prisma
model TelegramIntegration {
  id           String   @id @default(cuid())
  siteId       String   @unique
  botToken     String
  botUsername  String?
  webhookUrl   String?
  enabled      Boolean  @default(true)
  connectCode  String   @unique

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  site          Site                   @relation(fields: [siteId], references: [id], onDelete: Cascade)
  subscriptions TelegramSubscription[]

  @@index([siteId])
  @@map("telegram_integrations")
}

model TelegramSubscription {
  id            String   @id @default(cuid())
  integrationId String
  chatId        String
  username      String?
  firstName     String?
  isActive      Boolean  @default(true)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  integration   TelegramIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  @@unique([integrationId, chatId])
  @@index([integrationId])
  @@map("telegram_subscriptions")
}
```

**Step 2: Add relation to Site model**

Find the `Site` model and add this field:

```prisma
model Site {
  // ... existing fields
  telegramIntegration TelegramIntegration?
}
```

**Step 3: Generate and run migration**

```bash
cd api-server
npx prisma migrate dev --name add_telegram_integration
```

Expected output: Migration files created, database updated

**Step 4: Generate Prisma Client**

```bash
npx prisma generate
```

Expected output: Prisma Client regenerated with new models

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add Telegram integration tables

- Add TelegramIntegration model for bot configuration
- Add TelegramSubscription model for operator subscriptions
- Link to Site with cascade delete
- Unique constraints on siteId and connectCode"
```

---

## Task 2: Module Structure - Create Telegram Module

**Files:**
- Create: `api-server/src/telegram/telegram.module.ts`
- Create: `api-server/src/telegram/telegram.controller.ts`
- Create: `api-server/src/telegram/telegram.service.ts`
- Create: `api-server/src/telegram/telegram-notification.service.ts`
- Create: `api-server/src/telegram/telegram-webhook.controller.ts`
- Create: `api-server/src/telegram/dto/setup-telegram.dto.ts`
- Create: `api-server/src/telegram/dto/telegram-webhook.dto.ts`
- Modify: `api-server/src/app.module.ts`

**Step 1: Create DTO for setup endpoint**

Create `api-server/src/telegram/dto/setup-telegram.dto.ts`:

```typescript
import { IsString, IsUUID, MinLength } from 'class-validator';

export class SetupTelegramDto {
  @IsUUID()
  siteId: string;

  @IsString()
  @MinLength(30)
  botToken: string;
}
```

**Step 2: Create DTO for webhook**

Create `api-server/src/telegram/dto/telegram-webhook.dto.ts`:

```typescript
export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      username?: string;
      first_name?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
}
```

**Step 3: Create basic service structure**

Create `api-server/src/telegram/telegram.service.ts`:

```typescript
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private prisma: PrismaService) {}

  async setup(siteId: string, botToken: string) {
    this.logger.log(`Setting up Telegram for site: ${siteId}`);

    // Validate bot token with Telegram
    const botInfo = await this.validateBotToken(botToken);

    // Generate unique connect code
    const connectCode = this.generateConnectCode();

    // Create or update integration
    const integration = await this.prisma.telegramIntegration.upsert({
      where: { siteId },
      update: {
        botToken,
        botUsername: botInfo.username,
        enabled: true,
        connectCode,
      },
      create: {
        siteId,
        botToken,
        botUsername: botInfo.username,
        connectCode,
        enabled: true,
      },
    });

    // Register webhook
    await this.registerWebhook(integration.id, botToken);

    return {
      connectCode,
      botUsername: botInfo.username,
    };
  }

  private async validateBotToken(botToken: string) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getMe`
      );

      if (!response.ok) {
        throw new BadRequestException('Invalid bot token');
      }

      const data = await response.json();
      return {
        username: data.result.username,
        id: data.result.id,
      };
    } catch (error) {
      this.logger.error('Bot token validation failed', error);
      throw new BadRequestException('Invalid bot token');
    }
  }

  private generateConnectCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private async registerWebhook(integrationId: string, botToken: string) {
    const webhookDomain = process.env.TELEGRAM_WEBHOOK_DOMAIN;
    if (!webhookDomain) {
      this.logger.warn('TELEGRAM_WEBHOOK_DOMAIN not set, skipping webhook registration');
      return;
    }

    const integration = await this.prisma.telegramIntegration.findUnique({
      where: { id: integrationId },
    });

    const webhookUrl = `${webhookDomain}/telegram/webhook/${integration.siteId}`;

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/setWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: webhookUrl }),
        }
      );

      if (!response.ok) {
        throw new Error('Webhook registration failed');
      }

      await this.prisma.telegramIntegration.update({
        where: { id: integrationId },
        data: { webhookUrl },
      });

      this.logger.log(`Webhook registered: ${webhookUrl}`);
    } catch (error) {
      this.logger.error('Webhook registration failed', error);
      throw error;
    }
  }

  async getStatus(siteId: string) {
    const integration = await this.prisma.telegramIntegration.findUnique({
      where: { siteId },
      include: {
        subscriptions: { where: { isActive: true } },
      },
    });

    if (!integration) {
      return { enabled: false };
    }

    return {
      enabled: integration.enabled,
      botUsername: integration.botUsername,
      connectCode: integration.connectCode,
      subscribersCount: integration.subscriptions.length,
      webhookUrl: integration.webhookUrl,
    };
  }

  async disconnect(siteId: string) {
    const integration = await this.prisma.telegramIntegration.findUnique({
      where: { siteId },
    });

    if (!integration) {
      return;
    }

    // Delete webhook from Telegram
    try {
      await fetch(
        `https://api.telegram.org/bot${integration.botToken}/deleteWebhook`,
        { method: 'POST' }
      );
    } catch (error) {
      this.logger.error('Failed to delete webhook', error);
    }

    // Delete integration (cascades to subscriptions)
    await this.prisma.telegramIntegration.delete({
      where: { siteId },
    });

    this.logger.log(`Telegram disconnected for site: ${siteId}`);
  }

  async getSubscribers(siteId: string) {
    const integration = await this.prisma.telegramIntegration.findUnique({
      where: { siteId },
      include: {
        subscriptions: { where: { isActive: true } },
      },
    });

    return integration?.subscriptions || [];
  }
}
```

**Step 4: Create notification service**

Create `api-server/src/telegram/telegram-notification.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramNotificationService {
  private readonly logger = new Logger(TelegramNotificationService.name);

  constructor(private prisma: PrismaService) {}

  async notifyNewLead(chat: any, message: any) {
    // Find integration for this site
    const integration = await this.prisma.telegramIntegration.findUnique({
      where: { siteId: chat.siteId },
      include: {
        subscriptions: { where: { isActive: true } },
        site: true,
      },
    });

    if (!integration?.enabled) {
      this.logger.debug(`No Telegram integration for site: ${chat.siteId}`);
      return;
    }

    if (integration.subscriptions.length === 0) {
      this.logger.debug(`No active subscribers for site: ${chat.siteId}`);
      return;
    }

    // Format notification message
    const text = this.formatLeadMessage(chat, message, integration.site);
    const replyMarkup = this.createInlineButton(chat.id);

    // Send to all subscribers
    for (const subscription of integration.subscriptions) {
      try {
        await this.sendTelegramMessage(
          integration.botToken,
          subscription.chatId,
          text,
          replyMarkup
        );
        this.logger.log(
          `Notification sent to ${subscription.chatId} for site ${chat.siteId}`
        );
      } catch (error) {
        this.logger.error(
          `Failed to send notification to ${subscription.chatId}`,
          error.stack
        );
      }
    }
  }

  private formatLeadMessage(chat: any, message: any, site: any): string {
    const visitorName = chat.visitorName || 'Анонім';
    const messageText = message.text || '(без тексту)';
    const siteName = site.domain || site.name || 'Невідомий сайт';
    const time = new Date(message.createdAt).toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `🆕 Новий чат!

👤 Відвідувач: ${visitorName}
💬 Повідомлення: "${messageText}"
🌐 Сайт: ${siteName}
⏰ ${time}`;
  }

  private createInlineButton(chatId: string) {
    const adminUrl = process.env.ADMIN_PANEL_URL || 'http://localhost:3001';
    const chatUrl = `${adminUrl}/chats/${chatId}`;

    return {
      inline_keyboard: [
        [
          {
            text: '📱 Відкрити в Admin Panel',
            url: chatUrl,
          },
        ],
      ],
    };
  }

  private async sendTelegramMessage(
    botToken: string,
    chatId: string,
    text: string,
    replyMarkup: any
  ) {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          reply_markup: replyMarkup,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Telegram API error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }
}
```

**Step 5: Create webhook controller**

Create `api-server/src/telegram/telegram-webhook.controller.ts`:

```typescript
import { Controller, Post, Param, Body, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramUpdate } from './dto/telegram-webhook.dto';

@Controller('telegram/webhook')
export class TelegramWebhookController {
  private readonly logger = new Logger(TelegramWebhookController.name);

  constructor(private prisma: PrismaService) {}

  @Post(':siteId')
  async handleWebhook(
    @Param('siteId') siteId: string,
    @Body() update: TelegramUpdate
  ) {
    this.logger.debug(`Webhook received for site: ${siteId}`);

    const message = update.message;
    if (!message?.text) {
      return { ok: true };
    }

    const text = message.text.trim();
    const chatId = message.chat.id.toString();

    // Handle /start command
    if (text.startsWith('/start')) {
      await this.handleStartCommand(siteId, chatId, text, message);
    }

    return { ok: true };
  }

  private async handleStartCommand(
    siteId: string,
    chatId: string,
    text: string,
    message: any
  ) {
    // Extract connect code from "/start ABC123"
    const parts = text.split(' ');
    const connectCode = parts[1]?.trim();

    if (!connectCode) {
      await this.sendMessage(
        chatId,
        '❌ Використовуйте команду у форматі: /start CONNECT_CODE'
      );
      return;
    }

    // Find integration by connect code
    const integration = await this.prisma.telegramIntegration.findUnique({
      where: { connectCode },
    });

    if (!integration) {
      await this.sendMessage(chatId, '❌ Невірний код підключення');
      return;
    }

    // Security: verify siteId matches
    if (integration.siteId !== siteId) {
      await this.sendMessage(chatId, '❌ Невірний код підключення');
      return;
    }

    // Create or update subscription
    await this.prisma.telegramSubscription.upsert({
      where: {
        integrationId_chatId: {
          integrationId: integration.id,
          chatId,
        },
      },
      update: { isActive: true },
      create: {
        integrationId: integration.id,
        chatId,
        username: message.from.username,
        firstName: message.from.first_name,
        isActive: true,
      },
    });

    await this.sendMessage(
      chatId,
      '✅ Ви успішно підписані на сповіщення!',
      integration.botToken
    );

    this.logger.log(`Subscription created: chatId=${chatId}, siteId=${siteId}`);
  }

  private async sendMessage(
    chatId: string,
    text: string,
    botToken?: string
  ) {
    // If botToken not provided, we can't send (security - don't leak tokens)
    if (!botToken) {
      this.logger.warn('Cannot send message without botToken');
      return;
    }

    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    } catch (error) {
      this.logger.error('Failed to send Telegram message', error);
    }
  }
}
```

**Step 6: Create REST controller**

Create `api-server/src/telegram/telegram.controller.ts`:

```typescript
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TelegramService } from './telegram.service';
import { SetupTelegramDto } from './dto/setup-telegram.dto';

@Controller('telegram')
@UseGuards(JwtAuthGuard)
export class TelegramController {
  constructor(private telegramService: TelegramService) {}

  @Post('setup')
  async setup(@Body() dto: SetupTelegramDto) {
    const result = await this.telegramService.setup(dto.siteId, dto.botToken);
    return {
      success: true,
      data: result,
    };
  }

  @Get('status/:siteId')
  async getStatus(@Param('siteId') siteId: string) {
    return this.telegramService.getStatus(siteId);
  }

  @Delete('disconnect/:siteId')
  async disconnect(@Param('siteId') siteId: string) {
    await this.telegramService.disconnect(siteId);
    return { success: true };
  }

  @Get('subscribers/:siteId')
  async getSubscribers(@Param('siteId') siteId: string) {
    const subscribers = await this.telegramService.getSubscribers(siteId);
    return { subscribers };
  }
}
```

**Step 7: Create module**

Create `api-server/src/telegram/telegram.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { TelegramService } from './telegram.service';
import { TelegramNotificationService } from './telegram-notification.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TelegramController, TelegramWebhookController],
  providers: [TelegramService, TelegramNotificationService],
  exports: [TelegramNotificationService],
})
export class TelegramModule {}
```

**Step 8: Register module in app**

Modify `api-server/src/app.module.ts`, add to imports array:

```typescript
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    // ... existing imports
    TelegramModule,
  ],
  // ...
})
```

**Step 9: Verify compilation**

```bash
cd api-server
npm run build
```

Expected: Build succeeds without errors

**Step 10: Commit**

```bash
git add src/telegram/ src/app.module.ts
git commit -m "feat(telegram): add Telegram module with services

- Add TelegramService for bot setup and validation
- Add TelegramNotificationService for sending notifications
- Add TelegramController for REST API endpoints
- Add TelegramWebhookController for webhook handling
- Implement /start command subscription logic
- Implement notification formatting with inline button"
```

---

## Task 3: Integrate with ChatGateway

**Files:**
- Modify: `api-server/src/chat/chat.gateway.ts`

**Step 1: Import TelegramNotificationService**

At the top of `api-server/src/chat/chat.gateway.ts`:

```typescript
import { TelegramNotificationService } from '../telegram/telegram-notification.service';
```

**Step 2: Inject service in constructor**

Find the constructor and add:

```typescript
constructor(
  // ... existing injections
  private telegramNotificationService: TelegramNotificationService,
) {}
```

**Step 3: Add notification call in visitor message handler**

Find the `@SubscribeMessage('visitor:message')` handler method. After the message is created and saved, add:

```typescript
// Check if this is the first message in a new chat
const chat = await this.chatService.findOne(payload.chatId);

if (chat.messagesCount === 1) {
  // This is a new lead - send Telegram notification
  await this.telegramNotificationService.notifyNewLead(chat, message);
}
```

**Note:** The exact location depends on your existing code structure. Add it after message creation but before the broadcast to admins.

**Step 4: Verify compilation**

```bash
cd api-server
npm run build
```

Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/chat/chat.gateway.ts
git commit -m "feat(telegram): integrate notifications with chat gateway

- Send Telegram notification when first message arrives
- Only trigger for messagesCount === 1 (new leads)
- Non-blocking - chat continues if notification fails"
```

---

## Task 4: Environment Variables

**Files:**
- Modify: `api-server/.env.example`
- Modify: `api-server/.env` (local only, not committed)

**Step 1: Add variables to .env.example**

Add to `api-server/.env.example`:

```env
# Telegram Integration
TELEGRAM_WEBHOOK_DOMAIN=https://your-ngrok-url.ngrok-free.app
ADMIN_PANEL_URL=http://localhost:3001
```

**Step 2: Add variables to local .env**

Add to `api-server/.env`:

```env
# Telegram Integration (for development)
TELEGRAM_WEBHOOK_DOMAIN=
ADMIN_PANEL_URL=http://localhost:3001
```

Note: Leave TELEGRAM_WEBHOOK_DOMAIN empty for now. We'll set it when testing with ngrok.

**Step 3: Commit example file**

```bash
git add .env.example
git commit -m "feat(telegram): add environment variables

- TELEGRAM_WEBHOOK_DOMAIN for webhook URL
- ADMIN_PANEL_URL for inline button links"
```

---

## Task 5: Frontend - Settings Page Structure

**Files:**
- Create: `admin-panel/src/app/settings/channels/page.tsx`
- Create: `admin-panel/src/components/channels/ChannelsSettings.tsx`
- Create: `admin-panel/src/components/channels/ChannelCard.tsx`
- Create: `admin-panel/src/components/channels/TelegramChannelCard.tsx`
- Create: `admin-panel/src/hooks/useTelegramIntegration.ts`

**Step 1: Create base ChannelCard component**

Create `admin-panel/src/components/channels/ChannelCard.tsx`:

```tsx
import { ReactNode } from 'react';

interface ChannelCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children?: ReactNode;
}

export function ChannelCard({
  icon,
  title,
  description,
  enabled,
  onToggle,
  children,
}: ChannelCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>

        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-5 peer-focus:ring-2 peer-focus:ring-blue-400"></div>
        </label>
      </div>

      {enabled && children && (
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Create Telegram hook**

Create `admin-panel/src/hooks/useTelegramIntegration.ts`:

```typescript
import { useState, useEffect } from 'react';

interface TelegramStatus {
  enabled: boolean;
  botUsername?: string;
  connectCode?: string;
  subscribersCount?: number;
}

export function useTelegramIntegration(siteId: string) {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, [siteId]);

  async function fetchStatus() {
    try {
      const response = await fetch(`/api/telegram/status/${siteId}`);
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch Telegram status', error);
    }
  }

  async function setup(botToken: string) {
    setLoading(true);
    try {
      const response = await fetch('/api/telegram/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, botToken }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus({
          enabled: true,
          botUsername: data.data.botUsername,
          connectCode: data.data.connectCode,
          subscribersCount: 0,
        });
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    setLoading(true);
    try {
      await fetch(`/api/telegram/disconnect/${siteId}`, {
        method: 'DELETE',
      });
      setStatus({ enabled: false });
    } catch (error) {
      console.error('Failed to disconnect', error);
    } finally {
      setLoading(false);
    }
  }

  return { status, loading, setup, disconnect, refetch: fetchStatus };
}
```

**Step 3: Create TelegramChannelCard component**

Create `admin-panel/src/components/channels/TelegramChannelCard.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Send, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { ChannelCard } from './ChannelCard';
import { useTelegramIntegration } from '@/hooks/useTelegramIntegration';

interface TelegramChannelCardProps {
  siteId: string;
}

export function TelegramChannelCard({ siteId }: TelegramChannelCardProps) {
  const { status, loading, setup, disconnect } = useTelegramIntegration(siteId);
  const [botToken, setBotToken] = useState('');
  const [error, setError] = useState('');

  const enabled = status?.enabled || false;

  const handleToggle = async (newEnabled: boolean) => {
    if (!newEnabled && status?.enabled) {
      await disconnect();
    }
  };

  const handleSave = async () => {
    setError('');

    if (!botToken.trim()) {
      setError('Будь ласка, введіть Bot Token');
      return;
    }

    const result = await setup(botToken);

    if (!result.success) {
      setError(result.error || 'Не вдалося підключити бота');
    } else {
      setBotToken('');
    }
  };

  return (
    <ChannelCard
      icon={<Send className="h-5 w-5 text-blue-600" />}
      title="Telegram"
      description="Підключення бота для прийому повідомлень"
      enabled={enabled}
      onToggle={handleToggle}
    >
      {!status?.enabled ? (
        // Setup Form
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Створіть нового бота за посиланням{' '}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              @BotFather
            </a>{' '}
            та скопіюйте token
          </p>

          <div className="relative">
            <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              placeholder="Paste Telegram Bot Token"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading || !botToken.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Збереження...' : 'Зберегти'}
          </button>
        </div>
      ) : (
        // Connected Status
        <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
            <div className="flex-1 space-y-3">
              <p className="font-medium text-green-900">
                Бот підключено: {status.botUsername}
              </p>

              <div className="rounded-lg border border-green-200 bg-white p-3">
                <p className="mb-1 text-sm text-gray-700">
                  Щоб отримувати сповіщення, напишіть боту:
                </p>
                <code className="block rounded bg-gray-50 px-3 py-2 font-mono text-base font-bold text-gray-900">
                  /start {status.connectCode}
                </code>
              </div>

              <p className="text-sm text-gray-600">
                Підписано операторів:{' '}
                <strong>{status.subscribersCount || 0}</strong>
              </p>

              <button
                onClick={() => disconnect()}
                disabled={loading}
                className="text-sm text-red-600 hover:text-red-700 hover:underline"
              >
                Відключити бота
              </button>
            </div>
          </div>
        </div>
      )}
    </ChannelCard>
  );
}
```

**Step 4: Create ChannelsSettings component**

Create `admin-panel/src/components/channels/ChannelsSettings.tsx`:

```tsx
import { MessageSquare } from 'lucide-react';
import { ChannelCard } from './ChannelCard';
import { TelegramChannelCard } from './TelegramChannelCard';

interface ChannelsSettingsProps {
  siteId: string;
}

export function ChannelsSettings({ siteId }: ChannelsSettingsProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Online Chat Card */}
      <ChannelCard
        icon={<MessageSquare className="h-5 w-5 text-blue-600" />}
        title="Онлайн-чат"
        description="Віджет чату для сайту"
        enabled={true}
        onToggle={() => {}}
      />

      {/* Telegram Card */}
      <TelegramChannelCard siteId={siteId} />
    </div>
  );
}
```

**Step 5: Create settings page**

Create `admin-panel/src/app/settings/channels/page.tsx`:

```tsx
import { ChannelsSettings } from '@/components/channels/ChannelsSettings';

export default function ChannelsPage() {
  // TODO: Get siteId from session/auth
  const siteId = 'your-site-id'; // Replace with actual siteId from auth

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Канали зв'язку
          </h1>
          <p className="text-sm text-gray-600">
            Налаштуйте канали для отримання повідомлень від відвідувачів
          </p>
        </div>

        <ChannelsSettings siteId={siteId} />
      </div>
    </div>
  );
}
```

**Step 6: Verify compilation**

```bash
cd admin-panel
npm run build
```

Expected: Build succeeds (may have TypeScript warnings about siteId - we'll fix in integration)

**Step 7: Commit**

```bash
git add src/app/settings/ src/components/channels/ src/hooks/
git commit -m "feat(admin): add Telegram settings UI

- Add ChannelCard base component for channel cards
- Add TelegramChannelCard with bot setup form
- Add useTelegramIntegration hook for API calls
- Add channels settings page at /settings/channels
- Implement toggle, setup, and disconnect flows"
```

---

## Task 6: Manual Testing Setup

**Files:**
- No code changes
- Testing setup only

**Step 1: Install ngrok (if not installed)**

```bash
npm install -g ngrok
```

Or download from https://ngrok.com/download

**Step 2: Start ngrok tunnel**

In a separate terminal:

```bash
ngrok http 3000
```

Note the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

**Step 3: Update environment variable**

Edit `api-server/.env`:

```env
TELEGRAM_WEBHOOK_DOMAIN=https://abc123.ngrok-free.app
```

Replace with your actual ngrok URL.

**Step 4: Start API server**

```bash
cd api-server
npm run start:dev
```

Verify: Server starts on port 3000

**Step 5: Start admin panel**

In separate terminal:

```bash
cd admin-panel
npm run dev
```

Verify: Admin panel starts on port 3001

**Step 6: Create test bot**

1. Open Telegram
2. Search for @BotFather
3. Send `/newbot`
4. Follow prompts to create bot
5. Copy the bot token (format: `123456:ABC-DEF...`)

**Step 7: Test bot setup via API**

Using Postman or curl:

```bash
curl -X POST http://localhost:3000/telegram/setup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "siteId": "your-site-id",
    "botToken": "YOUR_BOT_TOKEN"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "connectCode": "ABC123",
    "botUsername": "@your_bot"
  }
}
```

**Step 8: Test subscription via Telegram**

1. Open Telegram
2. Find your bot
3. Send: `/start ABC123` (use actual connect code from step 7)
4. Bot should reply: "✅ Ви успішно підписані на сповіщення!"

**Step 9: Verify in database**

```bash
cd api-server
npx prisma studio
```

Check `TelegramSubscription` table - should have 1 entry with your chat_id

**Step 10: Test notification**

Create a test chat with a message (via widget or API). Verify you receive Telegram notification.

**No commit needed** - this is testing only

---

## Task 7: Integration with Auth & Site Context

**Files:**
- Modify: `admin-panel/src/app/settings/channels/page.tsx`

**Step 1: Get siteId from session**

This depends on your existing auth implementation. Example using NextAuth:

```tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function ChannelsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.siteId) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Канали зв'язку
          </h1>
          <p className="text-sm text-gray-600">
            Налаштуйте канали для отримання повідомлень від відвідувачів
          </p>
        </div>

        <ChannelsSettings siteId={session.user.siteId} />
      </div>
    </div>
  );
}
```

**Step 2: Add site validation to backend**

Add validation middleware to `telegram.controller.ts` to ensure user has access to siteId (using existing auth guards).

**Step 3: Test full flow**

1. Login to admin panel
2. Navigate to `/settings/channels`
3. Setup Telegram bot
4. Subscribe via Telegram
5. Create test chat
6. Verify notification received

**Step 4: Commit**

```bash
git add admin-panel/src/app/settings/channels/page.tsx
git commit -m "feat(admin): integrate Telegram settings with auth

- Get siteId from user session
- Add authorization checks
- Complete end-to-end flow"
```

---

## Task 8: Documentation & Cleanup

**Files:**
- Create: `docs/TELEGRAM_SETUP.md`
- Modify: `README.md`

**Step 1: Create setup guide**

Create `docs/TELEGRAM_SETUP.md`:

```markdown
# Telegram Integration Setup

## Overview

Telegram integration allows site operators to receive real-time notifications for new chat leads.

## Setup Steps

### 1. Create Telegram Bot

1. Open Telegram and search for @BotFather
2. Send `/newbot` command
3. Choose name and username for your bot
4. Copy the bot token (format: `123456:ABC-DEF...`)

### 2. Configure in Admin Panel

1. Login to admin panel
2. Navigate to Settings → Channels
3. Toggle "Telegram" ON
4. Paste your bot token
5. Click "Save"
6. Note the connect code (e.g., `ABC123`)

### 3. Subscribe to Notifications

Each operator who wants to receive notifications:

1. Open Telegram
2. Find the bot (click the link or search by username)
3. Send: `/start ABC123` (use the actual connect code)
4. Bot will confirm: "✅ Ви успішно підписані на сповіщення!"

### 4. Test

Create a test chat from the widget. All subscribed operators should receive a Telegram notification with:
- Visitor name
- First message
- Site name
- Button to open chat in admin panel

## Development Setup

### Local Testing with ngrok

Since Telegram webhooks require HTTPS, use ngrok for local development:

1. Install ngrok: `npm install -g ngrok`
2. Start ngrok: `ngrok http 3000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)
4. Update `.env`: `TELEGRAM_WEBHOOK_DOMAIN=https://abc123.ngrok-free.app`
5. Restart API server

### Environment Variables

```env
TELEGRAM_WEBHOOK_DOMAIN=https://your-domain.com  # Production API URL
ADMIN_PANEL_URL=https://admin.your-domain.com    # Admin panel URL for buttons
```

## Troubleshooting

### Bot not responding to /start

- Check ngrok is running
- Verify `TELEGRAM_WEBHOOK_DOMAIN` is set correctly
- Check API server logs for webhook errors
- Verify webhook registered: `https://api.telegram.org/botYOUR_TOKEN/getWebhookInfo`

### Notifications not arriving

- Verify bot is connected (check database `telegram_integrations` table)
- Verify you're subscribed (check `telegram_subscriptions` table)
- Check API server logs for notification errors
- Verify chat has exactly 1 message (trigger condition)

### Invalid bot token error

- Double-check token from @BotFather
- Ensure no extra spaces or characters
- Token format: `[0-9]+:[A-Za-z0-9_-]+`
```

**Step 2: Update README**

Add to main `README.md` under Features:

```markdown
- **Telegram Notifications** - Receive real-time notifications for new chat leads via Telegram bot
```

**Step 3: Commit**

```bash
git add docs/TELEGRAM_SETUP.md README.md
git commit -m "docs: add Telegram integration setup guide

- Add step-by-step setup instructions
- Add troubleshooting section
- Add development setup with ngrok
- Update README with Telegram feature"
```

---

## Testing Checklist

Before considering implementation complete, verify:

- [ ] Database migration runs successfully
- [ ] API server compiles without errors
- [ ] Admin panel builds without errors
- [ ] Bot token validation works (valid/invalid tokens)
- [ ] Webhook registration succeeds
- [ ] `/start` command creates subscription
- [ ] Invalid connect codes are rejected
- [ ] Duplicate subscriptions are handled (upsert)
- [ ] New chat triggers notification
- [ ] Only first message triggers (not subsequent messages)
- [ ] Multiple subscribers receive notifications
- [ ] Inline button opens correct chat in admin panel
- [ ] Disconnect removes webhook and deletes integration
- [ ] UI shows correct status (enabled/disabled)
- [ ] UI displays subscriber count
- [ ] Environment variables documented

---

## Rollback Plan

If issues are discovered:

1. **Disable feature flag** (if implemented)
2. **Remove webhook**: Call `deleteWebhook` for all bots
3. **Revert database migration**:
   ```bash
   cd api-server
   npx prisma migrate resolve --rolled-back MIGRATION_NAME
   ```
4. **Revert code**: `git revert` the feature commits

---

## Next Steps (Future Enhancements)

Out of scope for MVP but consider for future:

- Encrypt bot tokens at rest
- Add notification preferences (per operator)
- Rich notifications with visitor metadata
- Two-way communication (reply from Telegram)
- Analytics (delivery rates, response times)
- WhatsApp, Email, Slack integrations
- Webhook signature verification

---

## Estimated Time

- Task 1 (Database): 10 minutes
- Task 2 (Module): 30 minutes
- Task 3 (ChatGateway): 5 minutes
- Task 4 (Env vars): 5 minutes
- Task 5 (Frontend): 45 minutes
- Task 6 (Testing): 20 minutes
- Task 7 (Auth integration): 10 minutes
- Task 8 (Docs): 15 minutes

**Total: ~2.5 hours**
