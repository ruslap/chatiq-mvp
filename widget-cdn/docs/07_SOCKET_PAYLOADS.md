# Socket.io Payloads Specification

## Connection
Transport: WebSocket (Socket.IO)

---

## Visitor → Server

### Event: visitor:join
Sent when widget loads.

Payload:
{
  siteId: string,
  visitorId: string,
  pageUrl?: string,
  userAgent?: string
}

---

### Event: visitor:message
Sent when visitor sends a message.

Payload:
{
  siteId: string,
  visitorId: string,
  text: string,
  timestamp?: number
}

---

## Admin → Server

### Event: admin:join
Sent after admin login.

Payload:
{
  siteId: string,
  adminId: string
}

---

### Event: admin:message
Sent when admin replies.

Payload:
{
  siteId: string,
  chatId: string,
  text: string,
  timestamp?: number
}

---

## Server → Admin

### Event: chat:new
Triggered when a new visitor starts a chat.

Payload:
{
  chatId: string,
  siteId: string,
  visitorId: string,
  createdAt: string
}

---

### Event: chat:message
Triggered on new incoming message.

Payload:
{
  chatId: string,
  from: "visitor" | "admin",
  text: string,
  createdAt: string
}

---

## Server → Visitor

### Event: admin:message
Triggered when admin replies.

Payload:
{
  text: string,
  createdAt: string
}

---

## Error Event

### Event: error
Payload:
{
  code: string,
  message: string
}
