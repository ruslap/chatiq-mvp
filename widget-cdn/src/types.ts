export interface ChtqConfig {
  organizationId: string | null;
  apiUrl?: string;
  language: "uk" | "en";
  color: string;
  secondaryColor?: string;
  position: "left" | "right";
  size: "standard" | "compact" | "large";
  theme: "light" | "dark" | "auto";
  agentName: string;
  agentAvatar: string | null;
  welcomeMessage: string | null;
}

export interface BusinessStatus {
  isOpen: boolean;
  message?: string;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface MessageData {
  id?: string;
  text: string;
  from: "user" | "bot" | "system";
  attachment?: string | null;
  createdAt?: string;
  messageId?: string;
}

export interface WidgetSettings {
  operatorName?: string;
  operatorAvatar?: string;
  welcomeMessage?: string;
  showContactForm?: boolean;
  color?: string;
  secondaryColor?: string;
}

declare global {
  interface Window {
    chtq?: Partial<ChtqConfig>;
    ChatIQConfig?: Record<string, string>;
    io?: (url: string, opts?: Record<string, unknown>) => Socket;
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
    _chatiqVisitorFirstName?: string;
  }
}

export interface Socket {
  on(event: string, callback: (...args: unknown[]) => void): void;
  emit(event: string, ...args: unknown[]): void;
  disconnect(): void;
  connected: boolean;
}
