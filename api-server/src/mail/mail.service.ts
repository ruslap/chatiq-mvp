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
            // Use Resend REST API instead of SMTP directly if host matches smtp.resend.com
            // This bypasses common VPS outbound port 465/587 blocks
            if (process.env.SMTP_HOST?.includes('resend.com')) {
                const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.SMTP_PASS}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: process.env.SMTP_FROM,
                        to,
                        subject,
                        html,
                        reply_to: replyTo
                    })
                });

                if (!res.ok) {
                    const errText = await res.text();
                    throw new Error(`Resend API HTTP ${res.status}: ${errText}`);
                }
                
                const data = await res.json();
                this.logger.log(`Email sent via Resend API: ${data.id}`);
                return;
            }

            // Fallback for other providers
            const info = await this.transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
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
