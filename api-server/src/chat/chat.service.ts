import { Injectable, Logger, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AutomationService } from "../automation/automation.service";

import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class ChatService {
	private readonly logger = new Logger(ChatService.name);

	constructor(
		private prisma: PrismaService,
		private automationService: AutomationService,
		private eventEmitter: EventEmitter2,
	) { }

	async getChatById(chatId: string) {
		return this.prisma.chat.findUnique({
			where: { id: chatId },
		});
	}

	async assertUserSiteAccess(userId: string, siteId: string) {
		const site = await this.prisma.site.findFirst({
			where: {
				id: siteId,
				OR: [
					{ ownerId: userId },
					{ operators: { some: { userId } } },
				],
			},
			select: { id: true },
		});

		if (!site) {
			throw new ForbiddenException("You do not have access to this site");
		}
	}

	async assertUserChatAccess(userId: string, chatId: string) {
		const chat = await this.prisma.chat.findUnique({
			where: { id: chatId },
			select: { siteId: true },
		});

		if (!chat) {
			throw new NotFoundException("Chat not found");
		}

		await this.assertUserSiteAccess(userId, chat.siteId);
	}

	async assertUserMessageAccess(userId: string, messageId: string) {
		const message = await this.prisma.message.findUnique({
			where: { id: messageId },
			select: { chatId: true },
		});

		if (!message) {
			throw new NotFoundException("Message not found");
		}

		await this.assertUserChatAccess(userId, message.chatId);
	}

	async saveVisitorMessage(siteId: string, visitorId: string, text: string, attachment?: string) {
		const site = await this.prisma.site.findUnique({ where: { id: siteId } });

		if (!site) {
			this.logger.warn(`Rejected visitor message for unknown site: ${siteId}`);
			throw new NotFoundException(`Site ${siteId} not found`);
		}

		// 2. Find or create chat
		// First, try to find the most recent chat for this visitor (even if closed)
		let chat = await this.prisma.chat.findFirst({
			where: {
				siteId,
				visitorId,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		if (!chat) {
			// No chat exists, create a new one
			chat = await this.prisma.chat.create({
				data: {
					siteId,
					visitorId,
					status: "open",
				},
			});
		} else if (chat.status === "closed") {
			// Reopen the existing chat
			chat = await this.prisma.chat.update({
				where: { id: chat.id },
				data: { status: "open" },
			});
			this.logger.log(`Reopened chat ${chat.id} for visitor ${visitorId}`);
		}

		const message = await this.prisma.message.create({
			data: {
				chatId: chat.id,
				from: "visitor",
				text,
				attachment: attachment ? attachment : undefined,
			},
		});

		// Trigger auto-reply execution
		void this.automationService
			.executeAutoReply(siteId, chat.id, text, "visitor")
			.catch(error => this.logger.error("Auto-reply execution failed", error.stack));

		// Schedule email fallback
		this.eventEmitter.emit("chat.visitor_message", {
			siteId,
			chatId: chat.id,
		});

		return message;
	}

	async saveAdminMessage(chatId: string, text: string, attachment?: string) {
		const message = await this.prisma.message.create({
			data: {
				chatId,
				from: "admin",
				text,
				attachment: attachment ? attachment : undefined,
			},
		});

		// Emit event so automation service can cancel pending auto-replies
		this.eventEmitter.emit("chat.admin_message", {
			siteId: (await this.getChatById(chatId))?.siteId,
			chatId,
		});

		return message;
	}

	async getChatsBySite(
		siteId: string,
		options?: { search?: string; cursor?: string; limit?: number },
	) {
		const limit = Math.min(options?.limit ?? 50, 100);
		const cursor = options?.cursor;
		const search = options?.search;

		const chats = await this.prisma.chat.findMany({
			where: {
				siteId,
				...(search
					? {
						OR: [
							{ visitorName: { contains: search, mode: "insensitive" } },
							{
								messages: {
									some: { text: { contains: search, mode: "insensitive" } },
								},
							},
						],
					}
					: {}),
			},
			orderBy: { createdAt: "desc" },
			take: limit + 1,
			...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
			include: {
				messages: {
					take: 1,
					orderBy: { createdAt: "desc" },
				},
			},
		});

		const hasMore = chats.length > limit;
		const items = hasMore ? chats.slice(0, limit) : chats;
		const nextCursor = hasMore ? items[items.length - 1].id : undefined;

		// Batch unread counts with groupBy instead of N+1 queries
		const chatIds = items.map(c => c.id);
		const unreadGroups = chatIds.length > 0
			? await this.prisma.message.groupBy({
				by: ["chatId"],
				where: {
					chatId: { in: chatIds },
					from: "visitor",
					read: false,
				},
				_count: { id: true },
			})
			: [];

		const unreadMap = new Map(unreadGroups.map(g => [g.chatId, g._count.id]));

		const data = items.map(chat => ({
			...chat,
			unreadCount: unreadMap.get(chat.id) ?? 0,
		}));

		return { data, nextCursor };
	}

	async getMessagesByChat(
		chatId: string,
		options?: { cursor?: string; limit?: number },
	) {
		const limit = Math.min(options?.limit ?? 50, 200);
		const cursor = options?.cursor;

		const messages = await this.prisma.message.findMany({
			where: { chatId },
			orderBy: { createdAt: "asc" },
			take: limit + 1,
			...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
		});

		const hasMore = messages.length > limit;
		const data = hasMore ? messages.slice(0, limit) : messages;
		const nextCursor = hasMore ? data[data.length - 1].id : undefined;

		return { data, nextCursor };
	}

	async clearChatMessages(chatId: string) {
		return this.prisma.message.deleteMany({
			where: { chatId },
		});
	}

	async deleteChat(chatId: string) {
		// First delete all messages due to FK constraints if not cascading
		await this.prisma.message.deleteMany({
			where: { chatId },
		});
		return this.prisma.chat.delete({
			where: { id: chatId },
		});
	}

	async getUnreadCount(siteId: string) {
		// Count all unread messages from visitors
		const unreadCount = await this.prisma.message.count({
			where: {
				chat: {
					siteId: siteId,
				},
				from: "visitor",
				read: false,
			},
		});
		return unreadCount;
	}

	async markMessagesAsRead(chatId: string) {
		// Mark all visitor messages in this chat as read
		return this.prisma.message.updateMany({
			where: {
				chatId: chatId,
				from: "visitor",
				read: false,
			},
			data: {
				read: true,
			},
		});
	}

	async renameVisitor(chatId: string, visitorName: string) {
		// Update the chat with the new visitor name
		return this.prisma.chat.update({
			where: { id: chatId },
			data: { visitorName },
		});
	}

	async findChatByVisitor(siteId: string, visitorId: string) {
		// Find the most recent chat for this visitor
		return this.prisma.chat.findFirst({
			where: {
				siteId,
				visitorId,
			},
			orderBy: {
				createdAt: "desc",
			},
		});
	}

	async updateChatStatus(chatId: string, status: "open" | "closed") {
		// Update the chat status
		return this.prisma.chat.update({
			where: { id: chatId },
			data: { status },
		});
	}

	async getMessageCount(chatId: string): Promise<number> {
		return this.prisma.message.count({
			where: { chatId },
		});
	}

	async deleteMessage(messageId: string) {
		return this.prisma.message.delete({
			where: { id: messageId },
		});
	}

	async editMessage(messageId: string, newText: string) {
		return this.prisma.message.update({
			where: { id: messageId },
			data: {
				text: newText,
				editedAt: new Date(),
			},
		});
	}

	async getMessageById(messageId: string) {
		return this.prisma.message.findUnique({
			where: { id: messageId },
		});
	}

	async getVisitorChatHistory(
		siteId: string,
		visitorId: string,
		options?: { cursor?: string; limit?: number },
	) {
		const chat = await this.findChatByVisitor(siteId, visitorId);
		if (!chat) return { data: [], nextCursor: undefined };
		return this.getMessagesByChat(chat.id, options);
	}
}
