import { Module } from "@nestjs/common";
import { LeadsController } from "./leads.controller";
import { LeadsService } from "./leads.service";
import { TelegramModule } from "../telegram/telegram.module";

@Module({
	imports: [TelegramModule],
	controllers: [LeadsController],
	providers: [LeadsService],
	exports: [LeadsService],
})
export class LeadsModule {}

