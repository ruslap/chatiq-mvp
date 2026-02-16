import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AutomationController } from "./automation.controller";
import { AutomationService } from "./automation.service";
import { AutoReplyProcessor, AUTO_REPLY_QUEUE } from "./auto-reply.processor";
import { PrismaModule } from "../prisma/prisma.module";
import { SiteAccessGuard } from "../auth/site-access.guard";

@Module({
	imports: [
		PrismaModule,
		BullModule.registerQueue({ name: AUTO_REPLY_QUEUE }),
	],
	controllers: [AutomationController],
	providers: [AutomationService, AutoReplyProcessor, SiteAccessGuard],
	exports: [AutomationService],
})
export class AutomationModule {}
