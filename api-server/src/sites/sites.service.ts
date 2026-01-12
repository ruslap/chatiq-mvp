import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) { }

  async createSite(userId: string, name: string, domain: string) {
    return this.prisma.site.create({
      data: {
        name,
        domain,
        ownerId: userId,
      },
    });
  }

  async getMySites(userId: string) {
    const sites = await this.prisma.site.findMany({
      where: {
        OR: [{ ownerId: userId }, { operators: { some: { userId } } }],
      },
      include: {
        _count: {
          select: {
            chats: true,
            autoReplies: { where: { isActive: true } },
            quickTemplates: { where: { isActive: true } },
          },
        },
        businessHours: {
          select: {
            isEnabled: true,
          },
        },
      },
    });

    return sites.map((site) => ({
      ...site,
      stats: {
        chats: site._count.chats,
        activeAutoReplies: site._count.autoReplies,
        activeTemplates: site._count.quickTemplates,
        businessHoursEnabled: site.businessHours?.isEnabled ?? false,
      },
    }));
  }

  async inviteOperator(ownerId: string, siteId: string, email: string) {
    // Check if site belongs to owner
    const site = await this.prisma.site.findUnique({
      where: { id: siteId, ownerId },
    });

    if (!site)
      throw new ForbiddenException('Not authorized to invite to this site');

    // Find user by email
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create a placeholder user
      user = await this.prisma.user.create({
        data: {
          email,
          role: 'OPERATOR',
        },
      });
    }

    return this.prisma.siteUser.create({
      data: {
        siteId,
        userId: user.id,
      },
    });
  }

  /**
   * Get user's primary site (first created, used for single-site MVP)
   */
  async getPrimarySite(userId: string) {
    return this.prisma.site.findFirst({
      where: { ownerId: userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, domain: true },
    });
  }
}
