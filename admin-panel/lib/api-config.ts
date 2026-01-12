/**
 * Centralized API configuration for the admin panel.
 * Eliminates code duplication across components.
 */

export function getApiUrl(): string {
    if (typeof window === 'undefined') {
        // Server-side: use environment variable
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    }

    // Client-side: check localStorage first, then env, then default
    return (
        localStorage.getItem('chtq_api_url') ||
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:3000'
    );
}

export function getWsUrl(): string {
    const apiUrl = getApiUrl();
    // Convert http(s) to ws(s)
    return apiUrl.replace(/^http/, 'ws');
}

export function isLocalMode(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('chtq_api_url') === 'http://localhost:3000';
}

export function setLocalMode(enabled: boolean): void {
    if (typeof window === 'undefined') return;

    if (enabled) {
        localStorage.setItem('chtq_api_url', 'http://localhost:3000');
    } else {
        localStorage.removeItem('chtq_api_url');
    }
}
