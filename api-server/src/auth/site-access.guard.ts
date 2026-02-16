import {
	BadRequestException,
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SiteAccessGuard implements CanActivate {
	constructor(private readonly prisma: PrismaService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<{
			user?: { userId?: string };
			params?: Record<string, string | undefined>;
			query?: Record<string, string | string[] | undefined>;
			body?: Record<string, unknown>;
		}>();

		const userId = request.user?.userId;
		if (!userId) {
			throw new ForbiddenException("Unauthorized user context");
		}

		const siteId = this.extractSiteId(request);
		if (!siteId) {
			throw new BadRequestException("siteId is required");
		}

		const site = await this.prisma.site.findFirst({
			where: {
				id: siteId,
				OR: [
					{ ownerId: userId },
					{ operators: { some: { userId } } },
				],
			},
			select: { id: true },
		});

		if (!site) {
			throw new ForbiddenException("You do not have access to this site");
		}

		return true;
	}

	private extractSiteId(request: {
		params?: Record<string, string | undefined>;
		query?: Record<string, string | string[] | undefined>;
		body?: Record<string, unknown>;
	}): string | undefined {
		const paramsSiteId = request.params?.siteId;
		if (paramsSiteId) {
			return paramsSiteId;
		}

		const bodySiteId = request.body?.siteId;
		if (typeof bodySiteId === "string" && bodySiteId.trim()) {
			return bodySiteId;
		}

		const querySiteId = request.query?.siteId;
		if (typeof querySiteId === "string" && querySiteId.trim()) {
			return querySiteId;
		}

		return undefined;
	}
}
