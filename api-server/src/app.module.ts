import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { AuthModule } from "./auth/auth.module";
import { SitesModule } from "./sites/sites.module";
import { ChatModule } from "./chat/chat.module";
import { WidgetSettingsModule } from "./widget-settings/widget-settings.module";
import { OrganizationModule } from "./organization/organization.module";
import { UploadModule } from "./upload/upload.module";
import { AutomationModule } from "./automation/automation.module";
import { LeadsModule } from "./leads/leads.module";

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		EventEmitterModule.forRoot(),
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
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
