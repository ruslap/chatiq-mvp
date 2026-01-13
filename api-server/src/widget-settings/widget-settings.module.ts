import { Module } from "@nestjs/common";
import { WidgetSettingsController } from "./widget-settings.controller";
import { WidgetSettingsService } from "./widget-settings.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
	imports: [PrismaModule],
	controllers: [WidgetSettingsController],
	providers: [WidgetSettingsService],
	exports: [WidgetSettingsService],
})
export class WidgetSettingsModule {}
