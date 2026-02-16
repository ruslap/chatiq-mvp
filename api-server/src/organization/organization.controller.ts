import { Controller, Get, Post, Put, Body, UseGuards, Request, NotFoundException, Param } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OrganizationService } from "./organization.service";
import { SitesService } from "../sites/sites.service";
import { PrismaService } from "../prisma/prisma.service";

interface AuthRequest {
	user: {
		userId: string;
	};
}

@Controller("organization")
export class OrganizationController {
	constructor(
		private readonly organizationService: OrganizationService,
		private readonly sitesService: SitesService,
		private readonly prisma: PrismaService,
	) {}

	// Public endpoint for widget to resolve organizationId → siteId
	@Get("resolve/:organizationId")
	async resolveOrganizationToSite(@Param("organizationId") organizationId: string) {
		// Find widget settings by organizationId
		const widgetSettings = await this.prisma.widgetSettings.findUnique({
			where: { organizationId },
			include: {
				users: {
					include: {
						ownedSites: {
							take: 1,
							orderBy: { createdAt: "asc" },
						},
					},
				},
			},
		});

		if (!widgetSettings) {
			throw new NotFoundException(`Organization ${organizationId} not found`);
		}

		// Find the first user who owns a site
		const siteId = widgetSettings.users
			.map(u => u.ownedSites[0]?.id)
			.find(Boolean);

		if (!siteId) {
			throw new NotFoundException(`No site found for organization ${organizationId}`);
		}

		return {
			organizationId,
			siteId,
		};
	}

	@UseGuards(JwtAuthGuard)
	@Get("my")
	async getMyOrganization(@Request() req: AuthRequest) {
		const userId = req.user.userId;
		const organization = await this.organizationService.getOrCreateOrganization(userId);

		// Get or create primary site
		let primarySite = await this.sitesService.getPrimarySite(userId);

		// If no site exists, create a default one
		if (!primarySite) {
			primarySite = await this.sitesService.createSite(userId, "My Website", "example.com");
		}

		return {
			organizationId: organization.organizationId,
			siteId: primarySite.id,
			settings: organization,
		};
	}

	@UseGuards(JwtAuthGuard)
	@Get("settings")
	async getOrganizationSettings(@Request() req: AuthRequest) {
		const userId = req.user.userId;
		const organization = await this.organizationService.getOrganizationByUserId(userId);

		if (!organization) {
			// Create organization if it doesn't exist
			const newOrg = await this.organizationService.getOrCreateOrganization(userId);
			return newOrg;
		}

		return organization;
	}

	@UseGuards(JwtAuthGuard)
	@Put("settings")
	async updateOrganizationSettings(@Request() req: AuthRequest, @Body() settings: Record<string, unknown>) {
		const userId = req.user.userId;
		const organization = await this.organizationService.getOrganizationByUserId(userId);

		if (!organization) {
			throw new NotFoundException("Organization not found");
		}

		return this.organizationService.updateOrganizationSettings(organization.organizationId, settings);
	}

	@UseGuards(JwtAuthGuard)
	@Post("add-user")
	async addUserToOrganization(@Request() req: AuthRequest, @Body() body: { userId: string }) {
		const userId = req.user.userId;
		const organization = await this.organizationService.getOrganizationByUserId(userId);

		if (!organization) {
			throw new NotFoundException("Organization not found");
		}

		return this.organizationService.addUserToOrganization(organization.organizationId, body.userId);
	}
}
