import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { LicenseService } from "./license.service";

@Controller("license")
export class LicenseController {
	constructor(private readonly licenseService: LicenseService) {}

	@Get("status")
	@UseGuards(AuthGuard("jwt"))
	getStatus() {
		const status = this.licenseService.getStatus();
		return {
			valid: status.valid,
			licensee: status.licensee,
			plan: status.plan,
			expiresAt: status.expiresAt,
			daysRemaining: status.daysRemaining,
			...(status.error ? { error: status.error } : {}),
		};
	}
}
