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
import { getStyles } from "./ui/styles";
import { getTemplate } from "./ui/template";
import { isSoundEnabled } from "./sound";
import {
  initLauncher,
  updateLauncherState,
  setUnreadBadge,
} from "./ui/launcher";
import { initPanel, togglePanel } from "./ui/panel";
import {
  addMessageToUI,
  showTypingIndicator as showTypingUI,
  hideTypingIndicator as hideTypingUI,
  scrollToBottom,
} from "./ui/messages";

import { initDrafts } from "./ui/drafts";
import { showQuickReplies } from "./ui/messages";
import { initComposer } from "./ui/composer";
import { initEmojiPicker } from "./ui/emoji";
import { initFileUpload, clearUploadUI } from "./ui/file-upload";
import { uploadFile } from "./api";
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
          if (isOpen) sounds.receive();
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
    
    // Generate UI
    const styles = getStyles(accentColor, secondaryColorValue, hsl, config.position);
    const html = getTemplate(
      styles,
      agentName,
      agentAvatar,
      welcomeMessage,
      isSoundEnabled(),
      config.position
    );

    shadow.innerHTML = html;
    
    // Initialize interactive elements
    // Initialize interactive elements
    initLauncher(shadow, () => toggleWidget());
    initPanel(shadow, () => toggleWidget());
    
    // Drafts
    const { saveDraft, loadDraft, clearDraft } = initDrafts(shadow, organizationId!);
    
    let currentFile: File | null = null;
    
    initFileUpload(shadow, (file) => {
        currentFile = file;
        composerControls?.setSendDisabled(!file && !((shadow?.getElementById("input") as HTMLInputElement)?.value.trim()));
    });

    const composerControls = initComposer(shadow, async (text) => {
        if (!text && !currentFile) return;
        
        let attachment = null;
        if (currentFile && resolvedSiteId) {
            composerControls?.setLoading(true);
            const result = await uploadFile(resolvedSiteId, currentFile);
            if (result) {
                attachment = result;
            } else {
                // Upload failed
                composerControls?.setLoading(false);
                return; // Stop sending
            }
        }
        
        // Optimistic UI update
        addMessage(text, "user", attachment as any); 
        sounds.send();
        
        if (resolvedSiteId) {
            const visitorName = localStorage.getItem("chatiq_visitor_name") || "Guest"; 
            sendVisitorMessage(
                resolvedSiteId, 
                visitorId, 
                text, 
                visitorName, 
                attachment ? JSON.stringify(attachment) : undefined 
            );
        }
        
        if (currentFile) {
            clearUploadUI(shadow!);
            currentFile = null;
        }
        
        composerControls?.clear();
        clearDraft(); // Clear draft on send
        composerControls?.setLoading(false);
    });
    
    initEmojiPicker(shadow);
    
    // Load saved draft
    loadDraft();
  }

  // Expose API
  (globalThis as any).ChatIQ = {
      version: WIDGET_VERSION,
      siteId: resolvedSiteId,
      visitorId,
      open: () => {
          if (!isOpen && shadow) toggleWidget();
      },
      close: () => {
          if (isOpen && shadow) toggleWidget();
      },
      toggle: toggleWidget,
      sendMessage: (text: string, attachment?: any) => addMessage(text, "user", attachment),
      showQuickReplies: (replies: string[]) => {
          if (shadow) {
              showQuickReplies(shadow, replies, (text) => {
                  if (shadow) {
                      const input = shadow.getElementById("input") as HTMLInputElement;
                      if (input) {
                          input.value = text;
                          input.dispatchEvent(new Event("input"));
                          const sendBtn = shadow.getElementById("send-btn");
                          if (sendBtn) sendBtn.click();
                      }
                  }
              });
          }
      },
  };


  function toggleWidget(): void {
    isOpen = !isOpen;
    if (!shadow) return;
    
    updateLauncherState(shadow, isOpen);
    togglePanel(shadow, isOpen);
    
    if (isOpen) {
      unreadCount = 0;
      setUnreadBadge(shadow, 0);
      const messages = shadow.getElementById("messages");
      if (messages) scrollToBottom(messages);
    }
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
    if (!shadow) return;
    showTypingUI(shadow, agentName, agentAvatar);
  }

  function hideTypingIndicator(): void {
    if (!shadow) return;
    hideTypingUI(shadow);
  }

  function addMessage(
    text: string,
    from: string,
    attachment: any = null,
    messageId?: string,
  ): void {
    if (!shadow) return;
    
    addMessageToUI(shadow, {
        text,
        from: from as "bot" | "user",
        attachment,
        messageId,
        agentAvatar
    });

    if (from === "bot" && !isOpen) {
      unreadCount++;
      setUnreadBadge(shadow, unreadCount);
      sounds.notification();
    }
  }

  async function restoreHistory(): Promise<void> {
    if (!resolvedSiteId) return;
    const result = await fetchVisitorHistory(resolvedSiteId, visitorId);
    if (!shadow) return;
    
    for (const msg of result.data) {
      addMessageToUI(shadow, {
        text: msg.text as string,
        from: msg.from === "visitor" ? "user" : "bot",
        attachment: msg.attachment as string | null,
        messageId: msg.id as string,
        agentAvatar
      });
    }
  }

  // --- Bootstrap ---
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void init());
  } else {
    void init();
  }
})();
