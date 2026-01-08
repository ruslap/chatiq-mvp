
import { Test, TestingModule } from '@nestjs/testing';
import { AutomationService } from './automation.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('AutomationService - Delayed Replies', () => {
    let service: AutomationService;
    let prisma: jest.Mocked<PrismaService>;
    let eventEmitter: jest.Mocked<EventEmitter2>;

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
                        },
                        site: { findUnique: jest.fn() },
                        businessHours: { findUnique: jest.fn() },
                        message: {
                            count: jest.fn(),
                            create: jest.fn(),
                        },
                        chat: { findUnique: jest.fn() },
                    },
                },
                {
                    provide: EventEmitter2,
                    useValue: { emit: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<AutomationService>(AutomationService);
        prisma = module.get(PrismaService);
        eventEmitter = module.get(EventEmitter2);

        jest.useFakeTimers();
        jest.spyOn(global, 'setTimeout');
        jest.spyOn(global, 'clearTimeout');
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it('should schedule delayed no_reply message', async () => {
        // Mock business hours open (disabled = open)
        (prisma.site.findUnique as jest.Mock).mockResolvedValue({ id: 'site-1' });
        (prisma.businessHours.findUnique as jest.Mock).mockResolvedValue({
            id: 'bh-1', siteId: 'site-1', isEnabled: false, timezone: 'UTC',
            offlineMessage: 'Of',
            monday: '{}', tuesday: '{}', wednesday: '{}', thursday: '{}', friday: '{}', saturday: '{}', sunday: '{}',
            createdAt: new Date(), updatedAt: new Date()
        });

        // Mock existing delayed reply
        (prisma.autoReply.findMany as jest.Mock).mockResolvedValue([
            { trigger: 'no_reply_5min', delay: 300, message: 'Wait please', isActive: true, siteId: 'site-1' }
        ]);

        (prisma.message.count as jest.Mock).mockResolvedValue(2); // Not first message

        // Execute
        await service.executeAutoReply('site-1', 'chat-1', 'Hello', 'visitor');

        // Check if timer set
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 300000);

        // Fast forward
        jest.runAllTimers();

        // Check if message sent
        expect(prisma.message.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                text: 'Wait please',
                from: 'admin'
            })
        }));
    });

    it('should cancel pending timer when visitor sends another message', async () => {
        // Setup same as above
        (prisma.site.findUnique as jest.Mock).mockResolvedValue({ id: 'site-1' });
        (prisma.businessHours.findUnique as jest.Mock).mockResolvedValue({
            id: 'bh-1', siteId: 'site-1', isEnabled: false, timezone: 'UTC',
            offlineMessage: 'Of',
            monday: '{}', tuesday: '{}', wednesday: '{}', thursday: '{}', friday: '{}', saturday: '{}', sunday: '{}',
            createdAt: new Date(), updatedAt: new Date()
        });
        (prisma.autoReply.findMany as jest.Mock).mockResolvedValue([
            { trigger: 'no_reply_5min', delay: 300, message: 'Wait please', isActive: true, siteId: 'site-1' }
        ]);
        (prisma.message.count as jest.Mock).mockResolvedValue(2);

        // Visitor sends first message -> schedule timer
        await service.executeAutoReply('site-1', 'chat-1', 'Hello 1', 'visitor');
        expect(setTimeout).toHaveBeenCalledTimes(1);

        // Visitor sends second message -> should clear previous and schedule new
        await service.executeAutoReply('site-1', 'chat-1', 'Hello 2', 'visitor');

        // Should have called clearTimeout
        expect(clearTimeout).toHaveBeenCalled();
        // Should have scheduled new timer
        expect(setTimeout).toHaveBeenCalledTimes(2);

        // If run timers, should only fire once (the latest one)?
        // Actually since we mocked clearTimeout, jest's fake timers should respect it.
        // Let's verify expectations more strictly if possible, but minimal check is clearTimeout call.
    });

    it('should cancel pending timer when admin sends a message', async () => {
        // Setup pending timer
        (prisma.site.findUnique as jest.Mock).mockResolvedValue({ id: 'site-1' });
        (prisma.businessHours.findUnique as jest.Mock).mockResolvedValue({
            id: 'bh-1', siteId: 'site-1', isEnabled: false, timezone: 'UTC',
            offlineMessage: 'Of',
            monday: '{}', tuesday: '{}', wednesday: '{}', thursday: '{}', friday: '{}', saturday: '{}', sunday: '{}',
            createdAt: new Date(), updatedAt: new Date()
        });
        (prisma.autoReply.findMany as jest.Mock).mockResolvedValue([
            { trigger: 'no_reply_5min', delay: 300, message: 'Wait please', isActive: true, siteId: 'site-1' }
        ]);
        (prisma.message.count as jest.Mock).mockResolvedValue(2);

        await service.executeAutoReply('site-1', 'chat-1', 'Hello', 'visitor');
        expect(setTimeout).toHaveBeenCalledTimes(1);

        // Admin replies (simulating event)
        service.handleAdminMessage({ siteId: 'site-1', chatId: 'chat-1' });

        expect(clearTimeout).toHaveBeenCalled();
    });
});
