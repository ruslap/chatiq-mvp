#!/bin/bash

# Тестування автоматичного створення шаблонів для нових користувачів

echo "🧪 Тестування автоматичного створення шаблонів..."
echo ""

# Генеруємо унікальний email для тесту
TIMESTAMP=$(date +%s)
TEST_EMAIL="test_${TIMESTAMP}@example.com"
TEST_PASSWORD="test123456"
TEST_NAME="Test User ${TIMESTAMP}"

echo "📧 Створюємо нового користувача: ${TEST_EMAIL}"
echo ""

# Реєструємо нового користувача
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\",\"name\":\"${TEST_NAME}\"}")

echo "✅ Відповідь реєстрації:"
echo "$REGISTER_RESPONSE" | jq '.'
echo ""

# Витягуємо access_token
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.access_token')

if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Помилка: не вдалося отримати access_token"
  exit 1
fi

echo "🔑 Access Token отримано"
echo ""

# Отримуємо список сайтів
echo "🌐 Перевіряємо створені сайти..."
SITES_RESPONSE=$(curl -s -X GET http://localhost:3000/sites \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

echo "$SITES_RESPONSE" | jq '.'
echo ""

# Витягуємо ID першого сайту
SITE_ID=$(echo "$SITES_RESPONSE" | jq -r '.[0].id')

if [ "$SITE_ID" = "null" ] || [ -z "$SITE_ID" ]; then
  echo "❌ Помилка: сайт не створено автоматично"
  exit 1
fi

echo "✅ Дефолтний сайт створено: ${SITE_ID}"
echo ""

# Перевіряємо швидкі шаблони
echo "📝 Перевіряємо швидкі шаблони..."
TEMPLATES_RESPONSE=$(curl -s -X GET "http://localhost:3000/automation/${SITE_ID}/quick-templates" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

TEMPLATES_COUNT=$(echo "$TEMPLATES_RESPONSE" | jq '. | length')
echo "Знайдено шаблонів: ${TEMPLATES_COUNT}"
echo "$TEMPLATES_RESPONSE" | jq '.'
echo ""

if [ "$TEMPLATES_COUNT" -lt 6 ]; then
  echo "⚠️  Попередження: очікувалось 6 шаблонів, знайдено ${TEMPLATES_COUNT}"
else
  echo "✅ Усі 6 швидких шаблонів створено"
fi
echo ""

# Перевіряємо автовідповіді
echo "🤖 Перевіряємо автовідповіді..."
AUTO_REPLIES_RESPONSE=$(curl -s -X GET "http://localhost:3000/automation/${SITE_ID}/auto-replies" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

AUTO_REPLIES_COUNT=$(echo "$AUTO_REPLIES_RESPONSE" | jq '. | length')
echo "Знайдено автовідповідей: ${AUTO_REPLIES_COUNT}"
echo "$AUTO_REPLIES_RESPONSE" | jq '.'
echo ""

if [ "$AUTO_REPLIES_COUNT" -lt 4 ]; then
  echo "⚠️  Попередження: очікувалось 4 автовідповіді, знайдено ${AUTO_REPLIES_COUNT}"
else
  echo "✅ Усі 4 автовідповіді створено"
fi
echo ""

# Підсумок
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 ПІДСУМОК ТЕСТУВАННЯ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Користувач створено: ${TEST_EMAIL}"
echo "✅ Дефолтний сайт створено: ${SITE_ID}"
echo "📝 Швидких шаблонів: ${TEMPLATES_COUNT}/6"
echo "🤖 Автовідповідей: ${AUTO_REPLIES_COUNT}/4"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$TEMPLATES_COUNT" -ge 6 ] && [ "$AUTO_REPLIES_COUNT" -ge 4 ]; then
  echo "🎉 Тест пройдено успішно!"
  exit 0
else
  echo "⚠️  Тест пройдено з попередженнями"
  exit 1
fi
