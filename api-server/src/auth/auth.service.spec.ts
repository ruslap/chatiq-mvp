import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { OrganizationService } from '../organization/organization.service';
import { SitesService } from '../sites/sites.service';
import { AutomationService } from '../automation/automation.service';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let organizationService: jest.Mocked<OrganizationService>;
  let sitesService: jest.Mocked<SitesService>;
  let automationService: jest.Mocked<AutomationService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword123',
    role: 'OWNER',
    googleId: null,
    avatar: null,
    organizationId: 'org-123',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            site: {
              count: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: OrganizationService,
          useValue: {
            getOrCreateOrganization: jest.fn(),
          },
        },
        {
          provide: SitesService,
          useValue: {
            createSite: jest.fn(),
          },
        },
        {
          provide: AutomationService,
          useValue: {
            seedDefaultAutoReplies: jest.fn(),
            seedDefaultQuickTemplates: jest.fn(),
            getBusinessHours: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
    organizationService = module.get(OrganizationService);
    sitesService = module.get(SitesService);
    automationService = module.get(AutomationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw ConflictException if user already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as never);

      await expect(
        service.register({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(ConflictException);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should create a new user with OWNER role when first user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.count.mockResolvedValue(0);
      prisma.user.create.mockResolvedValue(mockUser as never);
      prisma.site.count.mockResolvedValue(0);
      sitesService.createSite.mockResolvedValue({ id: 'site-123' } as never);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password: 'hashedPassword',
          role: 'OWNER',
        },
      });
      expect(organizationService.getOrCreateOrganization).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockUser);
    });

    it('should create a new user with OPERATOR role when not first user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.count.mockResolvedValue(5);
      prisma.user.create.mockResolvedValue({ ...mockUser, role: 'OPERATOR' } as never);
      prisma.site.count.mockResolvedValue(0);
      sitesService.createSite.mockResolvedValue({ id: 'site-123' } as never);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await service.register({
        email: 'new@example.com',
        password: 'password123',
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          name: undefined,
          password: 'hashedPassword',
          role: 'OPERATOR',
        },
      });
    });
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as never);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'correctPassword');

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        googleId: mockUser.googleId,
        avatar: mockUser.avatar,
        organizationId: mockUser.organizationId,
        createdAt: mockUser.createdAt,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should return null when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as never);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongPassword');

      expect(result).toBeNull();
    });

    it('should return null when user has no password set', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, password: null } as never);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('validateGoogleUser', () => {
    const googleDetails = {
      email: 'google@example.com',
      googleId: 'google-123',
      firstName: 'John',
      lastName: 'Doe',
      picture: 'https://example.com/photo.jpg',
    };

    it('should return existing user with googleId already set', async () => {
      const userWithGoogle = { ...mockUser, googleId: 'google-123', organizationId: 'org-123' };
      prisma.user.findUnique.mockResolvedValue(userWithGoogle as never);

      const result = await service.validateGoogleUser(googleDetails);

      expect(result).toEqual(userWithGoogle);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should update existing user with googleId when not present', async () => {
      const userWithoutGoogle = { ...mockUser, googleId: null, organizationId: 'org-123' };
      const updatedUser = { ...userWithoutGoogle, googleId: 'google-123', avatar: googleDetails.picture };
      prisma.user.findUnique.mockResolvedValue(userWithoutGoogle as never);
      prisma.user.update.mockResolvedValue(updatedUser as never);

      const result = await service.validateGoogleUser(googleDetails);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userWithoutGoogle.id },
        data: { googleId: 'google-123', avatar: googleDetails.picture },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should create organization for existing user without one', async () => {
      const userWithoutOrg = { ...mockUser, googleId: 'google-123', organizationId: null };
      prisma.user.findUnique.mockResolvedValue(userWithoutOrg as never);

      await service.validateGoogleUser(googleDetails);

      expect(organizationService.getOrCreateOrganization).toHaveBeenCalledWith(userWithoutOrg.id);
    });

    it('should create new user with OWNER role when first user', async () => {
      const newUser = {
        id: 'new-user-123',
        email: googleDetails.email,
        name: 'John Doe',
        googleId: 'google-123',
        avatar: googleDetails.picture,
        role: 'OWNER',
      };
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.count.mockResolvedValue(0);
      prisma.user.create.mockResolvedValue(newUser as never);
      prisma.site.count.mockResolvedValue(0);
      sitesService.createSite.mockResolvedValue({ id: 'site-123' } as never);

      const result = await service.validateGoogleUser(googleDetails);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: googleDetails.email,
          name: 'John Doe',
          googleId: 'google-123',
          avatar: googleDetails.picture,
          role: 'OWNER',
        },
      });
      expect(organizationService.getOrCreateOrganization).toHaveBeenCalledWith('new-user-123');
      expect(result).toEqual(newUser);
    });

    it('should create new user with OPERATOR role when not first user', async () => {
      const newUser = {
        id: 'new-user-456',
        email: googleDetails.email,
        name: 'John Doe',
        googleId: 'google-123',
        avatar: googleDetails.picture,
        role: 'OPERATOR',
      };
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.count.mockResolvedValue(10);
      prisma.user.create.mockResolvedValue(newUser as never);
      prisma.site.count.mockResolvedValue(0);
      sitesService.createSite.mockResolvedValue({ id: 'site-123' } as never);

      await service.validateGoogleUser(googleDetails);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: googleDetails.email,
          name: 'John Doe',
          googleId: 'google-123',
          avatar: googleDetails.picture,
          role: 'OPERATOR',
        },
      });
    });
  });

  describe('login', () => {
    it('should return access token and user', () => {
      const userPayload = { email: 'test@example.com', id: 'user-123', role: 'OWNER' };
      jwtService.sign.mockReturnValue('jwt-token-123');

      const result = service.login(userPayload);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'test@example.com',
        sub: 'user-123',
        role: 'OWNER',
      });
      expect(result).toEqual({
        access_token: 'jwt-token-123',
        user: userPayload,
      });
    });
  });
});
