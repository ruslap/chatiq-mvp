export type Language = 'uk' | 'en';

export interface Translations {
  // Navigation
  nav: {
    chats: string;
    leads: string;
    sites: string;
    analytics: string;
    settings: string;
  };
  // Chat List
  chatList: {
    liveChats: string;
    messages: string;
    all: string;
    new: string;
    mine: string;
    conversations: string;
    unread: string;
    total: string;
    noConversations: string;
    waitingForVisitors: string;
    fileAttached: string;
    noMessages: string;
  };
  // Chat View
  chatView: {
    activeNow: string;
    clearHistory: string;
    deleteConversation: string;
    waitingForMessages: string;
    visitorHasntSent: string;
    typeMessage: string;
    send: string;
    uploading: string;
    pressEnter: string;
    fileSizeLimit: string;
    invalidFileType: string;
    fileUploadFailed: string;
    renameVisitor: string;
    enterNewName: string;
    save: string;
    cancel: string;
  };
  // Settings
  settings: {
    title: string;
    general: string;
    appearance: string;
    account: string;
    language: string;
    save: string;
    saved: string;
  };
  // Common
  common: {
    demo: string;
    live: string;
    you: string;
    visitor: string;
    admin: string;
    today: string;
    yesterday: string;
    selectConversation: string;
    chooseChat: string;
    quickSearch: string;
  };
  // Leads
  leads: {
    title: string;
    subtitle: string;
    noLeads: string;
    loading: string;
    deleteConfirm: string;
    deleteLead: string;
  };
}

export const translations: Record<Language, Translations> = {
  uk: {
    nav: {
      chats: 'Чати',
      leads: 'Ліди',
      sites: 'Сайти',
      analytics: 'Аналітика',
      settings: 'Налаштування',
    },
    chatList: {
      liveChats: 'Живі чати',
      messages: 'Повідомлення',
      all: 'Всі',
      new: 'Нові',
      mine: 'Мої',
      conversations: 'Розмови',
      unread: 'непрочитаних',
      total: 'всього',
      noConversations: 'Немає розмов',
      waitingForVisitors: 'Очікуємо на відвідувачів',
      fileAttached: '📎 Файл прикріплено',
      noMessages: 'Немає повідомлень',
    },
    chatView: {
      activeNow: 'Зараз онлайн',
      clearHistory: 'Очистити історію',
      deleteConversation: 'Видалити розмову',
      waitingForMessages: 'Очікуємо повідомлень...',
      visitorHasntSent: 'Відвідувач ще нічого не надіслав',
      typeMessage: 'Введіть повідомлення...',
      send: 'Надіслати',
      uploading: 'Завантаження...',
      pressEnter: 'Enter',
      fileSizeLimit: 'Розмір файлу має бути менше 10 МБ',
      invalidFileType: 'Недійсний тип файлу. Будь ласка, завантажуйте зображення, PDF або документи.',
      fileUploadFailed: 'Не вдалося завантажити файл. Спробуйте ще раз.',
      renameVisitor: 'Перейменувати відвідувача',
      enterNewName: 'Введіть нове ім\'я',
      save: 'Зберегти',
      cancel: 'Скасувати',
    },
    settings: {
      title: 'Налаштування',
      general: 'Загальні',
      appearance: 'Зовнішній вигляд',
      account: 'Акаунт',
      language: 'Мова',
      save: 'Зберегти',
      saved: 'Збережено',
    },
    common: {
      demo: 'Демо',
      live: 'Онлайн',
      you: 'Ви',
      visitor: 'Відвідувач',
      admin: 'Адмін',
      today: 'Сьогодні',
      yesterday: 'Вчора',
      selectConversation: 'Оберіть розмову',
      chooseChat: 'Виберіть чат зі списку, щоб переглянути розмову та відповісти відвідувачам',
      quickSearch: 'Швидкий пошук',
    },
    leads: {
      title: 'Контактні ліди',
      subtitle: 'Відвідувачі, які залишили свої контактні дані під час офлайн режиму',
      noLeads: 'Поки що немає контактних лідів',
      loading: 'Завантаження...',
      deleteConfirm: 'Ви впевнені, що хочете видалити цього ліда?',
      deleteLead: 'Видалити ліда',
    },
  },
  en: {
    nav: {
      chats: 'Chats',
      leads: 'Leads',
      sites: 'Sites',
      analytics: 'Analytics',
      settings: 'Settings',
    },
    chatList: {
      liveChats: 'Live Chats',
      messages: 'Messages',
      all: 'All',
      new: 'New',
      mine: 'Mine',
      conversations: 'Conversations',
      unread: 'unread',
      total: 'total',
      noConversations: 'No conversations yet',
      waitingForVisitors: 'Waiting for visitors to start chatting',
      fileAttached: '📎 File attached',
      noMessages: 'No messages',
    },
    chatView: {
      activeNow: 'Active Now',
      clearHistory: 'Clear History',
      deleteConversation: 'Delete Conversation',
      waitingForMessages: 'Waiting for messages...',
      visitorHasntSent: "The visitor hasn't sent anything yet",
      typeMessage: 'Type your message...',
      send: 'Send',
      uploading: 'Uploading...',
      pressEnter: 'Enter',
      fileSizeLimit: 'File size must be less than 10MB',
      invalidFileType: 'Invalid file type. Please upload images, PDFs, or documents.',
      fileUploadFailed: 'Failed to upload file. Please try again.',
      renameVisitor: 'Rename Visitor',
      enterNewName: 'Enter new name',
      save: 'Save',
      cancel: 'Cancel',
    },
    settings: {
      title: 'Settings',
      general: 'General',
      appearance: 'Appearance',
      account: 'Account',
      language: 'Language',
      save: 'Save',
      saved: 'Saved',
    },
    common: {
      demo: 'Demo',
      live: 'Online',
      you: 'You',
      visitor: 'Visitor',
      admin: 'Admin',
      today: 'Today',
      yesterday: 'Yesterday',
      selectConversation: 'Select a Conversation',
      chooseChat: 'Choose a chat from the sidebar to view the conversation and reply to your visitors',
      quickSearch: 'Quick search',
    },
    leads: {
      title: 'Contact Leads',
      subtitle: 'Visitors who left their contact information while offline',
      noLeads: 'No contact leads yet',
      loading: 'Loading...',
      deleteConfirm: 'Are you sure you want to delete this lead?',
      deleteLead: 'Delete lead',
    },
  },
};

export function useTranslation(lang: Language) {
  return translations[lang];
}

export function getBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'uk';
  
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('uk') || browserLang.startsWith('ru')) {
    return 'uk';
  }
  return 'en';
}
