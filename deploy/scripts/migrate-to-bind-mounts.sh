#!/bin/bash
# ============================================
# Міграція з Named Volumes на Bind Mounts
# ============================================
# Виконувати на VPS ПЕРЕД оновленням docker-compose.yml
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Міграція даних на Bind Mounts${NC}"
echo -e "${BLUE}============================================${NC}"

# Перевірка чи є старі volumes
if ! docker volume ls | grep -q "deploy_postgres_data"; then
    echo -e "${YELLOW}Named volume 'deploy_postgres_data' не знайдено.${NC}"
    echo -e "${GREEN}Це новий деплой - міграція не потрібна!${NC}"
    exit 0
fi

echo -e "${YELLOW}⚠️  Знайдено старі named volumes. Починаємо міграцію...${NC}"

# Створити директорії для bind mounts
mkdir -p ./data/postgres
mkdir -p ./data/redis
mkdir -p ./data/uploads

# Зупинити контейнери
echo -e "${BLUE}🛑 Зупиняємо контейнери...${NC}"
docker compose down

# Копіювати PostgreSQL дані
echo -e "${BLUE}📦 Копіюємо PostgreSQL дані...${NC}"
docker run --rm \
    -v deploy_postgres_data:/source \
    -v "$(pwd)/data/postgres:/target" \
    alpine sh -c "cp -av /source/. /target/"

# Копіювати uploads (якщо є)
if docker volume ls | grep -q "deploy_api_uploads"; then
    echo -e "${BLUE}📦 Копіюємо uploads...${NC}"
    docker run --rm \
        -v deploy_api_uploads:/source \
        -v "$(pwd)/data/uploads:/target" \
        alpine sh -c "cp -av /source/. /target/"
fi

# Встановити правильні права доступу
echo -e "${BLUE}🔒 Встановлюємо права доступу...${NC}"
sudo chown -R 999:999 ./data/postgres  # PostgreSQL user ID
sudo chown -R 1000:1000 ./data/redis
sudo chown -R 1000:1000 ./data/uploads

echo ""
echo -e "${GREEN}✅ Міграція завершена!${NC}"
echo ""
echo -e "${YELLOW}Наступні кроки:${NC}"
echo "1. git pull  # Отримати оновлений docker-compose.yml"
echo "2. docker compose up -d --build"
echo ""
echo -e "${BLUE}Старі volumes можна видалити після перевірки:${NC}"
echo "docker volume rm deploy_postgres_data deploy_api_uploads"
