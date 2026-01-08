import { Test, TestingModule } from '@nestjs/testing';
import { WidgetSettingsService } from './widget-settings.service';
import { PrismaService } from '../prisma/prisma.service';

describe('WidgetSettingsService', () => {
    let service: WidgetSettingsService;
    let prisma: jest.Mocked<PrismaService>;

    const mockSettings = {
        organizationId: 'org-123',
        color: '#000000',
        secondaryColor: '#ffffff',
        operatorName: 'Support',
        operatorAvatar: null,
        welcomeMessage: 'Hi!',
        showWelcome: true,
        position: 'right',
        size: 'normal',
        language: 'en',
        showContactForm: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WidgetSettingsService,
                {
                    provide: PrismaService,
                    useValue: {
                        widgetSettings: {
                            findUnique: jest.fn(),
                            create: jest.fn(),
                            upsert: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        service = module.get<WidgetSettingsService>(WidgetSettingsService);
        prisma = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getSettings', () => {
        it('should return existing settings', async () => {
            prisma.widgetSettings.findUnique.mockResolvedValue(mockSettings as never);

            const result = await service.getSettings('org-123');

            expect(prisma.widgetSettings.findUnique).toHaveBeenCalledWith({
                where: { organizationId: 'org-123' },
            });
            expect(result).toEqual(mockSettings);
        });

        it('should create and return default settings if not exists', async () => {
            prisma.widgetSettings.findUnique.mockResolvedValue(null);
            prisma.widgetSettings.create.mockResolvedValue(mockSettings as never);

            const result = await service.getSettings('org-123');

            expect(prisma.widgetSettings.create).toHaveBeenCalledWith({
                data: { organizationId: 'org-123' },
            });
            expect(result).toEqual(mockSettings);
        });
    });

    describe('updateSettings', () => {
        it('should upsert settings', async () => {
            const updateData = { color: '#ff0000' };
            const updatedSettings = { ...mockSettings, ...updateData };
            prisma.widgetSettings.upsert.mockResolvedValue(updatedSettings as never);

            const result = await service.updateSettings('org-123', updateData);

            expect(prisma.widgetSettings.upsert).toHaveBeenCalledWith({
                where: { organizationId: 'org-123' },
                create: {
                    organizationId: 'org-123',
                    ...updateData,
                },
                update: updateData,
            });
            expect(result).toEqual(updatedSettings);
        });
    });
});
