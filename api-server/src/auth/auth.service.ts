import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { OrganizationService } from '../organization/organization.service';
import { SitesService } from '../sites/sites.service';
import { AutomationService } from '../automation/automation.service';
import * as bcrypt from 'bcrypt';

interface RegisterDetails {
  email: string;
  password: string;
  name?: string;
}

interface GoogleUserDetails {
  email: string;
  googleId: string;
  firstName: string;
  lastName: string;
  picture?: string;
}

export interface UserPayload {
  email: string;
  id: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private organizationService: OrganizationService,
    private sitesService: SitesService,
    private automationService: AutomationService,
  ) {}

  async register(details: RegisterDetails) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: details.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(details.password, 10);

    const userCount = await this.prisma.user.count();
    const role = userCount === 0 ? 'OWNER' : 'OPERATOR';

    const user = await this.prisma.user.create({
      data: {
        email: details.email,
        name: details.name,
        password: hashedPassword,
        role,
      },
    });

    // Create organization for new user
    await this.organizationService.getOrCreateOrganization(user.id);

    // Create default site with templates
    await this.createDefaultSite(user.id);

    return user;
  }

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.password) {
      const isMatch = await bcrypt.compare(pass, user.password);
      if (isMatch) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  /**
   * Creates a default site with templates for a new user
   */
  private async createDefaultSite(userId: string): Promise<void> {
    try {
      // Check if user already has sites
      const existingSites = await this.prisma.site.count({
        where: { ownerId: userId },
      });

      // Only create default site if user has no sites
      if (existingSites > 0) {
        return;
      }

      // Create default site
      const site = await this.sitesService.createSite(
        userId,
        'Мій перший сайт',
        'example.com', // User can change this later
      );

      // Seed default templates and auto-replies
      await this.automationService.seedDefaultAutoReplies(site.id);
      await this.automationService.seedDefaultQuickTemplates(site.id);

      // Initialize business hours (this will create the record with defaults)
      await this.automationService.getBusinessHours(site.id);

      this.logger.log(`Default site created for user ${userId} with templates`);
    } catch (error) {
      this.logger.error(
        'Failed to create default site',
        error instanceof Error ? error.stack : error,
      );
      // Don't throw - we don't want to fail registration if site creation fails
    }
  }

  async validateGoogleUser(details: GoogleUserDetails) {
    let user = await this.prisma.user.findUnique({
      where: { email: details.email },
    });

    if (user) {
      // Update googleId if not present (transition from email/pass if it was there)
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: details.googleId, avatar: details.picture },
        });
      }

      // Check if user has organization, create if not
      if (!user.organizationId) {
        await this.organizationService.getOrCreateOrganization(user.id);
      }
    } else {
      // Create new user (Owner by default for the first one, or just OWNER/OPERATOR logic)
      // For MVP, simplify: if it's the first user ever, make them OWNER.
      const userCount = await this.prisma.user.count();
      const role = userCount === 0 ? 'OWNER' : 'OPERATOR';

      user = await this.prisma.user.create({
        data: {
          email: details.email,
          name: `${details.firstName} ${details.lastName}`,
          googleId: details.googleId,
          avatar: details.picture,
          role,
        },
      });

      // Create organization for new Google user
      await this.organizationService.getOrCreateOrganization(user.id);

      // Create default site with templates
      await this.createDefaultSite(user.id);
    }

    return user;
  }

  login(user: UserPayload) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
