# ============================================
# CHTQ Widget CDN (NGINX Static) Dockerfile
# Builds TypeScript widget via Vite, serves static assets
# ============================================

# Stage 1: Build widget from TypeScript sources
FROM node:20-alpine AS builder
WORKDIR /app

COPY widget-cdn/package*.json ./
RUN npm ci && npm cache clean --force

COPY widget-cdn/ ./
RUN npm run build

# Stage 2: Serve with NGINX
FROM nginx:1.25-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Create custom nginx config for CDN
RUN cat > /etc/nginx/conf.d/cdn.conf << 'EOF'
server {
    listen 3002;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # CORS headers for widget embedding
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept" always;
    
    # Cache control for static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*" always;
        
        # Handle OPTIONS preflight
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, OPTIONS";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Length 0;
            add_header Content-Type "text/plain charset=UTF-8";
            return 204;
        }
    }
    
    # widget.js specific - shorter cache for updates
    location = /widget.js {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
        add_header Access-Control-Allow-Origin "*" always;
    }
    
    # Health check endpoint
    location = /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
    
    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
}
EOF

# Copy public assets (index.html, test pages, icons, etc.)
COPY widget-cdn/public/ /usr/share/nginx/html/

# Copy Vite-built widget.js over the legacy public/widget.js
COPY --from=builder /app/dist/widget.js /usr/share/nginx/html/widget.js

# Create non-root user (nginx runs as nginx user by default in alpine)
RUN chown -R nginx:nginx /usr/share/nginx/html

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:3002/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
