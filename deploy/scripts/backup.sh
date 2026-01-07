#!/bin/bash
# ============================================
# CHTQ Database Backup Script
# ============================================
# Usage: ./backup.sh [backup_name]
# 
# Backups are saved to /opt/chtq/backups/
# Retention: Last 7 daily + last 4 weekly backups
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-/opt/chtq/backups}"
CONTAINER_NAME="chtq-postgres"
RETENTION_DAYS=7
RETENTION_WEEKS=4

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday

# Backup filename
if [ -n "$1" ]; then
    BACKUP_NAME="$1"
else
    BACKUP_NAME="chtq_backup_${TIMESTAMP}"
fi

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  CHTQ Database Backup${NC}"
echo -e "${BLUE}============================================${NC}"

# Load environment variables
if [ -f "$DEPLOY_DIR/.env" ]; then
    source "$DEPLOY_DIR/.env"
else
    echo -e "${RED}ERROR: .env file not found!${NC}"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR/daily"
mkdir -p "$BACKUP_DIR/weekly"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}ERROR: PostgreSQL container is not running!${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Creating backup: ${BACKUP_NAME}${NC}"

# Create backup
BACKUP_FILE="${BACKUP_DIR}/daily/${BACKUP_NAME}.sql.gz"

docker exec ${CONTAINER_NAME} pg_dump \
    -U ${POSTGRES_USER} \
    -d ${POSTGRES_DB} \
    --no-owner \
    --no-acl \
    | gzip > "${BACKUP_FILE}"

# Check backup was created
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}ERROR: Backup file was not created!${NC}"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}✅ Daily backup created: ${BACKUP_FILE} (${BACKUP_SIZE})${NC}"

# Create weekly backup on Sundays
if [ "$DAY_OF_WEEK" -eq 7 ]; then
    WEEKLY_FILE="${BACKUP_DIR}/weekly/chtq_weekly_$(date +%Y%m%d).sql.gz"
    cp "$BACKUP_FILE" "$WEEKLY_FILE"
    echo -e "${GREEN}✅ Weekly backup created: ${WEEKLY_FILE}${NC}"
fi

# Cleanup old daily backups (keep last N days)
echo -e "${BLUE}🧹 Cleaning up old daily backups (keeping last ${RETENTION_DAYS} days)...${NC}"
find "${BACKUP_DIR}/daily" -name "*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

# Cleanup old weekly backups (keep last N weeks)
echo -e "${BLUE}🧹 Cleaning up old weekly backups (keeping last ${RETENTION_WEEKS} weeks)...${NC}"
find "${BACKUP_DIR}/weekly" -name "*.sql.gz" -type f -mtime +$((RETENTION_WEEKS * 7)) -delete 2>/dev/null || true

# Show backup summary
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Backup Complete${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Daily backups:"
ls -lh "${BACKUP_DIR}/daily/" 2>/dev/null | tail -5 || echo "  (none)"
echo ""
echo "Weekly backups:"
ls -lh "${BACKUP_DIR}/weekly/" 2>/dev/null | tail -5 || echo "  (none)"
echo ""
echo -e "${YELLOW}💡 To restore, use: ./restore.sh <backup_file>${NC}"
