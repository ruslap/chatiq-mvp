import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private readonly chatService: ChatService) { }

    @OnEvent('auto-reply.sent')
    handleAutoReplySent(payload: { siteId: string; chatId: string; visitorId: string; message: any }) {
        const { siteId, visitorId, message } = payload;
        
        // Send to visitor's room
        const visitorRoom = `chat:${siteId}:${visitorId}`;
        this.server.to(visitorRoom).emit('admin:message', {
            text: message.text,
            createdAt: message.createdAt,
            from: 'admin'
        });

        // Also notify admin room
        const adminRoom = `admin:${siteId}`;
        this.server.to(adminRoom).emit('chat:message', message);
        
        console.log(`Auto-reply delivered via WebSocket to room ${visitorRoom}`);
    }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
        
        // Try to get visitor info from the socket before it's fully disconnected
        const visitorData = client.handshake.query;
        const siteId = visitorData?.siteId as string;
        const visitorId = visitorData?.visitorId as string;
        
        console.log(`[handleDisconnect] Query params:`, visitorData);
        
        if (siteId && visitorId) {
            console.log(`Visitor ${visitorId} disconnected from site ${siteId}`);
            
            // Find and update the chat status to closed
            this.chatService.findChatByVisitor(siteId, visitorId).then(chat => {
                if (chat) {
                    console.log(`[handleDisconnect] Found chat ${chat.id}, updating status to closed`);
                    this.chatService.updateChatStatus(chat.id, 'closed').then(() => {
                        console.log(`[handleDisconnect] Status updated, emitting visitor:offline to admin:${siteId}`);
                        // Notify admins that visitor has left
                        this.server.to(`admin:${siteId}`).emit('visitor:offline', {
                            chatId: chat.id,
                            visitorId: visitorId
                        });
                        console.log(`[handleDisconnect] visitor:offline event emitted`);
                    });
                } else {
                    console.log(`[handleDisconnect] No chat found for visitor ${visitorId}`);
                }
            }).catch(err => {
                console.error(`[handleDisconnect] Error:`, err);
            });
        } else {
            console.log(`[handleDisconnect] Missing siteId or visitorId in query params`);
        }
    }

    @SubscribeMessage('visitor:join')
    async handleVisitorJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { siteId: string; visitorId: string },
    ) {
        const { siteId, visitorId } = payload;
        // Join a room specific to this site and visitor conversation
        const roomName = `chat:${siteId}:${visitorId}`;
        client.join(roomName);
        console.log(`Visitor ${visitorId} joined room ${roomName}`);
        return { status: 'ok', room: roomName };
    }

    @SubscribeMessage('visitor:message')
    async handleVisitorMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { siteId: string; visitorId: string; text: string; attachment?: any; visitorName?: string },
    ) {
        const { siteId, visitorId, text, attachment, visitorName } = payload;

        // Persist message
        const message = await this.chatService.saveVisitorMessage(siteId, visitorId, text, attachment);

        // Update visitor name if provided
        if (visitorName && message.chatId) {
            await this.chatService.renameVisitor(message.chatId, visitorName);
            console.log(`[ChatGateway] Updated visitor name to: ${visitorName}`);
        }

        const roomName = `chat:${siteId}:${visitorId}`;
        const adminRoom = `admin:${siteId}`;

        // Notify visitor (confirmation/sync across tabs)
        this.server.to(roomName).emit('chat:message', message);

        // Notify all admins of this site
        this.server.to(adminRoom).emit('chat:new_message', {
            ...message,
            visitorId,
            visitorName: visitorName || undefined,
        });

        return message;
    }

    @SubscribeMessage('admin:join')
    async handleAdminJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { siteId: string },
    ) {
        const { siteId } = payload;
        const adminRoom = `admin:${siteId}`;
        client.join(adminRoom);
        console.log(`Admin joined room ${adminRoom}`);
        return { status: 'ok' };
    }

    @SubscribeMessage('admin:message')
    async handleAdminMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { chatId: string; text: string; siteId: string; attachment?: any },
    ) {
        const { chatId, text, siteId, attachment } = payload;

        // Persist message
        const message = await this.chatService.saveAdminMessage(chatId, text, attachment);

        // Get chat to find visitorId
        const chat = await this.chatService.getChatById(chatId);
        if (chat) {
            const visitorRoom = `chat:${siteId}:${chat.visitorId}`;

            // Notify visitor
            this.server.to(visitorRoom).emit('admin:message', {
                text: message.text,
                createdAt: message.createdAt,
                attachment: message.attachment
            });

            // Sync other admins
            const adminRoom = `admin:${siteId}`;
            this.server.to(adminRoom).emit('chat:message', message);
        }

        return message;
    }

    @SubscribeMessage('admin:get_unread_count')
    async handleGetUnreadCount(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { siteId: string },
    ) {
        const { siteId } = payload;
        const unreadCount = await this.chatService.getUnreadCount(siteId);
        client.emit('unread_count_update', unreadCount);
        return unreadCount;
    }

    @SubscribeMessage('admin:mark_read')
    async handleMarkAsRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { chatId: string },
    ) {
        const { chatId } = payload;
        await this.chatService.markMessagesAsRead(chatId);
        
        // Update unread count for all admins
        const chat = await this.chatService.getChatById(chatId);
        if (chat) {
            const adminRoom = `admin:${chat.siteId}`;
            const unreadCount = await this.chatService.getUnreadCount(chat.siteId);
            this.server.to(adminRoom).emit('unread_count_update', unreadCount);
        }
        
        return { status: 'ok' };
    }

    @SubscribeMessage('visitor:disconnect')
    async handleVisitorDisconnect(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { siteId: string; visitorId: string },
    ) {
        console.log(`Visitor ${payload.visitorId} disconnected from site ${payload.siteId}`);
        
        // Find and update the chat status to closed
        const chat = await this.chatService.findChatByVisitor(payload.siteId, payload.visitorId);
        if (chat) {
            await this.chatService.updateChatStatus(chat.id, 'closed');
            
            // Notify admins that visitor has left
            this.server.to(`admin:${payload.siteId}`).emit('visitor:offline', {
                chatId: chat.id,
                visitorId: payload.visitorId
            });
        }
    }
}
