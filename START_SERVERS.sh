#!/bin/bash
# Скрипт для запуска всех серверов

echo "🚀 Запуск серверов Luch-Znaniy..."

# 1. Проверка PostgreSQL
if ! docker ps | grep -q luch-znaniy-db; then
    echo "📦 Запуск PostgreSQL..."
    docker start luch-znaniy-db 2>/dev/null || \
    docker run -d --name luch-znaniy-db \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=luch_znaniy \
        -p 5432:5432 \
        postgres:15-alpine
    sleep 3
fi

# 2. Проверка/применение миграций
echo "🗄️ Применение миграций БД..."
npm run db:push

# 3. Запуск Backend сервера
echo "🔧 Запуск Backend сервера на порту 5000..."
# Убиваем старые процессы
lsof -ti:5000 | xargs kill -9 2>/dev/null
sleep 1

# Запускаем в фоне
npm run server:dev > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo "   PID сервера: $SERVER_PID"

# Ждем запуска
sleep 5

# Проверка
if curl -s http://localhost:5000/ -I | grep -q "200 OK"; then
    echo "   ✅ Backend сервер запущен"
else
    echo "   ❌ Backend сервер не отвечает"
    tail -20 /tmp/server.log
    exit 1
fi

# 4. Проверка публичного URL
CODESPACE_URL="https://$CODESPACE_NAME-5000.$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN"
echo ""
echo "📡 Backend доступен по адресу:"
echo "   Локально: http://localhost:5000"
echo "   Публично: $CODESPACE_URL"
echo ""

# Проверка публичного доступа
if curl -s -o /dev/null -w "%{http_code}" "$CODESPACE_URL/" | grep -q "200\|404"; then
    echo "   ✅ Публичный URL доступен"
else
    echo "   ⚠️ Публичный URL недоступен (порт может быть приватным)"
    echo "   💡 Откройте VS Code Ports панель и сделайте порт 5000 Public"
fi

echo ""
echo "5️⃣ Теперь запустите Expo в новом терминале:"
echo "   npx expo start --tunnel"
echo ""
echo "📱 Или используйте QR код для подключения"
