# Telegram Integration Setup

## Overview

Telegram integration allows site operators to receive real-time notifications for new chat leads directly in Telegram.

## Features

- 🔔 Real-time notifications when visitors send their first message
- 👥 Multiple operators can subscribe to receive notifications
- 🔗 Direct links to open chats in Admin Panel
- 🇺🇦 Ukrainian language support
- 🔒 Secure bot token storage
- ⚡ Webhook-based (no polling, instant delivery)

## Setup Steps

### 1. Create Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Choose a name for your bot (e.g., "ChatIQ Notifications")
4. Choose a username for your bot (must end with 'bot', e.g., "chatiq_notify_bot")
5. Copy the bot token (format: `123456:ABC-DEF...`)

**Important:** Keep your bot token secret! Never commit it to git or share it publicly.

### 2. Configure in Admin Panel

1. Login to the Admin Panel
2. Navigate to **Settings → Channels** (`/settings/channels`)
3. Find the **Telegram** card
4. Toggle it **ON**
5. Paste your bot token in the input field
6. Click **"Зберегти"** (Save)
7. You'll see a **connect code** (e.g., `ABC123`) - save this for the next step

### 3. Subscribe to Notifications

Each operator who wants to receive notifications should:

1. Open Telegram
2. Find your bot (click the link shown in Admin Panel or search by username)
3. Send the command: `/start ABC123` (use your actual connect code)
4. Bot will confirm: **"✅ Ви успішно підписані на сповіщення!"**

### 4. Test the Integration

1. Open your website with the ChatIQ widget
2. Send a test message as a visitor
3. All subscribed operators should receive a Telegram notification with:
   - 👤 Visitor name (or "Анонім" if not provided)
   - 💬 First message text
   - 🌐 Site name/domain
   - ⏰ Timestamp
   - 📱 Button to **open chat in Admin Panel**

## Development Setup

### Local Testing with ngrok

Since Telegram webhooks require HTTPS, use ngrok for local development:

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   # or download from https://ngrok.com/download
   ```

2. **Start ngrok tunnel:**
   ```bash
   ngrok http 3000
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

4. **Update environment variable:**
   Edit `api-server/.env`:
   ```env
   TELEGRAM_WEBHOOK_DOMAIN=https://abc123.ngrok-free.app
   ```

5. **Restart API server:**
   ```bash
   cd api-server
   npm run start:dev
   ```

6. **Verify webhook registration:**
   The webhook will be automatically registered when you setup the bot in Admin Panel.

   You can manually check webhook status:
   ```bash
   curl https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo
   ```

### Environment Variables

**Required for Telegram integration:**

```env
# Production API URL (use ngrok URL for local dev)
TELEGRAM_WEBHOOK_DOMAIN=https://your-domain.com

# Admin Panel URL for inline button links
ADMIN_PANEL_URL=https://admin.your-domain.com
```

## How It Works

### Architecture

```
Visitor sends message
    ↓
ChatGateway (Socket.IO)
    ↓
Check if first message (messageCount === 1)
    ↓
TelegramNotificationService
    ↓
Fetch active subscriptions from DB
    ↓
Send notification to each subscriber via Telegram Bot API
```

### Database Schema

**TelegramIntegration:**
- `siteId` - Links to Site (unique, cascade delete)
- `botToken` - Telegram bot token (encrypted at rest recommended for production)
- `botUsername` - Bot username for display
- `webhookUrl` - Registered webhook URL
- `connectCode` - 6-character code for operator subscriptions
- `enabled` - Integration enabled/disabled

**TelegramSubscription:**
- `integrationId` - Links to TelegramIntegration
- `chatId` - Telegram chat ID (operator's Telegram ID)
- `username` - Telegram username
- `firstName` - Telegram first name
- `isActive` - Subscription active/inactive

### Webhook Flow

1. **Setup:** When bot is configured, webhook is registered: `POST /telegram/webhook/{siteId}`
2. **Subscription:** Operator sends `/start CODE` → Bot receives update → Creates subscription
3. **Notification:** New chat created → First message → Fetch subscriptions → Send to all

## Troubleshooting

### Bot not responding to `/start`

**Possible causes:**
- ngrok not running
- `TELEGRAM_WEBHOOK_DOMAIN` not set or incorrect
- API server not restarted after env change
- Firewall blocking incoming webhooks

**Solutions:**
1. Check ngrok is running: `curl http://localhost:4040/api/tunnels`
2. Verify webhook domain in `.env`
3. Restart API server
4. Check webhook status:
   ```bash
   curl https://api.telegram.org/botYOUR_TOKEN/getWebhookInfo
   ```
5. Check API server logs for webhook errors

### Notifications not arriving

**Possible causes:**
- Bot not connected (check `telegram_integrations` table)
- No active subscriptions (check `telegram_subscriptions` table)
- Message count > 1 (only first message triggers notification)
- Integration disabled

**Solutions:**
1. **Verify bot is connected:**
   ```sql
   SELECT * FROM telegram_integrations WHERE site_id = 'your-site-id';
   ```

2. **Verify subscriptions exist:**
   ```sql
   SELECT * FROM telegram_subscriptions WHERE is_active = true;
   ```

3. **Check API logs:**
   ```bash
   # Look for Telegram notification logs
   grep "Telegram" api-server/logs/*.log
   ```

4. **Test with fresh chat:**
   Open widget in incognito/private window to ensure new chat

### Invalid bot token error

**Possible causes:**
- Token copied incorrectly (spaces, line breaks)
- Token from wrong bot
- Token revoked in @BotFather

**Solutions:**
1. Copy token carefully (no spaces)
2. Verify token format: `[0-9]+:[A-Za-z0-9_-]+`
3. Test token manually:
   ```bash
   curl https://api.telegram.org/botYOUR_TOKEN/getMe
   ```
4. Generate new token from @BotFather if needed

### Webhook not registering

**Possible causes:**
- Domain not accessible from internet
- SSL certificate issues (ngrok should work)
- Firewall blocking Telegram IPs

**Solutions:**
1. Test domain accessibility: `curl https://your-domain.com/telegram/webhook/test`
2. Use ngrok for local dev (handles SSL)
3. Check logs for webhook registration errors

### Multiple notifications received

**Possible causes:**
- Same operator subscribed multiple times
- Multiple integrations for same site

**Solutions:**
1. Check for duplicate subscriptions:
   ```sql
   SELECT chat_id, COUNT(*)
   FROM telegram_subscriptions
   GROUP BY chat_id
   HAVING COUNT(*) > 1;
   ```
2. Delete duplicates (keep only latest)

## Production Deployment

### Security Checklist

- [ ] Use HTTPS for webhook domain (required by Telegram)
- [ ] Store bot tokens securely (consider encryption at rest)
- [ ] Set up rate limiting on webhook endpoint
- [ ] Implement webhook signature verification (optional but recommended)
- [ ] Use environment-specific bot tokens (dev/staging/prod)
- [ ] Restrict API access with proper authentication
- [ ] Monitor webhook errors and failed deliveries
- [ ] Set up alerting for integration failures

### Environment-Specific Setup

**Development:**
```env
TELEGRAM_WEBHOOK_DOMAIN=https://dev-abc123.ngrok-free.app
ADMIN_PANEL_URL=http://localhost:3001
```

**Staging:**
```env
TELEGRAM_WEBHOOK_DOMAIN=https://staging-api.chatiq.com
ADMIN_PANEL_URL=https://staging-admin.chatiq.com
```

**Production:**
```env
TELEGRAM_WEBHOOK_DOMAIN=https://api.chatiq.com
ADMIN_PANEL_URL=https://admin.chatiq.com
```

### Monitoring

Track these metrics:
- Webhook delivery success rate
- Notification delivery success rate
- Average notification latency
- Active subscriptions count
- Bot setup completion rate

### Scaling Considerations

- Webhook endpoint should handle high traffic (rate limiting recommended)
- Consider queue for notification sending (Redis + Bull)
- Monitor Telegram API rate limits
- Implement retry logic with exponential backoff
- Cache bot token validation results

## API Reference

### REST Endpoints

**Setup Telegram Bot**
```http
POST /telegram/setup
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "siteId": "site-uuid",
  "botToken": "123456:ABC-DEF..."
}

Response 200:
{
  "success": true,
  "data": {
    "connectCode": "ABC123",
    "botUsername": "your_bot"
  }
}
```

**Get Status**
```http
GET /telegram/status/{siteId}
Authorization: Bearer {jwt_token}

Response 200:
{
  "enabled": true,
  "botUsername": "your_bot",
  "connectCode": "ABC123",
  "subscribersCount": 3,
  "webhookUrl": "https://api.example.com/telegram/webhook/site-id"
}
```

**Disconnect**
```http
DELETE /telegram/disconnect/{siteId}
Authorization: Bearer {jwt_token}

Response 200:
{
  "success": true
}
```

**Get Subscribers**
```http
GET /telegram/subscribers/{siteId}
Authorization: Bearer {jwt_token}

Response 200:
{
  "subscribers": [
    {
      "id": "sub-uuid",
      "chatId": "123456789",
      "username": "operator1",
      "firstName": "John",
      "isActive": true,
      "createdAt": "2026-01-19T..."
    }
  ]
}
```

### Webhook Endpoint

```http
POST /telegram/webhook/{siteId}
Content-Type: application/json

{
  "update_id": 123456,
  "message": {
    "message_id": 1,
    "from": {
      "id": 123456789,
      "username": "operator1",
      "first_name": "John"
    },
    "chat": {
      "id": 123456789,
      "type": "private"
    },
    "text": "/start ABC123"
  }
}

Response 200:
{
  "ok": true
}
```

## Future Enhancements

Ideas for future versions:

- 🔐 Encrypt bot tokens at rest
- ⚙️ Per-operator notification preferences
- 📊 Rich notifications with visitor metadata
- 💬 Two-way communication (reply from Telegram)
- 📈 Analytics dashboard (delivery rates, response times)
- 🔗 WhatsApp, Slack, Discord integrations
- ✅ Webhook signature verification
- 🔄 Automatic retry for failed deliveries
- 📱 Mobile app deep linking
- 🌐 Multi-language notification templates

## Support

For issues or questions:
- Check logs: `api-server/logs/`
- Database queries: `npx prisma studio`
- Webhook info: `https://api.telegram.org/botYOUR_TOKEN/getWebhookInfo`
- Test bot: `https://api.telegram.org/botYOUR_TOKEN/getMe`

## Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [BotFather Commands](https://core.telegram.org/bots#6-botfather)
- [Webhook Guide](https://core.telegram.org/bots/webhooks)
- [ngrok Documentation](https://ngrok.com/docs)
