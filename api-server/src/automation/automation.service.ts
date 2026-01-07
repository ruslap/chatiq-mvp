import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface DaySchedule {
  start: string;
  end: string;
  isOpen: boolean;
}

@Injectable()
export class AutomationService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) { }

  // ============ AUTO-REPLIES ============

  async getAutoReplies(siteId: string) {
    return this.prisma.autoReply.findMany({
      where: { siteId },
      orderBy: { order: 'asc' },
    });
  }

  async createAutoReply(
    siteId: string,
    data: {
      name: string;
      trigger: string;
      message: string;
      delay?: number;
      isActive?: boolean;
    },
  ) {
    const maxOrder = await this.prisma.autoReply.aggregate({
      where: { siteId },
      _max: { order: true },
    });

    return this.prisma.autoReply.create({
      data: {
        siteId,
        name: data.name,
        trigger: data.trigger,
        message: data.message,
        delay: data.delay || 0,
        isActive: data.isActive ?? true,
        order: (maxOrder._max.order || 0) + 1,
      },
    });
  }

  async updateAutoReply(
    id: string,
    data: {
      name?: string;
      trigger?: string;
      message?: string;
      delay?: number;
      isActive?: boolean;
      order?: number;
    },
  ) {
    return this.prisma.autoReply.update({
      where: { id },
      data,
    });
  }

  async deleteAutoReply(id: string) {
    return this.prisma.autoReply.delete({
      where: { id },
    });
  }

  async getActiveAutoReplyByTrigger(siteId: string, trigger: string) {
    return this.prisma.autoReply.findFirst({
      where: {
        siteId,
        trigger,
        isActive: true,
      },
      orderBy: { order: 'asc' },
    });
  }

  // ============ QUICK TEMPLATES ============

  async getQuickTemplates(siteId: string) {
    return this.prisma.quickTemplate.findMany({
      where: { siteId },
      orderBy: { order: 'asc' },
    });
  }

  async createQuickTemplate(
    siteId: string,
    data: {
      title: string;
      message: string;
      shortcut?: string;
      category?: string;
      isActive?: boolean;
    },
  ) {
    const maxOrder = await this.prisma.quickTemplate.aggregate({
      where: { siteId },
      _max: { order: true },
    });

    return this.prisma.quickTemplate.create({
      data: {
        siteId,
        title: data.title,
        message: data.message,
        shortcut: data.shortcut,
        category: data.category,
        isActive: data.isActive ?? true,
        order: (maxOrder._max.order || 0) + 1,
      },
    });
  }

  async updateQuickTemplate(
    id: string,
    data: {
      title?: string;
      message?: string;
      shortcut?: string;
      category?: string;
      isActive?: boolean;
      order?: number;
    },
  ) {
    return this.prisma.quickTemplate.update({
      where: { id },
      data,
    });
  }

  async deleteQuickTemplate(id: string) {
    return this.prisma.quickTemplate.delete({
      where: { id },
    });
  }

  async getActiveQuickTemplates(siteId: string) {
    return this.prisma.quickTemplate.findMany({
      where: {
        siteId,
        isActive: true,
      },
      orderBy: { order: 'asc' },
    });
  }

  // ============ SEED DEFAULT TEMPLATES ============

  async seedDefaultAutoReplies(siteId: string) {
    const existing = await this.prisma.autoReply.count({ where: { siteId } });
    if (existing > 0) return;

    const defaults = [
      {
        name: 'Привітання',
        trigger: 'first_message',
        message: 'Дякуємо за звернення! 👋 Ми відповімо вам найближчим часом.',
        delay: 0,
        order: 1,
      },
      {
        name: 'Затримка 5 хв',
        trigger: 'no_reply_5min',
        message: 'Дякуємо за очікування! Наш оператор скоро відповість вам.',
        delay: 300,
        order: 2,
      },
      {
        name: 'Затримка 10 хв',
        trigger: 'no_reply_10min',
        message:
          'Вибачте за затримку. Якщо ви поспішаєте, залиште свій номер телефону і ми вам передзвонимо! 📞',
        delay: 600,
        order: 3,
      },
      {
        name: 'Офлайн',
        trigger: 'offline',
        message:
          'Зараз ми офлайн. Залиште своє повідомлення і ми відповімо, як тільки повернемось! 🕐',
        delay: 0,
        order: 4,
      },
    ];

    for (const item of defaults) {
      await this.prisma.autoReply.create({
        data: { siteId, ...item, isActive: true },
      });
    }
  }

  async seedDefaultQuickTemplates(siteId: string) {
    const existing = await this.prisma.quickTemplate.count({
      where: { siteId },
    });
    if (existing > 0) return;

    const defaults = [
      {
        title: 'Привітання',
        shortcut: '/hello',
        message: 'Вітаю! Чим можу допомогти?',
        category: 'Загальні',
        order: 1,
      },
      {
        title: 'Запит телефону',
        shortcut: '/phone',
        message:
          'Залиште, будь ласка, ваш номер телефону і ми вам передзвонимо протягом 10 хвилин.',
        category: 'Контакти',
        order: 2,
      },
      {
        title: 'Подяка',
        shortcut: '/thanks',
        message:
          'Дякуємо за звернення! Якщо виникнуть питання - пишіть, завжди раді допомогти! 😊',
        category: 'Загальні',
        order: 3,
      },
      {
        title: 'Уточнення',
        shortcut: '/clarify',
        message:
          'Чи можете уточнити ваше питання? Хочу переконатись, що правильно вас зрозумів.',
        category: 'Загальні',
        order: 4,
      },
      {
        title: 'Час роботи',
        shortcut: '/hours',
        message:
          'Ми працюємо з 9:00 до 18:00, Пн-Пт. У вихідні відповідаємо на повідомлення з невеликою затримкою.',
        category: 'Інформація',
        order: 5,
      },
      {
        title: 'Очікування',
        shortcut: '/wait',
        message: 'Одну хвилинку, зараз уточню інформацію для вас...',
        category: 'Загальні',
        order: 6,
      },
    ];

    for (const item of defaults) {
      await this.prisma.quickTemplate.create({
        data: { siteId, ...item, isActive: true },
      });
    }
  }

  // ============ BUSINESS HOURS ============

  async getBusinessHours(siteId: string) {
    // 1. Check if site exists - if not, we cannot create business hours
    const siteExists = await this.prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true },
    });

    if (!siteExists) {
      // Return default values if site doesn't exist (for widget preview, etc.)
      return {
        id: 'default',
        siteId,
        timezone: 'Europe/Kyiv',
        isEnabled: false,
        offlineMessage: 'Дякуємо за звернення! 🕐 Наразі ми не в мережі.',
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
    }

    // 2. Try to find existing business hours
    let hours = await this.prisma.businessHours.findUnique({
      where: { siteId },
    });

    // 3. Create default if not exists (using try-catch to handle rare race conditions)
    if (!hours) {
      try {
        hours = await this.prisma.businessHours.create({
          data: { siteId },
        });

        // Seed default templates and auto-replies for new site
        await this.seedDefaultAutoReplies(siteId);
        await this.seedDefaultQuickTemplates(siteId);
      } catch (error: unknown) {
        // If creation fails due to unique constraint, try to find it again
        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002') {
          hours = await this.prisma.businessHours.findUnique({
            where: { siteId },
          });
        } else {
          throw error;
        }
      }
    }

    return hours;
  }

  async updateBusinessHours(
    siteId: string,
    data: {
      timezone?: string;
      isEnabled?: boolean;
      offlineMessage?: string;
      monday?: { start: string; end: string; isOpen: boolean };
      tuesday?: { start: string; end: string; isOpen: boolean };
      wednesday?: { start: string; end: string; isOpen: boolean };
      thursday?: { start: string; end: string; isOpen: boolean };
      friday?: { start: string; end: string; isOpen: boolean };
      saturday?: { start: string; end: string; isOpen: boolean };
      sunday?: { start: string; end: string; isOpen: boolean };
    },
  ) {
    // Ensure record exists
    await this.getBusinessHours(siteId);

    return this.prisma.businessHours.update({
      where: { siteId },
      data: {
        timezone: data.timezone,
        isEnabled: data.isEnabled,
        offlineMessage: data.offlineMessage,
        monday: data.monday ? JSON.stringify(data.monday) : undefined,
        tuesday: data.tuesday ? JSON.stringify(data.tuesday) : undefined,
        wednesday: data.wednesday ? JSON.stringify(data.wednesday) : undefined,
        thursday: data.thursday ? JSON.stringify(data.thursday) : undefined,
        friday: data.friday ? JSON.stringify(data.friday) : undefined,
        saturday: data.saturday ? JSON.stringify(data.saturday) : undefined,
        sunday: data.sunday ? JSON.stringify(data.sunday) : undefined,
      },
    });
  }

  async isWithinBusinessHours(
    siteId: string,
  ): Promise<{ isOpen: boolean; message?: string }> {
    const hours = await this.getBusinessHours(siteId);

    // If hours is null (shouldn't happen but handle for type safety)
    if (!hours) {
      return { isOpen: true }; // Default to always open if no settings
    }

    if (!hours.isEnabled) {
      return { isOpen: true }; // If disabled, always open
    }

    // Get current time in the configured timezone
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: hours.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    const timeStr = now.toLocaleTimeString('en-GB', options);
    const [currentHour, currentMinute] = timeStr.split(':').map(Number);
    const currentMinutes = currentHour * 60 + currentMinute;

    // Get day of week in timezone
    const dayOptions: Intl.DateTimeFormatOptions = {
      timeZone: hours.timezone,
      weekday: 'long',
    };
    const dayName = now.toLocaleDateString('en-US', dayOptions).toLowerCase();

    // Debug logging
    console.log(`[BusinessHours] Checking for siteId: ${siteId}`);
    console.log(
      `[BusinessHours] Current time: ${now.toLocaleTimeString('en-US', { timeZone: hours.timezone })}`,
    );
    console.log(`[BusinessHours] Current day: ${dayName}`);

    // Get schedule for current day
    const daySchedules: Record<string, any> = {
      monday: hours.monday,
      tuesday: hours.tuesday,
      wednesday: hours.wednesday,
      thursday: hours.thursday,
      friday: hours.friday,
      saturday: hours.saturday,
      sunday: hours.sunday,
    };

    let schedule: DaySchedule | null = daySchedules[dayName] as DaySchedule | null;
    if (typeof schedule === 'string') {
      schedule = JSON.parse(schedule) as DaySchedule;
    }

    console.log(`[BusinessHours] Schedule for ${dayName}:`, schedule);

    if (!schedule || !schedule.isOpen) {
      return { isOpen: false, message: hours.offlineMessage };
    }

    // Parse start and end times
    const [startHour, startMinute] = schedule.start.split(':').map(Number);
    const [endHour, endMinute] = schedule.end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;

    // Treat 00:00 as end of day (24:00)
    if (endMinutes === 0) {
      endMinutes = 24 * 60;
    }

    let isOpen = false;
    if (startMinutes < endMinutes) {
      // Same day schedule
      isOpen = currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Overnight schedule (e.g. 18:00 - 02:00)
      isOpen = currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    return {
      isOpen,
      message: isOpen ? undefined : hours.offlineMessage,
    };
  }

  // ============ AUTO-REPLY EXECUTION ============

  async checkAndExecuteAutoReply(
    siteId: string,
    trigger: string,
    _chatId: string,
  ): Promise<{ shouldReply: boolean; message?: string; delay?: number }> {
    // Get active auto-replies for this site
    const autoReplies = await this.prisma.autoReply.findMany({
      where: {
        siteId,
        isActive: true,
        trigger,
      },
      orderBy: { order: 'asc' },
    });

    if (autoReplies.length === 0) {
      return { shouldReply: false };
    }

    // Check business hours for offline trigger
    if (trigger === 'offline') {
      const businessStatus = await this.isWithinBusinessHours(siteId);
      if (businessStatus.isOpen) {
        return { shouldReply: false }; // Don't send offline message if we're open
      }
    }

    // Get the first matching auto-reply
    const autoReply = autoReplies[0];

    return {
      shouldReply: true,
      message: autoReply.message,
      delay: autoReply.delay,
    };
  }

  async executeAutoReply(
    siteId: string,
    chatId: string,
    message: string,
    from: 'admin' | 'visitor',
  ): Promise<void> {
    console.log('[AutoReply] executeAutoReply called', { siteId, chatId, from });

    // Don't execute auto-replies for admin messages
    if (from === 'admin') {
      console.log('[AutoReply] Skipping - message from admin');
      return;
    }

    // Check business hours status first
    const businessStatus = await this.isWithinBusinessHours(siteId);
    console.log('[AutoReply] Business status:', businessStatus);

    // Check for first message trigger
    const messageCount = await this.prisma.message.count({
      where: { chatId },
    });
    console.log('[AutoReply] Message count:', messageCount);

    if (messageCount === 1) {
      // This is the first message
      if (businessStatus.isOpen) {
        console.log('[AutoReply] ONLINE - sending welcome message');
        // Online: send welcome message
        const result = await this.checkAndExecuteAutoReply(
          siteId,
          'first_message',
          chatId,
        );
        if (result.shouldReply) {
          void (async () => {
            await new Promise((resolve) => setTimeout(resolve, result.delay || 0));
            await this.sendAutoReply(siteId, chatId, result.message!);
          })();
        }
      } else {
        console.log('[AutoReply] OFFLINE - sending offline message');
        // Offline: send offline message instead of welcome
        const offlineResult = await this.checkAndExecuteAutoReply(
          siteId,
          'offline',
          chatId,
        );
        if (offlineResult.shouldReply) {
          void (async () => {
            await new Promise((resolve) => setTimeout(resolve, offlineResult.delay || 0));
            await this.sendAutoReply(siteId, chatId, offlineResult.message!);
          })();
        }
      }
    }
  }

  private async sendAutoReply(
    siteId: string,
    chatId: string,
    message: string,
  ): Promise<void> {
    try {
      // Create the auto-reply message
      const savedMessage = await this.prisma.message.create({
        data: {
          chatId,
          text: message,
          from: 'admin',
          createdAt: new Date(),
        },
      });

      // Get chat to find visitorId
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
      });

      if (chat) {
        // Emit event for WebSocket delivery
        this.eventEmitter.emit('auto-reply.sent', {
          siteId,
          chatId,
          visitorId: chat.visitorId,
          message: savedMessage,
        });
      }

      console.log(`Auto-reply sent to chat ${chatId}: ${message}`);
    } catch (error) {
      console.error('Failed to send auto-reply:', error);
    }
  }
}
