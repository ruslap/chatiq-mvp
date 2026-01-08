import { Test, TestingModule } from '@nestjs/testing';
import { AutomationService } from './automation.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('AutomationService', () => {
    let service: AutomationService;
    let prisma: jest.Mocked<PrismaService>;
    let eventEmitter: jest.Mocked<EventEmitter2>;

    const mockAutoReply = {
        id: 'reply-123',
        siteId: 'site-123',
        name: 'Welcome',
        trigger: 'first_message',
        message: 'Hello! Welcome!',
        delay: 0,
        isActive: true,
        order: 1,
    };

    const mockQuickTemplate = {
        id: 'template-123',
        siteId: 'site-123',
        title: 'Greeting',
        message: 'Hello!',
        shortcut: '/hello',
        category: 'General',
        isActive: true,
        order: 1,
    };

    const mockBusinessHours = {
        id: 'bh-123',
        siteId: 'site-123',
        timezone: 'Europe/Kyiv',
        isEnabled: true,
        offlineMessage: 'We are offline',
        monday: '{"start": "09:00", "end": "18:00", "isOpen": true}',
        tuesday: '{"start": "09:00", "end": "18:00", "isOpen": true}',
        wednesday: '{"start": "09:00", "end": "18:00", "isOpen": true}',
        thursday: '{"start": "09:00", "end": "18:00", "isOpen": true}',
        friday: '{"start": "09:00", "end": "18:00", "isOpen": true}',
        saturday: '{"start": "10:00", "end": "15:00", "isOpen": false}',
        sunday: '{"start": "10:00", "end": "15:00", "isOpen": false}',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AutomationService,
                {
                    provide: PrismaService,
                    useValue: {
                        autoReply: {
                            findMany: jest.fn(),
                            findFirst: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                            delete: jest.fn(),
                            count: jest.fn(),
                            aggregate: jest.fn(),
                        },
                        quickTemplate: {
                            findMany: jest.fn(),
                            findFirst: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                            delete: jest.fn(),
                            count: jest.fn(),
                            aggregate: jest.fn(),
                        },
                        businessHours: {
                            findUnique: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                        },
                        site: {
                            findUnique: jest.fn(),
                        },
                        message: {
                            count: jest.fn(),
                            create: jest.fn(),
                        },
                        chat: {
                            findUnique: jest.fn(),
                        },
                    },
                },
                {
                    provide: EventEmitter2,
                    useValue: {
                        emit: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AutomationService>(AutomationService);
        prisma = module.get(PrismaService);
        eventEmitter = module.get(EventEmitter2);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ============ AUTO-REPLIES ============

    describe('getAutoReplies', () => {
        it('should return auto-replies ordered by order', async () => {
            const replies = [mockAutoReply];
            prisma.autoReply.findMany.mockResolvedValue(replies as never);

            const result = await service.getAutoReplies('site-123');

            expect(prisma.autoReply.findMany).toHaveBeenCalledWith({
                where: { siteId: 'site-123' },
                orderBy: { order: 'asc' },
            });
            expect(result).toEqual(replies);
        });
    });

    describe('createAutoReply', () => {
        it('should create auto-reply with next order number', async () => {
            prisma.autoReply.aggregate.mockResolvedValue({ _max: { order: 3 } } as never);
            prisma.autoReply.create.mockResolvedValue(mockAutoReply as never);

            const result = await service.createAutoReply('site-123', {
                name: 'Welcome',
                trigger: 'first_message',
                message: 'Hello!',
            });

            expect(prisma.autoReply.create).toHaveBeenCalledWith({
                data: {
                    siteId: 'site-123',
                    name: 'Welcome',
                    trigger: 'first_message',
                    message: 'Hello!',
                    delay: 0,
                    isActive: true,
                    order: 4,
                },
            });
            expect(result).toEqual(mockAutoReply);
        });

        it('should start with order 1 when no existing replies', async () => {
            prisma.autoReply.aggregate.mockResolvedValue({ _max: { order: null } } as never);
            prisma.autoReply.create.mockResolvedValue(mockAutoReply as never);

            await service.createAutoReply('site-123', {
                name: 'Welcome',
                trigger: 'first_message',
                message: 'Hello!',
                delay: 5000,
                isActive: false,
            });

            expect(prisma.autoReply.create).toHaveBeenCalledWith({
                data: {
                    siteId: 'site-123',
                    name: 'Welcome',
                    trigger: 'first_message',
                    message: 'Hello!',
                    delay: 5000,
                    isActive: false,
                    order: 1,
                },
            });
        });
    });

    describe('updateAutoReply', () => {
        it('should update auto-reply with provided data', async () => {
            const updated = { ...mockAutoReply, name: 'Updated' };
            prisma.autoReply.update.mockResolvedValue(updated as never);

            const result = await service.updateAutoReply('reply-123', { name: 'Updated' });

            expect(prisma.autoReply.update).toHaveBeenCalledWith({
                where: { id: 'reply-123' },
                data: { name: 'Updated' },
            });
            expect(result).toEqual(updated);
        });
    });

    describe('deleteAutoReply', () => {
        it('should delete auto-reply by id', async () => {
            prisma.autoReply.delete.mockResolvedValue(mockAutoReply as never);

            const result = await service.deleteAutoReply('reply-123');

            expect(prisma.autoReply.delete).toHaveBeenCalledWith({
                where: { id: 'reply-123' },
            });
            expect(result).toEqual(mockAutoReply);
        });
    });

    describe('getActiveAutoReplyByTrigger', () => {
        it('should find active auto-reply by trigger', async () => {
            prisma.autoReply.findFirst.mockResolvedValue(mockAutoReply as never);

            const result = await service.getActiveAutoReplyByTrigger('site-123', 'first_message');

            expect(prisma.autoReply.findFirst).toHaveBeenCalledWith({
                where: {
                    siteId: 'site-123',
                    trigger: 'first_message',
                    isActive: true,
                },
                orderBy: { order: 'asc' },
            });
            expect(result).toEqual(mockAutoReply);
        });
    });

    // ============ QUICK TEMPLATES ============

    describe('getQuickTemplates', () => {
        it('should return templates ordered by order', async () => {
            const templates = [mockQuickTemplate];
            prisma.quickTemplate.findMany.mockResolvedValue(templates as never);

            const result = await service.getQuickTemplates('site-123');

            expect(prisma.quickTemplate.findMany).toHaveBeenCalledWith({
                where: { siteId: 'site-123' },
                orderBy: { order: 'asc' },
            });
            expect(result).toEqual(templates);
        });
    });

    describe('createQuickTemplate', () => {
        it('should create template with next order number', async () => {
            prisma.quickTemplate.aggregate.mockResolvedValue({ _max: { order: 5 } } as never);
            prisma.quickTemplate.create.mockResolvedValue(mockQuickTemplate as never);

            const result = await service.createQuickTemplate('site-123', {
                title: 'Greeting',
                message: 'Hello!',
                shortcut: '/hello',
                category: 'General',
            });

            expect(prisma.quickTemplate.create).toHaveBeenCalledWith({
                data: {
                    siteId: 'site-123',
                    title: 'Greeting',
                    message: 'Hello!',
                    shortcut: '/hello',
                    category: 'General',
                    isActive: true,
                    order: 6,
                },
            });
            expect(result).toEqual(mockQuickTemplate);
        });
    });

    describe('updateQuickTemplate', () => {
        it('should update template with provided data', async () => {
            const updated = { ...mockQuickTemplate, title: 'Updated' };
            prisma.quickTemplate.update.mockResolvedValue(updated as never);

            const result = await service.updateQuickTemplate('template-123', { title: 'Updated' });

            expect(prisma.quickTemplate.update).toHaveBeenCalledWith({
                where: { id: 'template-123' },
                data: { title: 'Updated' },
            });
            expect(result).toEqual(updated);
        });
    });

    describe('deleteQuickTemplate', () => {
        it('should delete template by id', async () => {
            prisma.quickTemplate.delete.mockResolvedValue(mockQuickTemplate as never);

            const result = await service.deleteQuickTemplate('template-123');

            expect(prisma.quickTemplate.delete).toHaveBeenCalledWith({
                where: { id: 'template-123' },
            });
            expect(result).toEqual(mockQuickTemplate);
        });
    });

    describe('getActiveQuickTemplates', () => {
        it('should return only active templates', async () => {
            const templates = [mockQuickTemplate];
            prisma.quickTemplate.findMany.mockResolvedValue(templates as never);

            const result = await service.getActiveQuickTemplates('site-123');

            expect(prisma.quickTemplate.findMany).toHaveBeenCalledWith({
                where: {
                    siteId: 'site-123',
                    isActive: true,
                },
                orderBy: { order: 'asc' },
            });
            expect(result).toEqual(templates);
        });
    });

    // ============ SEED DEFAULTS ============

    describe('seedDefaultAutoReplies', () => {
        it('should skip if auto-replies already exist', async () => {
            prisma.autoReply.count.mockResolvedValue(5);

            await service.seedDefaultAutoReplies('site-123');

            expect(prisma.autoReply.create).not.toHaveBeenCalled();
        });

        it('should create default auto-replies when none exist', async () => {
            prisma.autoReply.count.mockResolvedValue(0);
            prisma.autoReply.create.mockResolvedValue(mockAutoReply as never);

            await service.seedDefaultAutoReplies('site-123');

            expect(prisma.autoReply.create).toHaveBeenCalledTimes(4);
        });
    });

    describe('seedDefaultQuickTemplates', () => {
        it('should skip if templates already exist', async () => {
            prisma.quickTemplate.count.mockResolvedValue(3);

            await service.seedDefaultQuickTemplates('site-123');

            expect(prisma.quickTemplate.create).not.toHaveBeenCalled();
        });

        it('should create default templates when none exist', async () => {
            prisma.quickTemplate.count.mockResolvedValue(0);
            prisma.quickTemplate.create.mockResolvedValue(mockQuickTemplate as never);

            await service.seedDefaultQuickTemplates('site-123');

            expect(prisma.quickTemplate.create).toHaveBeenCalledTimes(6);
        });
    });

    // ============ BUSINESS HOURS ============

    describe('getBusinessHours', () => {
        it('should return existing business hours', async () => {
            prisma.site.findUnique.mockResolvedValue({ id: 'site-123' } as never);
            prisma.businessHours.findUnique.mockResolvedValue(mockBusinessHours as never);

            const result = await service.getBusinessHours('site-123');

            expect(result).toEqual(mockBusinessHours);
        });

        it('should create default business hours if not exists', async () => {
            prisma.site.findUnique.mockResolvedValue({ id: 'site-123' } as never);
            prisma.businessHours.findUnique.mockResolvedValue(null);
            prisma.businessHours.create.mockResolvedValue(mockBusinessHours as never);
            prisma.autoReply.count.mockResolvedValue(0);
            prisma.quickTemplate.count.mockResolvedValue(0);
            prisma.autoReply.create.mockResolvedValue(mockAutoReply as never);
            prisma.quickTemplate.create.mockResolvedValue(mockQuickTemplate as never);

            const result = await service.getBusinessHours('site-123');

            expect(prisma.businessHours.create).toHaveBeenCalledWith({
                data: { siteId: 'site-123' },
            });
            expect(result).toEqual(mockBusinessHours);
        });

        it('should return default values if site does not exist', async () => {
            prisma.site.findUnique.mockResolvedValue(null);

            const result = await service.getBusinessHours('nonexistent-site');

            expect(result).toHaveProperty('siteId', 'nonexistent-site');
            expect(result).toHaveProperty('isEnabled', false);
            expect(prisma.businessHours.findUnique).not.toHaveBeenCalled();
        });
    });

    describe('updateBusinessHours', () => {
        it('should update business hours', async () => {
            prisma.site.findUnique.mockResolvedValue({ id: 'site-123' } as never);
            prisma.businessHours.findUnique.mockResolvedValue(mockBusinessHours as never);
            const updated = { ...mockBusinessHours, isEnabled: false };
            prisma.businessHours.update.mockResolvedValue(updated as never);

            const result = await service.updateBusinessHours('site-123', { isEnabled: false });

            expect(prisma.businessHours.update).toHaveBeenCalledWith({
                where: { siteId: 'site-123' },
                data: {
                    timezone: undefined,
                    isEnabled: false,
                    offlineMessage: undefined,
                    monday: undefined,
                    tuesday: undefined,
                    wednesday: undefined,
                    thursday: undefined,
                    friday: undefined,
                    saturday: undefined,
                    sunday: undefined,
                },
            });
            expect(result).toEqual(updated);
        });

        it('should stringify day schedule objects', async () => {
            prisma.site.findUnique.mockResolvedValue({ id: 'site-123' } as never);
            prisma.businessHours.findUnique.mockResolvedValue(mockBusinessHours as never);
            prisma.businessHours.update.mockResolvedValue(mockBusinessHours as never);

            await service.updateBusinessHours('site-123', {
                monday: { start: '10:00', end: '20:00', isOpen: true },
            });

            expect(prisma.businessHours.update).toHaveBeenCalledWith({
                where: { siteId: 'site-123' },
                data: expect.objectContaining({
                    monday: '{"start":"10:00","end":"20:00","isOpen":true}',
                }),
            });
        });
    });

    describe('isWithinBusinessHours', () => {
        it('should return isOpen true when hours are disabled', async () => {
            prisma.site.findUnique.mockResolvedValue({ id: 'site-123' } as never);
            prisma.businessHours.findUnique.mockResolvedValue({
                ...mockBusinessHours,
                isEnabled: false,
            } as never);

            const result = await service.isWithinBusinessHours('site-123');

            expect(result).toEqual({ isOpen: true });
        });

        it('should return isOpen true when no hours settings', async () => {
            prisma.site.findUnique.mockResolvedValue(null);

            const result = await service.isWithinBusinessHours('site-123');

            expect(result).toEqual({ isOpen: true });
        });
    });

    // ============ AUTO-REPLY EXECUTION ============

    describe('checkAndExecuteAutoReply', () => {
        it('should return no reply when no matching auto-replies', async () => {
            prisma.autoReply.findMany.mockResolvedValue([]);

            const result = await service.checkAndExecuteAutoReply('site-123', 'first_message', 'chat-123');

            expect(result).toEqual({ shouldReply: false });
        });

        it('should return auto-reply when trigger matches', async () => {
            prisma.autoReply.findMany.mockResolvedValue([mockAutoReply] as never);

            const result = await service.checkAndExecuteAutoReply('site-123', 'first_message', 'chat-123');

            expect(result).toEqual({
                shouldReply: true,
                message: 'Hello! Welcome!',
                delay: 0,
            });
        });
    });

    describe('executeAutoReply', () => {
        it('should skip for admin messages', async () => {
            await service.executeAutoReply('site-123', 'chat-123', 'Hello', 'admin');

            expect(prisma.message.count).not.toHaveBeenCalled();
        });

        it('should check first message and trigger welcome for online status', async () => {
            prisma.site.findUnique.mockResolvedValue({ id: 'site-123' } as never);
            prisma.businessHours.findUnique.mockResolvedValue({
                ...mockBusinessHours,
                isEnabled: false,
            } as never);
            prisma.message.count.mockResolvedValue(1);
            prisma.autoReply.findMany.mockResolvedValue([mockAutoReply] as never);

            await service.executeAutoReply('site-123', 'chat-123', 'Hello', 'visitor');

            expect(prisma.message.count).toHaveBeenCalledWith({
                where: { chatId: 'chat-123' },
            });
        });
    });
});
