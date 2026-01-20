import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TelegramNotificationService } from "../telegram/telegram-notification.service";

@Injectable()
export class LeadsService {
	private readonly logger = new Logger(LeadsService.name);

	constructor(
		private prisma: PrismaService,
		private telegramNotification: TelegramNotificationService,
	) {}

	async createLead(data: {
		siteId: string;
		name: string;
		email?: string;
		phone?: string;
		message?: string;
	}) {
		const lead = await this.prisma.contactLead.create({
			data,
		});

		// Send Telegram notification
		try {
			await this.telegramNotification.notifyNewContactLead(lead);
			this.logger.log(`Telegram notification sent for lead ${lead.id}`);
		} catch (error) {
			this.logger.error(`Failed to send Telegram notification for lead ${lead.id}`, error);
		}

		return lead;
	}

	async getLeadsBySite(siteId: string) {
		return this.prisma.contactLead.findMany({
			where: { siteId },
			orderBy: { createdAt: "desc" },
		});
	}

	async deleteLead(id: string) {
		return this.prisma.contactLead.delete({
			where: { id },
		});
	}
}
