import { getSession } from 'next-auth/react';

export async function getMyOrganization(): Promise<string> {
  try {
    const session = await getSession();
    if (!session?.user) {
      // Fallback to localStorage for unauthenticated access
      return localStorage.getItem('chtq_org_id') || '';
    }

    const response = await fetch('/api/organization/my', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const orgId = data.organizationId;

      // Store in localStorage as backup
      localStorage.setItem('chtq_org_id', orgId);

      return orgId;
    } else {
      console.error('Failed to get organization from API');
      // Fallback to localStorage
      return localStorage.getItem('chtq_org_id') || '';
    }
  } catch (error) {
    console.error('Error getting organization:', error);
    // Fallback to localStorage
    return localStorage.getItem('chtq_org_id') || '';
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
