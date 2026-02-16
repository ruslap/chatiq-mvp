'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { TelegramSettings } from '../../components/telegram-settings';

export default function SettingsPage() {
  const [siteId, setSiteId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  // Simplified config screen for testing
  if (!isConfigured) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[rgb(var(--surface-muted))]">
        <div className="w-full max-w-md rounded-xl bg-[rgb(var(--surface))] p-6 shadow-lg border border-[rgb(var(--border))]">
          <h2 className="mb-4 text-xl font-semibold text-[rgb(var(--foreground))]">
            Тестування Telegram Integration
          </h2>
          <p className="mb-4 text-sm text-[rgb(var(--foreground-secondary))]">
            Введіть siteId для тестування
          </p>
          <input
            type="text"
            placeholder="Site ID (cmkmgx5o4000212xnvsokh4hu)"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="mb-4 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-2.5 text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50 outline-none transition-smooth"
          />
          <input
            type="password"
            placeholder="Admin access token"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="mb-4 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-2.5 text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50 outline-none transition-smooth"
          />
          <button
            onClick={() => setIsConfigured(true)}
            disabled={!siteId.trim() || !accessToken.trim()}
            className="w-full rounded-xl bg-[rgb(var(--primary))] px-4 py-2.5 font-medium text-white transition-smooth hover:bg-[rgb(var(--primary-600))] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Продовжити
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[rgb(var(--surface))] overflow-hidden">
      <div className="flex-1 overflow-y-auto bg-[rgb(var(--surface-muted))] scrollbar-thin">
        <div className="w-full md:max-w-6xl md:mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
          {/* Page Title */}
          <h1 className="text-xl md:text-2xl lg:text-3xl font-light text-[rgb(var(--foreground-secondary))] mb-4 md:mb-6">
            Налаштування
          </h1>

          {/* Tabs Navigation */}
          <div className="border-b border-[rgb(var(--border))] mb-6">
            <nav className="flex gap-6">
              <button className="relative pb-3 text-sm font-medium text-[rgb(var(--primary))]">
                Канали зв'язку
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgb(var(--primary))] rounded-full" />
              </button>
            </nav>
          </div>

          {/* Channels Settings Content */}
          <div className="animate-fade-in">
            <div className="bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border))] shadow-sm p-6">
              <TelegramSettings siteId={siteId} accessToken={accessToken} />
            </div>
          </div>

          {/* Site ID Display */}
          <div className="mt-4 p-3 bg-[rgb(var(--accent))] rounded-lg text-xs text-[rgb(var(--foreground-secondary))]">
            Тестовий режим - Site ID: {siteId}
          </div>
        </div>
      </div>
    </div>
  );
}
