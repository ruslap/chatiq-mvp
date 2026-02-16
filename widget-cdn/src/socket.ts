import { API_URL } from "./config";
import type { Socket } from "./types";

let socket: Socket | null = null;
let connectRetries = 0;
const MAX_CONNECT_RETRIES = 10;

export type MessageHandler = (data: {
  text: string;
  messageId?: string;
  attachment?: string | null;
  createdAt?: string;
}) => void;

export type EditHandler = (data: {
  messageId: string;
  text: string;
  editedAt?: string;
}) => void;

export type DeleteHandler = (data: { messageId: string }) => void;

interface SocketCallbacks {
  onAdminMessage: MessageHandler;
  onMessageEdited: EditHandler;
  onMessageDeleted: DeleteHandler;
}

export function initSocket(
  siteId: string,
  visitorId: string,
  callbacks: SocketCallbacks,
): void {
  if (window.io) {
    connectSocket(siteId, visitorId, callbacks);
  } else {
    const script = document.createElement("script");
    script.src = "https://cdn.socket.io/4.7.2/socket.io.min.js";
    script.onload = () => connectSocket(siteId, visitorId, callbacks);
    document.head.appendChild(script);
  }
}

function connectSocket(
  siteId: string,
  visitorId: string,
  callbacks: SocketCallbacks,
): void {
  if (!window.io) {
    console.warn("[Chtq] Socket.IO not loaded");
    return;
  }

  socket = window.io(API_URL, {
    query: { siteId, visitorId },
  });

  socket.on("connect", () => {
    console.log("[Chtq] Connected to server");
    connectRetries = 0;
    socket!.emit("visitor:join", { siteId, visitorId });
  });

  socket.on("admin:message", (msg: unknown) => {
    const data = msg as {
      text: string;
      messageId?: string;
      attachment?: string | null;
      createdAt?: string;
    };
    callbacks.onAdminMessage(data);
  });

  socket.on("message:edited", (data: unknown) => {
    callbacks.onMessageEdited(
      data as { messageId: string; text: string; editedAt?: string },
    );
  });

  socket.on("message:deleted", (data: unknown) => {
    callbacks.onMessageDeleted(data as { messageId: string });
  });
}

export function sendVisitorMessage(
  siteId: string,
  visitorId: string,
  text: string,
  visitorName: string,
  attachment?: string,
): void {
  if (!socket?.connected) {
    console.warn("[Chtq] Socket not connected, cannot send message");
    return;
  }
  socket.emit("visitor:message", {
    siteId,
    visitorId,
    text,
    visitorName,
    attachment,
  });
}

export function emitDisconnect(siteId: string, visitorId: string): void {
  socket?.emit("visitor:disconnect", { siteId, visitorId });
}

export function getSocket(): Socket | null {
  return socket;
}
