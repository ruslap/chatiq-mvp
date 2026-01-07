import { Controller, Get, Param, Delete, Patch, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chats')
// @UseGuards(AuthGuard('jwt'))
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('site/:siteId')
    getSiteChats(@Param('siteId') siteId: string) {
        return this.chatService.getChatsBySite(siteId);
    }

    @Get(':chatId/history')
    async getChatMessages(@Param('chatId') chatId: string) {
        console.log(`[ChatController] Fetching history for chatId: "${chatId}"`);
        const messages = await this.chatService.getMessagesByChat(chatId);
        console.log(`[ChatController] Found ${messages.length} messages`);
        return messages;
    }

    @Delete(':chatId/clear')
    async clearChat(@Param('chatId') chatId: string) {
        console.log(`[ChatController] Clearing history for chatId: "${chatId}"`);
        return this.chatService.clearChatMessages(chatId);
    }

    @Delete(':chatId')
    async deleteChat(@Param('chatId') chatId: string) {
        console.log(`[ChatController] Deleting chat: "${chatId}"`);
        return this.chatService.deleteChat(chatId);
    }

    @Patch(':chatId/rename')
    async renameVisitor(
        @Param('chatId') chatId: string,
        @Body('visitorName') visitorName: string
    ) {
        console.log(`[ChatController] Renaming visitor for chatId: "${chatId}" to "${visitorName}"`);
        return this.chatService.renameVisitor(chatId, visitorName);
    }
}
