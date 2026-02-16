# ============================================
# CHTQ API Server (NestJS) Dockerfile
# Multi-stage build for production
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies needed for Prisma
RUN apk add --no-cache libc6-compat openssl

# Copy package files
COPY api-server/package*.json ./
# Copy Prisma schema (needed for postinstall generate)
COPY api-server/prisma ./prisma/

# Install dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies needed for Prisma
RUN apk add --no-cache libc6-compat openssl

# Copy package files and install all dependencies
COPY api-server/package*.json ./
# Copy Prisma schema (needed for postinstall generate)
COPY api-server/prisma ./prisma/

RUN npm ci

# Generate Prisma client (if not already done by postinstall)
# Generate Prisma client handled by postinstall script in npm ci

# Copy source code
COPY api-server/ ./

# Build the application
RUN npm run build \
    && ls -la dist/ \
    && (ls -la dist/main.js || ls -la dist/src/main.js || echo "Warning: main.js not found in expected locations")

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nestjs

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Copy Prisma files for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads

# Set ownership
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Start the application
# Using dist/main without .js to allow for commonjs/module flexibility
CMD ["node", "dist/src/main"]
