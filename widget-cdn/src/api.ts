import { API_URL, config } from "./config";
import type { BusinessStatus, WidgetSettings } from "./types";

export interface ResolveResult {
  organizationId: string;
  siteId: string;
}

export async function resolveSiteId(
  organizationId: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${API_URL}/organization/resolve/${organizationId}`,
    );
    if (res.ok) {
      const data: ResolveResult = await res.json();
      return data.siteId || null;
    }
    console.warn("[Chtq] Failed to resolve siteId");
    return null;
  } catch (error) {
    console.warn("[Chtq] Error resolving siteId:", error);
    return null;
  }
}

export async function fetchWidgetSettings(
  organizationId: string,
): Promise<WidgetSettings | null> {
  try {
    const res = await fetch(`${API_URL}/widget-settings/${organizationId}`);
    if (res.ok) {
      return (await res.json()) as WidgetSettings;
    }
    return null;
  } catch (error) {
    console.warn("[Chtq] Failed to fetch settings:", error);
    return null;
  }
}

export async function fetchBusinessStatus(
  siteId: string,
): Promise<BusinessStatus> {
  try {
    const res = await fetch(
      `${API_URL}/automation/business-hours/${siteId}/status`,
    );
    if (res.ok) {
      return (await res.json()) as BusinessStatus;
    }
  } catch (error) {
    console.warn("[Chtq] Failed to fetch business hours status:", error);
  }
  return { isOpen: true };
}

export async function submitContactLead(
  siteId: string,
  data: { name: string; email?: string; phone?: string; message?: string },
): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId, ...data }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchVisitorHistory(
  siteId: string,
  visitorId: string,
): Promise<{ data: Array<Record<string, unknown>>; nextCursor?: string }> {
  try {
    const res = await fetch(
      `${API_URL}/chat/visitor-history/${siteId}/${visitorId}`,
    );
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.warn("[Chtq] Failed to fetch visitor history:", error);
  }
  return { data: [] };
}
