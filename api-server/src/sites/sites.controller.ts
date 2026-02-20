import { Controller, Post, Get, Patch, Param, Body, Req, UseGuards } from "@nestjs/common";
import { SitesService } from "./sites.service";
import { AuthGuard } from "@nestjs/passport";
import { CreateSiteDto, InviteOperatorDto } from "./dto";

interface AuthRequest {
	user: {
		userId: string;
	};
}

@Controller("sites")
@UseGuards(AuthGuard("jwt"))
export class SitesController {
	constructor(private sitesService: SitesService) {}

	@Post()
	create(@Req() req: AuthRequest, @Body() dto: CreateSiteDto) {
		return this.sitesService.createSite(req.user.userId, dto.name, dto.domain);
	}

	@Get()
	findAll(@Req() req: AuthRequest) {
		return this.sitesService.getMySites(req.user.userId);
	}

	@Post("invite")
	invite(@Req() req: AuthRequest, @Body() dto: InviteOperatorDto) {
		return this.sitesService.inviteOperator(req.user.userId, dto.siteId, dto.email);
	}

	@Patch(":siteId/notifications")
	updateNotifications(
		@Req() req: AuthRequest,
		@Param("siteId") siteId: string,
		@Body()
		data: {
			notificationEmail?: string;
			emailFallbackEnabled?: boolean;
			emailFallbackAddress?: string;
			emailFallbackTimeout?: number;
		},
	) {
		return this.sitesService.updateNotifications(req.user.userId, siteId, data);
	}

	@Get(":siteId/notifications")
	getNotifications(
		@Req() req: AuthRequest,
		@Param("siteId") siteId: string,
	) {
		return this.sitesService.getNotifications(req.user.userId, siteId);
	}
}
