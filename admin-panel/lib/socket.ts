import { io, Socket } from "socket.io-client";
import { getApiUrl } from "./api-config";

// Singleton socket manager to avoid multiple connections
let socketInstance: Socket | null = null;
let currentSiteId: string | null = null;
let currentAccessToken: string | null = null;
let connectionCount = 0;

interface SocketOptions {
    siteId: string;
    accessToken: string;
}

export function getSocket(options: SocketOptions): Socket {
    const { siteId, accessToken } = options;

    // If we already have a connection for this siteId, reuse it
    if (
        socketInstance &&
        currentSiteId === siteId &&
        currentAccessToken === accessToken &&
        socketInstance.connected
    ) {
        connectionCount++;
        return socketInstance;
    }

    // If siteId changed, disconnect old socket
    if (
        socketInstance &&
        (currentSiteId !== siteId || currentAccessToken !== accessToken)
    ) {
        socketInstance.disconnect();
        socketInstance = null;
    }

    // Create new socket if needed
    if (!socketInstance) {
        const apiUrl = getApiUrl();

        socketInstance = io(apiUrl, {
            // Start with polling, then upgrade to WebSocket (more reliable through Cloudflare)
            transports: ['polling', 'websocket'],
            auth: {
                token: accessToken,
            },
            // Reconnection settings
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            // Don't auto-connect, we'll connect manually after setup
            autoConnect: true,
            // Timeout
            timeout: 10000,
        });

        currentSiteId = siteId;
        currentAccessToken = accessToken;

        socketInstance.on('connect', () => {
            console.log('[SocketManager] Connected, joining admin room:', siteId);
            socketInstance?.emit('admin:join', { siteId });
        });

        socketInstance.on('disconnect', (reason: string) => {
            console.log('[SocketManager] Disconnected:', reason);
        });

        socketInstance.on('connect_error', (error: Error) => {
            console.error('[SocketManager] Connection error:', error.message);
        });
    }

    connectionCount++;
    return socketInstance;
}

export function releaseSocket(): void {
    connectionCount--;
    console.log('[SocketManager] Release called, count:', connectionCount);

    // Only disconnect when no more components are using it
    // Keep socket alive to avoid constant reconnections
    // Socket will be disconnected on page unload automatically
}

export function disconnectSocket(): void {
    if (socketInstance) {
        console.log('[SocketManager] Force disconnecting');
        socketInstance.disconnect();
        socketInstance = null;
        currentSiteId = null;
        currentAccessToken = null;
        connectionCount = 0;
    }
}

// Check if socket is connected
export function isSocketConnected(): boolean {
    return socketInstance?.connected ?? false;
}

// Get current socket (without incrementing count)
export function getCurrentSocket(): Socket | null {
    return socketInstance;
}
