import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailService.name);

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'localhost',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendEmail(to: string[], subject: string, html: string, replyTo?: string) {
        if (!process.env.SMTP_HOST) {
            this.logger.warn('SMTP_HOST not configured. Email skipped.');
            return;
        }

        try {
            const info = await this.transporter.sendMail({
                from: `"ChatIQ" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: to.join(', '),
                replyTo,
                subject,
                html,
            });

            this.logger.log(`Email sent: ${info.messageId}`);
        } catch (error: any) {
            this.logger.error(`Error sending email: ${error.message}`, error.stack);
        }
    }
}
