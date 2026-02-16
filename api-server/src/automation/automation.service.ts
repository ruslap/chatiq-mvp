import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { AUTO_REPLY_QUEUE, AutoReplyJobData } from "./auto-reply.processor";

interface DaySchedule {
	start: string;
	end: string;
	isOpen: boolean;
}

@Injectable()
export class AutomationService {
	private readonly logger = new Logger(AutomationService.name);

	constructor(
		private prisma: PrismaService,
		private eventEmitter: EventEmitter2,
		@InjectQueue(AUTO_REPLY_QUEUE) private autoReplyQueue: Queue<AutoReplyJobData>,
	) {}

	@OnEvent("chat.admin_message")
	async handleAdminMessage(payload: { siteId: string; chatId: string }) {
		const { chatId } = payload;
		try {
			const delayed = await this.autoReplyQueue.getDelayed();
			let cancelled = 0;
			for (const job of delayed) {
				if (job.data.chatId === chatId) {
					await job.remove();
					cancelled++;
				}
			}
			if (cancelled > 0) {
				this.logger.debug(`Admin replied in chat ${chatId}, cancelled ${cancelled} pending auto-reply jobs`);
			}
		} catch (error) {
			this.logger.warn(`Failed to cancel queued auto-replies for chat ${chatId}: ${error instanceof Error ? error.message : error}`);
		}
	}

	// Helper to validate that siteId exists
	private async validateSiteId(siteId: string): Promise<void> {
		const site = await this.prisma.site.findUnique({
			where: { id: siteId },
			select: { id: true },
		});

		if (!site) {
			throw new NotFoundException(
				`Site ${siteId} not found. Ensure you are using the correct siteId, not organizationId.`,
			);
		}
	}

	// ============ AUTO-REPLIES ============

	async getAutoReplies(siteId: string) {
		return this.prisma.autoReply.findMany({
			where: { siteId },
			orderBy: { order: "asc" },
		});
	}

	async createAutoReply(
		siteId: string,
		data: {
			name: string;
			trigger: string;
			message: string;
			delay?: number;
			isActive?: boolean;
		},
	) {
		const maxOrder = await this.prisma.autoReply.aggregate({
			where: { siteId },
			_max: { order: true },
		});

		return this.prisma.autoReply.create({
			data: {
				siteId,
				name: data.name,
				trigger: data.trigger,
				message: data.message,
				delay: data.delay || 0,
				isActive: data.isActive ?? true,
				order: (maxOrder._max.order || 0) + 1,
			},
		});
	}

	async updateAutoReply(
		siteId: string,
		id: string,
		data: {
			name?: string;
			trigger?: string;
			message?: string;
			delay?: number;
			isActive?: boolean;
			order?: number;
		},
	) {
		const existing = await this.prisma.autoReply.findFirst({
			where: { id, siteId },
		});

		if (!existing) {
			throw new NotFoundException(`Auto-reply ${id} not found`);
		}

		return this.prisma.autoReply.update({
			where: { id },
			data,
		});
	}

	async deleteAutoReply(siteId: string, id: string) {
		const existing = await this.prisma.autoReply.findFirst({
			where: { id, siteId },
		});

		if (!existing) {
			throw new NotFoundException(`Auto-reply ${id} not found`);
		}

		return this.prisma.autoReply.delete({
			where: { id },
		});
	}

	async getActiveAutoReplyByTrigger(siteId: string, trigger: string) {
		return this.prisma.autoReply.findFirst({
			where: {
				siteId,
				trigger,
				isActive: true,
			},
			orderBy: { order: "asc" },
		});
	}

	// ============ QUICK TEMPLATES ============

	async getQuickTemplates(siteId: string) {
		return this.prisma.quickTemplate.findMany({
			where: { siteId },
			orderBy: { order: "asc" },
		});
	}

	async createQuickTemplate(
		siteId: string,
		data: {
			title: string;
			message: string;
			shortcut?: string;
			category?: string;
			isActive?: boolean;
		},
	) {
		const maxOrder = await this.prisma.quickTemplate.aggregate({
			where: { siteId },
			_max: { order: true },
		});

		return this.prisma.quickTemplate.create({
			data: {
				siteId,
				title: data.title,
				message: data.message,
				shortcut: data.shortcut,
				category: data.category,
				isActive: data.isActive ?? true,
				order: (maxOrder._max.order || 0) + 1,
			},
		});
	}

	async updateQuickTemplate(
		siteId: string,
		id: string,
		data: {
			title?: string;
			message?: string;
			shortcut?: string;
			category?: string;
			isActive?: boolean;
			order?: number;
		},
	) {
		const existing = await this.prisma.quickTemplate.findFirst({
			where: { id, siteId },
		});

		if (!existing) {
			throw new NotFoundException(`Quick template ${id} not found`);
		}

		return this.prisma.quickTemplate.update({
			where: { id },
			data,
		});
	}

	async deleteQuickTemplate(siteId: string, id: string) {
		const existing = await this.prisma.quickTemplate.findFirst({
			where: { id, siteId },
		});

		if (!existing) {
			throw new NotFoundException(`Quick template ${id} not found`);
		}

		return this.prisma.quickTemplate.delete({
			where: { id },
		});
	}

	async getActiveQuickTemplates(siteId: string) {
		return this.prisma.quickTemplate.findMany({
			where: {
				siteId,
				isActive: true,
			},
			orderBy: { order: "asc" },
		});
	}

	// ============ SEED DEFAULT TEMPLATES ============

	async seedDefaultAutoReplies(siteId: string): Promise<number> {
		// Verify site exists
		const site = await this.prisma.site.findUnique({
			where: { id: siteId },
			select: { id: true },
		});

		if (!site) {
			this.logger.warn(`Cannot seed auto-replies: Site ${siteId} not found`);
			return 0;
		}

		const existing = await this.prisma.autoReply.count({ where: { siteId } });
		if (existing > 0) {
			this.logger.debug(`Auto-replies already exist for site ${siteId}`);
			return 0;
		}

		const defaults = [
			{
				name: "Привітання",
				trigger: "first_message",
				message: "Дякуємо за звернення! 👋 Ми відповімо вам найближчим часом.",
				delay: 0,
				order: 1,
			},
			{
				name: "Затримка 5 хв",
				trigger: "no_reply_5min",
				message: "Дякуємо за очікування! Наш оператор скоро відповість вам.",
				delay: 300,
				order: 2,
			},
			{
				name: "Затримка 10 хв",
				trigger: "no_reply_10min",
				message: "Вибачте за затримку. Якщо ви поспішаєте, залиште свій номер телефону і ми вам передзвонимо! 📞",
				delay: 600,
				order: 3,
			},
			{
				name: "Офлайн",
				trigger: "offline",
				message: "Зараз ми офлайн. Залиште своє повідомлення і ми відповімо, як тільки повернемось! 🕐",
				delay: 0,
				order: 4,
			},
		];

		for (const item of defaults) {
			await this.prisma.autoReply.create({
				data: { siteId, ...item, isActive: true },
			});
		}

		this.logger.log(`Seeded ${defaults.length} default auto-replies for site ${siteId}`);
		return defaults.length;
	}

	async seedDefaultQuickTemplates(siteId: string): Promise<number> {
		// Verify site exists
		const site = await this.prisma.site.findUnique({
			where: { id: siteId },
			select: { id: true },
		});

		if (!site) {
			this.logger.warn(`Cannot seed templates: Site ${siteId} not found`);
			return 0;
		}

		const existing = await this.prisma.quickTemplate.count({
			where: { siteId },
		});
		if (existing > 0) {
			this.logger.debug(`Templates already exist for site ${siteId}`);
			return 0;
		}

		const defaults = [
			{
				title: "Привітання",
				shortcut: "/hello",
				message: "Вітаємо! 👋 Раді вас бачити 😊 Напишіть, будь ласка, чим можемо допомогти — ми на звʼязку!",
				category: "Загальні",
				order: 1,
			},
			{
				title: "Запит телефону",
				shortcut: "/phone",
				message: "Залиште, будь ласка, ваш номер телефону і ми вам передзвонимо протягом 10 хвилин.",
				category: "Контакти",
				order: 2,
			},
			{
				title: "Подяка",
				shortcut: "/thanks",
				message: "Дякуємо за звернення! Якщо виникнуть питання - пишіть, завжди раді допомогти! 😊",
				category: "Загальні",
				order: 3,
			},
			{
				title: "Уточнення",
				shortcut: "/clarify",
				message: "Чи можете уточнити ваше питання? Хочу переконатись, що правильно вас зрозумів.",
				category: "Загальні",
				order: 4,
			},
			{
				title: "Час роботи",
				shortcut: "/hours",
				message: "Ми працюємо з 9:00 до 18:00, Пн-Пт. У вихідні відповідаємо на повідомлення з невеликою затримкою.",
				category: "Інформація",
				order: 5,
			},
			{
				title: "Очікування",
				shortcut: "/wait",
				message: "Одну хвилинку, зараз уточню інформацію для вас...",
				category: "Загальні",
				order: 6,
			},
		];

		for (const item of defaults) {
			await this.prisma.quickTemplate.create({
				data: { siteId, ...item, isActive: true },
			});
		}

		this.logger.log(`Seeded ${defaults.length} default quick templates for site ${siteId}`);
		return defaults.length;
	}

	// ============ BUSINESS HOURS ============

	async getBusinessHours(siteId: string) {
		// 1. Check if site exists - if not, we cannot create business hours
		const siteExists = await this.prisma.site.findUnique({
			where: { id: siteId },
			select: { id: true },
		});

		if (!siteExists) {
			// Return default values if site doesn't exist (for widget preview, etc.)
			return {
				id: "default",
				siteId,
				timezone: "Europe/Kyiv",
				isEnabled: false,
				offlineMessage: "Дякуємо за звернення! 🕐 Наразі ми не в мережі.",
				monday: '{"start": "09:00", "end": "18:00", "isOpen": true}',
				tuesday: '{"start": "09:00", "end": "18:00", "isOpen": true}',
				wednesday: '{"start": "09:00", "end": "18:00", "isOpen": true}',
				thursday: '{"start": "09:00", "end": "18:00", "isOpen": true}',
				friday: '{"start": "09:00", "end": "18:00", "isOpen": true}',
				saturday: '{"start": "10:00", "end": "15:00", "isOpen": false}',
				sunday: '{"start": "10:00", "end": "15:00", "isOpen": false}',
				createdAt: new Date(),
				updatedAt: new Date(),
			};
		}

		// 2. Try to find existing business hours
		let hours = await this.prisma.businessHours.findUnique({
			where: { siteId },
		});

		// 3. Create default if not exists (using try-catch to handle rare race conditions)
		if (!hours) {
			try {
				hours = await this.prisma.businessHours.create({
					data: { siteId },
				});

				// Seed default templates and auto-replies for new site
				await this.seedDefaultAutoReplies(siteId);
				await this.seedDefaultQuickTemplates(siteId);
			} catch (error: unknown) {
				// If creation fails due to unique constraint, try to find it again
				if (
					typeof error === "object" &&
					error !== null &&
					"code" in error &&
					(error as { code: string }).code === "P2002"
				) {
					hours = await this.prisma.businessHours.findUnique({
						where: { siteId },
					});
				} else {
					throw error;
				}
			}
		}

		return hours;
	}

	async updateBusinessHours(
		siteId: string,
		data: {
			timezone?: string;
			isEnabled?: boolean;
			offlineMessage?: string;
			monday?: { start: string; end: string; isOpen: boolean };
			tuesday?: { start: string; end: string; isOpen: boolean };
			wednesday?: { start: string; end: string; isOpen: boolean };
			thursday?: { start: string; end: string; isOpen: boolean };
			friday?: { start: string; end: string; isOpen: boolean };
			saturday?: { start: string; end: string; isOpen: boolean };
			sunday?: { start: string; end: string; isOpen: boolean };
		},
	) {
		// Ensure record exists
		await this.getBusinessHours(siteId);

		return this.prisma.businessHours.update({
			where: { siteId },
			data: {
				timezone: data.timezone,
				isEnabled: data.isEnabled,
				offlineMessage: data.offlineMessage,
				monday: data.monday ?? undefined,
				tuesday: data.tuesday ?? undefined,
				wednesday: data.wednesday ?? undefined,
				thursday: data.thursday ?? undefined,
				friday: data.friday ?? undefined,
				saturday: data.saturday ?? undefined,
				sunday: data.sunday ?? undefined,
			},
		});
	}

	async isWithinBusinessHours(siteId: string): Promise<{ isOpen: boolean; message?: string }> {
		const hours = await this.getBusinessHours(siteId);

		// If hours is null (shouldn't happen but handle for type safety)
		if (!hours) {
			return { isOpen: true }; // Default to always open if no settings
		}

		if (!hours.isEnabled) {
			return { isOpen: true }; // If disabled, always open
		}

		// Get current time in the configured timezone
		const now = new Date();
		const options: Intl.DateTimeFormatOptions = {
			timeZone: hours.timezone,
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		};
		const timeStr = now.toLocaleTimeString("en-GB", options);
		const [currentHour, currentMinute] = timeStr.split(":").map(Number);
		const currentMinutes = currentHour * 60 + currentMinute;

		// Get day of week in timezone
		const dayOptions: Intl.DateTimeFormatOptions = {
			timeZone: hours.timezone,
			weekday: "long",
		};
		const dayName = now.toLocaleDateString("en-US", dayOptions).toLowerCase();

		this.logger.debug(
			`BusinessHours check for siteId: ${siteId}, time: ${now.toLocaleTimeString("en-US", { timeZone: hours.timezone })}, day: ${dayName}`,
		);

		// Get schedule for current day
		const daySchedules: Record<string, unknown> = {
			monday: hours.monday,
			tuesday: hours.tuesday,
			wednesday: hours.wednesday,
			thursday: hours.thursday,
			friday: hours.friday,
			saturday: hours.saturday,
			sunday: hours.sunday,
		};

		const raw = daySchedules[dayName];
		const schedule: DaySchedule | null =
			typeof raw === "string" ? (JSON.parse(raw) as DaySchedule) : (raw as DaySchedule | null);

		this.logger.debug(`Schedule for ${dayName}: ${JSON.stringify(schedule)}`);

		if (!schedule || !schedule.isOpen) {
			return { isOpen: false, message: hours.offlineMessage };
		}

		// Parse start and end times
		const [startHour, startMinute] = schedule.start.split(":").map(Number);
		const [endHour, endMinute] = schedule.end.split(":").map(Number);
		const startMinutes = startHour * 60 + startMinute;
		let endMinutes = endHour * 60 + endMinute;

		// Treat 00:00 as end of day (24:00)
		if (endMinutes === 0) {
			endMinutes = 24 * 60;
		}

		let isOpen = false;
		if (startMinutes < endMinutes) {
			// Same day schedule
			isOpen = currentMinutes >= startMinutes && currentMinutes < endMinutes;
		} else {
			// Overnight schedule (e.g. 18:00 - 02:00)
			isOpen = currentMinutes >= startMinutes || currentMinutes < endMinutes;
		}

		return {
			isOpen,
			message: isOpen ? undefined : hours.offlineMessage,
		};
	}

	// ============ AUTO-REPLY EXECUTION ============

	async checkAndExecuteAutoReply(
		siteId: string,
		trigger: string,
		_chatId: string,
	): Promise<{ shouldReply: boolean; message?: string; delay?: number }> {
		// Get active auto-replies for this site
		const autoReplies = await this.prisma.autoReply.findMany({
			where: {
				siteId,
				isActive: true,
				trigger,
			},
			orderBy: { order: "asc" },
		});

		if (autoReplies.length === 0) {
			return { shouldReply: false };
		}

		// Check business hours for offline trigger
		if (trigger === "offline") {
			const businessStatus = await this.isWithinBusinessHours(siteId);
			if (businessStatus.isOpen) {
				return { shouldReply: false }; // Don't send offline message if we're open
			}
		}

		// Get the first matching auto-reply
		const autoReply = autoReplies[0];

		return {
			shouldReply: true,
			message: autoReply.message,
			delay: autoReply.delay,
		};
	}

	async executeAutoReply(siteId: string, chatId: string, message: string, from: "admin" | "visitor"): Promise<void> {
		this.logger.debug(`executeAutoReply called: siteId=${siteId}, chatId=${chatId}, from=${from}`);

		// Don't execute auto-replies for admin messages
		if (from === "admin") {
			this.logger.debug("Skipping - message from admin");
			return;
		}

		// Cancel existing queued jobs for this chat (reset clock on visitor message)
		try {
			const delayed = await this.autoReplyQueue.getDelayed();
			for (const job of delayed) {
				if (job.data.chatId === chatId) {
					await job.remove();
				}
			}
		} catch (error) {
			this.logger.warn(`Failed to cancel queued jobs for chat ${chatId}: ${error instanceof Error ? error.message : error}`);
		}

		// Check business hours status first
		const businessStatus = await this.isWithinBusinessHours(siteId);
		this.logger.debug(`Business status: isOpen=${businessStatus.isOpen}`);

		// Check for first message trigger
		const messageCount = await this.prisma.message.count({
			where: { chatId },
		});
		this.logger.debug(`Message count: ${messageCount}`);

		if (messageCount === 1) {
			// This is the first message
			if (businessStatus.isOpen) {
				this.logger.debug("ONLINE - sending welcome message");
				const result = await this.checkAndExecuteAutoReply(siteId, "first_message", chatId);
				if (result.shouldReply) {
					await this.enqueueAutoReply(siteId, chatId, "first_message", result.message!, (result.delay || 0) * 1000);
				}
			} else {
				this.logger.debug("OFFLINE - checking offline message");
				let result = await this.checkAndExecuteAutoReply(siteId, "offline", chatId);

				if (!result.shouldReply) {
					this.logger.debug("No offline message, falling back to welcome message");
					result = await this.checkAndExecuteAutoReply(siteId, "first_message", chatId);
				}

				if (result.shouldReply) {
					await this.enqueueAutoReply(siteId, chatId, "offline", result.message!, (result.delay || 0) * 1000);
				}
			}
		}

		// Schedule delayed "no_reply" messages if we are ONLINE
		// (If offline, usually the offline message is enough, or we might want to schedule them anyway?
		// Usually no_reply is "wait for operator". If offline, no operator is coming.)
		if (businessStatus.isOpen) {
			const delayedReplies = await this.prisma.autoReply.findMany({
				where: {
					siteId,
					isActive: true,
					trigger: { startsWith: "no_reply_" },
				},
			});

			if (delayedReplies.length > 0) {
				this.logger.debug(`Found ${delayedReplies.length} delayed replies, scheduling via queue`);

				for (const reply of delayedReplies) {
					if (reply.delay > 0) {
						await this.enqueueAutoReply(siteId, chatId, reply.trigger, reply.message, reply.delay * 1000);
					}
				}
			}
		}
	}

	private async enqueueAutoReply(
		siteId: string,
		chatId: string,
		trigger: string,
		message: string,
		delayMs: number,
	): Promise<void> {
		try {
			await this.autoReplyQueue.add(
				trigger,
				{ siteId, chatId, trigger, message },
				{
					delay: delayMs,
					removeOnComplete: true,
					removeOnFail: { count: 5 },
					attempts: 2,
					backoff: { type: "exponential", delay: 3000 },
				},
			);
			this.logger.debug(`Enqueued auto-reply "${trigger}" for chat ${chatId} with ${delayMs}ms delay`);
		} catch (error) {
			this.logger.error(`Failed to enqueue auto-reply: ${error instanceof Error ? error.message : error}`);
		}
	}

	private async sendAutoReply(siteId: string, chatId: string, message: string): Promise<void> {
		try {
			// Create the auto-reply message
			const savedMessage = await this.prisma.message.create({
				data: {
					chatId,
					text: message,
					from: "admin",
					createdAt: new Date(),
				},
			});

			// Get chat to find visitorId
			const chat = await this.prisma.chat.findUnique({
				where: { id: chatId },
			});

			if (chat) {
				// Emit event for WebSocket delivery
				this.eventEmitter.emit("auto-reply.sent", {
					siteId,
					chatId,
					visitorId: chat.visitorId,
					message: savedMessage,
				});
			}

			this.logger.log(`Auto-reply sent to chat ${chatId}: ${message}`);
		} catch (error) {
			this.logger.error("Failed to send auto-reply", error instanceof Error ? error.stack : error);
		}
	}
}
