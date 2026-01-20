import { ChannelsSettings } from '@/components/channels/ChannelsSettings';

export default function ChannelsPage() {
  // TODO: Get siteId from session/auth
  const siteId = 'your-site-id'; // Replace with actual siteId from auth

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
        </div>

        <ChannelsSettings siteId={siteId} />
      </div>
    </div>
  );
}
