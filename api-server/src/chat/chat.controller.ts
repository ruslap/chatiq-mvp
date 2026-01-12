import {
  Controller,
  Get,
  Param,
  Delete,
  Patch,
  Body,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { RenameVisitorDto } from './dto';

@Controller('chats')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Get('site/:siteId')
  getSiteChats(
    @Param('siteId') siteId: string,
    @Query('search') search?: string,
  ) {
    return this.chatService.getChatsBySite(siteId, search);
  }

  @Get(':chatId/history')
  async getChatMessages(@Param('chatId') chatId: string) {
    this.logger.debug(`Fetching history for chatId: ${chatId}`);
    const messages = await this.chatService.getMessagesByChat(chatId);
    this.logger.debug(`Found ${messages.length} messages`);
    return messages;
  }

  @Delete(':chatId/clear')
  async clearChat(@Param('chatId') chatId: string) {
    this.logger.debug(`Clearing history for chatId: ${chatId}`);
    return this.chatService.clearChatMessages(chatId);
  }

  @Delete(':chatId')
  async deleteChat(@Param('chatId') chatId: string) {
    this.logger.debug(`Deleting chat: ${chatId}`);
    return this.chatService.deleteChat(chatId);
  }

  @Patch(':chatId/rename')
  async renameVisitor(
    @Param('chatId') chatId: string,
    @Body() dto: RenameVisitorDto,
  ) {
    this.logger.debug(
      `Renaming visitor for chatId: ${chatId} to ${dto.visitorName}`,
    );
    return this.chatService.renameVisitor(chatId, dto.visitorName);
  }
}
