'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ChannelsSettings } from '@/components/channels/ChannelsSettings';
import { getMyOrganization } from '@/lib/organization';
import { Settings } from 'lucide-react';

async function getOrgId(): Promise<string> {
  if (typeof window === 'undefined') return '';
  const org = await getMyOrganization();
  return org?.siteId || '';
}

export default function ChannelsPage() {
  const { data: session, status } = useSession();
  const [siteId, setSiteId] = useState<string>('');

  useEffect(() => {
    const fetchOrgId = async () => {
      const orgId = await getOrgId();
      setSiteId(orgId);
    };
    fetchOrgId();
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-blue-600 border-t-transparent"></div>
          <div className="text-sm font-medium text-gray-600">Завантаження...</div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
            <Settings className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Авторизація потрібна</h3>
          <p className="mb-6 text-sm text-gray-600">Увійдіть в систему для доступу до налаштувань каналів.</p>
          <a
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Увійти
          </a>
        </div>
      </div>
    );
  }

  if (!siteId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-blue-600 border-t-transparent"></div>
          <div className="text-sm font-medium text-gray-600">Завантаження організації...</div>
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
        </div>

        <ChannelsSettings siteId={siteId} />
      </div>
    </div>
  );
}
