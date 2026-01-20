'use client';

import { useState } from 'react';
import { Send, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { ChannelCard } from './ChannelCard';
import { useTelegramIntegration } from '@/hooks/useTelegramIntegration';

interface TelegramChannelCardProps {
  siteId: string;
}

export function TelegramChannelCard({ siteId }: TelegramChannelCardProps) {
  const { status, loading, setup, disconnect } = useTelegramIntegration(siteId);
  const [botToken, setBotToken] = useState('');
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

    const result = await setup(botToken);

    if (!result.success) {
      setError(result.error || 'Не вдалося підключити бота');
    } else {
      setBotToken('');
    }
  };

  return (
    <ChannelCard
      icon={<Send className="h-5 w-5 text-blue-600" />}
      title="Telegram"
      description="Підключення бота для прийому повідомлень"
      enabled={enabled}
      onToggle={handleToggle}
    >
      {!status?.enabled ? (
        // Setup Form
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Створіть нового бота за посиланням{' '}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              @BotFather
            </a>{' '}
            та скопіюйте token
          </p>

          <div className="relative">
            <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              placeholder="Paste Telegram Bot Token"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading || !botToken.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Збереження...' : 'Зберегти'}
          </button>
        </div>
      ) : (
        // Connected Status
        <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
            <div className="flex-1 space-y-3">
              <p className="font-medium text-green-900">
                Бот підключено: {status.botUsername}
              </p>

              <div className="rounded-lg border border-green-200 bg-white p-3">
                <p className="mb-1 text-sm text-gray-700">
                  Щоб отримувати сповіщення, напишіть боту:
                </p>
                <code className="block rounded bg-gray-50 px-3 py-2 font-mono text-base font-bold text-gray-900">
                  /start {status.connectCode}
                </code>
              </div>

              <p className="text-sm text-gray-600">
                Підписано операторів:{' '}
                <strong>{status.subscribersCount || 0}</strong>
              </p>

              <button
                onClick={() => disconnect()}
                disabled={loading}
                className="text-sm text-red-600 hover:text-red-700 hover:underline"
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
