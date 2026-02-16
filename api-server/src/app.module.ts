import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { BullModule } from "@nestjs/bullmq";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { ChatModule } from "./chat/chat.module";
import { SitesModule } from "./sites/sites.module";
import { OrganizationModule } from "./organization/organization.module";
import { WidgetSettingsModule } from "./widget-settings/widget-settings.module";
import { AutomationModule } from "./automation/automation.module";
import { LeadsModule } from "./leads/leads.module";
import { UploadModule } from "./upload/upload.module";
import { RedisModule } from "./redis/redis.module";
import { TelegramModule } from "./telegram/telegram.module";

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		EventEmitterModule.forRoot(),
		BullModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				connection: {
					url: configService.get<string>("REDIS_URL", "redis://localhost:6379"),
				},
			}),
		}),
		PrismaModule,
		RedisModule,
		AuthModule,
		SitesModule,
		ChatModule,
		WidgetSettingsModule,
		OrganizationModule,
		UploadModule,
		AutomationModule,
		LeadsModule,
		TelegramModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
