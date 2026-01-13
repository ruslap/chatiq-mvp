import { Module } from "@nestjs/common";
import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";
import { SitesModule } from "../sites/sites.module";

@Module({
	imports: [SitesModule],
	controllers: [OrganizationController],
	providers: [OrganizationService],
	exports: [OrganizationService],
})
export class OrganizationModule {}
