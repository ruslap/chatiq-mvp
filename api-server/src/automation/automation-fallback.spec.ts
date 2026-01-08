import { Test, TestingModule } from '@nestjs/testing';
import { AutomationService } from './automation.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('AutomationService (Fallback Logic)', () => {
    let service: AutomationService;
    let prisma: jest.Mocked<PrismaService>;
    let eventEmitter: jest.Mocked<EventEmitter2>;

    const mockWelcomeReply = {
        id: 'welcome-1',
        siteId: 'site-123',
        name: 'Greeting',
        trigger: 'first_message',
        message: 'Welcome message',
        delay: 0,
        isActive: true,
        order: 1,
    };

    const mockOfflineReply = {
        id: 'offline-1',
        siteId: 'site-123',
        name: 'Offline',
        trigger: 'offline',
        message: 'Offline message',
        delay: 0,
        isActive: true,
        order: 2,
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
                        },
                        businessHours: {
                            findUnique: jest.fn(),
                        },
                        site: {
                            findUnique: jest.fn().mockResolvedValue({ id: 'site-123' }),
                        },
                        message: {
                            count: jest.fn(),
                            create: jest.fn().mockResolvedValue({ text: 'auto-reply', createdAt: new Date() }),
                        },
                        chat: {
                            findUnique: jest.fn().mockResolvedValue({ visitorId: 'v-123' }),
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

        // Mock business hours to be CLOSED
        (prisma.businessHours.findUnique as any).mockResolvedValue({
            isEnabled: true,
            timezone: 'UTC',
            monday: '{"start":"09:00","end":"17:00","isOpen":true}',
            tuesday: '{"start":"09:00","end":"17:00","isOpen":true}',
            wednesday: '{"start":"09:00","end":"17:00","isOpen":true}',
            thursday: '{"start":"09:00","end":"17:00","isOpen":true}',
            friday: '{"start":"09:00","end":"17:00","isOpen":true}',
            saturday: '{"start":"09:00","end":"17:00","isOpen":false}',
            sunday: '{"start":"09:00","end":"17:00","isOpen":false}',
        } as any);

        // Mock Date to be Saturday (offline) using a spy instead of fake timers if possible
        // but for now let's just use real timers and check if it helps
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should send offline message when business is offline and offline reply exists', async () => {
        // Spy on isWithinBusinessHours to return CLOSED
        jest.spyOn(service, 'isWithinBusinessHours').mockResolvedValue({ isOpen: false, message: 'We are offline' });

        (prisma.message.count as any).mockResolvedValue(1);
        (prisma.autoReply.findMany as any).mockImplementation(async (args: any) => {
            if (args.where.trigger === 'offline') return [mockOfflineReply];
            if (args.where.trigger === 'first_message') return [mockWelcomeReply];
            return [];
        });

        await service.executeAutoReply('site-123', 'chat-123', 'Hello', 'visitor');

        // Wait for the async sendAutoReply
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(prisma.message.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                text: 'Offline message'
            })
        }));
    });

    it('should fallback to greeting message when offline and offline reply is missing', async () => {
        // Spy on isWithinBusinessHours to return CLOSED
        jest.spyOn(service, 'isWithinBusinessHours').mockResolvedValue({ isOpen: false, message: 'We are offline' });

        (prisma.message.count as any).mockResolvedValue(1);
        (prisma.autoReply.findMany as any).mockImplementation(async (args: any) => {
            if (args.where.trigger === 'offline') return [];
            if (args.where.trigger === 'first_message') return [mockWelcomeReply];
            return [];
        });

        await service.executeAutoReply('site-123', 'chat-123', 'Hello', 'visitor');

        // Wait for the async sendAutoReply
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(prisma.message.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                text: 'Welcome message'
            })
        }));
    });
});
