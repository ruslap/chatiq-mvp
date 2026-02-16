import { config } from "./config";

interface TextDictionary {
  online: string;
  offline: string;
  offlineHint: string;
  offlineBanner: string;
  welcomeFallback: string;
  contactFormTitle: string;
  contactFormDesc: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactMessage: string;
  contactSubmit: string;
  contactSuccess: string;
}

const TEXTS: Record<string, TextDictionary> = {
  uk: {
    online: "Онлайн",
    offline: "Не в мережі",
    offlineHint: "Ми відповімо у робочий час",
    offlineBanner:
      "Ми тимчасово офлайн. Залиште повідомлення і ми повернемось!",
    welcomeFallback: "Дякуємо за звернення! Ми скоро відповімо.",
    contactFormTitle: "Залиште контакти",
    contactFormDesc:
      "Ми зараз офлайн. Залиште свої дані і ми зв\u02bcяжемося з вами.",
    contactName: "Ім\u02bcя",
    contactEmail: "Email",
    contactPhone: "Телефон",
    contactMessage: "Повідомлення (опціонально)",
    contactSubmit: "Відправити",
    contactSuccess:
      "Дякуємо! Ми зв\u02bcяжемося з вами найближчим часом.",
  },
  en: {
    online: "Online",
    offline: "Offline",
    offlineHint: "We will reply during business hours",
    offlineBanner:
      "We are currently offline. Leave a message and we will get back to you!",
    welcomeFallback: "Thanks for reaching out! We will respond shortly.",
    contactFormTitle: "Leave your contacts",
    contactFormDesc:
      "We are currently offline. Leave your details and we will contact you.",
    contactName: "Name",
    contactEmail: "Email",
    contactPhone: "Phone",
    contactMessage: "Message (optional)",
    contactSubmit: "Submit",
    contactSuccess: "Thank you! We will contact you soon.",
  },
};

export function t(key: keyof TextDictionary): string {
  const dict = TEXTS[config.language] || TEXTS.en;
  return dict[key] || TEXTS.en[key] || key;
}
