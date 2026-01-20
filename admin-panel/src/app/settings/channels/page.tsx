'use client';

import { useState } from 'react';
import { ChannelsSettings } from '@/components/channels/ChannelsSettings';

export default function ChannelsPage() {
  const [siteId, setSiteId] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  if (!isConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Тестування Telegram Integration
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            Введіть siteId для тестування (отримайте з БД або створіть новий сайт)
          </p>
          <input
            type="text"
            placeholder="Site ID (UUID)"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            onClick={() => setIsConfigured(true)}
            disabled={!siteId.trim()}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Продовжити
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Канали зв'язку
          </h1>
          <p className="text-sm text-gray-600">
            Налаштуйте канали для отримання повідомлень від відвідувачів
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Тестовий режим - Site ID: {siteId}
          </p>
        </div>

        <ChannelsSettings siteId={siteId} />
      </div>
    </div>
  );
}
