import {
	WebSocketGateway,
	SubscribeMessage,
	MessageBody,
	ConnectedSocket,
	WebSocketServer,
	OnGatewayConnection,
	OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { ChatService } from "./chat.service";
import { OnEvent } from "@nestjs/event-emitter";

interface MessageData {
	text: string;
	createdAt: Date;
	from?: string;
	attachment?: string | null;
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

	// In-memory store for active visitors per site
	// Map<siteId, Map<visitorId, chatId>>
	private activeVisitors = new Map<string, Map<string, string>>();

	@WebSocketServer()
	server: Server;

	constructor(private readonly chatService: ChatService) {}

	@OnEvent("auto-reply.sent")
	handleAutoReplySent(payload: { siteId: string; chatId: string; visitorId: string; message: MessageData }) {
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

		this.logger.log(`Auto-reply delivered via WebSocket to room ${visitorRoom}`);
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

			// Remove from active visitors
			this.activeVisitors.get(siteId)?.delete(visitorId);

			// Find and update the chat status to closed
			void this.chatService
				.findChatByVisitor(siteId, visitorId)
				.then(chat => {
					if (chat) {
						this.logger.debug(`Found chat ${chat.id}, updating status to closed`);
						void this.chatService.updateChatStatus(chat.id, "closed").then(() => {
							this.logger.debug(`Status updated, emitting visitor:offline to admin:${siteId}`);
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

		// Track active visitor in memory
		if (!this.activeVisitors.has(siteId)) {
			this.activeVisitors.set(siteId, new Map());
		}

		// Find or create chat to get chatId
		const chat = await this.chatService.findChatByVisitor(siteId, visitorId);
		const chatId = chat?.id || null;

		// Store visitor as active
		if (chatId) {
			this.activeVisitors.get(siteId)!.set(visitorId, chatId);

			// Update chat status to open
			await this.chatService.updateChatStatus(chatId, "open");

			// Notify admins that visitor is online
			this.server.to(`admin:${siteId}`).emit("visitor:online", {
				chatId,
				visitorId,
			});
			this.logger.log(`Emitted visitor:online for ${visitorId} (chat: ${chatId})`);
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
		const message = await this.chatService.saveVisitorMessage(siteId, visitorId, text, attachment);

		// Update visitor name if provided
		if (visitorName && message.chatId) {
			void this.chatService.renameVisitor(message.chatId, visitorName).then(() => {
				this.logger.debug(`Updated visitor name to: ${visitorName}`);
			});
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
	handleAdminJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: { siteId: string }) {
		const { siteId } = payload;
		const adminRoom = `admin:${siteId}`;
		client.join(adminRoom);
		this.logger.log(`Admin joined room ${adminRoom}`);

		// Send current online visitors to this admin
		const siteVisitors = this.activeVisitors.get(siteId);
		const onlineVisitors: Array<{ visitorId: string; chatId: string }> = [];

		if (siteVisitors) {
			siteVisitors.forEach((chatId, visitorId) => {
				onlineVisitors.push({ visitorId, chatId });
			});
		}

		client.emit("visitors:status", { onlineVisitors });
		this.logger.log(`Sent visitors:status to admin with ${onlineVisitors.length} online visitors`);

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
		const { chatId, text, siteId, attachment } = payload;

		// Persist message
		const message = await this.chatService.saveAdminMessage(chatId, text, attachment);

		// Get chat to find visitorId
		const chat = await this.chatService.getChatById(chatId);
		if (chat) {
			const visitorRoom = `chat:${siteId}:${chat.visitorId}`;

			// Notify visitor
			this.server.to(visitorRoom).emit("admin:message", {
				text: message.text,
				createdAt: message.createdAt,
				attachment: message.attachment,
			});

			// Sync other admins
			const adminRoom = `admin:${siteId}`;
			this.server.to(adminRoom).emit("chat:message", message);
		}

		return message;
	}

	@SubscribeMessage("admin:get_unread_count")
	async handleGetUnreadCount(@ConnectedSocket() client: Socket, @MessageBody() payload: { siteId: string }) {
		const { siteId } = payload;
		const unreadCount = await this.chatService.getUnreadCount(siteId);
		client.emit("unread_count_update", unreadCount);
		return unreadCount;
	}

	@SubscribeMessage("admin:mark_read")
	async handleMarkAsRead(@ConnectedSocket() client: Socket, @MessageBody() payload: { chatId: string }) {
		const { chatId } = payload;
		await this.chatService.markMessagesAsRead(chatId);

		// Update unread count for all admins
		const chat = await this.chatService.getChatById(chatId);
		if (chat) {
			const adminRoom = `admin:${chat.siteId}`;
			const unreadCount = await this.chatService.getUnreadCount(chat.siteId);
			this.server.to(adminRoom).emit("unread_count_update", unreadCount);
		}

		return { status: "ok" };
	}

	@SubscribeMessage("visitor:disconnect")
	async handleVisitorDisconnect(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: { siteId: string; visitorId: string },
	) {
		this.logger.log(`Visitor ${payload.visitorId} disconnected from site ${payload.siteId}`);

		// Remove from active visitors
		this.activeVisitors.get(payload.siteId)?.delete(payload.visitorId);

		// Find and update the chat status to closed
		const chat = await this.chatService.findChatByVisitor(payload.siteId, payload.visitorId);
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
