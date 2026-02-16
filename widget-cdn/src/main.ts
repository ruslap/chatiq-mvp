/**
 * ChatIQ Widget - TypeScript Entry Point
 *
 * This is the modular TypeScript source for the widget SDK.
 * Build with: npm run build
 * Output: public/widget.js (single IIFE bundle for CDN)
 *
 * Module structure:
 *   types.ts   - Shared interfaces and global declarations
 *   config.ts  - Configuration merging (chtq / legacy / script attrs)
 *   i18n.ts    - Internationalization (uk/en)
 *   utils.ts   - Pure helpers (hexToHSL, escapeHtml, visitorId, formatting)
 *   sound.ts   - Audio feedback (Web Audio API tones)
 *   api.ts     - HTTP calls (resolve, settings, business hours, leads, history)
 *   socket.ts  - Socket.IO connection and event wiring
 *   main.ts    - Orchestrator (this file)
 */

import { config, API_URL, WIDGET_VERSION } from "./config";
import { t } from "./i18n";
import { hexToHSL, escapeHtml, getVisitorId, formatTime, formatFileSize } from "./utils";
import { sounds } from "./sound";
import {
  resolveSiteId,
  fetchWidgetSettings,
  fetchBusinessStatus,
  submitContactLead,
  fetchVisitorHistory,
} from "./api";
import {
  initSocket,
  sendVisitorMessage,
  emitDisconnect,
} from "./socket";
import type { BusinessStatus, WidgetSettings } from "./types";

(function () {
  "use strict";

  const organizationId = config.organizationId;
  if (!organizationId) {
    console.warn(
      "[Chtq] Missing organizationId. Please configure window.chtq or use data-site-id attribute.",
    );
    return;
  }

  // --- Mutable widget state ---
  let resolvedSiteId: string | null = null;
  let accentColor = config.color;
  let secondaryColorValue = config.secondaryColor || accentColor;
  let agentName = config.agentName;
  let agentAvatar = config.agentAvatar;
  let welcomeMessage = config.welcomeMessage || t("welcomeFallback");
  let showContactForm = false;
  let businessStatus: BusinessStatus = { isOpen: true };
  let isOpen = false;
  let unreadCount = 0;
  const visitorId = getVisitorId();

  // Shadow DOM references
  let shadow: ShadowRoot | null = null;
  let widgetContainer: HTMLDivElement | null = null;

  console.log(`[Chtq] Widget v${WIDGET_VERSION} initialized`);
  console.log(`[Chtq] Organization ID: ${organizationId}`);
  console.log(`[Chtq] Visitor ID: ${visitorId}`);

  // --- API integration ---
  async function init(): Promise<void> {
    // 1. Resolve siteId from organization
    resolvedSiteId = await resolveSiteId(organizationId!);
    if (!resolvedSiteId) {
      console.warn("[Chtq] Could not resolve siteId, widget disabled");
      return;
    }

    // 2. Fetch widget settings
    const settings = await fetchWidgetSettings(organizationId!);
    if (settings) {
      applySettings(settings);
    }

    // 3. Fetch business hours
    businessStatus = await fetchBusinessStatus(resolvedSiteId);

    // 4. Build and mount the widget DOM
    mountWidget();

    // 5. Connect socket
    initSocket(resolvedSiteId, visitorId, {
      onAdminMessage: (data) => {
        showTypingIndicator();
        setTimeout(() => {
          addMessage(data.text, "bot", data.attachment, data.messageId);
          hideTypingIndicator();
        }, 800);
      },
      onMessageEdited: (data) => {
        if (!shadow) return;
        const msgEl = shadow.querySelector(
          `[data-message-id="${data.messageId}"]`,
        );
        if (msgEl) {
          const bubble = msgEl.querySelector(".message-bubble");
          if (bubble) {
            const attachmentEl = bubble.querySelector(".message-attachment");
            const attachmentHTML = attachmentEl ? attachmentEl.outerHTML : "";
            bubble.innerHTML = escapeHtml(data.text) + attachmentHTML;
          }
        }
      },
      onMessageDeleted: (data) => {
        if (!shadow) return;
        const msgEl = shadow.querySelector(
          `[data-message-id="${data.messageId}"]`,
        );
        if (msgEl) {
          const el = msgEl as HTMLElement;
          el.style.transition = "opacity 0.3s, transform 0.3s";
          el.style.opacity = "0";
          el.style.transform = "scale(0.95)";
          setTimeout(() => el.remove(), 300);
        }
      },
    });

    // 6. Restore chat history
    await restoreHistory();

    // 7. Periodic business hours check
    setInterval(async () => {
      if (resolvedSiteId) {
        businessStatus = await fetchBusinessStatus(resolvedSiteId);
        updatePresenceUI();
      }
    }, 60_000);
  }

  function applySettings(settings: WidgetSettings): void {
    if (settings.operatorName) agentName = settings.operatorName;
    if (settings.operatorAvatar) agentAvatar = settings.operatorAvatar;
    if (settings.welcomeMessage) welcomeMessage = settings.welcomeMessage;
    if (settings.showContactForm !== undefined)
      showContactForm = settings.showContactForm;
    if (settings.color) {
      accentColor = settings.color;
      localStorage.setItem(`chtq_color_${organizationId}`, settings.color);
    }
    if (settings.secondaryColor) {
      secondaryColorValue = settings.secondaryColor;
    } else {
      secondaryColorValue = accentColor;
    }
  }

  // --- DOM construction (placeholder — full HTML/CSS from original widget.js) ---
  // NOTE: The full 2000-line CSS and HTML template from the original widget.js
  // should be migrated here incrementally. For now, this creates the minimal
  // Shadow DOM structure. The existing public/widget.js remains the production
  // version until this TypeScript source reaches feature parity.

  function mountWidget(): void {
    widgetContainer = document.createElement("div");
    widgetContainer.id = "chatiq-widget";
    Object.assign(widgetContainer.style, {
      position: "fixed",
      bottom: "0",
      right: "0",
      width: "auto",
      height: "auto",
      zIndex: "2147483647",
      overflow: "visible",
      pointerEvents: "none",
    });
    document.body.appendChild(widgetContainer);
    shadow = widgetContainer.attachShadow({ mode: "open" });

    // Apply accent color CSS variables
    const hsl = hexToHSL(accentColor);
    widgetContainer.style.setProperty("--accent-h", String(hsl.h));
    widgetContainer.style.setProperty("--accent-s", hsl.s + "%");
    widgetContainer.style.setProperty("--accent-l", hsl.l + "%");
    widgetContainer.style.setProperty("--accent-primary", accentColor);
    widgetContainer.style.setProperty("--accent-secondary", secondaryColorValue);

    // TODO: Migrate full HTML/CSS template from original widget.js
    // For now, this is a structural placeholder.
    shadow.innerHTML = `
      <style>/* CSS will be migrated from original widget.js */</style>
      <div class="widget-root">
        <!-- Launcher, Panel, Messages, Composer will be built here -->
      </div>
    `;
  }

  function updatePresenceUI(): void {
    if (!shadow) return;
    const statusText = shadow.querySelector(".status-text");
    if (statusText) {
      statusText.textContent = businessStatus.isOpen
        ? t("online")
        : t("offline");
    }
  }

  function showTypingIndicator(): void {
    // TODO: implement typing indicator in shadow DOM
  }

  function hideTypingIndicator(): void {
    // TODO: implement typing indicator in shadow DOM
  }

  function addMessage(
    text: string,
    from: string,
    attachment?: string | null,
    messageId?: string,
  ): void {
    if (!shadow) return;
    // TODO: implement full message rendering in shadow DOM
    console.log(`[Chtq] Message (${from}): ${text}`);
    if (from === "bot" && !isOpen) {
      unreadCount++;
      sounds.notification();
    }
  }

  async function restoreHistory(): Promise<void> {
    if (!resolvedSiteId) return;
    const result = await fetchVisitorHistory(resolvedSiteId, visitorId);
    for (const msg of result.data) {
      addMessage(
        msg.text as string,
        msg.from === "visitor" ? "user" : "bot",
        msg.attachment as string | null,
        msg.id as string,
      );
    }
  }

  // --- Bootstrap ---
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void init());
  } else {
    void init();
  }
})();
