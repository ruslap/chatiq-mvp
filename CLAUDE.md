# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChatIQ MVP is a multi-tenant live chat widget platform with three main components:
- **API Server** (NestJS/TypeScript) - Backend API and WebSocket server
- **Admin Panel** (Next.js/React) - Web interface for chat operators
- **Widget CDN** (Vanilla JS) - Embeddable chat widget

## Technology Stack
- **Backend**: NestJS, TypeScript, Prisma ORM, Socket.IO
- **Frontend Admin**: Next.js, React, NextAuth
- **Widget**: Vanilla JavaScript, Shadow DOM
- **Database**: PostgreSQL
- **Authentication**: JWT, Google OAuth

---

## Development Commands

### Start/Stop All Services
```bash
./start.sh              # Start all services (installs deps if needed)
./stop.sh               # Stop all services
./status.sh             # Check running services
```

### Individual Service Development

**API Server** (port 3000):
```bash
cd api-server
npm run start:dev       # Development with hot reload
npm run build           # Build for production
npm run test            # Run unit tests
npm run test:e2e        # Run end-to-end tests
npm run lint            # Lint TypeScript files
npx prisma generate     # Generate Prisma client
npx prisma migrate dev  # Run database migrations
npx prisma studio       # Open Prisma Studio (DB GUI)
```

**Admin Panel** (port 3001):
```bash
cd admin-panel
npm run dev             # Development server
npm run build           # Production build
npm run lint            # Run ESLint
```

**Widget CDN** (port 3002):
```bash
cd widget-cdn
npm run dev             # Serve on port 3002
```

---

## Architecture

### Multi-Tenant Data Model
The system enforces strict data isolation:
```
User (OWNER/OPERATOR)
  └─ Site (has unique siteId/apiKey)
       └─ Chat (visitor sessions)
            └─ Message (visitor/admin messages)
```

- Each `Site` belongs to one `User` (owner)
- `siteId` is used throughout for tenant isolation
- **All queries must filter by `siteId` to prevent cross-site access**
- Sites can have multiple operators via `SiteUser` join table

### Real-time Communication (Socket.IO)

**WebSocket Architecture**:
- API Server runs Socket.IO gateway on same port as REST API (3000)
- Two namespaces: visitor widgets and admin panel
- Events documented in `widget-cdn/docs/07_SOCKET_PAYLOADS.md`

Key Socket.IO events:
- `visitor:join` - Widget connects with siteId/visitorId
- `visitor:message` - Visitor sends message
- `admin:join` - Admin connects to chat room
- `admin:message` - Admin sends reply
- `chat:new` - Broadcast new chat to admins
- `chat:message` - Broadcast message updates

### Database (Prisma + PostgreSQL)

Schema location: `api-server/prisma/schema.prisma`

Important models:
- `User` - Admins/operators with roles (OWNER/OPERATOR)
- `Site` - Customer websites with unique apiKey
- `Chat` - Visitor chat sessions (status: open/closed)
- `Message` - Chat messages with optional attachments
- `WidgetSettings` - Per-organization widget customization
- `AutoReply` - Automated messages (triggers: first_message, offline, delays)
- `QuickTemplate` - Operator quick responses with shortcuts
- `BusinessHours` - Working hours per site with timezone support

After schema changes:
```bash
cd api-server
npx prisma migrate dev --name descriptive_name
npx prisma generate
```

### Widget Embedding

The widget is a single vanilla JS file served from CDN. Customers embed it with:
```html
<script src="https://cdn.example.com/widget.js" data-site-id="SITE_ID"></script>
```

- Widget reads `data-site-id` attribute from script tag
- Generates/stores `visitorId` in localStorage
- Creates Shadow DOM for style isolation
- Connects to API server via Socket.IO

Widget source: `widget-cdn/public/widget.js`

### Authentication

- **Admin Panel**: NextAuth with Google OAuth + email/password
- **Widget**: Anonymous with `visitorId` (UUID stored in localStorage)
- JWT tokens for API authentication
- Auth module: `api-server/src/auth/`

### File Uploads

- Upload endpoint: `/upload`
- Files stored in: `api-server/uploads/`
- Served via: `http://localhost:3000/uploads/filename`
- CORS enabled for cross-origin access
- Max payload: 10MB (configured in `main.ts`)

### Module Structure (API Server)

- `auth/` - Authentication (JWT, Google OAuth, guards)
- `chat/` - Chat management (REST + WebSocket gateway)
- `sites/` - Site CRUD operations
- `organization/` - Organization settings
- `widget-settings/` - Widget customization API
- `automation/` - Auto-replies and business hours logic
- `upload/` - File upload handling
- `prisma/` - Database service (singleton pattern)

---

## Code Standards

### Naming Conventions

- **Files**: kebab-case (`chat-messages.ts`, `widget-settings.ts`)
- **Classes/Services**: PascalCase (`ChatService`, `AuthGuard`)
- **Functions/Methods**: camelCase (`getMessages`, `validateTenant`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_MESSAGE_LENGTH`, `DEFAULT_TIMEOUT`)
- **Interfaces/Types**: PascalCase (`ChatMessageDTO`, `WidgetConfig`)

### NestJS Patterns

```typescript
// ✅ Good - Service with dependency injection
@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getChats(siteId: string): Promise<Chat[]> {
    return this.prisma.chat.findMany({
      where: { siteId }, // Always filter by tenant
    });
  }
}

// ❌ Bad - Missing tenant isolation
async getChats(): Promise<Chat[]> {
  return this.prisma.chat.findMany(); // Cross-tenant data leak!
}
```

### Conditional Logic

- ❌ AVOID nested ternaries
- ✅ Use if/else or switch for multiple conditions
- ✅ Use early returns to reduce nesting

```typescript
// ✅ Good - early returns
function getStatusText(status: ChatStatus): string {
  if (status === 'open') return 'Active';
  if (status === 'closed') return 'Resolved';
  if (status === 'pending') return 'Waiting';
  return 'Unknown';
}

// ❌ Bad - nested ternary
const text = status === 'open' ? 'Active' : status === 'closed' ? 'Resolved' : 'Unknown';
```

### Defensive Checks

- ✅ Validate only at API boundaries (controllers, gateways)
- ❌ Remove excessive null checks in internal functions when TypeScript guarantees types

```typescript
// ✅ Good - validation at controller
@Post('message')
async sendMessage(@Body() dto: CreateMessageDto) {
  if (!dto.siteId) throw new BadRequestException('siteId required');
  return this.chatService.createMessage(dto);
}

// In service - TypeScript guarantees types
async createMessage(dto: CreateMessageDto) {
  // No need to re-validate dto.siteId - already validated
  return this.prisma.message.create({ data: dto });
}
```

### Error Handling

- ✅ Use NestJS built-in exceptions (`BadRequestException`, `NotFoundException`, etc.)
- ✅ Custom exceptions for domain-specific errors
- ❌ NO silent catch blocks

```typescript
// ✅ Good - specific exceptions
if (!chat) {
  throw new NotFoundException(`Chat ${chatId} not found`);
}

if (chat.siteId !== userSiteId) {
  throw new ForbiddenException('Access denied to this chat');
}

// ❌ Bad - generic or silent errors
try {
  // logic
} catch (error) {
  console.log(error); // Don't just log and swallow
}
```

---

## Testing Standards

### Test Structure (AAA Pattern)

```typescript
describe('ChatService', () => {
  describe('getChats', () => {
    it('should return chats for specific site', async () => {
      // Arrange
      const siteId = 'test-site-id';
      
      // Act
      const result = await chatService.getChats(siteId);
      
      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].siteId).toBe(siteId);
    });

    it('should throw NotFoundException for invalid site', async () => {
      await expect(chatService.getChats('invalid-id'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
```

### Test Commands

```bash
npm run test            # Unit tests
npm run test:e2e        # End-to-end tests
npm run test:cov        # Coverage report
```

---

## Configuration

### Environment Variables

API Server (`.env` in `api-server/`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing (min 32 chars)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth credentials
- `NEXTAUTH_URL` - NextAuth callback URL
- `PORT` - Server port (default: 3000)

### Security Notes

- ✅ CORS is permissive in development (`origin: true`). **Restrict in production.**
- ✅ All services log to `logs/` directory when using `./start.sh`
- ✅ NestJS uses dependency injection - services are singletons by default
- ✅ Prisma client is initialized once in `PrismaService` and reused
- ✅ Always validate `siteId` to prevent unauthorized cross-tenant access
- ✅ Sanitize user input before storing (Messages, chat metadata)

---

## Important Files

| Path | Description |
|------|-------------|
| `api-server/src/chat/chat.gateway.ts` | Socket.IO event handlers |
| `api-server/prisma/schema.prisma` | Database schema |
| `widget-cdn/public/widget.js` | Embeddable widget source |
| `admin-panel/src/app/` | Next.js App Router pages |
| `widget-cdn/docs/07_SOCKET_PAYLOADS.md` | Socket.IO event documentation |

---

## Priority Order for Code Changes

1. **Security issues** (tenant isolation, XSS, SQL injection)
2. **Functionality-breaking bugs**
3. **Error handling consistency**
4. **Code duplication removal**
5. **Naming conventions**
6. **Performance optimizations**
