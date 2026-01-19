import { useState, useEffect } from 'react';

interface TelegramStatus {
  enabled: boolean;
  botUsername?: string;
  connectCode?: string;
  subscribersCount?: number;
}

export function useTelegramIntegration(siteId: string) {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, [siteId]);

  async function fetchStatus() {
    try {
      const response = await fetch(`/api/telegram/status/${siteId}`);
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch Telegram status', error);
    }
  }

  async function setup(botToken: string) {
    setLoading(true);
    try {
      const response = await fetch('/api/telegram/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    setLoading(true);
    try {
      await fetch(`/api/telegram/disconnect/${siteId}`, {
        method: 'DELETE',
      });
      setStatus({ enabled: false });
    } catch (error) {
      console.error('Failed to disconnect', error);
    } finally {
      setLoading(false);
    }
  }

  return { status, loading, setup, disconnect, refetch: fetchStatus };
}
