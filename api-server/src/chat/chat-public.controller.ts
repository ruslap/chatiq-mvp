import { Controller, Get, Param, Query, Logger } from "@nestjs/common";
import { ChatService } from "./chat.service";

@Controller("chat")
export class ChatPublicController {
	private readonly logger = new Logger(ChatPublicController.name);

	constructor(private readonly chatService: ChatService) {}

	@Get("visitor-history/:siteId/:visitorId")
	async getVisitorHistory(
		@Param("siteId") siteId: string,
		@Param("visitorId") visitorId: string,
		@Query("cursor") cursor?: string,
		@Query("limit") limit?: string,
	) {
		this.logger.debug(`Fetching visitor history for site=${siteId}, visitor=${visitorId}`);
		const result = await this.chatService.getVisitorChatHistory(siteId, visitorId, {
			cursor,
			limit: limit ? parseInt(limit, 10) : undefined,
		});
		this.logger.debug(`Found ${result.data.length} messages`);
		return result;
	}
}
