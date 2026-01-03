# Prisma Schema (MVP)

## Database
PostgreSQL

---

## User
Represents account owner / admin.

Fields:
- id (UUID)
- email (unique)
- passwordHash
- createdAt

---

## Site
Represents a website using the widget.

Fields:
- id (string, siteId)
- userId (FK → User)
- name
- domain
- apiKey
- createdAt

---

## Chat
Represents a single conversation.

Fields:
- id (UUID)
- siteId (FK → Site)
- visitorId
- status ("open" | "closed")
- createdAt

---

## Message
Represents a chat message.

Fields:
- id (UUID)
- chatId (FK → Chat)
- from ("visitor" | "admin")
- text
- createdAt

---

## Relations
User 1—N Site
Site 1—N Chat
Chat 1—N Message

---

## Notes
- visitorId stored as string
- No soft delete in MVP
- Index chatId, siteId for performance
