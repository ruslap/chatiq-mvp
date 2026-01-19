import { Controller, Post, Param, Body, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { TelegramUpdate } from './dto/telegram-webhook.dto';

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
    const parts = text.split(' ');
    const connectCode = parts[1]?.trim();

    if (!connectCode) {
      await this.sendMessage(
        chatId,
        '❌ Використовуйте команду у форматі: /start CONNECT_CODE'
      );
      return;
    }

    const integration = await this.prisma.telegramIntegration.findUnique({
      where: { connectCode },
    });

    if (!integration) {
      await this.sendMessage(chatId, '❌ Невірний код підключення');
      return;
    }

    if (integration.siteId !== siteId) {
      await this.sendMessage(chatId, '❌ Невірний код підключення');
      return;
    }

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
