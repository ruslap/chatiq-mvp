import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WidgetSettingsService {
    constructor(private prisma: PrismaService) { }

    async getSettings(organizationId: string) {
        let settings = await this.prisma.widgetSettings.findUnique({
            where: { organizationId },
        });

        // If no settings exist, create default settings
        if (!settings) {
            settings = await this.prisma.widgetSettings.create({
                data: { organizationId },
            });
        }

        return settings;
    }

    async updateSettings(
        organizationId: string,
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
        // Upsert - create if doesn't exist, update if exists
        return this.prisma.widgetSettings.upsert({
            where: { organizationId },
            create: {
                organizationId,
                ...data,
            },
            update: data,
        });
    }
}
