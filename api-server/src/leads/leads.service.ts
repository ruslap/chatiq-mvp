import { Injectable, Logger, ForbiddenException, NotFoundException } from "@nestjs/common";
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

	async getLeadsBySite(
		siteId: string,
		options?: { cursor?: string; limit?: number },
	) {
		const limit = Math.min(options?.limit ?? 50, 100);
		const cursor = options?.cursor;

		const leads = await this.prisma.contactLead.findMany({
			where: { siteId },
			orderBy: { createdAt: "desc" },
			take: limit + 1,
			...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
		});

		const hasMore = leads.length > limit;
		const data = hasMore ? leads.slice(0, limit) : leads;
		const nextCursor = hasMore ? data[data.length - 1].id : undefined;

		return { data, nextCursor };
	}

	async assertUserLeadAccess(userId: string, leadId: string) {
		const lead = await this.prisma.contactLead.findUnique({
			where: { id: leadId },
			select: { id: true, siteId: true },
		});

		if (!lead) {
			throw new NotFoundException("Lead not found");
		}

		const site = await this.prisma.site.findFirst({
			where: {
				id: lead.siteId,
				OR: [
					{ ownerId: userId },
					{ operators: { some: { userId } } },
				],
			},
			select: { id: true },
		});

		if (!site) {
			throw new ForbiddenException("You do not have access to this lead");
		}
	}

	async deleteLead(id: string) {
		return this.prisma.contactLead.delete({
			where: { id },
		});
	}
}
