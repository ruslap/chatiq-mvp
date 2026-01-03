import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { WidgetSettingsService } from './widget-settings.service';

@Controller('widget-settings')
export class WidgetSettingsController {
    constructor(private widgetSettingsService: WidgetSettingsService) { }

    @Get(':organizationId')
    async getSettings(@Param('organizationId') organizationId: string) {
        return this.widgetSettingsService.getSettings(organizationId);
    }

    @Put(':organizationId')
    async updateSettings(
        @Param('organizationId') organizationId: string,
        @Body()
        data: {
            color?: string;
            secondaryColor?: string;
            operatorName?: string;
            operatorAvatar?: string;
            welcomeMessage?: string;
            showWelcome?: boolean;
            position?: string;
            size?: string;
            language?: string;
            showContactForm?: boolean;
        },
    ) {
        return this.widgetSettingsService.updateSettings(organizationId, data);
    }
}
