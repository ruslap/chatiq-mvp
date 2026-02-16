import {
	Controller,
	Get,
	Post,
	Delete,
	Param,
	Body,
	UseGuards,
	Logger,
	Req,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { LeadsService } from "./leads.service";
import { CreateLeadDto } from "./dto";
import { SiteAccessGuard } from "../auth/site-access.guard";

@Controller("leads")
export class LeadsController {
	private readonly logger = new Logger(LeadsController.name);

	constructor(private readonly leadsService: LeadsService) {}

	// Public endpoint for widget to submit leads
	@Post()
	async createLead(@Body() dto: CreateLeadDto) {
		this.logger.log(
			`Creating lead for site ${dto.siteId}: ${dto.name} (${dto.email || dto.phone})`,
		);
		return this.leadsService.createLead(dto);
	}

	// Protected endpoints for admin panel
	@Get("site/:siteId")
	@UseGuards(AuthGuard("jwt"), SiteAccessGuard)
	async getLeads(@Param("siteId") siteId: string) {
		this.logger.debug(`Fetching leads for site: ${siteId}`);
		return this.leadsService.getLeadsBySite(siteId);
	}

	@Delete(":id")
	@UseGuards(AuthGuard("jwt"))
	async deleteLead(
		@Req() request: { user: { userId: string } },
		@Param("id") id: string,
	) {
		await this.leadsService.assertUserLeadAccess(request.user.userId, id);
		this.logger.debug(`Deleting lead: ${id}`);
		return this.leadsService.deleteLead(id);
	}
}
