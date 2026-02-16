import type { ChtqConfig } from "./types";

const WIDGET_VERSION = "3.2.1";

const chtqConfig = window.chtq || {};
const legacyConfig = window.ChatIQConfig || {};
const currentScript = document.currentScript;

export const API_URL =
  chtqConfig.apiUrl ||
  (window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://api.chtq.ink");

export const config: ChtqConfig = {
  organizationId:
    chtqConfig.organizationId ||
    legacyConfig.siteId ||
    currentScript?.getAttribute("data-site-id") ||
    null,
  language: (chtqConfig.language || legacyConfig.language || "uk") as
    | "uk"
    | "en",
  color: chtqConfig.color || legacyConfig.accentColor || "#6366F1",
  position: (chtqConfig.position || legacyConfig.position || "right") as
    | "left"
    | "right",
  size: (chtqConfig.size || legacyConfig.size || "standard") as
    | "standard"
    | "compact"
    | "large",
  theme: (chtqConfig.theme || legacyConfig.theme || "light") as
    | "light"
    | "dark"
    | "auto",
  agentName: chtqConfig.agentName || legacyConfig.agentName || "Support Team",
  agentAvatar: chtqConfig.agentAvatar || legacyConfig.agentAvatar || null,
  welcomeMessage:
    chtqConfig.welcomeMessage || legacyConfig.welcomeMessage || null,
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  "image/*",
  "application/pdf",
  ".doc",
  ".docx",
  ".txt",
];

export { WIDGET_VERSION };
