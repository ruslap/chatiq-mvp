import { Test, TestingModule } from '@nestjs/testing';
import { SitesService } from './sites.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SitesService', () => {
  let service: SitesService;
  let prisma: jest.Mocked<PrismaService>;

  const mockSite = {
    id: 'site-123',
    name: 'My Site',
    domain: 'example.com',
    ownerId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSiteWithStats = {
    ...mockSite,
    _count: {
      chats: 10,
      autoReplies: 5,
      quickTemplates: 3,
    },
    businessHours: {
      isEnabled: true,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SitesService,
        {
          provide: PrismaService,
          useValue: {
            site: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            siteUser: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SitesService>(SitesService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSite', () => {
    it('should create a new site', async () => {
      prisma.site.create.mockResolvedValue(mockSite as never);

      const result = await service.createSite('user-123', 'My Site', 'example.com');

      expect(prisma.site.create).toHaveBeenCalledWith({
        data: {
          name: 'My Site',
          domain: 'example.com',
          ownerId: 'user-123',
        },
      });
      expect(result).toEqual(mockSite);
    });
  });

  describe('getMySites', () => {
    it('should return sites with stats for the user', async () => {
      prisma.site.findMany.mockResolvedValue([mockSiteWithStats] as never);

      const result = await service.getMySites('user-123');

      expect(prisma.site.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { ownerId: 'user-123' },
            { operators: { some: { userId: 'user-123' } } },
          ],
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

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockSiteWithStats,
        stats: {
          chats: 10,
          activeAutoReplies: 5,
          activeTemplates: 3,
          businessHoursEnabled: true,
        },
      });
    });

    it('should handle sites without business hours', async () => {
      const siteWithoutHours = { ...mockSiteWithStats, businessHours: null };
      prisma.site.findMany.mockResolvedValue([siteWithoutHours] as never);

      const result = await service.getMySites('user-123');

      expect(result[0].stats.businessHoursEnabled).toBe(false);
    });
  });

  describe('inviteOperator', () => {
    it('should add existing user as operator', async () => {
      prisma.site.findUnique.mockResolvedValue(mockSite as never);
      prisma.user.findUnique.mockResolvedValue({ id: 'operator-123', email: 'op@example.com' } as never);
      prisma.siteUser.create.mockResolvedValue({ siteId: 'site-123', userId: 'operator-123' } as never);

      const result = await service.inviteOperator('user-123', 'site-123', 'op@example.com');

      expect(prisma.site.findUnique).toHaveBeenCalledWith({
        where: { id: 'site-123', ownerId: 'user-123' },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'op@example.com' },
      });
      expect(prisma.siteUser.create).toHaveBeenCalledWith({
        data: {
          siteId: 'site-123',
          userId: 'operator-123',
        },
      });
      expect(result).toEqual({ siteId: 'site-123', userId: 'operator-123' });
    });

    it('should create placeholder user and add as operator if user does not exist', async () => {
      prisma.site.findUnique.mockResolvedValue(mockSite as never);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user-123', email: 'new@example.com', role: 'OPERATOR' } as never);
      prisma.siteUser.create.mockResolvedValue({ siteId: 'site-123', userId: 'new-user-123' } as never);

      const result = await service.inviteOperator('user-123', 'site-123', 'new@example.com');

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          role: 'OPERATOR',
        },
      });
      expect(prisma.siteUser.create).toHaveBeenCalledWith({
        data: {
          siteId: 'site-123',
          userId: 'new-user-123',
        },
      });
      expect(result).toEqual({ siteId: 'site-123', userId: 'new-user-123' });
    });

    it('should throw error if requestor is not site owner', async () => {
      prisma.site.findUnique.mockResolvedValue(null);

      await expect(
        service.inviteOperator('user-123', 'site-123', 'op@example.com'),
      ).rejects.toThrow('Not authorized to invite to this site');
    });
  });
});
