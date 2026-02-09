import { Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { ChatPublicController } from "./chat-public.controller";
import { AutomationModule } from "../automation/automation.module";
import { TelegramModule } from "../telegram/telegram.module";

@Module({
	imports: [AutomationModule, TelegramModule],
	controllers: [ChatController, ChatPublicController],
	providers: [ChatGateway, ChatService],
})
export class ChatModule {}
