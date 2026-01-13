import { Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { AutomationModule } from "../automation/automation.module";

@Module({
	imports: [AutomationModule],
	controllers: [ChatController],
	providers: [ChatGateway, ChatService],
})
export class ChatModule {}
