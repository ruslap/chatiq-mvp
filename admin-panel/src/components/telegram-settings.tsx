'use client';

import { useState, useEffect } from 'react';
import { Send, Key, CheckCircle, AlertCircle, Loader2, Users } from 'lucide-react';

interface TelegramSettingsProps {
  siteId: string;
  accessToken: string;
}

interface TelegramStatus {
  enabled: boolean;
  botUsername?: string;
  connectCode?: string;
  subscribersCount?: number;
  webhookUrl?: string;
}

export function TelegramSettings({ siteId, accessToken }: TelegramSettingsProps) {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, [siteId]);

  async function fetchStatus() {
    try {
      const response = await fetch(`/api/telegram/status/${siteId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      setStatus(data);
      setIsExpanded(data.enabled);
    } catch (error) {
      console.error('Failed to fetch Telegram status', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup() {
    if (!botToken.trim()) {
      setError('Будь ласка, введіть Bot Token');
      return;
    }

    setError('');
    setSaving(true);

    try {
      const response = await fetch(`/api/telegram/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ siteId, botToken }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus({
          enabled: true,
          botUsername: data.data.botUsername,
          connectCode: data.data.connectCode,
          subscribersCount: 0,
        });
        setBotToken('');
        setIsExpanded(false);
      } else {
        setError(data.error || 'Не вдалося підключити бота');
      }
    } catch (error) {
      setError('Помилка мережі');
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Ви впевнені, що хочете відключити Telegram бота?')) {
      return;
    }

    setSaving(true);
    try {
      await fetch(`/api/telegram/disconnect/${siteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setStatus({ enabled: false });
      setIsExpanded(false);
    } catch (error) {
      console.error('Failed to disconnect', error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--primary))]" />
      </div>
    );
  }

  const enabled = status?.enabled || false;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-1">
          Telegram сповіщення
        </h2>
        <p className="text-sm text-[rgb(var(--foreground-secondary))]">
          Отримуйте сповіщення про нові чати в Telegram
        </p>
      </div>

      {/* Telegram Integration Card */}
      <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))] overflow-hidden">
        {/* Header with Toggle */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[rgb(var(--primary))]/10 flex items-center justify-center">
              <Send className="w-5 h-5 text-[rgb(var(--primary))]" />
            </div>
            <div>
              <h3 className="font-medium text-[rgb(var(--foreground))]">Telegram</h3>
              <p className="text-sm text-[rgb(var(--foreground-secondary))]">
                {enabled ? 'Підключено' : 'Підключіть бота для сповіщень'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (enabled) {
                handleDisconnect();
              } else {
                setIsExpanded(!isExpanded);
              }
            }}
            disabled={saving}
            className={`relative w-12 h-7 rounded-full transition-smooth ${
              enabled
                ? 'bg-[rgb(var(--primary))]'
                : 'bg-[rgb(var(--border))]'
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-smooth ${
                enabled ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Setup Form */}
        {isExpanded && !enabled && (
          <div className="p-4 pt-0 space-y-4 animate-fade-in">
            <div className="p-4 bg-[rgb(var(--surface))] rounded-lg border border-[rgb(var(--border))]">
              <p className="text-sm text-[rgb(var(--foreground-secondary))] mb-3">
                Створіть нового бота за посиланням{' '}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[rgb(var(--primary))] hover:underline font-medium"
                >
                  @BotFather
                </a>{' '}
                та скопіюйте token
              </p>

              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--foreground-secondary))]" />
                <input
                  type="password"
                  placeholder="Paste Telegram Bot Token"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] text-sm focus:ring-2 focus:ring-[rgb(var(--primary))]/20 focus:border-[rgb(var(--primary))]/50 outline-none transition-smooth"
                />
              </div>

              {error && (
                <div className="mt-3 flex items-center gap-2 text-sm text-[rgb(var(--destructive))]">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                onClick={handleSetup}
                disabled={saving || !botToken.trim()}
                className="mt-4 w-full h-10 rounded-xl bg-[rgb(var(--primary))] text-white font-medium transition-smooth hover:bg-[rgb(var(--primary-600))] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Збереження...
                  </>
                ) : (
                  'Зберегти'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Connected Status */}
        {enabled && status && (
          <div className="p-4 pt-0 space-y-4 animate-fade-in">
            <div className="p-4 rounded-lg border border-[rgb(var(--success))]/20 bg-[rgb(var(--success))]/5">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[rgb(var(--success))] flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-3">
                  <p className="font-medium text-[rgb(var(--foreground))]">
                    Бот підключено: {status.botUsername}
                  </p>

                  <div className="p-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
                    <p className="text-sm text-[rgb(var(--foreground-secondary))] mb-2">
                      Щоб отримувати сповіщення, напишіть боту:
                    </p>
                    <code className="block px-3 py-2 rounded bg-[rgb(var(--surface-muted))] font-mono text-base font-bold text-[rgb(var(--primary))]">
                      /start {status.connectCode}
                    </code>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-[rgb(var(--foreground-secondary))]">
                    <Users className="w-4 h-4" />
                    Підписано операторів: <strong className="text-[rgb(var(--foreground))]">{status.subscribersCount || 0}</strong>
                  </div>

                  <button
                    onClick={handleDisconnect}
                    disabled={saving}
                    className="text-sm text-[rgb(var(--destructive))] hover:text-[rgb(var(--destructive))]/80 hover:underline transition-smooth disabled:opacity-50"
                  >
                    Відключити бота
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-4 rounded-lg bg-[rgb(var(--accent))] border border-[rgb(var(--border))]">
        <h4 className="text-sm font-medium text-[rgb(var(--foreground))] mb-2">
          Як це працює?
        </h4>
        <ul className="text-sm text-[rgb(var(--foreground-secondary))] space-y-1.5">
          <li>• Створіть Telegram бота через @BotFather</li>
          <li>• Підключіть бота, вставивши токен вище</li>
          <li>• Кожен оператор підписується командою /start CODE</li>
          <li>• Отримуйте миттєві сповіщення про нові чати</li>
        </ul>
      </div>
    </div>
  );
}
