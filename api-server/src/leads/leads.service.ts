import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class LeadsService {
	constructor(private prisma: PrismaService) {}

	async createLead(data: {
		siteId: string;
		name: string;
		email?: string;
		phone?: string;
		message?: string;
	}) {
		return this.prisma.contactLead.create({
			data,
		});
	}

	async getLeadsBySite(siteId: string) {
		return this.prisma.contactLead.findMany({
			where: { siteId },
			orderBy: { createdAt: "desc" },
		});
	}

	async deleteLead(id: string) {
		return this.prisma.contactLead.delete({
			where: { id },
		});
	}
}
