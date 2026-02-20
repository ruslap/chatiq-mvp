import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Processor('email-fallback')
export class EmailFallbackProcessor extends WorkerHost {
    private readonly logger = new Logger(EmailFallbackProcessor.name);

    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        const { siteId, chatId } = job.data;

        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: { site: true },
        });

        if (!chat || !chat.site.emailFallbackEnabled) {
            return;
        }

        const unreadMessages = await this.prisma.message.findMany({
            where: {
                chatId,
                from: 'visitor',
                read: false,
            },
            orderBy: { createdAt: 'asc' },
        });

        if (unreadMessages.length === 0) {
            this.logger.debug(`No unread messages for chat ${chatId}. Skipping email fallback.`);
            return;
        }

        const operators = await this.prisma.siteUser.findMany({
            where: { siteId },
            include: { user: true },
        });
        const owner = await this.prisma.user.findUnique({
            where: { id: chat.site.ownerId },
        });

        const emails = new Set<string>();
        if (owner?.email) emails.add(owner.email);
        for (const op of operators) {
            if (op.user?.email) emails.add(op.user.email);
        }

        if (emails.size === 0) {
            this.logger.warn(`No operator emails found for site ${siteId}`);
            return;
        }

        const visitorName = chat.visitorName || 'Відвідувач';
        const siteDomain = chat.site.domain || chat.site.name;
        const adminUrl = process.env.ADMIN_PANEL_URL || 'http://localhost:3000'; // fallback to frontend
        const chatUrl = `${adminUrl}/chats/${chatId}`;

        // Extremely basic attempt to find an email in their messages for Reply-To
        let replyTo: string | undefined = undefined;
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        for (const msg of unreadMessages) {
            const match = msg.text.match(emailRegex);
            if (match) {
                replyTo = match[0];
                break; // take the first found email
            }
        }

        const historyHtml = unreadMessages
            .map(
                m =>
                    `<div><b style="color: #4f46e5;">${visitorName}:</b> <span style="color: #3f3f46;">${m.text}</span></div>`,
            )
            .join('<br/><br/>');

        const html = `
      <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto;">
        <h2>Нове повідомлення на сайті ${siteDomain}</h2>
        <p>Відвідувач <b>${visitorName}</b> залишив повідомлення, поки вас або операторів не було в мережі (або повідомлення довго залишалися без відповіді):</p>
        <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e4e4e7;">
          ${historyHtml}
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${chatUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">Відповісти в Admin Panel</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 30px 0;" />
        <p style="color: #71717a; font-size: 13px;">Це автоматичне повідомлення від ChatIQ MVP. Ви можете змінити час очікування або вимкнути email-сповіщення у налаштуваннях вашого сайту.</p>
      </div>
    `;

        const subject = `[ChatIQ] Нове повідомлення від ${visitorName} на сайті ${siteDomain}`;

        await this.mailService.sendEmail(Array.from(emails), subject, html, replyTo);
        this.logger.log(`Email fallback sent for chat ${chatId} to ${emails.size} operators`);
    }
}
