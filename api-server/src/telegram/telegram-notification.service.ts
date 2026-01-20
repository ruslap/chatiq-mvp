import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramNotificationService {
  private readonly logger = new Logger(TelegramNotificationService.name);

  constructor(private prisma: PrismaService) {}

  async notifyNewLead(chat: any, message: any) {
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

    const text = this.formatLeadMessage(chat, message, integration.site);
    const replyMarkup = this.createInlineButton(chat.id);

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
    const chatUrl = `${adminUrl}/chats?id=${chatId}`;

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

  async notifyNewContactLead(lead: {
    id: string;
    siteId: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    message?: string | null;
    createdAt: Date;
  }) {
    const integration = await this.prisma.telegramIntegration.findUnique({
      where: { siteId: lead.siteId },
      include: {
        subscriptions: { where: { isActive: true } },
        site: true,
      },
    });

    if (!integration?.enabled) {
      this.logger.debug(`No Telegram integration for site: ${lead.siteId}`);
      return;
    }

    if (integration.subscriptions.length === 0) {
      this.logger.debug(`No active subscribers for site: ${lead.siteId}`);
      return;
    }

    const text = this.formatContactLeadMessage(lead, integration.site);
    const replyMarkup = this.createLeadsButton(lead.siteId);

    for (const subscription of integration.subscriptions) {
      try {
        await this.sendTelegramMessage(
          integration.botToken,
          subscription.chatId,
          text,
          replyMarkup
        );
        this.logger.log(
          `Lead notification sent to ${subscription.chatId} for site ${lead.siteId}`
        );
      } catch (error) {
        this.logger.error(
          `Failed to send lead notification to ${subscription.chatId}`,
          error.stack
        );
      }
    }
  }

  private formatContactLeadMessage(lead: any, site: any): string {
    const siteName = site.domain || site.name || 'Невідомий сайт';
    const time = new Date(lead.createdAt).toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const date = new Date(lead.createdAt).toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    let contactInfo = '';
    if (lead.email) contactInfo += `📧 Email: ${lead.email}\n`;
    if (lead.phone) contactInfo += `📞 Телефон: ${lead.phone}\n`;

    return `📋 Новий контактний лід!

👤 Ім'я: ${lead.name}
${contactInfo}${lead.message ? `💬 Повідомлення: "${lead.message}"\n` : ''}🌐 Сайт: ${siteName}
📅 ${date}, ${time}`;
  }

  private createLeadsButton(siteId: string) {
    const adminUrl = process.env.ADMIN_PANEL_URL || 'http://localhost:3001';
    const leadsUrl = `${adminUrl}/leads?siteId=${siteId}`;

    return {
      inline_keyboard: [
        [
          {
            text: '📋 Переглянути ліди',
            url: leadsUrl,
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
