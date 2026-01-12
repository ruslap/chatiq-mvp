import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrganizationService } from './organization.service';
import { SitesService } from '../sites/sites.service';

interface AuthRequest {
  user: {
    userId: string;
  };
}

@Controller('organization')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly sitesService: SitesService,
  ) { }

  @Get('my')
  async getMyOrganization(@Request() req: AuthRequest) {
    const userId = req.user.userId;
    const organization =
      await this.organizationService.getOrCreateOrganization(userId);
    const primarySite = await this.sitesService.getPrimarySite(userId);

    return {
      organizationId: organization.organizationId,
      siteId: primarySite?.id || null,
      settings: organization,
    };
  }

  @Get('settings')
  async getOrganizationSettings(@Request() req: AuthRequest) {
    const userId = req.user.userId;
    const organization =
      await this.organizationService.getOrganizationByUserId(userId);

    if (!organization) {
      // Create organization if it doesn't exist
      const newOrg =
        await this.organizationService.getOrCreateOrganization(userId);
      return newOrg;
    }

    return organization;
  }

  @Put('settings')
  async updateOrganizationSettings(
    @Request() req: AuthRequest,
    @Body() settings: Record<string, unknown>,
  ) {
    const userId = req.user.userId;
    const organization =
      await this.organizationService.getOrganizationByUserId(userId);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return this.organizationService.updateOrganizationSettings(
      organization.organizationId,
      settings,
    );
  }

  @Post('add-user')
  async addUserToOrganization(
    @Request() req: AuthRequest,
    @Body() body: { userId: string },
  ) {
    const userId = req.user.userId;
    const organization =
      await this.organizationService.getOrganizationByUserId(userId);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return this.organizationService.addUserToOrganization(
      organization.organizationId,
      body.userId,
    );
  }
}
