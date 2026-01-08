import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationService } from '../automation/automation.service';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: jest.Mocked<PrismaService>;
  let automationService: jest.Mocked<AutomationService>;

  const mockSite = {
    id: 'site-123',
    name: 'Test Site',
    domain: 'example.com',
    ownerId: 'user-123',
  };

  const mockChat = {
    id: 'chat-123',
    siteId: 'site-123',
    visitorId: 'visitor-456',
    visitorName: 'Test Visitor',
    status: 'open',
    createdAt: new Date(),
    messages: [],
  };

  const mockMessage = {
    id: 'msg-789',
    chatId: 'chat-123',
    from: 'visitor',
    text: 'Hello!',
    attachment: null,
    read: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: PrismaService,
          useValue: {
            site: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            chat: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            message: {
              create: jest.fn(),
              findMany: jest.fn(),
              deleteMany: jest.fn(),
              count: jest.fn(),
              updateMany: jest.fn(),
            },
            user: {
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: AutomationService,
          useValue: {
            executeAutoReply: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prisma = module.get(PrismaService);
    automationService = module.get(AutomationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getChatById', () => {
    it('should return chat when found', async () => {
      prisma.chat.findUnique.mockResolvedValue(mockChat as never);

      const result = await service.getChatById('chat-123');

      expect(prisma.chat.findUnique).toHaveBeenCalledWith({
        where: { id: 'chat-123' },
      });
      expect(result).toEqual(mockChat);
    });

    it('should return null when chat not found', async () => {
      prisma.chat.findUnique.mockResolvedValue(null);

      const result = await service.getChatById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('saveVisitorMessage', () => {
    it('should create new chat and message when no chat exists', async () => {
      prisma.site.findUnique.mockResolvedValue(mockSite as never);
      prisma.chat.findFirst.mockResolvedValue(null);
      prisma.chat.create.mockResolvedValue(mockChat as never);
      prisma.message.create.mockResolvedValue(mockMessage as never);

      const result = await service.saveVisitorMessage('site-123', 'visitor-456', 'Hello!');

      expect(prisma.chat.create).toHaveBeenCalledWith({
        data: {
          siteId: 'site-123',
          visitorId: 'visitor-456',
          status: 'open',
        },
      });
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          chatId: 'chat-123',
          from: 'visitor',
          text: 'Hello!',
          attachment: undefined,
        },
      });
      expect(result).toEqual(mockMessage);
    });

    it('should reuse existing open chat', async () => {
      prisma.site.findUnique.mockResolvedValue(mockSite as never);
      prisma.chat.findFirst.mockResolvedValue(mockChat as never);
      prisma.message.create.mockResolvedValue(mockMessage as never);

      await service.saveVisitorMessage('site-123', 'visitor-456', 'Hello again!');

      expect(prisma.chat.create).not.toHaveBeenCalled();
      expect(prisma.chat.update).not.toHaveBeenCalled();
    });

    it('should reopen closed chat', async () => {
      const closedChat = { ...mockChat, status: 'closed' };
      prisma.site.findUnique.mockResolvedValue(mockSite as never);
      prisma.chat.findFirst.mockResolvedValue(closedChat as never);
      prisma.chat.update.mockResolvedValue({ ...closedChat, status: 'open' } as never);
      prisma.message.create.mockResolvedValue(mockMessage as never);

      await service.saveVisitorMessage('site-123', 'visitor-456', 'Hello!');

      expect(prisma.chat.update).toHaveBeenCalledWith({
        where: { id: 'chat-123' },
        data: { status: 'open' },
      });
    });

    it('should create site if not exists and user available', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      prisma.site.findUnique.mockResolvedValue(null);
      prisma.user.findFirst.mockResolvedValue(mockUser as never);
      prisma.site.create.mockResolvedValue(mockSite as never);
      prisma.chat.findFirst.mockResolvedValue(null);
      prisma.chat.create.mockResolvedValue(mockChat as never);
      prisma.message.create.mockResolvedValue(mockMessage as never);

      await service.saveVisitorMessage('site-123', 'visitor-456', 'Hello!');

      expect(prisma.site.create).toHaveBeenCalledWith({
        data: {
          id: 'site-123',
          name: 'Auto-created Test Site',
          domain: 'localhost',
          ownerId: 'user-123',
        },
      });
    });

    it('should throw error when no user exists for site creation', async () => {
      prisma.site.findUnique.mockResolvedValue(null);
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.saveVisitorMessage('site-123', 'visitor-456', 'Hello!'),
      ).rejects.toThrow('No users found in database to assign the new site to.');
    });

    it('should save message with attachment', async () => {
      prisma.site.findUnique.mockResolvedValue(mockSite as never);
      prisma.chat.findFirst.mockResolvedValue(mockChat as never);
      prisma.message.create.mockResolvedValue({ ...mockMessage, attachment: 'file.jpg' } as never);

      await service.saveVisitorMessage('site-123', 'visitor-456', 'Hello!', 'file.jpg');

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          chatId: 'chat-123',
          from: 'visitor',
          text: 'Hello!',
          attachment: 'file.jpg',
        },
      });
    });

    it('should trigger auto-reply after saving message', async () => {
      prisma.site.findUnique.mockResolvedValue(mockSite as never);
      prisma.chat.findFirst.mockResolvedValue(mockChat as never);
      prisma.message.create.mockResolvedValue(mockMessage as never);

      await service.saveVisitorMessage('site-123', 'visitor-456', 'Hello!');

      expect(automationService.executeAutoReply).toHaveBeenCalledWith(
        'site-123',
        'chat-123',
        'Hello!',
        'visitor',
      );
    });
  });

  describe('saveAdminMessage', () => {
    it('should create admin message', async () => {
      const adminMessage = { ...mockMessage, from: 'admin', text: 'How can I help?' };
      prisma.message.create.mockResolvedValue(adminMessage as never);

      const result = await service.saveAdminMessage('chat-123', 'How can I help?');

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          chatId: 'chat-123',
          from: 'admin',
          text: 'How can I help?',
          attachment: undefined,
        },
      });
      expect(result).toEqual(adminMessage);
    });

    it('should save admin message with attachment', async () => {
      prisma.message.create.mockResolvedValue({ ...mockMessage, attachment: '"file.pdf"' } as never);

      await service.saveAdminMessage('chat-123', 'See attachment', 'file.pdf');

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          chatId: 'chat-123',
          from: 'admin',
          text: 'See attachment',
          attachment: '"file.pdf"',
        },
      });
    });
  });

  describe('getChatsBySite', () => {
    it('should return chats with unread counts', async () => {
      const chatsFromDb = [mockChat];
      prisma.chat.findMany.mockResolvedValue(chatsFromDb as never);
      prisma.message.count.mockResolvedValue(3);

      const result = await service.getChatsBySite('site-123');

      expect(prisma.chat.findMany).toHaveBeenCalledWith({
        where: { siteId: 'site-123' },
        orderBy: { createdAt: 'desc' },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      expect(result).toEqual([{ ...mockChat, unreadCount: 3 }]);
    });

    it('should filter chats by search term', async () => {
      prisma.chat.findMany.mockResolvedValue([]);
      prisma.message.count.mockResolvedValue(0);

      await service.getChatsBySite('site-123', 'search term');

      expect(prisma.chat.findMany).toHaveBeenCalledWith({
        where: {
          siteId: 'site-123',
          OR: [
            { visitorName: { contains: 'search term', mode: 'insensitive' } },
            { messages: { some: { text: { contains: 'search term', mode: 'insensitive' } } } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });
  });

  describe('getMessagesByChat', () => {
    it('should return messages ordered by creation date', async () => {
      const messages = [mockMessage];
      prisma.message.findMany.mockResolvedValue(messages as never);

      const result = await service.getMessagesByChat('chat-123');

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { chatId: 'chat-123' },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(messages);
    });
  });

  describe('clearChatMessages', () => {
    it('should delete all messages for chat', async () => {
      prisma.message.deleteMany.mockResolvedValue({ count: 5 } as never);

      const result = await service.clearChatMessages('chat-123');

      expect(prisma.message.deleteMany).toHaveBeenCalledWith({
        where: { chatId: 'chat-123' },
      });
      expect(result).toEqual({ count: 5 });
    });
  });

  describe('deleteChat', () => {
    it('should delete messages first then chat', async () => {
      prisma.message.deleteMany.mockResolvedValue({ count: 3 } as never);
      prisma.chat.delete.mockResolvedValue(mockChat as never);

      const result = await service.deleteChat('chat-123');

      expect(prisma.message.deleteMany).toHaveBeenCalledWith({
        where: { chatId: 'chat-123' },
      });
      expect(prisma.chat.delete).toHaveBeenCalledWith({
        where: { id: 'chat-123' },
      });
      expect(result).toEqual(mockChat);
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread visitor messages', async () => {
      prisma.message.count.mockResolvedValue(7);

      const result = await service.getUnreadCount('site-123');

      expect(prisma.message.count).toHaveBeenCalledWith({
        where: {
          chat: { siteId: 'site-123' },
          from: 'visitor',
          read: false,
        },
      });
      expect(result).toBe(7);
    });
  });

  describe('markMessagesAsRead', () => {
    it('should mark all unread visitor messages as read', async () => {
      prisma.message.updateMany.mockResolvedValue({ count: 4 } as never);

      const result = await service.markMessagesAsRead('chat-123');

      expect(prisma.message.updateMany).toHaveBeenCalledWith({
        where: {
          chatId: 'chat-123',
          from: 'visitor',
          read: false,
        },
        data: { read: true },
      });
      expect(result).toEqual({ count: 4 });
    });
  });

  describe('renameVisitor', () => {
    it('should update visitor name', async () => {
      const updatedChat = { ...mockChat, visitorName: 'New Name' };
      prisma.chat.update.mockResolvedValue(updatedChat as never);

      const result = await service.renameVisitor('chat-123', 'New Name');

      expect(prisma.chat.update).toHaveBeenCalledWith({
        where: { id: 'chat-123' },
        data: { visitorName: 'New Name' },
      });
      expect(result).toEqual(updatedChat);
    });
  });

  describe('findChatByVisitor', () => {
    it('should find most recent chat for visitor', async () => {
      prisma.chat.findFirst.mockResolvedValue(mockChat as never);

      const result = await service.findChatByVisitor('site-123', 'visitor-456');

      expect(prisma.chat.findFirst).toHaveBeenCalledWith({
        where: {
          siteId: 'site-123',
          visitorId: 'visitor-456',
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockChat);
    });

    it('should return null when no chat found', async () => {
      prisma.chat.findFirst.mockResolvedValue(null);

      const result = await service.findChatByVisitor('site-123', 'unknown-visitor');

      expect(result).toBeNull();
    });
  });

  describe('updateChatStatus', () => {
    it('should update chat status to closed', async () => {
      const closedChat = { ...mockChat, status: 'closed' };
      prisma.chat.update.mockResolvedValue(closedChat as never);

      const result = await service.updateChatStatus('chat-123', 'closed');

      expect(prisma.chat.update).toHaveBeenCalledWith({
        where: { id: 'chat-123' },
        data: { status: 'closed' },
      });
      expect(result).toEqual(closedChat);
    });

    it('should update chat status to open', async () => {
      prisma.chat.update.mockResolvedValue(mockChat as never);

      const result = await service.updateChatStatus('chat-123', 'open');

      expect(prisma.chat.update).toHaveBeenCalledWith({
        where: { id: 'chat-123' },
        data: { status: 'open' },
      });
      expect(result).toEqual(mockChat);
    });
  });
});
