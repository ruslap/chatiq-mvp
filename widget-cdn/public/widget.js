/**
 * ChatIQ Widget v3.1.0 - Enhanced Edition
 * Premium chat widget with killer features
 * 
 * New Features:
 * - 📎 File uploads with drag & drop
 * - 😊 Emoji picker
 * - ❤️ Message reactions
 * - ⚡ Quick reply suggestions
 * - 👤 Agent avatar & typing with name
 * - 🔔 Sound notifications
 * - 📎 Rich attachment previews
 * - 🕐 Message timestamps
 * - ✓✓ Read receipts
 * - 🎨 Animated backgrounds
 * - ⌨️ Typing indicators with names
 * - 🎭 Status presence (online/away/busy)
 * - 📱 Mobile-optimized gestures
 * - 🔧 Configurable via window.chtq
 * 
 * Usage (New):
 * <script async src="https://widget-cdn-chatiq.vercel.app/widget.js"></script>
 * <script>
 *   window.chtq = {
 *     organizationId: "your-uuid",
 *     language: "uk",
 *     color: "#6366F1",
 *     position: "right",
 *     size: "standard"
 *   }
 * </script>
 * 
 * Usage (Legacy):
 * <script src="https://cdn.chatiq.io/widget.js" data-site-id="YOUR_SITE_ID"></script>
 */

(function () {
  'use strict';

  // Configuration
  // Configuration
  const WIDGET_VERSION = '3.2.0';
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_FILE_TYPES = ['image/*', 'application/pdf', '.doc', '.docx', '.txt'];

  // Get configuration from new window.chtq or legacy window.ChatIQConfig / script attribute
  const chtqConfig = window.chtq || {};
  const API_URL = chtqConfig.apiUrl || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : 'https://api.chtq.ink');
  const legacyConfig = window.ChatIQConfig || {};
  const currentScript = document.currentScript;

  // Merge configurations with priority: chtq > legacy > script attributes > defaults
  const config = {
    organizationId: chtqConfig.organizationId || legacyConfig.siteId || currentScript?.getAttribute('data-site-id') || null,
    language: chtqConfig.language || legacyConfig.language || 'uk',
    color: chtqConfig.color || legacyConfig.accentColor || '#6366F1',
    position: chtqConfig.position || legacyConfig.position || 'right',
    size: chtqConfig.size || legacyConfig.size || 'standard',
    theme: chtqConfig.theme || legacyConfig.theme || 'light',
    agentName: chtqConfig.agentName || legacyConfig.agentName || 'Support Team',
    agentAvatar: chtqConfig.agentAvatar || legacyConfig.agentAvatar || null,
    welcomeMessage: chtqConfig.welcomeMessage || legacyConfig.welcomeMessage || null,
  };

  const TEXTS = {
    uk: {
      online: 'Онлайн',
      offline: 'Не в мережі',
      offlineHint: 'Ми відповімо у робочий час',
      offlineBanner: 'Ми тимчасово офлайн. Залиште повідомлення і ми повернемось!',
      welcomeFallback: 'Дякуємо за звернення! Ми скоро відповімо.',
    },
    en: {
      online: 'Online',
      offline: 'Offline',
      offlineHint: 'We will reply during business hours',
      offlineBanner: 'We are currently offline. Leave a message and we will get back to you!',
      welcomeFallback: 'Thanks for reaching out! We will respond shortly.',
    },
  };

  function t(key) {
    const dict = TEXTS[config.language] || TEXTS.en;
    return dict[key] || TEXTS.en[key] || key;
  }

  // Store organizationId
  const organizationId = config.organizationId;
  let resolvedSiteId = null; // Will be resolved from API
  // Use saved color from localStorage for faster initial render
  const savedColor = organizationId ? localStorage.getItem(`chtq_color_${organizationId}`) : null;
  let accentColor = config.color || savedColor || '#6366F1';
  const position = config.position;
  const widgetSize = config.size;
  let agentName = config.agentName;
  let agentAvatar = config.agentAvatar;
  let welcomeMessage = config.welcomeMessage || t('welcomeFallback');
  // Use saved secondaryColor from localStorage or config, fallback to accentColor instead of green
  const savedSecondaryColor = localStorage.getItem(`chtq_secondary_color_${organizationId}`);
  let secondaryColorValue = config.secondaryColor || chtqConfig.secondaryColor || savedSecondaryColor || accentColor;
  let soundEnabled = localStorage.getItem('chatiq_sound_enabled') !== 'false';
  let businessStatus = { isOpen: true, message: '' };

  if (!organizationId) {
    console.warn('[Chtq] Missing organizationId. Please configure window.chtq or use data-site-id attribute.');
    return;
  }

  // Shadow DOM & key element references
  let shadow = null;
  let statusTextEl = null;
  let panelEl = null;
  let offlineBannerEl = null;
  let statusIndicatorEl = null;

  // Resolve organizationId to siteId
  async function resolveSiteId() {
    try {
      const res = await fetch(`${API_URL}/organization/resolve/${organizationId}`);
      if (res.ok) {
        const data = await res.json();
        resolvedSiteId = data.siteId || organizationId;
        console.log('[Chtq] Resolved siteId:', resolvedSiteId);
      } else {
        resolvedSiteId = organizationId; // Fallback
        console.warn('[Chtq] Failed to resolve siteId, using organizationId as fallback');
      }
    } catch (error) {
      console.warn('[Chtq] Error resolving siteId:', error);
      resolvedSiteId = organizationId; // Fallback
    }
  }

  async function fetchSettings() {
    try {
      const res = await fetch(`${API_URL}/widget-settings/${organizationId}`);
      if (res.ok) {
        const data = await res.json();
        // Update local settings
        if (data.operatorName) agentName = data.operatorName;
        if (data.operatorAvatar) agentAvatar = data.operatorAvatar;
        if (data.welcomeMessage) welcomeMessage = data.welcomeMessage;
        if (data.color) {
          accentColor = data.color;
          localStorage.setItem(`chtq_color_${organizationId}`, data.color);
        }
        if (data.secondaryColor) {
          secondaryColorValue = data.secondaryColor;
          localStorage.setItem(`chtq_secondary_color_${organizationId}`, data.secondaryColor);
        } else {
          // If no secondaryColor from API, use accentColor and save it
          secondaryColorValue = accentColor;
          localStorage.setItem(`chtq_secondary_color_${organizationId}`, accentColor);
        }
        console.log('[Chtq] Loaded settings from API:', { agentName, agentAvatar, welcomeMessage, accentColor, secondaryColorValue });
      }
    } catch (error) {
      console.warn('[Chtq] Failed to fetch settings:', error);
    }
    // Always update UI (show launcher) even if fetch fails - use default/config colors
    updateUIWithSettings();
  }

  async function fetchBusinessStatus() {
    if (!resolvedSiteId) return; // Wait for siteId resolution
    try {
      const res = await fetch(`${API_URL}/automation/business-hours/${resolvedSiteId}/status`);
      if (res.ok) {
        businessStatus = await res.json();
        updatePresenceUI();
      }
    } catch (error) {
      console.warn('[Chtq] Failed to fetch business hours status:', error);
    }
  }

  // Update presence UI based on business hours status
  function updatePresenceUI() {
    if (!shadow) return;

    const statusText = shadow.querySelector('.status-text');
    const offlineBanner = shadow.querySelector('.offline-banner');
    const avatarIconOnline = shadow.querySelector('.avatar-icon-online');
    const avatarIconOffline = shadow.querySelector('.avatar-icon-offline');

    if (statusText) {
      statusText.textContent = businessStatus.isOpen ? t('online') : t('offline');
    }

    // Switch avatar icons based on status
    if (avatarIconOnline && avatarIconOffline) {
      avatarIconOnline.style.display = businessStatus.isOpen ? 'block' : 'none';
      avatarIconOffline.style.display = businessStatus.isOpen ? 'none' : 'block';
    }

    // Show/hide offline banner
    if (offlineBanner) {
      offlineBanner.style.display = businessStatus.isOpen ? 'none' : 'flex';
    }

    console.log('[ChatIQ] Business status updated:', businessStatus);
  }

  // Update UI elements with fetched settings
  function updateUIWithSettings() {
    if (!shadow) return;

    // Apply accent color dynamically
    if (accentColor) {
      const hsl = hexToHSL(accentColor);
      widgetContainer.style.setProperty('--accent-h', hsl.h);
      widgetContainer.style.setProperty('--accent-s', hsl.s + '%');
      widgetContainer.style.setProperty('--accent-l', hsl.l + '%');
      widgetContainer.style.setProperty('--accent-primary', accentColor);
    }

    // Show launcher after settings are applied (prevents color flash)
    const launcher = shadow.querySelector('.launcher');
    if (launcher) launcher.classList.add('ready');

    // Apply secondary color dynamically
    if (secondaryColorValue) {
      widgetContainer.style.setProperty('--accent-secondary', secondaryColorValue);
      widgetContainer.style.setProperty('--secondary-accent', secondaryColorValue);
      widgetContainer.style.setProperty('--accent-highlight', secondaryColorValue);
    }

    // Update header title if exists
    const headerTitle = shadow.querySelector('.header-title');
    if (headerTitle) headerTitle.textContent = agentName;

    // Update header avatar if exists
    const headerAvatar = shadow.querySelector('.header-avatar');
    if (headerAvatar && agentAvatar) {
      headerAvatar.innerHTML = `<img src="${agentAvatar}" alt="${agentName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
    }

    // Update welcome message if exists
    const welcomeEl = shadow.querySelector('.welcome-msg');
    if (welcomeEl) welcomeEl.textContent = welcomeMessage;
  }

  // Initialization functions moved to the bottom of the script to ensure UI elements are ready
  // ---------------------------------------------------------------------------------------
  function getVisitorId() {
    const storageKey = 'chtq_visitor_id';
    let visitorId = localStorage.getItem(storageKey);

    if (!visitorId) {
      visitorId = 'v_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem(storageKey, visitorId);
    }

    return visitorId;
  }

  const visitorId = getVisitorId();

  // Detect theme preference
  function getThemePreference() {
    const themeConfig = config.theme;
    if (themeConfig === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themeConfig;
  }

  let currentTheme = getThemePreference();

  console.log(`[Chtq] Widget v${WIDGET_VERSION} initialized`);
  console.log(`[Chtq] Organization ID: ${organizationId}`);
  console.log(`[Chtq] Visitor ID: ${visitorId}`);
  console.log(`[Chtq] Config:`, { color: accentColor, position, size: widgetSize });

  // Socket.IO Integration
  let socket = null;

  function initSocket() {
    if (window.io) {
      connectSocket();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
      script.onload = connectSocket;
      document.head.appendChild(script);
    }
  }

  function connectSocket() {
    if (!resolvedSiteId) {
      console.warn('[Chtq] Cannot connect socket - siteId not resolved yet');
      setTimeout(connectSocket, 500); // Retry after 500ms
      return;
    }

    socket = window.io(API_URL, {
      query: {
        siteId: resolvedSiteId,
        visitorId: visitorId
      }
    });

    socket.on('connect', () => {
      console.log('[ChatIQ] Connected to server');
      socket.emit('visitor:join', { siteId: resolvedSiteId, visitorId });
    });

    socket.on('admin:message', (msg) => {
      showTyping();
      setTimeout(() => {
        addMessage(msg.text, 'bot');
      }, 800);
    });

    socket.on('chat:message', (msg) => {
      if (msg.from === 'visitor' && msg.visitorId !== visitorId) {
        // Handle sync across tabs if needed
      }
    });
  }

  // Check business hours and update status
  async function updateStatus() {
    if (!resolvedSiteId) return; // Wait for siteId resolution
    try {
      const response = await fetch(`${API_URL}/automation/business-hours/${resolvedSiteId}/status`);
      if (response.ok) {
        const data = await response.json();

        // Update business status
        businessStatus = data;

        // Update all UI elements
        updatePresenceUI();

        // Update widget class for offline styling
        const panel = shadow.querySelector('.panel');
        if (panel) {
          if (data.isOpen) {
            panel.classList.remove('widget-offline');
          } else {
            panel.classList.add('widget-offline');
          }
        }

        console.log('[ChatIQ] Business status updated:', businessStatus);
      }
    } catch (error) {
      console.error('[ChatIQ] Failed to check business hours:', error);
    }
  }

  // Deferred initialization calls moved to the bottom
  // ---------------------------------------------------

  // Create widget container with Shadow DOM
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'chatiq-widget';
  // Fix container to viewport to avoid layout interference
  Object.assign(widgetContainer.style, {
    position: 'fixed',
    bottom: '0',
    right: '0',
    width: 'auto',
    height: 'auto',
    zIndex: '2147483647',
    overflow: 'visible',
    pointerEvents: 'none'
  });
  document.body.appendChild(widgetContainer);

  shadow = widgetContainer.attachShadow({ mode: 'open' });

  // Generate accent color variants
  function hexToHSL(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  const accentHSL = hexToHSL(accentColor);

  // Sound effects
  const sounds = {
    send: () => playTone(800, 0.1, 'sine'),
    receive: () => playTone(600, 0.15, 'sine'),
    notification: () => playTone([600, 800], 0.1, 'sine'),
  };

  function playTone(freq, duration, type = 'sine') {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const freqs = Array.isArray(freq) ? freq : [freq];

      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = f;
        osc.type = type;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.start(ctx.currentTime + (i * 0.1));
        osc.stop(ctx.currentTime + duration + (i * 0.1));
      });
    } catch (e) {
      console.warn('[ChatIQ] Sound playback failed:', e);
    }
  }

  // Design Tokens & Enhanced Styles
  const styles = `
    /* ===== FONTS ===== */
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    /* ===== DESIGN TOKENS ===== */
    :host {
      /* Accent Color */
      --accent-h: ${accentHSL.h};
      --accent-s: ${accentHSL.s}%;
      --accent-l: ${accentHSL.l}%;
      
      --accent: hsl(var(--accent-h), var(--accent-s), var(--accent-l));
      --accent-hover: hsl(var(--accent-h), var(--accent-s), calc(var(--accent-l) - 8%));
      --accent-light: hsl(var(--accent-h), var(--accent-s), 96%);
      --accent-soft: hsl(var(--accent-h), calc(var(--accent-s) * 0.3), 95%);
      --accent-text: ${accentHSL.l > 60 ? '#000000' : '#FFFFFF'};

      /* Typography - Using DM Sans instead of generic system fonts */
      --font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', 'Courier New', monospace;
      --font-size-xs: 11px;
      --font-size-sm: 12px;
      --font-size-base: 14px;
      --font-size-lg: 15px;
      --font-weight-normal: 400;
      --font-weight-medium: 500;
      --font-weight-semibold: 600;
      --font-weight-bold: 700;
      --line-height: 1.5;

      /* Spacing */
      --space-1: 4px;
      --space-2: 8px;
      --space-3: 12px;
      --space-4: 16px;
      --space-5: 20px;
      --space-6: 24px;
      --space-8: 32px;

      /* Border Radius */
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --radius-xl: 18px;
      --radius-full: 9999px;

      /* Transitions */
      --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
      --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
      --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
      --duration-fast: 150ms;
      --duration-base: 200ms;
      --duration-slow: 300ms;

      /* Z-index */
      --z-launcher: 999999;
      --z-panel: 999998;
      --z-overlay: 999997;
    }

    /* ===== LIGHT THEME ===== */
    :host {
      --bg-primary: #FFFFFF;
      --bg-secondary: #F8F9FA;
      --bg-tertiary: #F1F3F5;
      --bg-hover: #E9ECEF;
      --bg-overlay: rgba(29, 35, 49, 0.4);
      
      --border-light: #F1F3F5;
      --border-medium: #E9ECEF;
      --border-strong: #DEE2E6;
      
      --text-primary: #1D2331;
      --text-secondary: #495057;
      --text-tertiary: #6C757D;
      --text-muted: #ADB5BD;
      
      /* Primary Accent (Purple) */
      --accent-primary: ${accentColor};
      /* Highlight Accent (Lime) - Used minimally */
      --accent-highlight: ${secondaryColorValue};
      --accent-highlight-soft: ${secondaryColorValue};
      
      --shadow-sm: 0 2px 8px rgba(29, 35, 49, 0.05);
      --shadow-md: 0 4px 16px rgba(29, 35, 49, 0.08);
      --shadow-lg: 0 12px 32px rgba(29, 35, 49, 0.12);
      
      --message-user-bg: var(--accent-primary);
      --message-user-text: #FFFFFF;
      --message-bot-bg: var(--bg-tertiary);
      --message-bot-text: var(--text-primary);

      --bg-pattern: none;
    }

    /* ===== DARK THEME ===== */
    :host(.dark) {
      --bg-primary: #1A1E28;
      --bg-secondary: #242834;
      --bg-tertiary: #2D3241;
      --bg-hover: #363C4D;
      --bg-overlay: rgba(0, 0, 0, 0.7);
      
      --border-light: #2D3241;
      --border-medium: #3D4454;
      --border-strong: #4D5568;
      
      --text-primary: #FFFFFF;
      --text-secondary: #C4C9D4;
      --text-tertiary: ${secondaryColorValue};
      --text-muted: #5A6274;
      
      /* Purple accent for secondary elements */
      --secondary-accent: ${secondaryColorValue};
      --secondary-accent-light: ${secondaryColorValue}26;
      
      --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.3);
      --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4);
      --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3);
      --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.3);
      --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4);
      
      --accent-light: ${accentColor}26;
      --accent-soft: ${accentColor}14;
      
      --message-user-bg: var(--accent);
      --message-user-text: #1D2331;
      --message-bot-bg: var(--secondary-accent);
      --message-bot-text: #FFFFFF;

      /* Animated background - subtle lime/purple glow */
      --bg-pattern: radial-gradient(circle at 20% 50%, rgba(142, 255, 1, 0.06) 0%, transparent 50%),
                     radial-gradient(circle at 80% 80%, rgba(125, 83, 255, 0.08) 0%, transparent 50%);
    }

    /* ===== RESET ===== */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* ===== LAUNCHER BUTTON ===== */
    .launcher {
      position: fixed;
      bottom: 24px;
      bottom: calc(24px + env(safe-area-inset-bottom, 0px));
      width: 64px;
      height: 64px;
      border-radius: var(--radius-full);
      background: var(--accent);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--duration-base) var(--ease-out);
      z-index: var(--z-launcher);
      box-shadow: var(--shadow-lg);
      overflow: visible;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      -webkit-touch-callout: none;
      user-select: none;
      pointer-events: auto;
      opacity: 0;
    }

    .launcher.ready {
      opacity: 1;
    }

    /* Position: Right (default) */
    .launcher.position-right {
      right: 24px;
      right: calc(24px + env(safe-area-inset-right, 0px));
    }

    /* Position: Left */
    .launcher.position-left {
      left: 24px;
      left: calc(24px + env(safe-area-inset-left, 0px));
    }

    .launcher::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: var(--radius-full);
      background: radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%);
      opacity: 0;
      transition: opacity var(--duration-base);
    }

    .launcher:hover::before {
      opacity: 1;
    }

    .launcher:hover {
      transform: scale(1.08) rotate(5deg);
      background: var(--accent-hover);
      box-shadow: var(--shadow-xl);
    }

    .launcher:active {
      transform: scale(0.95);
    }

    .launcher:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 4px;
    }

    .launcher svg {
      width: 26px;
      height: 26px;
      fill: var(--accent-highlight);
      transition: transform var(--duration-base) var(--ease-out),
                  opacity var(--duration-fast);
      position: relative;
      z-index: 1;
    }

    .launcher .icon-chat {
      position: absolute;
    }

    .launcher .icon-close {
      position: absolute;
      opacity: 0;
      transform: rotate(-90deg) scale(0.8);
    }

    .launcher.open .icon-chat {
      opacity: 0;
      transform: rotate(90deg) scale(0.8);
    }

    .launcher.open .icon-close {
      opacity: 1;
      transform: rotate(0) scale(1);
    }

    /* Pulse animation for launcher */
    @keyframes launcher-pulse {
      0%, 100% {
        box-shadow: var(--shadow-lg);
      }
      50% {
        box-shadow: var(--shadow-xl);
      }
    }

    .launcher.pulse {
      animation: launcher-pulse 2s ease-in-out infinite;
    }

    /* Badge */
    .launcher-badge {
      top: -4px;
      right: -4px;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      border-radius: var(--radius-full);
      background: var(--accent-primary);
      color: #FFFFFF;
      font-family: var(--font-family);
      font-size: 12px;
      font-weight: 800;
      display: none;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--accent-primary);
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      z-index: 2;
    }

    .launcher-badge.visible {
      display: flex;
      animation: badge-bounce var(--duration-slow) var(--ease-bounce);
    }

    @keyframes badge-bounce {
      0% { transform: scale(0); }
      50% { transform: scale(1.3); }
      70% { transform: scale(0.9); }
      100% { transform: scale(1); }
    }

    /* ===== CHAT PANEL ===== */
    .panel {
      position: fixed;
      bottom: calc(104px + env(safe-area-inset-bottom, 0px));
      width: 400px;
      height: 600px;
      max-height: calc(100vh - 130px);
      max-height: calc(100dvh - 130px);
      background: var(--bg-primary);
      border-radius: var(--radius-xl);
      border: 1px solid var(--border-light);
      box-shadow: var(--shadow-xl);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: var(--z-panel);
      opacity: 0;
      transform: translateY(16px) scale(0.94);
      -webkit-overflow-scrolling: touch;
      pointer-events: auto;
      isolation: isolate;
    }

    /* Panel Position: Right (default) */
    .panel.position-right {
      right: calc(24px + env(safe-area-inset-right, 0px));
      transform-origin: bottom right;
    }

    /* Panel Position: Left */
    .panel.position-left {
      left: calc(24px + env(safe-area-inset-left, 0px));
      transform-origin: bottom left;
    }

    .panel::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--bg-pattern);
      pointer-events: none;
      z-index: 0;
    }

    .panel.open {
      display: flex;
      animation: panel-enter var(--duration-slow) var(--ease-out) forwards;
    }

    .panel.closing {
      animation: panel-exit var(--duration-base) var(--ease-in-out) forwards;
    }

    @keyframes panel-enter {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.94);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes panel-exit {
      from {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      to {
        opacity: 0;
        transform: translateY(20px) scale(0.94);
      }
    }

    /* ===== HEADER ===== */
    .header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-5);
      background: var(--accent);
      color: var(--accent-text);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }

    .header-avatar {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      position: relative;
    }

    .header-avatar::after {
      content: '';
      position: absolute;
      bottom: 0;
      right: 0;
      width: 12px;
      height: 12px;
      border-radius: var(--radius-full);
      background: #10B981;
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6), 0 2px 4px rgba(0, 0, 0, 0.2);
      animation: pulse-badge 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse-badge {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6), 0 2px 4px rgba(0, 0, 0, 0.2);
      }
      50% {
        transform: scale(1.1);
        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0), 0 2px 6px rgba(0, 0, 0, 0.3);
      }
    }

    .widget-offline .header-avatar {
      background: rgba(239, 68, 68, 0.15);
    }

    .widget-offline .header-avatar::after {
      background: #EF4444;
      border-color: #FFFFFF;
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6), 0 2px 4px rgba(0, 0, 0, 0.2);
      animation: pulse-badge-offline 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse-badge-offline {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6), 0 2px 4px rgba(0, 0, 0, 0.2);
      }
      50% {
        transform: scale(1.1);
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0), 0 2px 6px rgba(0, 0, 0, 0.3);
      }
    }

    .header-avatar svg {
      width: 22px;
      height: 22px;
      fill: #FFFFFF;
      transition: all 0.3s ease;
    }

    .widget-offline .avatar-icon-online {
      fill: rgba(239, 68, 68, 0.6);
      opacity: 0.7;
      filter: grayscale(100%);
    }

    .widget-offline .avatar-icon-offline {
      fill: rgba(239, 68, 68, 0.8);
      opacity: 0.8;
      filter: grayscale(20%);
    }

    .header-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: left;
    }

    .header-title {
      font-family: var(--font-family);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: #FFFFFF;
      line-height: 1.3;
    }

    .header-status {
      display: flex;
      align-items: center;
      color: rgba(255, 255, 255, 0.9);
      font-size: var(--font-size-sm);
      margin-top: 4px;
    }

    .widget-offline .header {
      background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
    }

    .widget-offline .header-status {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .status-indicator {
      display: flex;
      align-items: center;
      transition: all 0.3s ease;
    }

    .status-text {
      font-family: var(--font-family);
      font-size: 11px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.85);
      letter-spacing: 0.3px;
      text-transform: none;
      line-height: 1;
      animation: fade-in 0.4s ease-out;
      transition: all 0.3s ease;
    }

    /* Remove any dot/indicator before status text */
    .status-text::before,
    .header-status::before,
    .status-indicator::before {
      display: none !important;
      content: none !important;
    }

    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(-2px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .status-text:hover {
      color: rgba(255, 255, 255, 0.95);
    }

    .header-actions {
      display: flex;
      gap: var(--space-1);
    }

    .header-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.1);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      opacity: 0.7;
      transition: all var(--duration-fast);
    }

    .header-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      opacity: 1;
      color: var(--accent-highlight);
      transform: scale(1.05);
    }

    .header-btn:active {
      transform: scale(0.95);
    }

    .header-btn:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: -2px;
    }

    .header-btn svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    /* ===== MESSAGES ===== */
    .messages {
      flex: 1;
      padding: var(--space-5);
      overflow-y: auto;
      background: var(--bg-secondary);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      position: relative;
      z-index: 1;
    }

    .messages::-webkit-scrollbar {
      width: 6px;
    }

    .messages::-webkit-scrollbar-track {
      background: transparent;
    }

    .messages::-webkit-scrollbar-thumb {
      background: var(--border-medium);
      border-radius: var(--radius-full);
    }

    .messages::-webkit-scrollbar-thumb:hover {
      background: var(--border-strong);
    }

    /* Message Group */
    .message-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .message-group.bot {
      align-items: flex-start;
    }

    .message-group.user {
      align-items: flex-end;
    }

    /* Message */
    .message {
      display: flex;
      gap: var(--space-2);
      max-width: 85%;
      animation: message-slide-in var(--duration-base) var(--ease-out);
    }

    @keyframes message-slide-in {
      from {
        opacity: 0;
        transform: translateY(10px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .message.bot {
      align-self: flex-start;
    }

    .message.user {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      background: #1D2331;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: var(--shadow-sm);
    }

    .message-avatar svg {
      width: 18px;
      height: 18px;
      fill: var(--accent-highlight);
    }

    .message.user .message-avatar {
      display: none;
    }

    .message-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      flex: 1;
    }

    .message-bubble {
      padding: var(--space-3) var(--space-4);
      font-family: var(--font-family);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-normal);
      line-height: var(--line-height);
      word-wrap: break-word;
      overflow-wrap: break-word;
      position: relative;
      transition: transform var(--duration-fast);
    }

    .message-bubble:hover {
      transform: translateY(-1px);
    }

    .message.bot .message-bubble {
      background: var(--message-bot-bg);
      color: var(--message-bot-text);
      border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--space-1);
      box-shadow: var(--shadow-xs);
    }

    .message.user .message-bubble {
      background: var(--accent-primary);
      color: #FFFFFF;
      border-radius: var(--radius-lg) var(--radius-lg) var(--space-1) var(--radius-lg);
    }

    /* Message Meta */
    .message-meta {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: 0 var(--space-1);
      font-family: var(--font-family);
      font-size: var(--font-size-xs);
      color: var(--text-muted);
    }

    .message.user .message-meta {
      flex-direction: row-reverse;
    }

    .message-time {
      opacity: 0;
      transition: opacity var(--duration-fast);
    }

    .message:hover .message-time {
      opacity: 1;
    }

    .message-status {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .message-status svg {
      width: 14px;
      height: 14px;
      fill: currentColor;
    }

    /* Message Reactions */
    .message-reactions {
      display: flex;
      gap: var(--space-1);
      flex-wrap: wrap;
      margin-top: var(--space-1);
    }

    .reaction {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background: var(--bg-tertiary);
      border: 1px solid var(--border-light);
      font-size: var(--font-size-sm);
      cursor: pointer;
      transition: all var(--duration-fast);
    }

    .reaction:hover {
      background: var(--bg-hover);
      transform: scale(1.05);
    }

    .reaction.active {
      background: var(--accent-light);
      border-color: var(--accent);
    }

    .reaction-emoji {
      font-size: 14px;
    }

    .reaction-count {
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      font-weight: var(--font-weight-medium);
    }

    /* Attachment */
    .message-attachment {
      margin-top: var(--space-2);
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 1px solid var(--border-light);
      background: var(--bg-primary);
    }

    .attachment-image {
      width: 100%;
      display: block;
      max-height: 200px;
      object-fit: cover;
    }

    .attachment-file {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
    }

    .attachment-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: var(--accent-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .attachment-icon svg {
      width: 20px;
      height: 20px;
      fill: var(--accent);
    }

    .attachment-info {
      flex: 1;
      min-width: 0;
    }

    .attachment-name {
      font-family: var(--font-family);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .attachment-size {
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
    }

    /* Welcome */
    .welcome {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: var(--space-8) var(--space-6);
      flex: 1;
      background: var(--bg-primary);
      pointer-events: auto;
      position: relative;
      z-index: 2;
    }

    .welcome-card {
      background: var(--bg-primary);
      padding: var(--space-8) var(--space-6);
      border-radius: var(--radius-xl);
      border: 1px solid var(--border-light);
      box-shadow: var(--shadow-md);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
      max-width: 320px;
      pointer-events: auto;
      position: relative;
      z-index: 3;
    }

    .welcome-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      background: #1D2331;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-sm);
    }

    .welcome-icon svg {
      width: 24px;
      height: 24px;
      fill: var(--accent-highlight);
    }

    .welcome-title {
      font-family: var(--font-family);
      font-size: 18px;
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
    }

    .welcome-text {
      font-family: var(--font-family);
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0;
    }

    .welcome-name-form {
      width: 100%;
      margin-top: var(--space-3);
      pointer-events: auto;
      position: relative;
      z-index: 5;
    }

    .welcome-name-label {
      display: block;
      font-size: 13px;
      font-weight: var(--font-weight-medium);
      color: var(--text-secondary);
      margin-bottom: var(--space-2);
    }

    .welcome-name-input {
      width: 100%;
      padding: var(--space-3);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-md);
      font-family: var(--font-family);
      font-size: 14px;
      color: var(--text-primary);
      background: var(--bg-primary);
      outline: none;
      transition: border-color var(--duration-fast), box-shadow var(--duration-fast);
      pointer-events: auto;
      position: relative;
      z-index: 6;
    }

    .welcome-name-input:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px hsla(var(--accent-h), 70%, 60%, 0.15);
    }

    .welcome-name-input::placeholder {
      color: var(--text-tertiary);
    }

    .welcome-action {
      margin-top: var(--space-3);
      width: 100%;
      pointer-events: auto;
      position: relative;
      z-index: 10;
    }

    .btn-start {
      width: 100%;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      background: var(--accent-primary);
      color: #FFFFFF;
      border: none;
      font-family: var(--font-family);
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      transition: all var(--duration-fast);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      pointer-events: auto;
      position: relative;
      z-index: 11;
    }

    .btn-start:hover {
      background: var(--accent-hover);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .btn-start:active {
      transform: translateY(0);
    }

    /* Quick Replies */
    .quick-replies {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-top: var(--space-3);
      animation: fade-in var(--duration-base) var(--ease-out);
    }

    @keyframes fade-in {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .quick-reply {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-full);
      background: var(--bg-primary);
      border: 1px solid var(--border-medium);
      font-family: var(--font-family);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--duration-fast);
    }

    .quick-reply:hover {
      background: var(--accent-highlight);
      color: #1D2331;
      border-color: var(--accent-highlight);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .quick-reply:active {
      transform: translateY(0);
    }

    /* Typing */
    .typing {
      display: flex;
      gap: var(--space-2);
      align-self: flex-start;
      animation: message-slide-in var(--duration-base) var(--ease-out);
    }

    .typing-avatar {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      background: #1D2331;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: var(--shadow-sm);
    }

    .typing-avatar svg {
      width: 18px;
      height: 18px;
      fill: var(--accent-highlight);
    }

    .typing-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .typing-name {
      font-family: var(--font-family);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--text-tertiary);
      padding: 0 var(--space-1);
    }

    .typing-bubble {
      background: var(--message-bot-bg);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--space-1);
      display: flex;
      gap: 5px;
      align-items: center;
      box-shadow: var(--shadow-xs);
    }

    .typing-dot {
      width: 7px;
      height: 7px;
      border-radius: var(--radius-full);
      background: var(--text-muted);
      animation: typing-bounce 1.4s ease-in-out infinite;
    }

    .typing-dot:nth-child(2) { animation-delay: 0.15s; }
    .typing-dot:nth-child(3) { animation-delay: 0.3s; }

    @keyframes typing-bounce {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.5;
      }
      30% {
        transform: translateY(-6px);
        opacity: 1;
      }
    }

    /* ===== COMPOSER ===== */
    .composer {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-4);
      background: var(--bg-primary);
      border-top: 1px solid var(--border-light);
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }

    .composer-main {
      display: flex;
      align-items: flex-end;
      gap: var(--space-2);
    }

    .composer-actions {
      display: flex;
      gap: var(--space-1);
    }

    .composer-action-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-tertiary);
      transition: all var(--duration-fast);
    }

    .composer-action-btn:hover {
      background: var(--bg-hover);
      color: var(--accent);
      transform: scale(1.08);
    }

    .composer-action-btn:active {
      transform: scale(0.95);
    }

    .composer-action-btn svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }

    .composer-input-wrapper {
      flex: 1;
      position: relative;
    }

    .composer-input {
      width: 100%;
      min-height: 44px;
      max-height: 120px;
      padding: var(--space-3) var(--space-4);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-lg);
      font-family: var(--font-family);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-normal);
      line-height: var(--line-height);
      color: var(--text-primary);
      background: var(--bg-primary);
      outline: none;
      resize: none;
      transition: all var(--duration-fast);
    }

    .composer-input::placeholder {
      color: var(--text-muted);
    }

    .composer-input:focus {
      border-color: var(--accent-primary);
    }

    .composer-send {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-lg);
      background: var(--accent);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all var(--duration-fast);
      position: relative;
      overflow: hidden;
    }

    .composer-send::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%);
      opacity: 0;
      transition: opacity var(--duration-fast);
    }

    .composer-send:hover:not(:disabled)::before {
      opacity: 1;
    }

    .composer-send:hover:not(:disabled) {
      background: var(--accent-hover);
      transform: scale(1.05) rotate(-5deg);
      box-shadow: var(--shadow-md);
    }

    .composer-send:active:not(:disabled) {
      transform: scale(0.95);
    }

    .composer-send:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
    }

    .composer-send:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .composer-send svg {
      width: 20px;
      height: 20px;
      fill: #1D2331;
      position: relative;
      z-index: 1;
    }

    /* File Upload Preview */
    .upload-preview {
      display: none;
      padding: var(--space-3);
      background: var(--bg-tertiary);
      border-radius: var(--radius-md);
      gap: var(--space-3);
    }

    .upload-preview.visible {
      display: flex;
    }

    .upload-preview-thumb {
      width: 50px;
      height: 50px;
      border-radius: var(--radius-sm);
      background: var(--bg-hover);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .upload-preview-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: var(--radius-sm);
    }

    .upload-preview-thumb svg {
      width: 24px;
      height: 24px;
      fill: var(--text-muted);
    }

    .upload-preview-info {
      flex: 1;
      min-width: 0;
    }

    .upload-preview-name {
      font-family: var(--font-family);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .upload-preview-size {
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
    }

    .upload-preview-remove {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-tertiary);
      transition: all var(--duration-fast);
    }

    .upload-preview-remove:hover {
      background: var(--bg-hover);
      color: #EF4444;
    }

    .upload-preview-remove svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }

    /* Emoji Picker */
    .emoji-picker {
      position: absolute;
      bottom: 100%;
      left: 0;
      margin-bottom: var(--space-2);
      width: 300px;
      background: var(--bg-primary);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 100;
    }

    .emoji-picker.visible {
      display: flex;
      animation: picker-enter var(--duration-base) var(--ease-out);
    }

    @keyframes picker-enter {
      from {
        opacity: 0;
        transform: translateY(8px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .emoji-picker-header {
      padding: var(--space-3);
      border-bottom: 1px solid var(--border-light);
    }

    .emoji-picker-search {
      width: 100%;
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-md);
      font-family: var(--font-family);
      font-size: var(--font-size-sm);
      background: var(--bg-secondary);
      color: var(--text-primary);
      outline: none;
    }

    .emoji-picker-search:focus {
      border-color: var(--accent);
    }

    .emoji-picker-content {
      padding: var(--space-3);
      max-height: 200px;
      overflow-y: auto;
    }

    .emoji-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: var(--space-1);
    }

    .emoji-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      font-size: 20px;
      cursor: pointer;
      border-radius: var(--radius-sm);
      transition: all var(--duration-fast);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .emoji-btn:hover {
      background: var(--bg-hover);
      transform: scale(1.2);
    }

    /* Hidden Inputs */
    #file-input {
      display: none;
    }

    /* Drag & Drop Overlay */
    .drop-overlay {
      position: absolute;
      inset: 0;
      background: var(--bg-overlay);
      backdrop-filter: blur(8px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 10;
      border-radius: var(--radius-xl);
    }

    .drop-overlay.visible {
      display: flex;
      animation: fade-in var(--duration-base);
    }

    .drop-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-8);
      background: var(--bg-primary);
      border-radius: var(--radius-xl);
      border: 2px dashed var(--accent);
    }

    .drop-icon {
      width: 64px;
      height: 64px;
      border-radius: var(--radius-xl);
      background: var(--accent-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: drop-bounce 0.6s ease-in-out infinite;
    }

    @keyframes drop-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    .drop-icon svg {
      width: 32px;
      height: 32px;
      fill: var(--accent);
    }

    .drop-text {
      font-family: var(--font-family);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
    }

    /* ===== POWERED BY ===== */
    .powered {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding: var(--space-3);
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-light);
      font-family: var(--font-family);
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      position: relative;
      z-index: 1;
    }

    .powered a {
      color: var(--text-primary);
      text-decoration: none;
      font-weight: var(--font-weight-semibold);
      transition: color var(--duration-fast);
    }

    .powered a:hover {
      color: var(--accent-hover);
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 480px) {
      .launcher {
        bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
        ${position === 'left' ? 'left' : 'right'}: calc(var(--space-4) + env(safe-area-inset-right, 0px));
        width: 56px;
        height: 56px;
      }

      .launcher svg {
        width: 24px;
        height: 24px;
      }

      .launcher.open {
        display: none;
      }

      .panel {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        max-height: 100%;
        max-height: 100dvh;
        border-radius: 0;
        border: none;
        transform: translateY(0) scale(1);
      }
      
      .panel.open {
        animation: panel-enter-mobile var(--duration-slow) var(--ease-out) forwards;
      }
      
      .panel.closing {
        animation: panel-exit-mobile var(--duration-base) var(--ease-in-out) forwards;
      }

      .emoji-picker {
        width: calc(100% - var(--space-8));
        left: var(--space-4);
      }
      
      .composer {
        padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
      }
      
      .powered {
        padding-bottom: calc(var(--space-3) + env(safe-area-inset-bottom, 0px));
      }
      
      .messages {
        -webkit-overflow-scrolling: touch;
      }
      
      .composer-input {
        font-size: 16px; /* Prevents iOS zoom on focus */
      }
    }
    
    @keyframes panel-enter-mobile {
      from {
        opacity: 0;
        transform: translateY(100%);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes panel-exit-mobile {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(100%);
      }
    }

    /* Hidden file input */
    input[type="file"] {
      display: none;
    }
    `;

  // Enhanced Widget HTML
  const html = `
    <style>${styles}</style>
    
    <!-- Launcher -->
    <button class="launcher" id="launcher" aria-label="Open chat">
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
    <div class="panel" id="panel" role="dialog" aria-modal="true" aria-labelledby="chat-title">
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
          <svg viewBox="0 0 24 24" aria-hidden="true" class="avatar-icon-online">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <svg viewBox="0 0 24 24" aria-hidden="true" class="avatar-icon-offline" style="display: none;">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.85.63-3.55 1.69-4.9l10.21 10.21C14.55 19.37 13.35 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.41 0 8 3.59 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
          </svg>
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
              <input type="text" id="visitor-name-input" class="welcome-name-input" placeholder="Прізвище та ім'я" autocomplete="name" />
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
        
        <!-- Powered by -->
        <div class="powered">
          Powered by <a href="https://ruslan-lapiniak-cv.vercel.app/en" target="_blank" rel="noopener">Chatq © Ruslan Lap</a>
        </div>
      </div>

      <!-- Hidden file input -->
      <input type="file" id="file-input" accept="${ALLOWED_FILE_TYPES.join(',')}" style="display: none !important; visibility: hidden !important; position: absolute; left: -9999px;" />
    </div>
    `;

  shadow.innerHTML = html;

  // Apply theme class
  if (currentTheme === 'dark') {
    shadow.host.classList.add('dark');
  }

  // Get elements
  const launcher = shadow.getElementById('launcher');
  const panel = shadow.getElementById('panel');

  // Apply position class
  const positionClass = position === 'left' ? 'position-left' : 'position-right';
  launcher?.classList.add(positionClass);
  panel?.classList.add(positionClass);

  const messages = shadow.getElementById('messages');
  const welcome = shadow.getElementById('welcome');
  const input = shadow.getElementById('input');
  const sendBtn = shadow.getElementById('send-btn');
  const closeBtn = shadow.getElementById('close-btn');
  const badge = shadow.getElementById('badge');
  const attachBtn = shadow.getElementById('attach-btn');
  const emojiBtn = shadow.getElementById('emoji-btn');
  const fileInput = shadow.getElementById('file-input');
  const emojiPicker = shadow.getElementById('emoji-picker');
  const emojiGrid = shadow.getElementById('emoji-grid');
  const emojiSearch = shadow.getElementById('emoji-search');
  const uploadPreview = shadow.getElementById('upload-preview');
  const uploadThumb = shadow.getElementById('upload-thumb');
  const uploadName = shadow.getElementById('upload-name');
  const uploadSize = shadow.getElementById('upload-size');
  const uploadRemove = shadow.getElementById('upload-remove');
  const soundBtn = shadow.getElementById('sound-btn');
  const soundOnIcon = shadow.querySelector('.sound-on-icon');
  const soundOffIcon = shadow.querySelector('.sound-off-icon');
  const dropOverlay = shadow.getElementById('drop-overlay');
  const startBtn = shadow.getElementById('start-btn');
  const composerContainer = shadow.getElementById('composer-container');
  const visitorNameInput = shadow.getElementById('visitor-name-input');
  let visitorDisplayName = localStorage.getItem('chatiq_visitor_name') || '';

  // Pre-fill name input if saved
  if (visitorNameInput && visitorDisplayName) {
    visitorNameInput.value = visitorDisplayName;
  }

  // Clear error state when user starts typing
  visitorNameInput?.addEventListener('input', () => {
    visitorNameInput.style.borderColor = '';
    visitorNameInput.style.boxShadow = '';
  });

  // Allow Enter key to start chat
  visitorNameInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      startBtn?.click();
    }
  });

  startBtn?.addEventListener('click', async () => {
    // Get visitor name from input - make it optional
    const enteredName = visitorNameInput?.value?.trim();

    // Fallback name if none entered
    const displayNameToUse = enteredName || 'Гість';

    // Create unique display name with date/time
    const now = new Date();
    const dateStr = now.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
    const timeStr = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    const uniqueDisplayName = `${displayNameToUse} (${dateStr} ${timeStr})`;

    visitorDisplayName = uniqueDisplayName;

    if (enteredName) {
      localStorage.setItem('chatiq_visitor_name', enteredName); // Save original name for pre-fill
    }

    // Update visitor name on server (will be done after chat is created)
    window._chatiqPendingVisitorName = uniqueDisplayName;
    window._chatiqVisitorFirstName = displayNameToUse; // For personalized greeting

    welcome.style.display = 'none';
    composerContainer.style.display = 'block';
    input.focus();
    showWelcomeMessageIfNeeded();
  });

  soundBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    soundEnabled = !soundEnabled;
    localStorage.setItem('chatiq_sound_enabled', soundEnabled);
    soundOnIcon.style.display = soundEnabled ? 'block' : 'none';
    soundOffIcon.style.display = soundEnabled ? 'none' : 'block';

    // Play a test sound to confirm
    if (soundEnabled) sounds.notification();
  });

  let isOpen = false;
  let isTyping = false;
  let unreadCount = 0;
  let currentFile = null;
  const messageHistory = [];
  let welcomeMessageShown = false;

  // Show welcome message as first message from operator
  function showWelcomeMessageIfNeeded() {
    if (!welcomeMessageShown && messageHistory.length === 0) {
      welcomeMessageShown = true;

      // Get visitor's first name for personalized greeting
      const visitorFirstName = window._chatiqVisitorFirstName || '';

      // Create personalized greeting
      let personalizedGreeting = '';
      if (visitorFirstName) {
        personalizedGreeting = `Вітаємо, <span style="color: ${accentColor}; font-weight: 600;">${visitorFirstName}</span> 👋! `;
      }

      // Show offline message if offline, otherwise show welcome message
      let messageToShow = !businessStatus.isOpen && businessStatus.message
        ? businessStatus.message
        : welcomeMessage;

      // Add personalized greeting to the beginning
      if (personalizedGreeting && messageToShow) {
        messageToShow = personalizedGreeting + messageToShow;
      } else if (personalizedGreeting) {
        messageToShow = personalizedGreeting + 'Чим можу допомогти?';
      }

      if (messageToShow) {
        addMessage(messageToShow, 'bot');
      }
    }
  }

  // Emojis
  const emojis = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤝', '💪', '🦾', '🙏', '✍️', '💅', '🤳', '💃', '🕺', '👯', '🧘', '🛀', '🛌', '👥', '🗣', '👤', '🔥', '⭐', '✨', '💫', '💥', '💯', '💢', '💬', '👁', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👃', '👂', '🦻', '🧏', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂'];

  // Populate emoji grid
  function populateEmojis(filter = '') {
    const filteredEmojis = filter ? emojis.filter(e => e.includes(filter)) : emojis;
    emojiGrid.innerHTML = filteredEmojis.map(emoji =>
      `<button class="emoji-btn" data-emoji="${emoji}">${emoji}</button>`
    ).join('');
  }

  populateEmojis();

  // Emoji search
  emojiSearch.addEventListener('input', (e) => {
    populateEmojis(e.target.value.toLowerCase());
  });

  // Emoji picker events
  emojiGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.emoji-btn');
    if (btn) {
      const emoji = btn.dataset.emoji;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const text = input.value;
      input.value = text.substring(0, start) + emoji + text.substring(end);
      input.selectionStart = input.selectionEnd = start + emoji.length;

      autoResize();
      sendBtn.disabled = !input.value.trim() && !currentFile;
      emojiPicker.classList.remove('visible');
      input.focus();
    }
  });

  emojiBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    emojiPicker.classList.toggle('visible');
  });

  // Close emoji picker when clicking outside
  shadow.addEventListener('click', (e) => {
    if (!emojiBtn.contains(e.target) && !emojiPicker.contains(e.target)) {
      emojiPicker.classList.remove('visible');
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target !== widgetContainer) {
      emojiPicker.classList.remove('visible');
    }
  });

  // File upload
  attachBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    handleFileSelect(e.target.files[0]);
  });

  uploadRemove.addEventListener('click', () => {
    clearFileUpload();
  });

  function handleFileSelect(file) {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert('File size must be less than 10MB');
      return;
    }

    currentFile = file;
    uploadName.textContent = file.name;
    uploadSize.textContent = formatFileSize(file.size);

    // Enable send button when file is selected
    sendBtn.disabled = false;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadThumb.innerHTML = `<img src="${e.target.result}" alt="${file.name}">`;
      };
      reader.readAsDataURL(file);
    } else {
      uploadThumb.innerHTML = `
                <svg viewBox="0 0 24 24">
                    <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/>
                </svg>
            `;
    }

    uploadPreview.classList.add('visible');
  }

  function clearFileUpload() {
    currentFile = null;
    fileInput.value = '';
    uploadPreview.classList.remove('visible');
    // Update send button state when file is cleared
    sendBtn.disabled = !input.value.trim();
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Drag & Drop
  let dragCounter = 0;

  panel.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (dragCounter === 1) {
      dropOverlay.classList.add('visible');
    }
  });

  panel.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      dropOverlay.classList.remove('visible');
    }
  });

  panel.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  panel.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropOverlay.classList.remove('visible');

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  });

  // Draft persistence
  const DRAFT_KEY = `chatiq_draft_${organizationId}`;

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, input.value);
  }

  function loadDraft() {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      input.value = draft;
      autoResize();
      sendBtn.disabled = !draft.trim() && !currentFile;
    }
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
  }

  // Auto-resize textarea
  function autoResize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }

  input.addEventListener('input', () => {
    autoResize();
    sendBtn.disabled = !input.value.trim() && !currentFile;
    saveDraft();
  });

  // Scroll management
  function scrollToBottom(smooth = true) {
    messages.scrollTo({
      top: messages.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }

  // Badge
  function updateBadge(count) {
    unreadCount = count;
    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.classList.add('visible');
      if (!isOpen) {
        launcher.classList.add('pulse');
      }
    } else {
      badge.classList.remove('visible');
      launcher.classList.remove('pulse');
    }
  }

  // Toggle widget
  function openWidget() {
    console.log('[ChatIQ] Opening widget...');
    if (isOpen) return;
    isOpen = true;
    launcher.classList.add('open');
    launcher.classList.remove('pulse');
    panel.classList.add('open');
    panel.classList.remove('closing');
    launcher.setAttribute('aria-label', 'Close chat');
    input.focus();
    updateBadge(0);
    scrollToBottom(false);
    loadDraft();
    updateStatus();
  }

  function closeWidget() {
    if (!isOpen) return;
    isOpen = false;
    launcher.classList.remove('open');
    panel.classList.add('closing');
    launcher.setAttribute('aria-label', 'Open chat');
    emojiPicker.classList.remove('visible');

    if (input.value.trim()) saveDraft();

    setTimeout(() => {
      panel.classList.remove('open', 'closing');
    }, 200);
  }

  function toggleWidget() {
    console.log('[ChatIQ] Toggle clicked, current state:', isOpen);
    isOpen ? closeWidget() : openWidget();
  }

  // Typing indicator
  function showTyping() {
    if (isTyping) return;
    isTyping = true;

    if (welcome) welcome.style.display = 'none';
    if (composerContainer) composerContainer.style.display = 'block';

    const typing = document.createElement('div');
    typing.className = 'typing';
    typing.id = 'typing';
    typing.innerHTML = `
          <div class="typing-avatar">
            ${agentAvatar || shadow?.querySelector('.header-avatar img')?.src
        ? `<img src="${agentAvatar || shadow.querySelector('.header-avatar img').src}" alt="${agentName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
        : `<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`
      }
          </div>
          <div class="typing-content">
            <div class="typing-name">${agentName}</div>
            <div class="typing-bubble">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </div>
          </div>
        `;
    messages.appendChild(typing);
    scrollToBottom();
  }

  function hideTyping() {
    isTyping = false;
    const typing = shadow.getElementById('typing');
    if (typing) typing.remove();
  }

  // Format time
  function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  // Add message
  function addMessage(text, from = 'user', attachment = null) {
    hideTyping();

    if (welcome) welcome.style.display = 'none';
    if (composerContainer) composerContainer.style.display = 'block';

    const now = new Date();
    const msg = document.createElement('div');
    msg.className = `message ${from}`;

    const avatarHTML = from === 'bot' ? `
          <div class="message-avatar">
            ${agentAvatar
        ? `<img src="${agentAvatar}" alt="${agentName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
        : `<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`
      }
          </div>
        ` : '';

    const attachmentHTML = attachment ? (
      attachment.type === 'image' ? `
                <div class="message-attachment">
                    <img src="${attachment.url}" alt="${attachment.name}" class="attachment-image">
                </div>
            ` : `
                <div class="message-attachment">
                    <div class="attachment-file">
                        <div class="attachment-icon">
                            <svg viewBox="0 0 24 24">
                                <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/>
                            </svg>
                        </div>
                        <div class="attachment-info">
                            <div class="attachment-name">${attachment.name}</div>
                            <div class="attachment-size">${attachment.size}</div>
                        </div>
                    </div>
                </div>
            `
    ) : '';

    const statusHTML = from === 'user' ? `
            <div class="message-status">
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </div>
        ` : '';

    msg.innerHTML = `
          ${avatarHTML}
          <div class="message-content">
            <div class="message-bubble">${from === 'bot' ? text : escapeHtml(text)}${attachmentHTML}</div>
            <div class="message-meta">
              <span class="message-time">${formatTime(now)}</span>
              ${statusHTML}
            </div>
          </div>
        `;

    messages.appendChild(msg);
    scrollToBottom(true);

    if (!isOpen && from === 'bot') {
      updateBadge(unreadCount + 1);
      sounds.notification();
    } else if (from === 'user') {
      sounds.send();
    } else if (from === 'bot') {
      sounds.receive();
    }

    messageHistory.push({ text, from, timestamp: Date.now(), attachment });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Show quick replies
  function showQuickReplies(replies) {
    const quickReplies = document.createElement('div');
    quickReplies.className = 'quick-replies';
    quickReplies.innerHTML = replies.map(reply =>
      `<button class="quick-reply" data-text="${escapeHtml(reply)}">${escapeHtml(reply)}</button>`
    ).join('');

    messages.appendChild(quickReplies);
    scrollToBottom();

    // Handle quick reply clicks
    quickReplies.addEventListener('click', (e) => {
      const btn = e.target.closest('.quick-reply');
      if (btn) {
        const text = btn.dataset.text;
        input.value = text;
        sendMessage();
        quickReplies.remove();
      }
    });
  }

  // Send message
  async function sendMessage() {
    const text = input.value.trim();
    if (!currentFile && !text) return;

    let attachment = null;
    if (currentFile) {
      // Show uploading state
      sendBtn.disabled = true;
      sendBtn.innerHTML = '⏳';

      try {
        // Upload file first
        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('siteId', resolvedSiteId);

        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Upload failed');

        const uploadedFile = await response.json();
        attachment = uploadedFile;
      } catch (error) {
        console.error('[ChatIQ] Upload error:', error);
        alert('Failed to upload file. Please try again.');
        sendBtn.disabled = false;
        sendBtn.innerHTML = '➤';
        return;
      }
    }

    addMessage(text || '📎 File attached', 'user', attachment);

    if (socket) {
      // Include visitor name if set
      const visitorName = window._chatiqPendingVisitorName || localStorage.getItem('chatiq_visitor_name') || null;
      socket.emit('visitor:message', { siteId: resolvedSiteId, visitorId, text, attachment, visitorName });

      // Clear pending name after first message
      if (window._chatiqPendingVisitorName) {
        delete window._chatiqPendingVisitorName;
      }
    }

    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = !input.value.trim() && !currentFile;
    sendBtn.innerHTML = '➤';
    clearDraft();
    clearFileUpload();

    console.log('[ChatIQ] Message sent:', { siteId: resolvedSiteId, visitorId, text, attachment });
  }

  // Theme toggle
  function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('chatiq_theme', theme);
    shadow.host.classList.toggle('dark', theme === 'dark');
  }

  function toggleTheme() {
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
  }

  // Event listeners
  launcher.addEventListener('click', toggleWidget);
  closeBtn.addEventListener('click', closeWidget);
  sendBtn.addEventListener('click', sendMessage);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeWidget();
      emojiPicker.classList.remove('visible');
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // System theme listener
  if (config.theme === 'auto') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      setTheme(e.matches ? 'dark' : 'light');
    });
  }

  // Send disconnect message when user leaves
  const sendDisconnect = () => {
    if (socket) {
      socket.emit('visitor:disconnect', { siteId: resolvedSiteId, visitorId });
    }
  };

  // Handle page unload/close
  window.addEventListener('beforeunload', sendDisconnect);
  window.addEventListener('pagehide', sendDisconnect);

  // Also handle when widget is closed
  const originalCloseWidget = closeWidget;
  closeWidget = () => {
    if (socket) {
      socket.emit('visitor:disconnect', { siteId: resolvedSiteId, visitorId });
    }
    originalCloseWidget();
  };

  // Expose API
  globalThis.ChatIQ = {
    version: WIDGET_VERSION,
    siteId: resolvedSiteId,
    visitorId,
    open: openWidget,
    close: closeWidget,
    toggle: toggleWidget,
    sendMessage: (text, attachment) => addMessage(text, 'user', attachment),
    setTheme,
    toggleTheme,
    setUnreadCount: updateBadge,
    showQuickReplies,
    setAccentColor: (color) => {
      const hsl = hexToHSL(color);
      shadow.host.style.setProperty('--accent-h', hsl.h);
      shadow.host.style.setProperty('--accent-s', `${hsl.s}%`);
      shadow.host.style.setProperty('--accent-l', `${hsl.l}%`);
      shadow.host.style.setProperty('--accent-text', hsl.l > 60 ? '#000000' : '#FFFFFF');
    },
    simulateMessage: (text, quickReplies) => {
      showTyping();
      setTimeout(() => {
        addMessage(text, 'bot');
        if (quickReplies) {
          setTimeout(() => showQuickReplies(quickReplies), 500);
        }
      }, 1000);
    },
    playSound: (type) => sounds[type]?.(),
  };

  // Initialization - resolve siteId first, then fetch settings and update UI
  (async () => {
    try {
      // 1. Create UI basic elements synchronously
      // (This already happened above in the script body)

      // 2. Resolve IDs and Settings
      await resolveSiteId();
      await fetchSettings();

      // 3. Setup Socket and Status
      initSocket();
      await updateStatus();

      // 4. Periodic updates
      setInterval(updateStatus, 60000);

      console.log('[ChatIQ] Initialization complete');
    } catch (err) {
      console.error('[ChatIQ] Initialization failed:', err);
    }
  })();

  console.log('[ChatIQ] Enhanced Widget ready');
  console.log('[ChatIQ] New features: File upload, Emoji picker, Quick replies, Sounds, Enhanced UI');
})();