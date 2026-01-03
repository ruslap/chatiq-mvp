import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { SitesService } from './sites.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('sites')
@UseGuards(AuthGuard('jwt'))
export class SitesController {
    constructor(private sitesService: SitesService) { }

    @Post()
    create(@Req() req, @Body() body: { name: string; domain: string }) {
        return this.sitesService.createSite(req.user.userId, body.name, body.domain);
    }

    @Get()
    findAll(@Req() req) {
        return this.sitesService.getMySites(req.user.userId);
    }

    @Post('invite')
    invite(@Req() req, @Body() body: { siteId: string; email: string }) {
        return this.sitesService.inviteOperator(req.user.userId, body.siteId, body.email);
    }
}
