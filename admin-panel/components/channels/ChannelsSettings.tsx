'use client';

import { MessageSquare, Radio } from 'lucide-react';
import { ChannelCard } from './ChannelCard';
import { TelegramChannelCard } from './TelegramChannelCard';

interface ChannelsSettingsProps {
  siteId: string;
}

export function ChannelsSettings({ siteId }: ChannelsSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">
            Канали зв'язку
          </h2>
          <p className="text-sm text-[rgb(var(--foreground-secondary))] mt-1">
            Налаштуйте канали для отримання повідомлень від відвідувачів
          </p>
        </div>
      </div>

      {/* Channel Cards */}
      <div className="grid gap-4">
        <ChannelCard
          icon={<MessageSquare className="h-5 w-5 text-[rgb(var(--primary))]" />}
          title="Онлайн-чат"
          description="Віджет чату для сайту — завжди активний"
          enabled={true}
          onToggle={() => { }}
        />

        <TelegramChannelCard siteId={siteId} />
      </div>

      {/* Info Hint */}
      <div className="bg-[rgb(var(--accent))] rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 bg-[rgb(var(--primary))]/10 rounded-lg flex items-center justify-center shrink-0">
          <Radio className="w-4 h-4 text-[rgb(var(--primary))]" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-[rgb(var(--foreground))] mb-1">
            Мультиканальна підтримка
          </h4>
          <p className="text-sm text-[rgb(var(--foreground-secondary))]">
            Усі повідомлення з різних каналів потрапляють в єдиний інтерфейс чату,
            де ви можете відповідати клієнтам з одного місця
          </p>
        </div>
      </div>
    </div>
  );
}
