import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AutomationService } from './automation.service';
import {
  CreateAutoReplyDto,
  UpdateAutoReplyDto,
  CreateQuickTemplateDto,
  UpdateQuickTemplateDto,
  UpdateBusinessHoursDto,
  ExecuteAutoReplyDto,
} from './dto';

@Controller('automation')
@UseGuards(AuthGuard('jwt'))
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
    @Body() dto: CreateAutoReplyDto,
  ) {
    return this.automationService.createAutoReply(siteId, dto);
  }

  @Patch('auto-replies/:siteId/:id')
  async updateAutoReply(
    @Param('siteId') siteId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAutoReplyDto,
  ) {
    return this.automationService.updateAutoReply(siteId, id, dto);
  }

  @Delete('auto-replies/:siteId/:id')
  async deleteAutoReply(
    @Param('siteId') siteId: string,
    @Param('id') id: string,
  ) {
    return this.automationService.deleteAutoReply(siteId, id);
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
    @Body() dto: CreateQuickTemplateDto,
  ) {
    return this.automationService.createQuickTemplate(siteId, dto);
  }

  @Patch('templates/:siteId/:id')
  async updateQuickTemplate(
    @Param('siteId') siteId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQuickTemplateDto,
  ) {
    return this.automationService.updateQuickTemplate(siteId, id, dto);
  }

  @Delete('templates/:siteId/:id')
  async deleteQuickTemplate(
    @Param('siteId') siteId: string,
    @Param('id') id: string,
  ) {
    return this.automationService.deleteQuickTemplate(siteId, id);
  }

  // ============ BUSINESS HOURS ============

  @Get('business-hours/:siteId')
  async getBusinessHours(@Param('siteId') siteId: string) {
    return this.automationService.getBusinessHours(siteId);
  }

  @Patch('business-hours/:siteId')
  async updateBusinessHours(
    @Param('siteId') siteId: string,
    @Body() dto: UpdateBusinessHoursDto,
  ) {
    return this.automationService.updateBusinessHours(siteId, dto);
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
    @Body() dto: ExecuteAutoReplyDto,
  ) {
    await this.automationService.executeAutoReply(
      siteId,
      chatId,
      dto.message,
      dto.from,
    );
    return { success: true };
  }

  // ============ SEED DEFAULTS ============

  @Post('seed/:siteId')
  async seedDefaults(@Param('siteId') siteId: string) {
    await this.automationService.seedDefaultAutoReplies(siteId);
    await this.automationService.seedDefaultQuickTemplates(siteId);
    return {
      success: true,
      message: 'Default auto-replies and templates created',
    };
  }
}
