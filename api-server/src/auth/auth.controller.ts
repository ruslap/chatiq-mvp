import { Controller, Get, Post, Body, Req, UseGuards, Res, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth() { }

    @Post('register')
    async register(@Body() body: { email: string; password: string; name?: string }) {
        return this.authService.register(body);
    }

    @Post('login')
    async login(@Body() body: { email: string; password: string }) {
        const user = await this.authService.validateUser(body.email, body.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req: { user: any }, @Res() res: Response) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const { access_token } = await this.authService.login(req.user as any);

        // Redirect to frontend with token
        // For MVP, we can append it as a query param or set cookie
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        return res.redirect(`${frontendUrl}/auth/callback?token=${access_token}`);
    }

    @Get('profile')
    @UseGuards(AuthGuard('jwt'))
    getProfile(@Req() req: { user: any }) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return req.user;
    }
}
