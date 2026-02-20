import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { EmailFallbackService } from './email-fallback.service';
import { EmailFallbackProcessor } from './email-fallback.processor';

@Module({
    imports: [
        BullModule.registerQueue({ name: 'email-fallback' }),
        PrismaModule,
        MailModule,
    ],
    providers: [EmailFallbackService, EmailFallbackProcessor],
    exports: [EmailFallbackService],
})
export class EmailFallbackModule { }
