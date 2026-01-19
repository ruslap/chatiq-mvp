import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private prisma: PrismaService) {}

  async setup(siteId: string, botToken: string) {
    this.logger.log(`Setting up Telegram for site: ${siteId}`);

    const botInfo = await this.validateBotToken(botToken);

    const connectCode = this.generateConnectCode();

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

    if (!integration) {
      throw new Error('Integration not found');
    }

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

    try {
      await fetch(
        `https://api.telegram.org/bot${integration.botToken}/deleteWebhook`,
        { method: 'POST' }
      );
    } catch (error) {
      this.logger.error('Failed to delete webhook', error);
    }

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
