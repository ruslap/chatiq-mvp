#!/bin/bash
# ============================================
# CHTQ Database Restore Script
# ============================================
# Usage: ./restore.sh <backup_file>
# 
# Example:
#   ./restore.sh /opt/chtq/backups/daily/chtq_backup_20260107_120000.sql.gz
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
CONTAINER_NAME="chtq-postgres"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  CHTQ Database Restore${NC}"
echo -e "${BLUE}============================================${NC}"

# Check arguments
if [ -z "$1" ]; then
    echo -e "${RED}ERROR: No backup file specified!${NC}"
    echo ""
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh /opt/chtq/backups/daily/ 2>/dev/null | tail -10 || echo "  No daily backups found"
    ls -lh /opt/chtq/backups/weekly/ 2>/dev/null | tail -5 || echo "  No weekly backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}ERROR: Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

# Load environment variables
if [ -f "$DEPLOY_DIR/.env" ]; then
    source "$DEPLOY_DIR/.env"
else
    echo -e "${RED}ERROR: .env file not found!${NC}"
    exit 1
fi

# Warning
echo ""
echo -e "${RED}⚠️  WARNING: This will OVERWRITE all data in the database!${NC}"
echo -e "${YELLOW}Backup file: ${BACKUP_FILE}${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Restore cancelled.${NC}"
    exit 0
fi

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}ERROR: PostgreSQL container is not running!${NC}"
    exit 1
fi

# Stop application containers to prevent writes during restore
echo -e "${BLUE}🛑 Stopping application containers...${NC}"
cd "$DEPLOY_DIR"
docker compose stop api-server admin-panel || true

# Create a backup before restore
echo -e "${BLUE}📦 Creating pre-restore backup...${NC}"
PRE_RESTORE_BACKUP="/opt/chtq/backups/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
docker exec ${CONTAINER_NAME} pg_dump \
    -U ${POSTGRES_USER} \
    -d ${POSTGRES_DB} \
    --no-owner \
    --no-acl \
    | gzip > "${PRE_RESTORE_BACKUP}"
echo -e "${GREEN}✅ Pre-restore backup saved to: ${PRE_RESTORE_BACKUP}${NC}"

# Drop and recreate database
echo -e "${BLUE}🗑️  Dropping existing database...${NC}"
docker exec ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};"
docker exec ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -c "CREATE DATABASE ${POSTGRES_DB};"

# Restore from backup
echo -e "${BLUE}📥 Restoring from backup...${NC}"
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker exec -i ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}
else
    cat "$BACKUP_FILE" | docker exec -i ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}
fi

echo -e "${GREEN}✅ Database restored successfully!${NC}"

# Restart application containers
echo -e "${BLUE}🔄 Restarting application containers...${NC}"
docker compose start api-server admin-panel

# Wait for health checks
echo -e "${BLUE}⏳ Waiting for services to become healthy...${NC}"
sleep 15

# Verify
echo -e "${BLUE}🔍 Verifying services...${NC}"
docker compose ps

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Restore Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}💡 Pre-restore backup saved to: ${PRE_RESTORE_BACKUP}${NC}"
echo -e "${YELLOW}   If something went wrong, you can restore from this backup.${NC}"
