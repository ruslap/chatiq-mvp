import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TelegramService } from './telegram.service';
import { SetupTelegramDto } from './dto/setup-telegram.dto';

@Controller('telegram')
@UseGuards(JwtAuthGuard)
export class TelegramController {
  constructor(private telegramService: TelegramService) {}

  @Post('setup')
  async setup(@Body() dto: SetupTelegramDto) {
    const result = await this.telegramService.setup(dto.siteId, dto.botToken);
    return {
      success: true,
      data: result,
    };
  }

  @Get('status/:siteId')
  async getStatus(@Param('siteId') siteId: string) {
    return this.telegramService.getStatus(siteId);
  }

  @Delete('disconnect/:siteId')
  async disconnect(@Param('siteId') siteId: string) {
    await this.telegramService.disconnect(siteId);
    return { success: true };
  }

  @Get('subscribers/:siteId')
  async getSubscribers(@Param('siteId') siteId: string) {
    const subscribers = await this.telegramService.getSubscribers(siteId);
    return { subscribers };
  }
}
