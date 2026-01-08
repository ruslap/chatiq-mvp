import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from './organization.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-123'),
}));

describe('OrganizationService', () => {
    let service: OrganizationService;
    let prisma: jest.Mocked<PrismaService>;

    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-123',
        organization: {
            organizationId: 'org-123',
            color: '#3b82f6',
        },
    };

    const mockOrganization = {
        organizationId: 'org-123',
        color: '#3b82f6',
        operatorName: 'Support',
        welcomeMessage: 'Hello!',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrganizationService,
                {
                    provide: PrismaService,
                    useValue: {
                        user: {
                            findUnique: jest.fn(),
                            update: jest.fn(),
                        },
                        widgetSettings: {
                            create: jest.fn(),
                            update: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        service = module.get<OrganizationService>(OrganizationService);
        prisma = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getOrCreateOrganization', () => {
        it('should return existing organization if user already has one', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser as never);

            const result = await service.getOrCreateOrganization('user-123');

            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                include: { organization: true },
            });
            expect(result).toEqual(mockUser.organization);
            expect(prisma.widgetSettings.create).not.toHaveBeenCalled();
        });

        it('should create new organization if user does not have one', async () => {
            const userWithoutOrg = { ...mockUser, organization: null };
            prisma.user.findUnique.mockResolvedValue(userWithoutOrg as never);
            prisma.widgetSettings.create.mockResolvedValue(mockOrganization as never);

            const result = await service.getOrCreateOrganization('user-123');

            expect(prisma.widgetSettings.create).toHaveBeenCalledWith({
                data: {
                    organizationId: 'mock-uuid-123',
                    users: {
                        connect: { id: 'user-123' },
                    },
                },
            });
            expect(result).toEqual(mockOrganization);
        });

        it('should create organization for new user', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.widgetSettings.create.mockResolvedValue(mockOrganization as never);

            const result = await service.getOrCreateOrganization('user-123');

            expect(prisma.widgetSettings.create).toHaveBeenCalled();
            expect(result).toEqual(mockOrganization);
        });
    });

    describe('getOrganizationByUserId', () => {
        it('should return organization when user has one', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser as never);

            const result = await service.getOrganizationByUserId('user-123');

            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                include: { organization: true },
            });
            expect(result).toEqual(mockUser.organization);
        });

        it('should return undefined when user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const result = await service.getOrganizationByUserId('nonexistent');

            expect(result).toBeUndefined();
        });

        it('should return undefined when user has no organization', async () => {
            prisma.user.findUnique.mockResolvedValue({ ...mockUser, organization: null } as never);

            const result = await service.getOrganizationByUserId('user-123');

            expect(result).toBeNull();
        });
    });

    describe('updateOrganizationSettings', () => {
        it('should update organization settings', async () => {
            const updatedOrg = { ...mockOrganization, color: '#ff0000' };
            prisma.widgetSettings.update.mockResolvedValue(updatedOrg as never);

            const result = await service.updateOrganizationSettings('org-123', { color: '#ff0000' });

            expect(prisma.widgetSettings.update).toHaveBeenCalledWith({
                where: { organizationId: 'org-123' },
                data: { color: '#ff0000' },
            });
            expect(result).toEqual(updatedOrg);
        });

        it('should update multiple settings at once', async () => {
            const newSettings = { color: '#00ff00', operatorName: 'New Name' };
            prisma.widgetSettings.update.mockResolvedValue({ ...mockOrganization, ...newSettings } as never);

            await service.updateOrganizationSettings('org-123', newSettings);

            expect(prisma.widgetSettings.update).toHaveBeenCalledWith({
                where: { organizationId: 'org-123' },
                data: newSettings,
            });
        });
    });

    describe('addUserToOrganization', () => {
        it('should update user with organization id', async () => {
            const updatedUser = { ...mockUser, organizationId: 'new-org-456' };
            prisma.user.update.mockResolvedValue(updatedUser as never);

            const result = await service.addUserToOrganization('new-org-456', 'user-123');

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: { organizationId: 'new-org-456' },
            });
            expect(result).toEqual(updatedUser);
        });
    });
});
