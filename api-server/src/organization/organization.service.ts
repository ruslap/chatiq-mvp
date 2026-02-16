import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class OrganizationService {
	constructor(private prisma: PrismaService) {}

	async getOrCreateOrganization(userId: string) {
		// First check if user already has an organization
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			include: { organization: true },
		});

		if (user?.organization) {
			return user.organization;
		}

		// Create a new organization and link the user
		const organizationId = uuidv4();

		const organization = await this.prisma.widgetSettings.create({
			data: {
				organizationId,
			},
		});

		// Link user to the new organization
		await this.prisma.user.update({
			where: { id: userId },
			data: { organizationId },
		});

		return organization;
	}

	async getOrganizationByUserId(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			include: { organization: true },
		});

		return user?.organization;
	}

	async updateOrganizationSettings(organizationId: string, settings: Record<string, unknown>) {
		return this.prisma.widgetSettings.update({
			where: { organizationId },
			data: settings,
		});
	}

	async addUserToOrganization(organizationId: string, userId: string) {
		return this.prisma.user.update({
			where: { id: userId },
			data: {
				organizationId,
			},
		});
	}
}
