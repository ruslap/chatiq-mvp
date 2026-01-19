# Telegram Integration Design

**Date:** 2026-01-19
**Status:** Approved
**Author:** Design Session with User

## Overview

Add Telegram bot integration to ChatIQ MVP platform to notify site operators about new chat leads. Each site owner creates their own bot (full tenant isolation), operators subscribe via `/start` command, and receive notifications when visitors initiate new chats.

## Goals

- Enable site owners to configure personal Telegram bots in admin panel
- Allow multiple operators per site to subscribe to notifications
- Send Telegram notifications for new leads (new chat + first message only)
- Maintain strict multi-tenant security (each bot belongs to one site)
- Support local development via ngrok and production deployment via webhook

## Architecture

### High-Level Components

1. **Database (Prisma)** - Two new tables for bot config and operator subscriptions
2. **Backend (NestJS)** - REST API for setup + Webhook handler for Telegram commands + Notification service
3. **Frontend (Admin Panel)** - Settings page for bot configuration with UI from Telegram_integr.md spec
4. **Telegram Bot** - Webhook-based (no separate process/VPS needed)

### Technology Choices

- **Webhook vs Polling:** Webhook approach (runs in existing api-server, no separate hosting)
- **Bot Model:** Personal bots per site (owner creates bot via @BotFather, pastes token)
- **Token Storage:** Plaintext for MVP (can add encryption later)
- **Local Dev:** ngrok for webhook testing on localhost

---

## Database Schema

### New Models

**TelegramIntegration** - stores bot configuration per site

```prisma
model TelegramIntegration {
  id           String   @id @default(cuid())
  siteId       String   @unique
  botToken     String   // Plain text for MVP
  botUsername  String?  // @bot_name (optional, for display)
  webhookUrl   String?  // Registered webhook URL
  enabled      Boolean  @default(true)

  connectCode  String   @unique // Generated code like "ABC123"

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  site          Site               @relation(fields: [siteId], references: [id], onDelete: Cascade)
  subscriptions TelegramSubscription[]

  @@index([siteId])
}
```

**TelegramSubscription** - stores Telegram chat_id for each subscribed operator

```prisma
model TelegramSubscription {
  id            String   @id @default(cuid())
  integrationId String
  chatId        String   // Telegram chat_id of operator
  username      String?  // @username (optional)
  firstName     String?  // First name from Telegram

  isActive      Boolean  @default(true)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  integration   TelegramIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  @@unique([integrationId, chatId]) // Prevent duplicate subscriptions
  @@index([integrationId])
}
```

**Changes to existing models:**

```prisma
model Site {
  // ... existing fields
  telegramIntegration TelegramIntegration?
}
```

---

## Backend API

### Module Structure

```
api-server/src/telegram/
├── telegram.module.ts
├── telegram.controller.ts      # REST API endpoints
├── telegram.gateway.ts         # Webhook handler
├── telegram.service.ts         # Core logic (setup, validation)
├── telegram-notification.service.ts  # Send notifications
└── dto/
    ├── setup-telegram.dto.ts
    └── telegram-webhook.dto.ts
```

### REST Endpoints

**1. POST `/telegram/setup`** - Configure Telegram bot

```typescript
// Request
{
  "siteId": "site_123",
  "botToken": "123456:ABC-DEF..."
}

// Response
{
  "success": true,
  "data": {
    "connectCode": "ABC123",
    "botUsername": "@my_support_bot",
    "instructions": "Напишіть боту команду: /start ABC123"
  }
}
```

**Logic:**
1. Validate Bot Token via Telegram API `getMe`
2. Create/update `TelegramIntegration` record
3. Generate unique `connectCode` (6-char alphanumeric)
4. Register webhook with Telegram via `setWebhook`
5. Return connect instructions

**2. GET `/telegram/status/:siteId`** - Get integration status

```typescript
// Response
{
  "enabled": true,
  "botUsername": "@my_support_bot",
  "connectCode": "ABC123",
  "subscribersCount": 3,
  "webhookStatus": "active"
}
```

**3. DELETE `/telegram/disconnect/:siteId`** - Disconnect Telegram

- Deletes `TelegramIntegration` (cascades to subscriptions)
- Removes webhook from Telegram via `deleteWebhook`

**4. GET `/telegram/subscribers/:siteId`** - List subscribed operators

```typescript
// Response
{
  "subscribers": [
    {
      "chatId": "12345",
      "username": "@john",
      "firstName": "John",
      "subscribedAt": "2026-01-19T10:30:00Z"
    }
  ]
}
```

**Security:**
- All endpoints protected by JWT Auth Guard
- Validate user has access to `siteId` (owner or operator via `SiteUser`)

---

## Telegram Webhook Handler

### Endpoint

`POST /telegram/webhook/:siteId`

Receives updates from Telegram when someone messages the bot.

### Incoming Webhook Payload

```typescript
{
  "update_id": 123456,
  "message": {
    "message_id": 1,
    "from": {
      "id": 987654321,        // This is chat_id we need
      "username": "john_doe",
      "first_name": "John"
    },
    "chat": {
      "id": 987654321,
      "type": "private"
    },
    "text": "/start ABC123"
  }
}
```

### Handler Logic

```typescript
async handleWebhook(siteId: string, update: TelegramUpdate) {
  const message = update.message;
  const chatId = message.chat.id.toString();
  const text = message.text;

  // Only handle /start commands
  if (!text?.startsWith('/start')) return;

  const connectCode = text.split(' ')[1]; // Extract "ABC123"

  // Find integration by connectCode
  const integration = await this.prisma.telegramIntegration.findUnique({
    where: { connectCode }
  });

  if (!integration) {
    return this.sendMessage(chatId, '❌ Невірний код підключення');
  }

  // Security: verify siteId matches (prevent cross-tenant attacks)
  if (integration.siteId !== siteId) {
    return this.sendMessage(chatId, '❌ Невірний код підключення');
  }

  // Create or update subscription
  await this.prisma.telegramSubscription.upsert({
    where: {
      integrationId_chatId: {
        integrationId: integration.id,
        chatId
      }
    },
    update: { isActive: true },
    create: {
      integrationId: integration.id,
      chatId,
      username: message.from.username,
      firstName: message.from.first_name
    }
  });

  // Send confirmation
  await this.sendMessage(
    chatId,
    '✅ Ви успішно підписані на сповіщення!'
  );
}
```

---

## Notification System

### Trigger Point

Integrate into existing `ChatGateway` when new chat + first message arrives:

```typescript
// chat.gateway.ts

@SubscribeMessage('visitor:message')
async handleVisitorMessage(client: Socket, payload: MessagePayload) {
  // ... existing logic (create chat, message)

  const chat = await this.chatService.findOne(payload.chatId);
  const message = await this.messageService.findOne(payload.messageId);

  // If this is the first message in a new chat → notify
  if (chat.messagesCount === 1) {
    await this.telegramNotificationService.notifyNewLead(chat, message);
  }

  // ... existing broadcast logic
}
```

### Notification Service

**TelegramNotificationService.notifyNewLead():**

```typescript
async notifyNewLead(chat: Chat, message: Message) {
  // 1. Find integration for this site
  const integration = await this.prisma.telegramIntegration.findUnique({
    where: { siteId: chat.siteId },
    include: {
      subscriptions: { where: { isActive: true } },
      site: true
    }
  });

  if (!integration?.enabled) return;

  // 2. Format notification message
  const text = this.formatLeadMessage(chat, message, integration.site);
  const inlineKeyboard = this.createInlineButton(chat.id);

  // 3. Send to all active subscribers
  for (const subscription of integration.subscriptions) {
    try {
      await this.sendTelegramMessage(
        integration.botToken,
        subscription.chatId,
        text,
        inlineKeyboard
      );
    } catch (error) {
      // Log error but don't fail - continue sending to other subscribers
      this.logger.error(
        `Failed to send Telegram notification to ${subscription.chatId}`,
        error.stack
      );
    }
  }
}
```

### Message Format

```typescript
formatLeadMessage(chat: Chat, message: Message, site: Site): string {
  return `
🆕 Новий чат!

👤 Відвідувач: ${chat.visitorName || 'Анонім'}
💬 Повідомлення: "${message.text}"
🌐 Сайт: ${site.domain}
⏰ ${this.formatTime(message.createdAt)}
  `.trim();
}

createInlineButton(chatId: string) {
  const adminUrl = `${process.env.ADMIN_PANEL_URL}/chats/${chatId}`;

  return {
    inline_keyboard: [[
      {
        text: '📱 Відкрити в Admin Panel',
        url: adminUrl
      }
    ]]
  };
}

async sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
  replyMarkup: any
) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup
    })
  });
}
```

---

## Frontend (Admin Panel)

### Page Location

`admin-panel/src/app/settings/channels/page.tsx`

### Component Structure

**1. Settings Layout with Tabs**

Following the UI spec from `admin-panel/Telegram_integr.md`:

```tsx
<SettingsLayout>
  <Tabs defaultValue="channels">
    <TabsList>
      <TabsTrigger value="channels">Канали зв'язку</TabsTrigger>
      <TabsTrigger value="widget">Віджет</TabsTrigger>
      <TabsTrigger value="hours">Робочі години</TabsTrigger>
      <TabsTrigger value="automation">Автоматизація</TabsTrigger>
      <TabsTrigger value="templates">Шаблони</TabsTrigger>
      <TabsTrigger value="notifications">Сповіщення</TabsTrigger>
    </TabsList>

    <TabsContent value="channels">
      <ChannelsSettings siteId={siteId} />
    </TabsContent>
  </Tabs>
</SettingsLayout>
```

**2. Channels Settings Component**

```tsx
// components/ChannelsSettings.tsx

export function ChannelsSettings({ siteId }: { siteId: string }) {
  return (
    <div className="space-y-4 max-w-3xl">
      {/* Online Chat Card */}
      <ChannelCard
        icon={<MessageSquare className="w-5 h-5" />}
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

**3. Telegram Channel Card (Main Component)**

```tsx
// components/TelegramChannelCard.tsx

export function TelegramChannelCard({ siteId }: { siteId: string }) {
  const [enabled, setEnabled] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<TelegramStatus | null>(null);

  // Load existing integration on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    const data = await fetch(`/api/telegram/status/${siteId}`).then(r => r.json());
    if (data.enabled) {
      setEnabled(true);
      setStatus(data);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch('/api/telegram/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, botToken })
      });

      const data = await response.json();

      if (data.success) {
        setStatus({
          enabled: true,
          botUsername: data.data.botUsername,
          connectCode: data.data.connectCode,
          subscribersCount: 0
        });
        toast.success('Telegram бот підключено!');
      } else {
        toast.error('Помилка: ' + data.error);
      }
    } catch (error) {
      toast.error('Не вдалося підключити бота');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Send className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Telegram</h3>
            <p className="text-sm text-gray-600">
              Підключення бота для прийому повідомлень
            </p>
          </div>
        </div>

        <Toggle
          checked={enabled}
          onCheckedChange={setEnabled}
          className="data-[state=checked]:bg-blue-500"
        />
      </div>

      {/* Expandable Configuration */}
      {enabled && (
        <div className="mt-4 space-y-4 pt-4 border-t border-gray-100">
          {!status ? (
            // Setup Form
            <>
              <p className="text-sm text-gray-600">
                Створіть нового бота за посиланням{' '}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  @BotFather
                </a>
                {' '}та скопіюйте token
              </p>

              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Paste Telegram Bot Token"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={!botToken || saving}
                className="w-full sm:w-auto"
              >
                {saving ? 'Збереження...' : 'Зберегти'}
              </Button>
            </>
          ) : (
            // Connected Status
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertTitle className="text-green-900">
                Бот підключено: {status.botUsername}
              </AlertTitle>
              <AlertDescription className="mt-3 space-y-3">
                <div className="p-3 bg-white rounded-lg border border-green-200">
                  <p className="text-sm text-gray-700 mb-1">
                    Щоб отримувати сповіщення, напишіть боту:
                  </p>
                  <code className="block text-base font-mono font-bold text-gray-900 bg-gray-50 px-3 py-2 rounded">
                    /start {status.connectCode}
                  </code>
                </div>

                <p className="text-sm text-gray-600">
                  Підписано операторів: <strong>{status.subscribersCount}</strong>
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatus(null)}
                  className="text-red-600 hover:bg-red-50"
                >
                  Відключити бота
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </Card>
  );
}
```

### API Integration Hook

```typescript
// hooks/useTelegramIntegration.ts

export function useTelegramIntegration(siteId: string) {
  async function setup(botToken: string) {
    const response = await fetch('/api/telegram/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId, botToken })
    });
    return response.json();
  }

  async function getStatus() {
    const response = await fetch(`/api/telegram/status/${siteId}`);
    return response.json();
  }

  async function disconnect() {
    const response = await fetch(`/api/telegram/disconnect/${siteId}`, {
      method: 'DELETE'
    });
    return response.json();
  }

  return { setup, getStatus, disconnect };
}
```

---

## Development Setup

### Local Development with ngrok

**1. Install ngrok:**

```bash
npm install -g ngrok
```

**2. Start ngrok tunnel:**

```bash
ngrok http 3000
```

Output:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

**3. Update Environment Variables:**

```env
# api-server/.env

# Existing vars
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# New for Telegram
TELEGRAM_WEBHOOK_DOMAIN=https://abc123.ngrok-free.app
ADMIN_PANEL_URL=http://localhost:3001

# Production values (comment out for local dev):
# TELEGRAM_WEBHOOK_DOMAIN=https://api.chatiq.com
# ADMIN_PANEL_URL=https://admin.chatiq.com
```

**Important:** ngrok URL changes on each restart. Update `TELEGRAM_WEBHOOK_DOMAIN` accordingly.

**4. Webhook Registration:**

When saving Bot Token in admin panel:

```typescript
const webhookUrl = `${process.env.TELEGRAM_WEBHOOK_DOMAIN}/telegram/webhook/${siteId}`;

await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: webhookUrl })
});
```

### Production Deployment

1. Set `TELEGRAM_WEBHOOK_DOMAIN` to production API domain (e.g., `https://api.chatiq.com`)
2. Set `ADMIN_PANEL_URL` to production admin domain
3. Ensure HTTPS is properly configured
4. No other changes needed - same code works for both environments

---

## Error Handling

### Possible Errors and Responses

**1. Invalid Bot Token**

```typescript
// Frontend: show error toast
toast.error('Невірний Bot Token. Перевірте токен з @BotFather');

// Backend: validate with Telegram API
const botInfo = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
if (!botInfo.ok) {
  throw new BadRequestException('Invalid bot token');
}
```

**2. Webhook Registration Failed**

```typescript
// Log error and show user-friendly message
this.logger.error('Failed to register webhook', error.stack);
throw new InternalServerErrorException('Не вдалося підключити бота');
```

**3. Invalid Connect Code (during /start)**

```typescript
// In webhook handler:
if (!integration) {
  return this.sendMessage(chatId, '❌ Невірний код підключення');
}
```

**4. Telegram API Unavailable (during notification send)**

```typescript
// Don't fail the entire chat creation - just log
try {
  await this.telegramNotificationService.notifyNewLead(chat, message);
} catch (error) {
  this.logger.error('Failed to send Telegram notification', error.stack);
  // Chat still works, notification just doesn't go through
}
```

**5. Duplicate Subscription**

```typescript
// Handled by unique constraint in DB - use upsert:
await this.prisma.telegramSubscription.upsert({
  where: { integrationId_chatId: { integrationId, chatId } },
  update: { isActive: true },
  create: { integrationId, chatId, username, firstName }
});
```

---

## Security Considerations

### Multi-Tenant Isolation

- **Bot Token per Site:** Each site has its own bot token → full data isolation
- **Connect Code Validation:** When processing `/start`, verify `connectCode` belongs to correct `siteId`
- **API Auth:** All REST endpoints require JWT + validate user has access to `siteId`

### Webhook Security

- Validate `siteId` in webhook URL matches `connectCode` in database
- Consider adding Telegram webhook secret validation (optional for MVP)

```typescript
// Optional: validate webhook came from Telegram
// Telegram sends X-Telegram-Bot-Api-Secret-Token header
const secretToken = req.headers['x-telegram-bot-api-secret-token'];
if (secretToken !== integration.webhookSecret) {
  throw new UnauthorizedException();
}
```

### Token Security

- **MVP:** Store Bot Token in plaintext (acceptable risk for MVP)
- **Future:** Encrypt bot tokens using `crypto` with secret key in `.env`

```typescript
// Future encryption approach:
import * as crypto from 'crypto';

function encryptToken(token: string): string {
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
  return cipher.update(token, 'utf8', 'hex') + cipher.final('hex');
}

function decryptToken(encrypted: string): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
}
```

---

## Testing Strategy

### Manual Testing Flow

**1. Setup Flow:**
- Create site in admin panel
- Go to Settings → Channels
- Toggle Telegram ON
- Create bot via @BotFather, get token
- Paste token, click Save
- Verify success message with connect code

**2. Subscription Flow:**
- Open Telegram, find bot
- Send `/start ABC123` (with actual connect code)
- Verify bot responds with confirmation
- Check admin panel shows 1 subscriber

**3. Notification Flow:**
- Open widget on website
- Send first message as visitor
- Verify Telegram notification arrives
- Click "Відкрити в Admin Panel" button
- Verify opens correct chat in admin

**4. Multiple Subscribers:**
- From another Telegram account, send `/start ABC123`
- Verify both accounts receive notifications

### Automated Tests (Future)

```typescript
// Example unit test structure
describe('TelegramService', () => {
  describe('setup', () => {
    it('should validate bot token with Telegram API', async () => {});
    it('should generate unique connect code', async () => {});
    it('should register webhook with Telegram', async () => {});
  });

  describe('handleWebhook', () => {
    it('should create subscription for valid connect code', async () => {});
    it('should reject invalid connect code', async () => {});
    it('should prevent cross-tenant access', async () => {});
  });

  describe('notifyNewLead', () => {
    it('should send notification to all subscribers', async () => {});
    it('should skip if integration disabled', async () => {});
    it('should not fail if Telegram API is down', async () => {});
  });
});
```

---

## Migration Plan

### Database Migration

```bash
cd api-server
npx prisma migrate dev --name add_telegram_integration
npx prisma generate
```

### Rollout Strategy

1. **Phase 1:** Backend + Database (no UI yet)
   - Deploy new tables
   - Deploy API endpoints
   - Test with Postman/curl

2. **Phase 2:** Frontend UI
   - Deploy settings page
   - Test end-to-end flow with one test site

3. **Phase 3:** Production Rollout
   - Update environment variables to production domains
   - Monitor logs for errors
   - Gradually enable for customers

---

## Future Enhancements (Out of Scope for MVP)

- **Bot Token Encryption:** Encrypt tokens at rest
- **Rich Notifications:** Include visitor metadata (location, referrer, previous chats)
- **Two-way Communication:** Reply to visitors directly from Telegram
- **Notification Preferences:** Let operators choose which events to receive
- **Analytics:** Track notification delivery rates, response times
- **Multiple Channels:** WhatsApp, Email, Slack integrations
- **Webhook Secret Validation:** Verify webhook requests truly from Telegram

---

## Summary

This design provides a complete Telegram integration with:

✅ Multi-tenant security (personal bots per site)
✅ Simple operator subscription via `/start` command
✅ Real-time notifications for new leads
✅ Clean UI following existing design system
✅ Webhook-based (no extra hosting needed)
✅ ngrok support for local development
✅ Inline button for quick access to admin panel

The implementation follows ChatIQ's existing patterns (NestJS modules, Prisma ORM, Next.js frontend) and maintains strict tenant isolation per `CLAUDE.md` guidelines.
