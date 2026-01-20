import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface TelegramStatus {
  enabled: boolean;
  botUsername?: string;
  connectCode?: string;
  subscribersCount?: number;
}

export function useTelegramIntegration(siteId: string) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const accessToken = (session as any)?.accessToken;

  useEffect(() => {
    if (siteId && accessToken) {
      fetchStatus();
    }
  }, [siteId, accessToken]);

  async function fetchStatus() {
    try {
      const response = await fetch(`/api/telegram/status/${siteId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch Telegram status', error);
    }
  }

  async function setup(botToken: string) {
    setLoading(true);
    console.log('[Telegram] Setup called, accessToken:', accessToken ? 'present' : 'missing');
    try {
      const response = await fetch('/api/telegram/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ siteId, botToken }),
      });

      console.log('[Telegram] Setup response status:', response.status);
      const data = await response.json();
      console.log('[Telegram] Setup response data:', data);

      if (data.success) {
        setStatus({
          enabled: true,
          botUsername: data.data.botUsername,
          connectCode: data.data.connectCode,
          subscribersCount: 0,
        });
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error || data.message };
      }
    } catch (error) {
      console.error('[Telegram] Setup error:', error);
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
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
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
