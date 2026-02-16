import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { EventEmitter2 } from "@nestjs/event-emitter";

export interface AutoReplyJobData {
	siteId: string;
	chatId: string;
	trigger: string;
	message: string;
}

export const AUTO_REPLY_QUEUE = "auto-reply";

@Processor(AUTO_REPLY_QUEUE)
export class AutoReplyProcessor extends WorkerHost {
	private readonly logger = new Logger(AutoReplyProcessor.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly eventEmitter: EventEmitter2,
	) {
		super();
	}

	async process(job: Job<AutoReplyJobData>): Promise<void> {
		const { siteId, chatId, trigger, message } = job.data;

		this.logger.debug(`Processing delayed auto-reply "${trigger}" for chat ${chatId}`);

		// Idempotency: check chat still exists and is open
		const chat = await this.prisma.chat.findUnique({
			where: { id: chatId },
			select: { id: true, status: true, siteId: true },
		});

		if (!chat) {
			this.logger.debug(`Chat ${chatId} no longer exists, skipping`);
			return;
		}

		if (chat.status === "closed") {
			this.logger.debug(`Chat ${chatId} is closed, skipping auto-reply`);
			return;
		}

		// Check if an admin has already replied (cancel auto-reply if so)
		const adminReplyAfterJob = await this.prisma.message.findFirst({
			where: {
				chatId,
				from: "admin",
				createdAt: { gte: new Date(job.timestamp) },
			},
		});

		if (adminReplyAfterJob) {
			this.logger.debug(`Admin already replied in chat ${chatId}, skipping auto-reply`);
			return;
		}

		// Send the auto-reply
		const savedMessage = await this.prisma.message.create({
			data: {
				chatId,
				from: "system",
				text: message,
			},
		});

		// Emit event for WebSocket broadcast
		this.eventEmitter.emit("auto-reply.sent", {
			siteId,
			chatId,
			message: savedMessage,
		});

		this.logger.log(`Auto-reply "${trigger}" sent to chat ${chatId}`);
	}
}
