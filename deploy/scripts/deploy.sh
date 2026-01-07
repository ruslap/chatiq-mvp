#!/bin/bash
# ============================================
# CHTQ VPS Deployment Script
# ============================================
# Usage: ./deploy.sh [--build]
#   --build    Force rebuild of Docker images
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  CHTQ Deployment Script${NC}"
echo -e "${BLUE}============================================${NC}"

# Check if .env exists
if [ ! -f "$DEPLOY_DIR/.env" ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    echo -e "${YELLOW}Copy .env.example to .env and configure it:${NC}"
    echo "  cp $DEPLOY_DIR/.env.example $DEPLOY_DIR/.env"
    exit 1
fi

cd "$DEPLOY_DIR"

# Parse arguments
BUILD_FLAG=""
UP_FLAG=""
if [ "$1" == "--build" ]; then
    BUILD_FLAG="--no-cache"
    UP_FLAG="--build"
    echo -e "${YELLOW}🔨 Build flag enabled - rebuilding all images without cache${NC}"
fi

# Step 1: Pull latest code (if in git repo)
if [ -d "$DEPLOY_DIR/../.git" ]; then
    echo -e "${BLUE}📥 Pulling latest code...${NC}"
    cd "$DEPLOY_DIR/.."
    git pull origin main || echo -e "${YELLOW}⚠️ Git pull skipped (not on main or no remote)${NC}"
    cd "$DEPLOY_DIR"
fi

# Step 2: Build images
echo -e "${BLUE}🔨 Building Docker images...${NC}"
docker compose build $BUILD_FLAG

# Step 3: Run database migrations
echo -e "${BLUE}📊 Running database migrations...${NC}"
docker compose run --rm api-server npx prisma migrate deploy

# Step 4: Start/restart containers
echo -e "${BLUE}🚀 Starting containers...${NC}"
docker compose up -d --remove-orphans $UP_FLAG

# Step 5: Wait for health checks
echo -e "${BLUE}⏳ Waiting for services to become healthy...${NC}"
sleep 10

# Step 6: Show status
echo -e "${BLUE}📋 Container status:${NC}"
docker compose ps

# Step 7: Verify health
echo -e "${BLUE}🔍 Verifying services...${NC}"

# Check API
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --header "Host: api.chtq.ink" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ API Server: OK${NC}"
else
    echo -e "${YELLOW}⚠️ API Server: Check logs with 'docker compose logs api-server'${NC}"
fi

# Check Admin
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --header "Host: admin.chtq.ink" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ Admin Panel: OK${NC}"
else
    echo -e "${YELLOW}⚠️ Admin Panel: Check logs with 'docker compose logs admin-panel'${NC}"
fi

# Check CDN
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/widget.js --header "Host: cdn.chtq.ink" | grep -q "200"; then
    echo -e "${GREEN}✅ Widget CDN: OK${NC}"
else
    echo -e "${YELLOW}⚠️ Widget CDN: Check logs with 'docker compose logs widget-cdn'${NC}"
fi

# Cleanup old images
echo -e "${BLUE}🧹 Cleaning up old images...${NC}"
docker image prune -f

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Deployment complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "🌐 Services available at:"
echo -e "   API:    https://api.chtq.ink"
echo -e "   Admin:  https://admin.chtq.ink"
echo -e "   Widget: https://cdn.chtq.ink/widget.js"
echo ""
echo -e "📋 Useful commands:"
echo -e "   docker compose logs -f          # View logs"
echo -e "   docker compose ps               # Container status"
echo -e "   docker compose restart          # Restart all"
echo -e "   ./scripts/backup.sh             # Backup database"
