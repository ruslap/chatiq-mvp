#!/bin/bash
# ============================================
# Перевірка Redis на VPS
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Перевірка Redis${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# 1. Перевірка чи контейнер запущений
echo -e "${BLUE}1. Статус контейнера:${NC}"
if docker ps --format '{{.Names}}' | grep -q "^chtq-redis$"; then
    echo -e "${GREEN}✅ Контейнер chtq-redis запущений${NC}"
else
    echo -e "${RED}❌ Контейнер chtq-redis НЕ запущений${NC}"
    docker ps -a | grep redis || echo "Контейнер не знайдено"
    exit 1
fi

# 2. Health check
echo ""
echo -e "${BLUE}2. Health check:${NC}"
HEALTH=$(docker inspect --format='{{.State.Health.Status}}' chtq-redis 2>/dev/null || echo "no-healthcheck")
if [ "$HEALTH" = "healthy" ]; then
    echo -e "${GREEN}✅ Health check: healthy${NC}"
elif [ "$HEALTH" = "no-healthcheck" ]; then
    echo -e "${YELLOW}⚠️  Health check не налаштований${NC}"
else
    echo -e "${RED}❌ Health check: $HEALTH${NC}"
fi

# 3. PING тест
echo ""
echo -e "${BLUE}3. PING тест:${NC}"
if docker exec chtq-redis redis-cli ping | grep -q "PONG"; then
    echo -e "${GREEN}✅ Redis відповідає на PING${NC}"
else
    echo -e "${RED}❌ Redis НЕ відповідає${NC}"
    exit 1
fi

# 4. Інформація про Redis
echo ""
echo -e "${BLUE}4. Інформація про Redis:${NC}"
docker exec chtq-redis redis-cli INFO server | grep -E "redis_version|uptime_in_seconds|process_id"

# 5. Перевірка пам'яті
echo ""
echo -e "${BLUE}5. Використання пам'яті:${NC}"
docker exec chtq-redis redis-cli INFO memory | grep -E "used_memory_human|maxmemory_human|maxmemory_policy"

# 6. Перевірка persistence (AOF)
echo ""
echo -e "${BLUE}6. Persistence (AOF):${NC}"
docker exec chtq-redis redis-cli INFO persistence | grep -E "aof_enabled|aof_current_size"

# 7. Тест запису/читання
echo ""
echo -e "${BLUE}7. Тест запису/читання:${NC}"
docker exec chtq-redis redis-cli SET test_key "Hello from CHTQ" > /dev/null
RESULT=$(docker exec chtq-redis redis-cli GET test_key)
if [ "$RESULT" = "Hello from CHTQ" ]; then
    echo -e "${GREEN}✅ Запис/читання працює${NC}"
    docker exec chtq-redis redis-cli DEL test_key > /dev/null
else
    echo -e "${RED}❌ Помилка запису/читання${NC}"
fi

# 8. Перевірка підключення з API сервера
echo ""
echo -e "${BLUE}8. Підключення з API сервера:${NC}"
if docker exec chtq-api sh -c 'nc -zv redis 6379' 2>&1 | grep -q "succeeded"; then
    echo -e "${GREEN}✅ API сервер може підключитись до Redis${NC}"
else
    echo -e "${YELLOW}⚠️  Не вдалося перевірити підключення (nc може бути відсутнім)${NC}"
fi

# 9. Логи Redis
echo ""
echo -e "${BLUE}9. Останні логи Redis:${NC}"
docker logs chtq-redis --tail 10

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Перевірка завершена!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}Корисні команди:${NC}"
echo "  docker logs chtq-redis -f          # Дивитись логи в реальному часі"
echo "  docker exec -it chtq-redis redis-cli   # Підключитись до Redis CLI"
echo "  docker stats chtq-redis            # Моніторинг ресурсів"
