import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailFallbackService {
    private readonly logger = new Logger(EmailFallbackService.name);

    constructor(
        @InjectQueue('email-fallback') private emailFallbackQueue: Queue,
        private prisma: PrismaService,
    ) { }

    @OnEvent('chat.visitor_message')
    async handleVisitorMessage(payload: { siteId: string; chatId: string }) {
        const { siteId, chatId } = payload;

        const site = await this.prisma.site.findUnique({
            where: { id: siteId },
        });

        if (!site?.emailFallbackEnabled) {
            return;
        }

        const delayMs = (site.emailFallbackTimeout || 5) * 60 * 1000;

        // By adding a job with the same jobId, BullMQ will ignore it if it's already in the queue.
        // This correctly implements "send email after X min of first unread message".
        await this.emailFallbackQueue.add(
            'process-fallback',
            { siteId, chatId },
            { delay: delayMs, jobId: `fallback-${chatId}`, removeOnComplete: true },
        );

        this.logger.debug(`Scheduled email fallback for chat ${chatId} in ${site.emailFallbackTimeout} mins`);
    }

    @OnEvent('chat.admin_message')
    async handleAdminMessage(payload: { siteId: string; chatId: string }) {
        // If admin replies, we can safely remove the pending fallback check.
        try {
            const job = await this.emailFallbackQueue.getJob(`fallback-${payload.chatId}`);
            if (job) {
                await job.remove();
                this.logger.debug(`Removed pending fallback for chat ${payload.chatId}`);
            }
        } catch (e: any) {
            this.logger.warn(`Failed to remove fallback job: ${e.message}`);
        }
    }
}
