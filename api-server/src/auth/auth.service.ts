import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { OrganizationService } from '../organization/organization.service';
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

interface UserPayload {
    email: string;
    id: string;
    role: string;
}

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private organizationService: OrganizationService,
    ) { }

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
