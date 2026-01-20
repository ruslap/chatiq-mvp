'use client';

import { useState } from 'react';
import { Settings as SettingsIcon, MessageSquare } from 'lucide-react';
import { ChannelsSettings } from '@/components/channels/ChannelsSettings';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'widget' | 'channels'>('widget');
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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Налаштування</h1>
          <p className="mt-2 text-sm text-gray-600">
            Керуйте налаштуваннями віджету та каналами зв'язку
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Тестовий режим - Site ID: {siteId}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-8">
            <button
              onClick={() => setActiveTab('widget')}
              className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'widget'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <SettingsIcon className="h-5 w-5" />
              Віджет
            </button>
            <button
              onClick={() => setActiveTab('channels')}
              className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'channels'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              Канали зв'язку
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'widget' && (
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Налаштування віджету
              </h2>
              <p className="text-sm text-gray-600">
                Тут будуть налаштування віджету (колір, текст привітання, тощо)
              </p>
            </div>
          )}

          {activeTab === 'channels' && <ChannelsSettings siteId={siteId} />}
        </div>
      </div>
    </div>
  );
}
