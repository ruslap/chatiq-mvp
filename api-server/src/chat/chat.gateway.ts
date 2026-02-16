import {
	WebSocketGateway,
	SubscribeMessage,
	MessageBody,
	ConnectedSocket,
	WebSocketServer,
	OnGatewayConnection,
	OnGatewayDisconnect,
	WsException,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { ChatService } from "./chat.service";
import { OnEvent } from "@nestjs/event-emitter";
import { TelegramNotificationService } from "../telegram/telegram-notification.service";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

interface MessageData {
	text: string;
	createdAt: Date;
	from?: string;
	attachment?: string | null;
}

interface SocketJwtPayload {
	sub: string;
	email: string;
	role: string;
}

@WebSocketGateway({
	cors: {
		origin: "*",
		credentials: false,
	},
	transports: ["websocket", "polling"],
	allowEIO3: true,
	pingTimeout: 60000,
	pingInterval: 25000,
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger = new Logger(ChatGateway.name);

	private readonly PRESENCE_KEY_PREFIX = "presence:visitors:";
	private readonly PRESENCE_TTL = 3600; // 1 hour

	@WebSocketServer()
	server: Server;

	constructor(
		private readonly chatService: ChatService,
		private readonly telegramNotificationService: TelegramNotificationService,
		private readonly jwtService: JwtService,
		private readonly prisma: PrismaService,
		private readonly redisService: RedisService,
	) {}

	// --- Shared presence helpers (Redis-backed, fallback to noop) ---

	private async setVisitorPresence(siteId: string, visitorId: string, chatId: string): Promise<void> {
		const client = this.redisService.getClient();
		if (!this.redisService.isAvailable()) return;
		try {
			const key = `${this.PRESENCE_KEY_PREFIX}${siteId}`;
			await client.hset(key, visitorId, chatId);
			await client.expire(key, this.PRESENCE_TTL);
		} catch {
			this.logger.warn("Failed to set visitor presence in Redis");
		}
	}

	private async removeVisitorPresence(siteId: string, visitorId: string): Promise<void> {
		if (!this.redisService.isAvailable()) return;
		try {
			await this.redisService.getClient().hdel(`${this.PRESENCE_KEY_PREFIX}${siteId}`, visitorId);
		} catch {
			this.logger.warn("Failed to remove visitor presence from Redis");
		}
	}

	private async getOnlineVisitors(siteId: string): Promise<Array<{ visitorId: string; chatId: string }>> {
		if (!this.redisService.isAvailable()) return [];
		try {
			const data = await this.redisService.getClient().hgetall(`${this.PRESENCE_KEY_PREFIX}${siteId}`);
			if (!data) return [];
			return Object.entries(data).map(([visitorId, chatId]) => ({ visitorId, chatId }));
		} catch {
			return [];
		}
	}

	private getSocketToken(client: Socket): string | null {
		const authToken = client.handshake.auth?.token;
		if (typeof authToken === "string" && authToken.trim()) {
			return authToken.trim();
		}

		const authHeader = client.handshake.headers?.authorization;
		if (
			typeof authHeader === "string" &&
			authHeader.toLowerCase().startsWith("bearer ")
		) {
			return authHeader.slice(7).trim();
		}

		return null;
	}

	private async authenticateAdminClient(client: Socket): Promise<SocketJwtPayload> {
		const cachedPayload = client.data?.adminPayload as SocketJwtPayload | undefined;
		if (cachedPayload?.sub) {
			return cachedPayload;
		}

		const token = this.getSocketToken(client);
		if (!token) {
			throw new WsException("Unauthorized: missing auth token");
		}

		try {
			const payload = await this.jwtService.verifyAsync<SocketJwtPayload>(token);
			client.data.adminPayload = payload;
			return payload;
		} catch {
			throw new WsException("Unauthorized: invalid auth token");
		}
	}

	private async assertAdminSiteAccess(client: Socket, siteId: string): Promise<void> {
		const payload = await this.authenticateAdminClient(client);

		const site = await this.prisma.site.findFirst({
			where: {
				id: siteId,
				OR: [
					{ ownerId: payload.sub },
					{ operators: { some: { userId: payload.sub } } },
				],
			},
			select: { id: true },
		});

		if (!site) {
			throw new WsException("Forbidden: no access to requested site");
		}
	}

	@OnEvent("auto-reply.sent")
	handleAutoReplySent(payload: {
		siteId: string;
		chatId: string;
		visitorId: string;
		message: MessageData;
	}) {
		const { siteId, visitorId, message } = payload;

		// Send to visitor's room
		const visitorRoom = `chat:${siteId}:${visitorId}`;
		this.server.to(visitorRoom).emit("admin:message", {
			text: message.text,
			createdAt: message.createdAt,
			from: "admin",
		});

		// Also notify admin room
		const adminRoom = `admin:${siteId}`;
		this.server.to(adminRoom).emit("chat:message", message);

		this.logger.log(
			`Auto-reply delivered via WebSocket to room ${visitorRoom}`,
		);
	}

	handleConnection(client: Socket) {
		this.logger.debug(`Client connected: ${client.id}`);
	}

	handleDisconnect(client: Socket) {
		this.logger.debug(`Client disconnected: ${client.id}`);

		// Try to get visitor info from the socket before it's fully disconnected
		const visitorData = client.handshake.query;
		const siteId = visitorData?.siteId as string;
		const visitorId = visitorData?.visitorId as string;

		this.logger.debug(`Query params: ${JSON.stringify(visitorData)}`);

		if (siteId && visitorId) {
			this.logger.log(`Visitor ${visitorId} disconnected from site ${siteId}`);

			// Remove from shared presence store
			void this.removeVisitorPresence(siteId, visitorId);

			// Find and update the chat status to closed
			void this.chatService
				.findChatByVisitor(siteId, visitorId)
				.then(chat => {
					if (chat) {
						this.logger.debug(
							`Found chat ${chat.id}, updating status to closed`,
						);
						void this.chatService
							.updateChatStatus(chat.id, "closed")
							.then(() => {
								this.logger.debug(
									`Status updated, emitting visitor:offline to admin:${siteId}`,
								);
								// Notify admins that visitor has left
								this.server.to(`admin:${siteId}`).emit("visitor:offline", {
									chatId: chat.id,
									visitorId: visitorId,
								});
								this.logger.debug("visitor:offline event emitted");
							});
					} else {
						this.logger.debug(`No chat found for visitor ${visitorId}`);
					}
				})
				.catch(err => {
					this.logger.error("Error during disconnect handling", err.stack);
				});
		} else {
			this.logger.debug("Missing siteId or visitorId in query params");
		}
	}

	@SubscribeMessage("visitor:join")
	async handleVisitorJoin(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: { siteId: string; visitorId: string },
	) {
		const { siteId, visitorId } = payload;
		// Join a room specific to this site and visitor conversation
		const roomName = `chat:${siteId}:${visitorId}`;
		client.join(roomName);
		this.logger.log(`Visitor ${visitorId} joined room ${roomName}`);

		// Find or create chat to get chatId
		const chat = await this.chatService.findChatByVisitor(siteId, visitorId);
		const chatId = chat?.id || null;

		// Store visitor in shared presence store
		if (chatId) {
			await this.setVisitorPresence(siteId, visitorId, chatId);

			// Update chat status to open
			await this.chatService.updateChatStatus(chatId, "open");

			// Notify admins that visitor is online
			this.server.to(`admin:${siteId}`).emit("visitor:online", {
				chatId,
				visitorId,
			});
			this.logger.log(
				`Emitted visitor:online for ${visitorId} (chat: ${chatId})`,
			);
		}

		return { status: "ok", room: roomName };
	}

	@SubscribeMessage("visitor:message")
	async handleVisitorMessage(
		@ConnectedSocket() client: Socket,
		@MessageBody()
		payload: {
			siteId: string;
			visitorId: string;
			text: string;
			attachment?: string;
			visitorName?: string;
		},
	) {
		const { siteId, visitorId, text, attachment, visitorName } = payload;

		// Persist message
		const message = await this.chatService.saveVisitorMessage(
			siteId,
			visitorId,
			text,
			attachment,
		);

		// Update visitor name if provided
		if (visitorName && message.chatId) {
			await this.chatService.renameVisitor(message.chatId, visitorName);
			this.logger.debug(`Updated visitor name to: ${visitorName}`);
		}

		// Check if this is the first message and send Telegram notification
		const chat = await this.chatService.getChatById(message.chatId);
		if (chat) {
			const messageCount = await this.chatService.getMessageCount(chat.id);
			if (messageCount === 1) {
				void this.telegramNotificationService
					.notifyNewLead(chat, message)
					.catch((error) =>
						this.logger.error('Failed to send Telegram notification', error.stack),
					);
			}
		}

		const roomName = `chat:${siteId}:${visitorId}`;
		const adminRoom = `admin:${siteId}`;

		// Notify visitor (confirmation/sync across tabs)
		this.server.to(roomName).emit("chat:message", message);

		// Notify all admins of this site
		this.server.to(adminRoom).emit("chat:new_message", {
			...message,
			visitorId,
			visitorName: visitorName || undefined,
		});

		return message;
	}

	@SubscribeMessage("admin:join")
	async handleAdminJoin(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: { siteId: string },
	) {
		const { siteId } = payload;
		await this.assertAdminSiteAccess(client, siteId);

		const adminRoom = `admin:${siteId}`;
		client.join(adminRoom);
		this.logger.log(`Admin joined room ${adminRoom}`);

		// Send current online visitors to this admin (from shared Redis store)
		const onlineVisitors = await this.getOnlineVisitors(siteId);

		client.emit("visitors:status", { onlineVisitors });
		this.logger.log(
			`Sent visitors:status to admin with ${onlineVisitors.length} online visitors`,
		);

		return { status: "ok" };
	}

	@SubscribeMessage("admin:message")
	async handleAdminMessage(
		@ConnectedSocket() client: Socket,
		@MessageBody()
		payload: {
			chatId: string;
			text: string;
			siteId: string;
			attachment?: string;
		},
	) {
		const { chatId, text, attachment } = payload;

		const chat = await this.chatService.getChatById(chatId);
		if (!chat) return { error: "Chat not found" };

		await this.assertAdminSiteAccess(client, chat.siteId);

		// Persist message
		const message = await this.chatService.saveAdminMessage(
			chatId,
			text,
			attachment,
		);

		const visitorRoom = `chat:${chat.siteId}:${chat.visitorId}`;

		// Notify visitor
		this.server.to(visitorRoom).emit("admin:message", {
			messageId: message.id,
			text: message.text,
			createdAt: message.createdAt,
			attachment: message.attachment,
		});

		// Sync other admins
		const adminRoom = `admin:${chat.siteId}`;
		this.server.to(adminRoom).emit("chat:message", message);

		return message;
	}

	@SubscribeMessage("admin:edit_message")
	async handleEditMessage(
		@ConnectedSocket() client: Socket,
		@MessageBody()
		payload: {
			messageId: string;
			text: string;
			siteId: string;
		},
	) {
		const { messageId, text } = payload;

		const message = await this.chatService.getMessageById(messageId);
		if (!message) return { error: "Message not found" };

		const chat = await this.chatService.getChatById(message.chatId);
		if (!chat) return { error: "Chat not found" };

		await this.assertAdminSiteAccess(client, chat.siteId);

		const updated = await this.chatService.editMessage(messageId, text);

		const visitorRoom = `chat:${chat.siteId}:${chat.visitorId}`;
		const adminRoom = `admin:${chat.siteId}`;

		this.server.to(visitorRoom).emit("message:edited", {
			messageId: updated.id,
			text: updated.text,
			editedAt: updated.editedAt,
		});

		this.server.to(adminRoom).emit("message:edited", {
			messageId: updated.id,
			chatId: updated.chatId,
			text: updated.text,
			editedAt: updated.editedAt,
		});

		return updated;
	}

	@SubscribeMessage("admin:delete_message")
	async handleDeleteMessage(
		@ConnectedSocket() client: Socket,
		@MessageBody()
		payload: {
			messageId: string;
			siteId: string;
		},
	) {
		const { messageId } = payload;

		const message = await this.chatService.getMessageById(messageId);
		if (!message) return { error: "Message not found" };

		const chatId = message.chatId;
		const chat = await this.chatService.getChatById(chatId);
		if (!chat) return { error: "Chat not found" };

		await this.assertAdminSiteAccess(client, chat.siteId);

		await this.chatService.deleteMessage(messageId);

		const visitorRoom = `chat:${chat.siteId}:${chat.visitorId}`;
		const adminRoom = `admin:${chat.siteId}`;

		this.server.to(visitorRoom).emit("message:deleted", {
			messageId,
		});

		this.server.to(adminRoom).emit("message:deleted", {
			messageId,
			chatId,
		});

		return { status: "ok" };
	}

	@SubscribeMessage("admin:get_unread_count")
	async handleGetUnreadCount(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: { siteId: string },
	) {
		const { siteId } = payload;
		await this.assertAdminSiteAccess(client, siteId);

		const unreadCount = await this.chatService.getUnreadCount(siteId);
		client.emit("unread_count_update", unreadCount);
		return unreadCount;
	}

	@SubscribeMessage("admin:mark_read")
	async handleMarkAsRead(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: { chatId: string },
	) {
		const { chatId } = payload;
		const chat = await this.chatService.getChatById(chatId);
		if (!chat) return { error: "Chat not found" };

		await this.assertAdminSiteAccess(client, chat.siteId);

		await this.chatService.markMessagesAsRead(chatId);

		// Update unread count for all admins
		const adminRoom = `admin:${chat.siteId}`;
		const unreadCount = await this.chatService.getUnreadCount(chat.siteId);
		this.server.to(adminRoom).emit("unread_count_update", unreadCount);

		return { status: "ok" };
	}

	@SubscribeMessage("visitor:disconnect")
	async handleVisitorDisconnect(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: { siteId: string; visitorId: string },
	) {
		this.logger.log(
			`Visitor ${payload.visitorId} disconnected from site ${payload.siteId}`,
		);

		// Remove from shared presence store
		await this.removeVisitorPresence(payload.siteId, payload.visitorId);

		// Find and update the chat status to closed
		const chat = await this.chatService.findChatByVisitor(
			payload.siteId,
			payload.visitorId,
		);
		if (chat) {
			await this.chatService.updateChatStatus(chat.id, "closed");

			// Notify admins that visitor has left
			this.server.to(`admin:${payload.siteId}`).emit("visitor:offline", {
				chatId: chat.id,
				visitorId: payload.visitorId,
			});
		}
	}
}
