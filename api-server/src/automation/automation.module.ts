import { Module } from "@nestjs/common";
import { AutomationController } from "./automation.controller";
import { AutomationService } from "./automation.service";
import { PrismaModule } from "../prisma/prisma.module";
import { SiteAccessGuard } from "../auth/site-access.guard";

@Module({
	imports: [PrismaModule],
	controllers: [AutomationController],
	providers: [AutomationService, SiteAccessGuard],
	exports: [AutomationService],
})
export class AutomationModule {}
