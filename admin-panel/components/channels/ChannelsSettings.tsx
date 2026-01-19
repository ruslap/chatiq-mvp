'use client';

import { MessageSquare } from 'lucide-react';
import { ChannelCard } from './ChannelCard';
import { TelegramChannelCard } from './TelegramChannelCard';

interface ChannelsSettingsProps {
  siteId: string;
}

export function ChannelsSettings({ siteId }: ChannelsSettingsProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <ChannelCard
        icon={<MessageSquare className="h-5 w-5 text-blue-600" />}
        title="Онлайн-чат"
        description="Віджет чату для сайту"
        enabled={true}
        onToggle={() => {}}
      />

      <TelegramChannelCard siteId={siteId} />
    </div>
  );
}
