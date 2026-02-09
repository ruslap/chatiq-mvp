import { Controller, Get, Param, Logger } from "@nestjs/common";
import { ChatService } from "./chat.service";

@Controller("chat")
export class ChatPublicController {
	private readonly logger = new Logger(ChatPublicController.name);

	constructor(private readonly chatService: ChatService) {}

	@Get("visitor-history/:siteId/:visitorId")
	async getVisitorHistory(
		@Param("siteId") siteId: string,
		@Param("visitorId") visitorId: string,
	) {
		this.logger.debug(`Fetching visitor history for site=${siteId}, visitor=${visitorId}`);
		const messages = await this.chatService.getVisitorChatHistory(siteId, visitorId);
		this.logger.debug(`Found ${messages.length} messages`);
		return messages;
	}
}
