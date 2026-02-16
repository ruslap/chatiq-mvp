import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { TelegramService } from './telegram.service';
import { TelegramNotificationService } from './telegram-notification.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SiteAccessGuard } from '../auth/site-access.guard';

@Module({
  imports: [PrismaModule],
  controllers: [TelegramController, TelegramWebhookController],
  providers: [TelegramService, TelegramNotificationService, SiteAccessGuard],
  exports: [TelegramNotificationService],
})
export class TelegramModule {}
