import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationService } from '../automation/automation.service';

@Injectable()
export class ChatService {
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ChatService {
    constructor(
        private prisma: PrismaService,
        private automationService: AutomationService,
        private eventEmitter: EventEmitter2
    ) { }

    async getChatById(chatId: string) {
        return this.prisma.chat.findUnique({
            where: { id: chatId },
        });
    }

    async saveVisitorMessage(siteId: string, visitorId: string, text: string, attachment?: string) {
        // 1. Ensure the site exists (SaaS logic: sites should be pre-registered, 
        // but for demo/testing we'll ensure it exists to avoid FK errors)
        let site = await this.prisma.site.findUnique({ where: { id: siteId } });

        if (!site) {
            console.log(`[ChatService] Site ${siteId} not found, creating a default one for testing...`);
            // Find any owner or create a dummy one if needed. 
            // For now, let's assume there is at least one user or we'll get another error.
            const user = await this.prisma.user.findFirst();
            if (user) {
                site = await this.prisma.site.create({
                    data: {
                        id: siteId,
                        name: 'Auto-created Test Site',
                        domain: 'localhost',
                        ownerId: user.id
                    }
                });
            } else {
                throw new Error("No users found in database to assign the new site to.");
            }
        }

        // 2. Find or create chat
        // First, try to find the most recent chat for this visitor (even if closed)
        let chat = await this.prisma.chat.findFirst({
            where: {
                siteId,
                visitorId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!chat) {
            // No chat exists, create a new one
            chat = await this.prisma.chat.create({
                data: {
                    siteId,
                    visitorId,
                    status: 'open',
                },
            });
        } else if (chat.status === 'closed') {
            // Reopen the existing chat
            chat = await this.prisma.chat.update({
                where: { id: chat.id },
                data: { status: 'open' },
            });
            console.log(`[ChatService] Reopened chat ${chat.id} for visitor ${visitorId}`);
        }

        const message = await this.prisma.message.create({
            data: {
                chatId: chat.id,
                from: 'visitor',
                text,
                attachment: attachment ? attachment : undefined,
            },
        });

        // Trigger auto-reply execution
        void this.automationService.executeAutoReply(siteId, chat.id, text, 'visitor')
            .catch(error => console.error('Auto-reply execution failed:', error));

        return message;
    }

    async saveAdminMessage(chatId: string, text: string, attachment?: string) {
        const message = await this.prisma.message.create({
            data: {
                chatId,
                from: 'admin',
                text,
                attachment: attachment ? JSON.stringify(attachment) : undefined,
            },
        });

        // Emit event so automation service can cancel pending auto-replies
        this.eventEmitter.emit('chat.admin_message', {
            siteId: (await this.getChatById(chatId))?.siteId,
            chatId,
        });

        return message;
    }

    async getChatsBySite(siteId: string, search?: string) {
        const chats = await this.prisma.chat.findMany({
            where: {
                siteId,
                ...(search ? {
                    OR: [
                        { visitorName: { contains: search, mode: 'insensitive' } },
                        { messages: { some: { text: { contains: search, mode: 'insensitive' } } } }
                    ]
                } : {})
            },
            orderBy: { createdAt: 'desc' },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        // Add unreadCount for each chat
        const chatsWithUnreadCount = await Promise.all(
            chats.map(async (chat) => {
                const unreadCount = await this.prisma.message.count({
                    where: {
                        chatId: chat.id,
                        from: 'visitor',
                        read: false
                    }
                });
                return {
                    ...chat,
                    unreadCount
                };
            })
        );

        return chatsWithUnreadCount;
    }

    async getMessagesByChat(chatId: string) {
        return this.prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async clearChatMessages(chatId: string) {
        return this.prisma.message.deleteMany({
            where: { chatId }
        });
    }

    async deleteChat(chatId: string) {
        // First delete all messages due to FK constraints if not cascading
        await this.prisma.message.deleteMany({
            where: { chatId }
        });
        return this.prisma.chat.delete({
            where: { id: chatId }
        });
    }

    async getUnreadCount(siteId: string) {
        // Count all unread messages from visitors
        const unreadCount = await this.prisma.message.count({
            where: {
                chat: {
                    siteId: siteId
                },
                from: 'visitor',
                read: false
            }
        });
        return unreadCount;
    }

    async markMessagesAsRead(chatId: string) {
        // Mark all visitor messages in this chat as read
        return this.prisma.message.updateMany({
            where: {
                chatId: chatId,
                from: 'visitor',
                read: false
            },
            data: {
                read: true
            }
        });
    }

    async renameVisitor(chatId: string, visitorName: string) {
        // Update the chat with the new visitor name
        return this.prisma.chat.update({
            where: { id: chatId },
            data: { visitorName }
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
                createdAt: 'desc'
            }
        });
    }

    async updateChatStatus(chatId: string, status: 'open' | 'closed') {
        // Update the chat status
        return this.prisma.chat.update({
            where: { id: chatId },
            data: { status }
        });
    }
}
