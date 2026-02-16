import { Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { ChatPublicController } from "./chat-public.controller";
import { AutomationModule } from "../automation/automation.module";
import { TelegramModule } from "../telegram/telegram.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SiteAccessGuard } from "../auth/site-access.guard";
import { RedisModule } from "../redis/redis.module";

@Module({
	imports: [
		AutomationModule,
		TelegramModule,
		RedisModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				secret: configService.getOrThrow<string>("JWT_SECRET"),
			}),
		}),
	],
	controllers: [ChatController, ChatPublicController],
	providers: [ChatGateway, ChatService, SiteAccessGuard],
})
export class ChatModule {}
