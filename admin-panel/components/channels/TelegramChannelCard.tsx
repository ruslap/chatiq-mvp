'use client';

import { useState } from 'react';
import { Send, Key, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { ChannelCard } from './ChannelCard';
import { useTelegramIntegration } from '@/hooks/useTelegramIntegration';

interface TelegramChannelCardProps {
  siteId: string;
}

export function TelegramChannelCard({ siteId }: TelegramChannelCardProps) {
  const { status, loading, setup, disconnect } = useTelegramIntegration(siteId);
  const [botToken, setBotToken] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [error, setError] = useState('');

  const enabled = status?.enabled || false;

  const handleToggle = async (newEnabled: boolean) => {
    if (!newEnabled && status?.enabled) {
      await disconnect();
    }
  };

  const handleSave = async () => {
    setError('');

    if (!botToken.trim()) {
      setError('Будь ласка, введіть Bot Token');
      return;
    }

    const result = await setup(botToken, notificationEmail);

    if (!result.success) {
      setError(result.error || 'Не вдалося підключити бота');
    } else {
      setBotToken('');
      setNotificationEmail('');
    }
  };

  return (
    <ChannelCard
      icon={<Send className="h-5 w-5 text-[rgb(var(--primary))]" />}
      title="Telegram"
      description="Підключення бота для прийому повідомлень"
      enabled={enabled}
      onToggle={handleToggle}
    >
      {!status?.enabled ? (
        <div className="space-y-4">
          <p className="text-sm text-[rgb(var(--foreground-secondary))]">
            Створіть нового бота за посиланням{' '}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[rgb(var(--primary))] hover:underline inline-flex items-center gap-1"
            >
              @BotFather
              <ExternalLink className="w-3 h-3" />
            </a>{' '}
            та скопіюйте token
          </p>

          <div className="space-y-3">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--foreground-secondary))]" />
              <input
                type="password"
                placeholder="Paste Telegram Bot Token"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-sm text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--foreground-secondary))] focus:ring-2 focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50 outline-none"
              />
            </div>

            <div className="relative">
              <input
                type="email"
                placeholder="Email для сповіщень (опціонально)"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-sm text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--foreground-secondary))] focus:ring-2 focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50 outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--destructive))]">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading || !botToken.trim()}
            className="px-4 py-2.5 rounded-xl bg-[rgb(var(--primary))] text-white text-sm font-medium transition-colors hover:bg-[rgb(var(--primary-600))] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Збереження...' : 'Зберегти'}
          </button>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-[rgb(var(--success))]/30 bg-[rgb(var(--success))]/10 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-[rgb(var(--success))]" />
            <div className="flex-1 space-y-3">
              <p className="font-medium text-[rgb(var(--foreground))]">
                Бот підключено: {status.botUsername}
              </p>

              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3">
                <p className="mb-2 text-sm text-[rgb(var(--foreground-secondary))]">
                  Щоб отримувати сповіщення, напишіть боту:
                </p>
                <code className="block rounded-lg bg-[rgb(var(--surface-muted))] px-3 py-2 font-mono text-base font-bold text-[rgb(var(--foreground))]">
                  /start {status.connectCode}
                </code>
              </div>

              <p className="text-sm text-[rgb(var(--foreground-secondary))]">
                Підписано операторів:{' '}
                <strong className="text-[rgb(var(--foreground))]">{status.subscribersCount || 0}</strong>
              </p>

              {status.notificationEmail && (
                <p className="text-sm text-[rgb(var(--foreground-secondary))]">
                  Email для сповіщень:{' '}
                  <strong className="text-[rgb(var(--foreground))]">{status.notificationEmail}</strong>
                </p>
              )}

              <button
                onClick={() => disconnect()}
                disabled={loading}
                className="text-sm text-[rgb(var(--destructive))] hover:text-[rgb(var(--destructive))]/80 hover:underline transition-colors"
              >
                Відключити бота
              </button>
            </div>
          </div>
        </div>
      )}
    </ChannelCard>
  );
}
