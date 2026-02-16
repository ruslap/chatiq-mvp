import { Module } from "@nestjs/common";
import { LeadsController } from "./leads.controller";
import { LeadsService } from "./leads.service";
import { TelegramModule } from "../telegram/telegram.module";
import { SiteAccessGuard } from "../auth/site-access.guard";

@Module({
	imports: [TelegramModule],
	controllers: [LeadsController],
	providers: [LeadsService, SiteAccessGuard],
	exports: [LeadsService],
})
export class LeadsModule {}

