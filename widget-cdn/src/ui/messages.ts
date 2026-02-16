import { escapeHtml, formatTime, formatFileSize } from "../utils";
import type { MessageAttachment } from "../types";

export interface MessageOptions {
  text: string;
  from: "bot" | "user";
  attachment?: MessageAttachment | string | null;
  messageId?: string;
  agentAvatar?: string | null;
}

export function addMessageToUI(shadow: ShadowRoot, options: MessageOptions): void {
  const messagesContainer = shadow.getElementById("messages");
  if (!messagesContainer) return;

  const { text, from, attachment, messageId, agentAvatar } = options;
  const isBot = from === "bot";
  const time = formatTime(new Date());

  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${from}`;
  if (messageId) msgDiv.setAttribute("data-message-id", messageId);

  // Avatar for bot
  let avatarHTML = "";
  if (isBot) {
    if (agentAvatar) {
      avatarHTML = `<img src="${agentAvatar}" alt="Agent" class="message-avatar" />`;
    } else {
      // Default icon
      avatarHTML = `
        <div class="message-avatar">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </div>`;
    }
  }

  // Content
  let contentHTML = `<div class="message-bubble">`;
  contentHTML += escapeHtml(text);
  
  if (attachment) {
      if (typeof attachment === 'string') {
          if (attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              contentHTML += `
                <div class="message-attachment">
                    <a href="${attachment}" target="_blank" rel="noopener">
                        <img src="${attachment}" class="attachment-image" alt="Attachment" loading="lazy" />
                    </a>
                </div>`;
          } else {
               contentHTML += `
                <div class="message-attachment">
                    <a href="${attachment}" target="_blank" rel="noopener" class="attachment-link">
                        Download File
                    </a>
                </div>`;
          }
      } else {
          if (attachment.type.startsWith("image/")) {
              contentHTML += `
                <div class="message-attachment">
                    <a href="${attachment.url}" target="_blank" rel="noopener">
                        <img src="${attachment.url}" class="attachment-image" alt="${escapeHtml(attachment.name)}" loading="lazy" />
                    </a>
                </div>`;
          } else {
              contentHTML += `
                <div class="message-attachment">
                    <a href="${attachment.url}" target="_blank" rel="noopener" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit; padding: 8px;">
                        <div class="attachment-icon">
                            <svg style="width: 24px; height: 24px;" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/></svg>
                        </div>
                        <div class="attachment-info">
                            <div class="attachment-name">${escapeHtml(attachment.name)}</div>
                            <div class="attachment-size">${formatFileSize(attachment.size)}</div>
                        </div>
                    </a>
                </div>`;
          }
      }
  }
  contentHTML += `</div>`;

  // Meta (time)
  const metaHTML = `
    <div class="message-meta">
      <span class="message-time">${time}</span>
      ${!isBot ? '<span class="message-status"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span>' : ''}
    </div>
  `;

  msgDiv.innerHTML = avatarHTML + `
    <div class="message-content">
      ${contentHTML}
      ${metaHTML}
    </div>
  `;

  messagesContainer.appendChild(msgDiv);
  scrollToBottom(messagesContainer);
}

export function scrollToBottom(container: HTMLElement): void {
  container.scrollTop = container.scrollHeight;
}

export function showTypingIndicator(
  shadow: ShadowRoot,
  agentName: string,
  agentAvatar: string | null
): void {
  const messagesContainer = shadow.getElementById("messages");
  if (!messagesContainer) return;

  if (shadow.getElementById("typing")) return;

  const typing = document.createElement("div");
  typing.className = "typing";
  typing.id = "typing";
  
  // Use same structure as widget.js
  const avatarHTML = agentAvatar
    ? `<img src="${agentAvatar}" alt="${agentName}" class="typing-avatar-img" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;

  typing.innerHTML = `
    <div class="typing-avatar" style="width:32px;height:32px;border-radius:50%;background:#1D2331;display:flex;align-items:center;justify-content:center;margin-right:8px;">
      ${avatarHTML}
    </div>
    <div class="typing-content">
      <div class="typing-name">${escapeHtml(agentName)}</div>
      <div class="typing-bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>
  `;
  
  // Apply some inline styles if classes are missing or for layout
  typing.style.display = "flex";
  typing.style.alignItems = "flex-end";
  typing.style.marginBottom = "16px";
  typing.style.animation = "fade-in 0.3s ease-out";

  messagesContainer.appendChild(typing);
  scrollToBottom(messagesContainer);
}

export function hideTypingIndicator(shadow: ShadowRoot): void {
  const typing = shadow.getElementById("typing");
  if (typing) {
    typing.remove();
  }
}

export function showQuickReplies(
  shadow: ShadowRoot,
  replies: string[],
  onReply: (text: string) => void
): void {
  const messagesContainer = shadow.getElementById("messages");
  if (!messagesContainer) return;

  const quickReplies = document.createElement("div");
  quickReplies.className = "quick-replies";
  quickReplies.innerHTML = replies.map(reply =>
    `<button class="quick-reply" data-text="${escapeHtml(reply)}">${escapeHtml(reply)}</button>`
  ).join("");

  messagesContainer.appendChild(quickReplies);
  scrollToBottom(messagesContainer);

  quickReplies.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest(".quick-reply") as HTMLElement;
    if (btn && btn.dataset.text) {
      onReply(btn.dataset.text);
      quickReplies.remove();
    }
  });
}
