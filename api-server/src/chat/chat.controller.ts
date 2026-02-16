import { Controller, Get, Param, Delete, Patch, Body, Query, UseGuards, Logger, Req } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ChatService } from "./chat.service";
import { RenameVisitorDto } from "./dto";
import { SiteAccessGuard } from "../auth/site-access.guard";

@Controller("chats")
@UseGuards(AuthGuard("jwt"))
export class ChatController {
	private readonly logger = new Logger(ChatController.name);

	constructor(private readonly chatService: ChatService) {}

	@Get("site/:siteId")
	@UseGuards(SiteAccessGuard)
	getSiteChats(
		@Param("siteId") siteId: string,
		@Query("search") search?: string,
		@Query("cursor") cursor?: string,
		@Query("limit") limit?: string,
	) {
		return this.chatService.getChatsBySite(siteId, {
			search,
			cursor,
			limit: limit ? parseInt(limit, 10) : undefined,
		});
	}

	@Get(":chatId/history")
	async getChatMessages(
		@Req() request: { user: { userId: string } },
		@Param("chatId") chatId: string,
		@Query("cursor") cursor?: string,
		@Query("limit") limit?: string,
	) {
		await this.chatService.assertUserChatAccess(request.user.userId, chatId);
		this.logger.debug(`Fetching history for chatId: ${chatId}`);
		const result = await this.chatService.getMessagesByChat(chatId, {
			cursor,
			limit: limit ? parseInt(limit, 10) : undefined,
		});
		this.logger.debug(`Found ${result.data.length} messages`);
		return result;
	}

	@Delete(":chatId/clear")
	async clearChat(@Req() request: { user: { userId: string } }, @Param("chatId") chatId: string) {
		await this.chatService.assertUserChatAccess(request.user.userId, chatId);
		this.logger.debug(`Clearing history for chatId: ${chatId}`);
		return this.chatService.clearChatMessages(chatId);
	}

	@Delete(":chatId")
	async deleteChat(@Req() request: { user: { userId: string } }, @Param("chatId") chatId: string) {
		await this.chatService.assertUserChatAccess(request.user.userId, chatId);
		this.logger.debug(`Deleting chat: ${chatId}`);
		return this.chatService.deleteChat(chatId);
	}

	@Patch(":chatId/rename")
	async renameVisitor(
		@Req() request: { user: { userId: string } },
		@Param("chatId") chatId: string,
		@Body() dto: RenameVisitorDto,
	) {
		await this.chatService.assertUserChatAccess(request.user.userId, chatId);
		this.logger.debug(`Renaming visitor for chatId: ${chatId} to ${dto.visitorName}`);
		return this.chatService.renameVisitor(chatId, dto.visitorName);
	}

	@Delete("messages/:messageId")
	async deleteMessage(
		@Req() request: { user: { userId: string } },
		@Param("messageId") messageId: string,
	) {
		await this.chatService.assertUserMessageAccess(request.user.userId, messageId);
		this.logger.debug(`Deleting message: ${messageId}`);
		return this.chatService.deleteMessage(messageId);
	}

	@Patch("messages/:messageId")
	async editMessage(
		@Req() request: { user: { userId: string } },
		@Param("messageId") messageId: string,
		@Body() body: { text: string },
	) {
		await this.chatService.assertUserMessageAccess(request.user.userId, messageId);
		this.logger.debug(`Editing message: ${messageId}`);
		return this.chatService.editMessage(messageId, body.text);
	}
}
