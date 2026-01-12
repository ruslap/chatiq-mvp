Ось комплексний `CLAUDE.md` для твого CHTQ MVP проєкту. Це не JSONC, а Markdown файл, який code-simplifier читає як "інструкцію" для роботи з твоїм проєктом:

```markdown
# CHTQ MVP - Code Standards & Simplification Guidelines

## Project Overview
CHTQ (chtq.ink) - Multi-tenant SaaS chat widget platform
- **Widget**: Embeddable React/TypeScript chat component
- **Backend**: RESTful API with tenant isolation
- **Infrastructure**: Docker-based deployment on VPS
- **Database**: PostgreSQL with tenant-based schemas

## Technology Stack
- **Frontend**: React 18+, TypeScript 5+, Vite, TailwindCSS
- **Backend**: Node.js/Express (or specify your actual stack)
- **Database**: PostgreSQL 15+
- **Infrastructure**: Docker, Docker Compose, Nginx
- **Deployment**: Hetzner VPS, Cloudflare

---

## 1. Widget Frontend (React/TypeScript)

### Module System
- ✅ Use ES modules with explicit `.js` extensions in imports
- ✅ Named exports preferred over default exports
- ✅ Group imports: external → internal → types → styles
```typescript
// Good
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.js';
import type { ChatMessage } from '@/types/chat.js';
import './ChatWidget.css';

// Bad - no extensions, mixed order
import './ChatWidget.css';
import type { ChatMessage } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
```

### Component Structure
- ✅ Functional components with hooks only
- ✅ Custom hooks start with `use` prefix
- ✅ One component per file (except tightly coupled sub-components)
- ✅ Props interface defined above component
```typescript
// Good
interface ChatWidgetProps {
  tenantId: string;
  theme?: 'light' | 'dark';
  position?: 'bottom-right' | 'bottom-left';
}

export function ChatWidget({ tenantId, theme = 'light', position = 'bottom-right' }: ChatWidgetProps) {
  // component logic
}

// Bad - inline types, default export
export default ({ tenantId, theme, position }: {tenantId: string, theme?: string, position?: string}) => {
  // logic
}
```

### Conditional Logic
- ❌ AVOID nested ternaries completely
- ✅ Use if/else chains or switch statements for multiple conditions
- ✅ Use early returns to reduce nesting
```typescript
// Good
function getMessageStatus(status: MessageStatus): string {
  if (status === 'sending') return 'Відправляється...';
  if (status === 'sent') return 'Відправлено';
  if (status === 'failed') return 'Помилка';
  return 'Невідомий статус';
}

// Or with switch
function getMessageStatus(status: MessageStatus): string {
  switch (status) {
    case 'sending': return 'Відправляється...';
    case 'sent': return 'Відправлено';
    case 'failed': return 'Помилка';
    default: return 'Невідомий статус';
  }
}

// Bad - nested ternary
const status = isSending ? 'Відправляється...' : isSent ? 'Відправлено' : isFailed ? 'Помилка' : 'Невідомий';
```

### Defensive Checks
- ❌ Remove excessive null checks when TypeScript guarantees type safety
- ❌ Remove try-catch in functions called by trusted/validated code paths
- ✅ Keep validation only at API boundaries and user input points
```typescript
// Good - validation at boundary only
export function ChatWidget({ tenantId }: ChatWidgetProps) {
  if (!tenantId) {
    throw new Error('tenantId is required');
  }
  // rest of code assumes tenantId exists
  return <div>{processTenantId(tenantId)}</div>;
}

function processTenantId(id: string) {
  // No need to check if id exists - TypeScript guarantees it
  return id.toUpperCase();
}

// Bad - redundant checks
function processTenantId(id: string) {
  if (!id) return ''; // Unnecessary - TypeScript ensures id is string
  if (typeof id !== 'string') return ''; // Unnecessary
  try {
    return id.toUpperCase();
  } catch (error) { // Unnecessary - toUpperCase() can't throw on string
    return '';
  }
}
```

### Styling & Design
- ✅ TailwindCSS utility classes preferred
- ✅ Material Design 3 principles (elevation, motion, color system)
- ✅ Glassmorphism effects for premium feel
- ✅ Responsive by default (mobile-first)
```typescript
// Good - semantic class grouping
<div className="
  flex items-center gap-4
  rounded-2xl bg-white/80 backdrop-blur-lg
  shadow-lg hover:shadow-xl
  transition-all duration-300
">

// Bad - unorganized classes
<div className="gap-4 backdrop-blur-lg transition-all flex rounded-2xl bg-white/80 shadow-lg items-center hover:shadow-xl duration-300">
```

### State Management
- ✅ Local state with useState for component-specific data
- ✅ Context API for widget-wide state (theme, tenant config)
- ✅ Derived state over duplicated state
```typescript
// Good - single source of truth
const [messages, setMessages] = useState<Message[]>([]);
const unreadCount = messages.filter(m => !m.read).length; // derived

// Bad - duplicated state
const [messages, setMessages] = useState<Message[]>([]);
const [unreadCount, setUnreadCount] = useState(0); // will get out of sync
```

---

## 2. Backend API

### Project Structure
```
src/
├── routes/          # API route definitions
├── controllers/     # Request handlers
├── services/        # Business logic
├── models/          # Database models
├── middleware/      # Express middleware
├── utils/           # Helper functions
└── types/           # TypeScript types
```

### Naming Conventions
- ✅ **Files**: kebab-case (`chat-messages.ts`, `tenant-config.ts`)
- ✅ **Classes**: PascalCase (`TenantService`, `ChatController`)
- ✅ **Functions**: camelCase (`getTenantConfig`, `sendMessage`)
- ✅ **Constants**: SCREAMING_SNAKE_CASE (`MAX_MESSAGE_LENGTH`, `API_VERSION`)
- ✅ **Interfaces/Types**: PascalCase with descriptive names (`ChatMessageDTO`, `TenantConfig`)

```typescript
// Good
export const MAX_MESSAGES_PER_REQUEST = 50;

export interface TenantConfigDTO {
  tenantId: string;
  widgetTheme: WidgetTheme;
  allowedDomains: string[];
}

export class TenantService {
  async getTenantConfig(tenantId: string): Promise<TenantConfigDTO> {
    // implementation
  }
}

// Bad
export const maxMessages = 50; // Should be SCREAMING_SNAKE_CASE
export interface tenantConfig { /* ... */ } // Should be PascalCase
export class tenant_service { /* ... */ } // Should be PascalCase
```

### Route Organization
- ✅ RESTful conventions strictly followed
- ✅ Versioned API paths (`/api/v1/...`)
- ✅ Grouped by resource, not by operation
- ❌ NO duplicate route handlers - extract common logic to middleware

```typescript
// Good - RESTful organization
// routes/chat-messages.ts
router.get('/api/v1/tenants/:tenantId/messages', getMessages);
router.post('/api/v1/tenants/:tenantId/messages', createMessage);
router.patch('/api/v1/tenants/:tenantId/messages/:messageId', updateMessage);
router.delete('/api/v1/tenants/:tenantId/messages/:messageId', deleteMessage);

// Bad - non-RESTful, duplicated logic
router.get('/api/v1/get-messages/:tenantId', async (req, res) => {
  // inline logic repeated in multiple routes
  const tenantId = req.params.tenantId;
  if (!tenantId) return res.status(400).json({ error: 'Missing tenant' });
  // ... more logic
});
router.get('/api/v1/get-all-messages/:tenantId', async (req, res) => {
  // same validation repeated
  const tenantId = req.params.tenantId;
  if (!tenantId) return res.status(400).json({ error: 'Missing tenant' });
  // ... similar logic
});
```

### Error Handling
- ✅ Centralized error handling middleware
- ✅ Custom error classes for different error types
- ✅ Consistent error response format
- ❌ NO silent failures or empty catch blocks

```typescript
// Good - Custom error classes
export class TenantNotFoundError extends Error {
  statusCode = 404;
  constructor(tenantId: string) {
    super(`Tenant ${tenantId} not found`);
    this.name = 'TenantNotFoundError';
  }
}

export class ValidationError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Centralized error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  const statusCode = 'statusCode' in error ? error.statusCode : 500;
  res.status(statusCode).json({
    error: error.message,
    code: error.name,
    timestamp: new Date().toISOString(),
  });
});

// Bad - inconsistent error handling
try {
  // logic
} catch (error) {
  res.json({ msg: 'error' }); // Inconsistent format
}

try {
  // logic
} catch (error) {
  res.status(500).send('Something went wrong'); // Different format
}

try {
  // logic  
} catch (error) {
  // Silent failure - very bad!
}
```

### Standardized API Responses
- ✅ Consistent response structure for all endpoints
- ✅ Include metadata (pagination, timestamps) when relevant

```typescript
// Good - Consistent success response
interface ApiResponse<T> {
  data: T;
  meta?: {
    timestamp: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

res.json({
  data: messages,
  meta: {
    timestamp: new Date().toISOString(),
    pagination: { page: 1, limit: 50, total: 234 }
  }
});

// Good - Consistent error response
interface ApiError {
  error: string;
  code: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

res.status(400).json({
  error: 'Validation failed',
  code: 'VALIDATION_ERROR',
  timestamp: new Date().toISOString(),
  details: { field: 'tenantId', reason: 'Required' }
});

// Bad - inconsistent formats
res.json({ messages }); // Sometimes just data
res.json({ success: true, result: messages }); // Different structure
res.json({ data: messages, success: true }); // Mixed patterns
```

### Environment Variables
- ✅ All config from environment variables
- ✅ Validated at startup, not at runtime
- ✅ Use dotenv only in development
- ✅ Type-safe config object

```typescript
// Good - config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  ALLOWED_ORIGINS: z.string().transform(s => s.split(',')),
});

export const env = envSchema.parse(process.env);

// Usage
const server = app.listen(env.PORT);

// Bad - reading process.env directly everywhere
app.listen(process.env.PORT || 3000); // No validation
const secret = process.env.JWT_SECRET; // Might be undefined
```

---

## 3. Docker & Infrastructure

### Docker Compose Structure
- ✅ Services clearly named and organized
- ✅ Environment variables in .env file, not hardcoded
- ✅ Health checks for all services
- ✅ Explicit dependencies between services

```yaml
# Good - docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - NODE_ENV=production
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "${BACKEND_PORT}:3000"

volumes:
  postgres_data:

# Bad - hardcoded values, no health checks
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: password123  # Hardcoded!
  app:
    build: .
    ports:
      - "3000:3000"  # Hardcoded!
    # No depends_on, services may start in wrong order
```

### Environment Variables in Docker
- ✅ Use .env file for local development
- ✅ Use secrets for production
- ✅ Never commit .env to git
- ✅ Provide .env.example with dummy values

```bash
# .env.example
DATABASE_URL=postgresql://user:password@localhost:5432/chtq
JWT_SECRET=your-secret-key-min-32-characters
ALLOWED_ORIGINS=http://localhost:3000,https://chtq.ink
BACKEND_PORT=3000
```

### Dockerfile Best Practices
- ✅ Multi-stage builds to minimize image size
- ✅ Non-root user for security
- ✅ .dockerignore to exclude unnecessary files
- ✅ Cache-friendly layer ordering

```dockerfile
# Good - multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
USER nodejs
EXPOSE 3000
CMD ["node", "dist/index.js"]

# Bad - single stage, runs as root
FROM node:20
WORKDIR /app
COPY . .
RUN npm install  # Includes dev dependencies
CMD ["npm", "start"]
```

---

## 4. Database (PostgreSQL)

### Schema Design
- ✅ Use snake_case for table and column names
- ✅ Explicit foreign keys with ON DELETE/UPDATE clauses
- ✅ Created_at, updated_at timestamps on all tables
- ✅ Indexes on frequently queried columns
- ✅ Tenant isolation through tenant_id column

```sql
-- Good
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('user', 'agent', 'bot')),
  message_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_tenant_created ON chat_messages(tenant_id, created_at DESC);

-- Bad - inconsistent naming, no constraints
CREATE TABLE ChatMessages (  -- PascalCase in SQL is bad
  id serial PRIMARY KEY,
  tenantID int,  -- camelCase, no foreign key
  senderType text,  -- no constraints
  messageText text,
  createdAt timestamp  -- camelCase, no timezone
);
```

### Query Standards
- ✅ Use parameterized queries (prevent SQL injection)
- ✅ Explicit column names, not SELECT *
- ✅ Consistent indentation and formatting
- ✅ CTEs (WITH clauses) for complex queries

```sql
-- Good - parameterized, explicit columns
SELECT 
  m.id,
  m.message_text,
  m.sender_type,
  m.created_at,
  t.name AS tenant_name
FROM chat_messages m
INNER JOIN tenants t ON m.tenant_id = t.id
WHERE 
  m.tenant_id = $1 
  AND m.created_at > $2
ORDER BY m.created_at DESC
LIMIT $3;

-- Good - CTE for complex query
WITH recent_messages AS (
  SELECT 
    tenant_id,
    COUNT(*) as message_count
  FROM chat_messages
  WHERE created_at > NOW() - INTERVAL '24 hours'
  GROUP BY tenant_id
)
SELECT 
  t.name,
  COALESCE(rm.message_count, 0) as messages_24h
FROM tenants t
LEFT JOIN recent_messages rm ON t.id = rm.tenant_id
ORDER BY messages_24h DESC;

-- Bad - vulnerable to injection, unclear
SELECT * FROM chat_messages 
WHERE tenant_id = '" + tenantId + "' 
ORDER BY createdAt;  -- SQL injection risk!
```

### Migrations
- ✅ Sequential numbering (001_initial, 002_add_index, etc.)
- ✅ Both up and down migrations
- ✅ Idempotent migrations (safe to run multiple times)

```sql
-- migrations/002_add_chat_sessions.up.sql
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  visitor_id VARCHAR(255) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_tenant_visitor 
  ON chat_sessions(tenant_id, visitor_id);

-- migrations/002_add_chat_sessions.down.sql
DROP INDEX IF EXISTS idx_chat_sessions_tenant_visitor;
DROP TABLE IF EXISTS chat_sessions;
```

---

## General Code Quality Standards

### Comments
- ✅ Explain WHY, not WHAT (code should be self-explanatory)
- ✅ Complex algorithms and business logic need comments
- ✅ JSDoc for public APIs and exported functions
- ❌ Remove commented-out code (use git history instead)
- ❌ No TODO comments in production code

```typescript
// Good - explains why
// Use exponential backoff to avoid overwhelming the server during outages
async function retryWithBackoff(fn: () => Promise<void>, maxAttempts = 3) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}

/**
 * Validates tenant access based on domain whitelist
 * @throws {TenantNotFoundError} If tenant doesn't exist
 * @throws {ValidationError} If domain not whitelisted
 */
export async function validateTenantAccess(tenantId: string, origin: string) {
  // implementation
}

// Bad - obvious comments, commented code
function getTenant(id) {
  // Get tenant by id  // Useless comment - function name already says this
  return db.query('SELECT * FROM tenants WHERE id = $1', [id]);
}

// const oldImplementation = () => { /* ... */ };  // Delete this!
// TODO: refactor this later  // Fix it now or create a ticket
```

### Logging
- ✅ Structured logging (JSON format)
- ✅ Include request ID for tracing
- ✅ Different log levels (debug, info, warn, error)
- ❌ NO console.log in production code

```typescript
// Good - structured logging
import { logger } from './utils/logger.js';

logger.info('Tenant created', {
  tenantId: tenant.id,
  requestId: req.id,
  userId: req.user.id
});

logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
  requestId: req.id
});

// Bad - console.log
console.log('tenant created:', tenant);  // Remove all console.logs
console.log(error);  // Unhelpful in production
```

### Security
- ✅ Input validation on all API endpoints
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (sanitize user input)
- ✅ CSRF protection for state-changing operations
- ✅ Rate limiting on public endpoints
- ✅ Secrets in environment variables, never in code

```typescript
// Good - validated input
import { z } from 'zod';

const createMessageSchema = z.object({
  tenantId: z.string().uuid(),
  message: z.string().min(1).max(5000),
  senderType: z.enum(['user', 'agent', 'bot'])
});

app.post('/api/v1/messages', async (req, res) => {
  const data = createMessageSchema.parse(req.body); // Throws if invalid
  // Safe to use data.message, data.tenantId, etc.
});

// Bad - no validation
app.post('/api/v1/messages', async (req, res) => {
  const { message, tenantId } = req.body; // Could be anything!
  await db.query(`INSERT INTO messages VALUES ('${tenantId}', '${message}')`); // SQL injection!
});
```

---

## Testing Standards
- ✅ Unit tests for business logic
- ✅ Integration tests for API endpoints
- ✅ Test file naming: `*.test.ts` or `*.spec.ts`
- ✅ Descriptive test names: `it('should reject invalid tenant ID')`
- ✅ AAA pattern: Arrange, Act, Assert

```typescript
// Good test structure
describe('TenantService', () => {
  describe('getTenantConfig', () => {
    it('should return tenant config for valid tenant ID', async () => {
      // Arrange
      const tenantId = 'valid-uuid';
      const expectedConfig = { theme: 'dark', domain: 'example.com' };
      
      // Act
      const result = await tenantService.getTenantConfig(tenantId);
      
      // Assert
      expect(result).toEqual(expectedConfig);
    });

    it('should throw TenantNotFoundError for non-existent tenant', async () => {
      // Arrange
      const tenantId = 'non-existent-uuid';
      
      // Act & Assert
      await expect(tenantService.getTenantConfig(tenantId))
        .rejects
        .toThrow(TenantNotFoundError);
    });
  });
});
```

---

## Ukrainian Language Context
- ✅ Ukrainian comments welcome for complex business logic
- ✅ API response messages can be Ukrainian (i18n layer)
- ✅ Variable names and code must remain English
- ✅ Documentation can be bilingual (EN/UK)


## Code Simplifier Instructions

When simplifying code for this project:
1. **Preserve all functionality** - never change what code does
2. **Apply these standards** strictly - this is the project's "law"
3. **Remove defensive coding** in internal functions (keep only at boundaries)
4. **Eliminate nested ternaries** - always use if/else or switch
5. **Standardize error responses** - use the ApiResponse/ApiError format
6. **Clean up imports** - group and sort as specified
7. **Remove console.logs** - replace with structured logging
8. **Fix naming** - enforce conventions (camelCase, PascalCase, etc.)
9. **DRY up duplicated logic** - extract to shared functions
10. **Simplify complex conditionals** - use early returns, guard clauses

### Priority Order
1. Security issues (SQL injection, XSS, exposed secrets)
2. Functionality-breaking bugs
3. Error handling consistency
4. Code duplication removal
5. Naming conventions
6. Import organization
7. Comment cleanup
8. Formatting and style

```