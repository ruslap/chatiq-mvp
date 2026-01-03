import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { AutomationService } from './automation.service';

@Controller('automation')
export class AutomationController {
    constructor(private readonly automationService: AutomationService) {}

    // ============ AUTO-REPLIES ============

    @Get('auto-replies/:siteId')
    async getAutoReplies(@Param('siteId') siteId: string) {
        return this.automationService.getAutoReplies(siteId);
    }

    @Post('auto-replies/:siteId')
    async createAutoReply(
        @Param('siteId') siteId: string,
        @Body() data: {
            name: string;
            trigger: string;
            message: string;
            delay?: number;
            isActive?: boolean;
        }
    ) {
        return this.automationService.createAutoReply(siteId, data);
    }

    @Patch('auto-replies/:id')
    async updateAutoReply(
        @Param('id') id: string,
        @Body() data: {
            name?: string;
            trigger?: string;
            message?: string;
            delay?: number;
            isActive?: boolean;
            order?: number;
        }
    ) {
        return this.automationService.updateAutoReply(id, data);
    }

    @Delete('auto-replies/:id')
    async deleteAutoReply(@Param('id') id: string) {
        return this.automationService.deleteAutoReply(id);
    }

    // ============ QUICK TEMPLATES ============

    @Get('templates/:siteId')
    async getQuickTemplates(@Param('siteId') siteId: string) {
        return this.automationService.getQuickTemplates(siteId);
    }

    @Get('templates/:siteId/active')
    async getActiveQuickTemplates(@Param('siteId') siteId: string) {
        return this.automationService.getActiveQuickTemplates(siteId);
    }

    @Post('templates/:siteId')
    async createQuickTemplate(
        @Param('siteId') siteId: string,
        @Body() data: {
            title: string;
            message: string;
            shortcut?: string;
            category?: string;
            isActive?: boolean;
        }
    ) {
        return this.automationService.createQuickTemplate(siteId, data);
    }

    @Patch('templates/:id')
    async updateQuickTemplate(
        @Param('id') id: string,
        @Body() data: {
            title?: string;
            message?: string;
            shortcut?: string;
            category?: string;
            isActive?: boolean;
            order?: number;
        }
    ) {
        return this.automationService.updateQuickTemplate(id, data);
    }

    @Delete('templates/:id')
    async deleteQuickTemplate(@Param('id') id: string) {
        return this.automationService.deleteQuickTemplate(id);
    }

    // ============ BUSINESS HOURS ============

    @Get('business-hours/:siteId')
    async getBusinessHours(@Param('siteId') siteId: string) {
        return this.automationService.getBusinessHours(siteId);
    }

    @Patch('business-hours/:siteId')
    async updateBusinessHours(
        @Param('siteId') siteId: string,
        @Body() data: {
            timezone?: string;
            isEnabled?: boolean;
            offlineMessage?: string;
            monday?: { start: string; end: string; isOpen: boolean };
            tuesday?: { start: string; end: string; isOpen: boolean };
            wednesday?: { start: string; end: string; isOpen: boolean };
            thursday?: { start: string; end: string; isOpen: boolean };
            friday?: { start: string; end: string; isOpen: boolean };
            saturday?: { start: string; end: string; isOpen: boolean };
            sunday?: { start: string; end: string; isOpen: boolean };
        }
    ) {
        return this.automationService.updateBusinessHours(siteId, data);
    }

    @Get('business-hours/:siteId/status')
    async getBusinessHoursStatus(@Param('siteId') siteId: string) {
        return this.automationService.isWithinBusinessHours(siteId);
    }

    // ============ AUTO-REPLY EXECUTION ============

    @Post('auto-reply/:siteId/:chatId')
    async executeAutoReply(
        @Param('siteId') siteId: string,
        @Param('chatId') chatId: string,
        @Body() data: { message: string; from: 'admin' | 'visitor' }
    ) {
        await this.automationService.executeAutoReply(siteId, chatId, data.message, data.from);
        return { success: true };
    }

    // ============ SEED DEFAULTS ============

    @Post('seed/:siteId')
    async seedDefaults(@Param('siteId') siteId: string) {
        await this.automationService.seedDefaultAutoReplies(siteId);
        await this.automationService.seedDefaultQuickTemplates(siteId);
        return { success: true, message: 'Default auto-replies and templates created' };
    }
}
