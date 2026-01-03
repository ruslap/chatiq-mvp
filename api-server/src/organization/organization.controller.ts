import { Controller, Get, Post, Put, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrganizationService } from './organization.service';

@Controller('organization')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('my')
  async getMyOrganization(@Request() req) {
    const userId = req.user.userId;
    const organization = await this.organizationService.getOrCreateOrganization(userId);
    return {
      organizationId: organization.organizationId,
      settings: organization
    };
  }

  @Get('settings')
  async getOrganizationSettings(@Request() req) {
    const userId = req.user.userId;
    const organization = await this.organizationService.getOrganizationByUserId(userId);
    
    if (!organization) {
      // Create organization if it doesn't exist
      const newOrg = await this.organizationService.getOrCreateOrganization(userId);
      return newOrg;
    }
    
    return organization;
  }

  @Put('settings')
  async updateOrganizationSettings(@Request() req, @Body() settings: any) {
    const userId = req.user.userId;
    const organization = await this.organizationService.getOrganizationByUserId(userId);
    
    if (!organization) {
      throw new Error('Organization not found');
    }
    
    return this.organizationService.updateOrganizationSettings(
      organization.organizationId,
      settings
    );
  }

  @Post('add-user')
  async addUserToOrganization(@Request() req, @Body() body: { userId: string }) {
    const userId = req.user.userId;
    const organization = await this.organizationService.getOrganizationByUserId(userId);
    
    if (!organization) {
      throw new Error('Organization not found');
    }
    
    return this.organizationService.addUserToOrganization(
      organization.organizationId,
      body.userId
    );
  }
}
