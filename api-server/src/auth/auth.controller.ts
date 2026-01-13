import { Controller, Get, Post, Body, Req, UseGuards, Res, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService, UserPayload } from "./auth.service";
import { RegisterDto, LoginDto } from "./dto";
import type { Response } from "express";

@Controller("auth")
export class AuthController {
	constructor(private authService: AuthService) {}

	@Get("google")
	@UseGuards(AuthGuard("google"))
	async googleAuth() {}

	@Post("register")
	async register(@Body() dto: RegisterDto) {
		return this.authService.register(dto);
	}

	@Post("login")
	async login(@Body() dto: LoginDto) {
		const user = await this.authService.validateUser(dto.email, dto.password);
		if (!user) {
			throw new UnauthorizedException("Invalid credentials");
		}
		return this.authService.login(user);
	}

	@Get("google/callback")
	@UseGuards(AuthGuard("google"))
	googleAuthRedirect(@Req() req: { user: UserPayload }, @Res() res: Response) {
		const { access_token } = this.authService.login(req.user);

		// Redirect to frontend with token
		const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
		return res.redirect(`${frontendUrl}/auth/callback?token=${access_token}`);
	}

	@Get("profile")
	@UseGuards(AuthGuard("jwt"))
	getProfile(@Req() req: { user: UserPayload }) {
		return req.user;
	}
}
