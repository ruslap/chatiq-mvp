#!/bin/bash
# ============================================
# CHTQ VPS Deployment Script
# ============================================
# Usage: ./deploy.sh [--build]
#   --build    Force rebuild of Docker images
# ============================================

set -e

# Track start time
START_TIME=$(date +%s)

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
    echo -e "${YELLOW}🔨 Build flag enabled - rebuilding images without cache${NC}"
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

# Step 5: Wait for health checks with retry
echo -e "${BLUE}⏳ Waiting for services to become healthy...${NC}"
MAX_RETRIES=12
RETRY_INTERVAL=5

check_service() {
    local name=$1
    local url=$2
    local host_header=$3
    for i in $(seq 1 $MAX_RETRIES); do
        if curl -s -o /dev/null -w "%{http_code}" "$url" --header "Host: $host_header" -m 5 | grep -q "200\|301\|302"; then
            echo -e "${GREEN}✅ ${name}: OK${NC}"
            return 0
        fi
        sleep $RETRY_INTERVAL
    done
    echo -e "${YELLOW}⚠️ ${name}: not healthy after $((MAX_RETRIES * RETRY_INTERVAL))s — check logs with 'docker compose logs'${NC}"
    return 1
}

# Step 6: Show status
echo -e "${BLUE}📋 Container status:${NC}"
docker compose ps

# Step 7: Verify health
echo -e "${BLUE}🔍 Verifying services...${NC}"
check_service "API Server" "http://localhost:3000" "api.chtq.ink"
check_service "Admin Panel" "http://localhost:3000" "admin.chtq.ink"
check_service "Widget CDN" "http://localhost:3000/widget.js" "cdn.chtq.ink"

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
echo ""

# Calculate and display execution time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
echo -e "${BLUE}⏱️  Total deployment time: ${YELLOW}${DURATION}s${NC}"
