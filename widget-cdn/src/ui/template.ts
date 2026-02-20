import { t } from "../i18n";
import { ALLOWED_FILE_TYPES } from "../config";

export function getTemplate(
  styles: string,
  agentName: string,
  agentAvatar: string | null,
  welcomeMessage: string,
  soundEnabled: boolean,
  position: 'left' | 'right'
): string {
  return `<style>${styles}</style>
    
    <!-- Launcher -->
    <button class="launcher position-${position}" id="launcher" aria-label="Open chat">
      <svg class="icon-chat" viewBox="0 0 400 400" aria-hidden="true">
        <path d="M322.251 235.8C319.251 235.8 316.784 234.933 314.851 233.2C312.984 231.4 312.051 229.2 312.051 226.6C312.051 223.933 312.984 221.7 314.851 219.9C316.784 218.1 319.251 217.2 322.251 217.2C325.184 217.2 327.584 218.1 329.451 219.9C331.384 221.7 332.351 223.933 332.351 226.6C332.351 229.2 331.384 231.4 329.451 233.2C327.584 234.933 325.184 235.8 322.251 235.8Z" />
        <path d="M244.98 207.2C244.98 201.667 246.113 196.733 248.38 192.4C250.713 188.067 253.813 184.7 257.68 182.3C261.613 179.833 265.88 178.6 270.48 178.6C274.013 178.6 277.18 179.233 279.98 180.5C282.78 181.7 285.046 183.4 286.78 185.6V179.2H303.88V261.6H286.78V228C284.846 230.333 282.48 232.2 279.68 233.6C276.946 235 273.813 235.7 270.28 235.7C265.746 235.7 261.546 234.5 257.68 232.1C253.813 229.7 250.713 226.333 248.38 222C246.113 217.667 244.98 212.733 244.98 207.2ZM286.78 207.1C286.78 204.1 286.18 201.6 284.98 199.6C283.846 197.533 282.346 196 280.48 195C278.613 193.933 276.646 193.4 274.58 193.4C272.58 193.4 270.646 193.933 268.78 195C266.913 196 265.38 197.533 264.18 199.6C262.98 201.667 262.38 204.2 262.38 207.2C262.38 210.2 262.98 212.733 264.18 214.8C265.38 216.8 266.913 218.333 268.78 219.4C270.646 220.4 272.58 220.9 274.58 220.9C276.58 220.9 278.513 220.4 280.38 219.4C282.313 218.333 283.846 216.767 284.98 214.7C286.18 212.633 286.78 210.1 286.78 207.1Z" />
        <path d="M240.855 220.5V235H232.155C225.955 235 221.121 233.5 217.655 230.5C214.188 227.433 212.455 222.467 212.455 215.6V193.4H205.655V179.2H212.455V165.6H229.555V179.2H240.755V193.4H229.555V215.8C229.555 217.467 229.955 218.667 230.755 219.4C231.555 220.133 232.888 220.5 234.755 220.5H240.855Z" />
        <path d="M178.672 178.6C185.072 178.6 190.205 180.733 194.072 185C197.938 189.2 199.872 195 199.872 202.4V235H182.872V204.7C182.872 200.967 181.905 198.067 179.972 196C178.038 193.933 175.438 192.9 172.172 192.9C168.905 192.9 166.305 193.933 164.372 196C162.438 198.067 161.472 200.967 161.472 204.7V235H144.372V161H161.472V186.7C163.205 184.233 165.572 182.267 168.572 180.8C171.572 179.333 174.938 178.6 178.672 178.6Z" />
        <path d="M67.3 199.8C67.3 192.867 68.8 186.7 71.8 181.3C74.8 175.833 78.9667 171.6 84.3001 168.6C89.7001 165.533 95.8001 164 102.6 164C110.933 164 118.067 166.2 124 170.6C129.933 175 133.9 181 135.9 188.6H117.1C115.7 185.667 113.7 183.433 111.1 181.9C108.567 180.367 105.667 179.6 102.4 179.6C97.1334 179.6 92.8667 181.433 89.6 185.1C86.3334 188.767 84.7001 193.667 84.7001 199.8C84.7001 205.933 86.3334 210.833 89.6 214.5C92.8667 218.167 97.1334 220 102.4 220C105.667 220 108.567 219.233 111.1 217.7C113.7 216.167 115.7 213.933 117.1 211H135.9C133.9 218.6 129.933 224.6 124 229C118.067 233.333 110.933 235.5 102.6 235.5C95.8001 235.5 89.7001 234 84.3001 231C78.9667 227.933 74.8 223.7 71.8 218.3C68.8 212.9 67.3 206.733 67.3 199.8Z" />
      </svg>
      <svg class="icon-close" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
      <span class="launcher-badge" id="badge"></span>
    </button>
    
    <!-- Panel -->
    <div class="panel position-${position}" id="panel" role="dialog" aria-modal="true" aria-labelledby="chat-title">
      <!-- Drag & Drop Overlay -->
      <div class="drop-overlay" id="drop-overlay">
        <div class="drop-content">
          <div class="drop-icon">
            <svg viewBox="0 0 24 24">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 18.16 24 16.68 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2L21 20.73 4.27 4 3 5.27zM7.73 10l8 8H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z"/>
            </svg>
          </div>
          <div class="drop-text">Drop files to upload</div>
        </div>
      </div>

      <!-- Header -->
      <div class="header">
        <div class="header-avatar" id="header-avatar">
          ${agentAvatar
            ? `<img src="${agentAvatar}" alt="${agentName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
            : `<svg viewBox="0 0 24 24" aria-hidden="true" class="avatar-icon-online">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <svg viewBox="0 0 24 24" aria-hidden="true" class="avatar-icon-offline" style="display: none;">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.85.63-3.55 1.69-4.9l10.21 10.21C14.55 19.37 13.35 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.41 0 8 3.59 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
              </svg>`
          }
        </div>
        <div class="header-content">
          <div class="header-title" id="chat-title">${agentName}</div>
            <div class="header-status">
              <span class="status-text">Онлайн</span>
            </div>
        </div>
        <div class="header-actions">
          <button class="header-btn" id="sound-btn" aria-label="Toggle sound">
            <svg class="sound-on-icon" viewBox="0 0 24 24" style="display: ${soundEnabled ? 'block' : 'none'}">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <svg class="sound-off-icon" viewBox="0 0 24 24" style="display: ${soundEnabled ? 'none' : 'block'}">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          </button>
          <button class="header-btn" id="close-btn" aria-label="Close chat">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Messages -->
      <div class="messages" id="messages" role="log" aria-live="polite">
        <div class="welcome" id="welcome">
          <div class="welcome-card">
            <div class="welcome-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <div class="welcome-title">Привіт! 👋</div>
            <div class="welcome-text welcome-msg">${welcomeMessage}</div>
            <div class="welcome-name-form">
              <label class="welcome-name-label">Як до вас звертатися?</label>
              <input type="text" id="visitor-name-input" class="welcome-name-input" placeholder="Ваше ім'я" autocomplete="name" />
            </div>
            <div class="welcome-action">
              <button class="btn-start" id="start-btn">
                Почати розмову
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Composer -->
      <div class="composer-container" style="display: none;" id="composer-container">
        <div class="composer">
          <div class="upload-preview" id="upload-preview">
            <div class="upload-preview-thumb" id="upload-thumb"></div>
            <div class="upload-preview-info">
              <div class="upload-preview-name" id="upload-name"></div>
              <div class="upload-preview-size" id="upload-size"></div>
            </div>
            <button class="upload-preview-remove" id="upload-remove" aria-label="Remove file">
              <svg viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>

          <div class="composer-main">
            <div class="composer-actions">
              <button class="composer-action-btn" id="attach-btn" aria-label="Attach file">
                <svg viewBox="0 0 24 24">
                  <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                </svg>
              </button>
              <button class="composer-action-btn" id="emoji-btn" aria-label="Insert emoji">
                <svg viewBox="0 0 24 24">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                </svg>
              </button>
            </div>

            <div class="composer-input-wrapper">
              <textarea 
                class="composer-input" 
                id="input" 
                placeholder="Type a message..." 
                rows="1"
                aria-label="Type your message"
              ></textarea>
              
              <!-- Emoji Picker -->
              <div class="emoji-picker" id="emoji-picker">
                <div class="emoji-picker-header">
                  <input type="text" class="emoji-picker-search" id="emoji-search" placeholder="Search emoji...">
                </div>
                <div class="emoji-picker-content">
                  <div class="emoji-grid" id="emoji-grid"></div>
                </div>
              </div>
            </div>

            <button class="composer-send" id="send-btn" disabled aria-label="Send message">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>


      <!-- Contact Form (shown when offline) -->
      <div class="contact-form-container" style="display: none;" id="contact-form-container">
        <div class="contact-form">
          <div class="contact-form-header">
            <h3 class="contact-form-title">${t('contactFormTitle')}</h3>
            <p class="contact-form-desc">${t('contactFormDesc')}</p>
          </div>
          <form id="contact-form" class="contact-form-fields">
            <div class="contact-form-field">
              <input type="text" id="contact-name" class="contact-input" placeholder="${t('contactName')}" required />
            </div>
            <div class="contact-form-field">
              <input type="email" id="contact-email" class="contact-input" placeholder="${t('contactEmail')}" />
            </div>
            <div class="contact-form-field">
              <input type="tel" id="contact-phone" class="contact-input" placeholder="${t('contactPhone')}" />
            </div>
            <div class="contact-form-field">
              <textarea id="contact-message" class="contact-textarea" placeholder="${t('contactMessage')}" rows="3"></textarea>
            </div>
            <button type="submit" class="contact-submit" id="contact-submit">
              ${t('contactSubmit')}
            </button>
          </form>
          <div class="contact-success" id="contact-success" style="display: none;">
            <svg viewBox="0 0 24 24" style="width: 48px; height: 48px; fill: var(--success-color, #10B981); margin-bottom: 12px;">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <p>${t('contactSuccess')}</p>
            </div>
      </div>
      </div>

      <!-- Powered by -->
      <div class="powered">
        Powered by <a href="https://ruslan-lapiniak-cv.vercel.app/en" target="_blank" rel="noopener">Chatq © Ruslan Lap</a>
      </div>


      <!-- Hidden file input -->
      <input type="file" id="file-input" accept="${ALLOWED_FILE_TYPES.join(',')}" style="display: none !important; visibility: hidden !important; position: absolute; left: -9999px;" />
    </div>
    `;
}
