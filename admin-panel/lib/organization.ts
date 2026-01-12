import { getSession } from 'next-auth/react';

export interface OrganizationInfo {
  organizationId: string;
  siteId: string | null;
}

export async function getMyOrganization(): Promise<OrganizationInfo | null> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return null;
    }

    const response = await fetch('/api/organization/my', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        organizationId: data.organizationId || '',
        siteId: data.siteId || null,
      };
    } else {
      console.error('Failed to get organization from API');
      return null;
    }
  } catch (error) {
    console.error('Error getting organization:', error);
    return null;
  }
}

interface OrganizationSettings {
  [key: string]: unknown;
}

interface OrganizationSettingsResponse {
  success: boolean;
  settings?: OrganizationSettings;
}

export async function updateOrganizationSettings(
  settings: OrganizationSettings
): Promise<OrganizationSettingsResponse> {
  try {
    const session = await getSession();
    if (!session?.user) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/organization/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error('Failed to update settings');
    }

    return response.json();
  } catch (error) {
    console.error('Error updating organization settings:', error);
    throw error;
  }
}
