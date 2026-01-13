#!/bin/bash

# Heyapply Database Starter
# Startet PostgreSQL mit Docker

echo "🐘 Starte PostgreSQL Datenbank..."
echo ""

# Check if Docker Desktop is installed
if [ ! -d "/Applications/Docker.app" ]; then
    echo "❌ Docker Desktop ist nicht installiert!"
    echo ""
    echo "📥 Installiere Docker Desktop:"
    echo "   1. Gehe zu: https://www.docker.com/products/docker-desktop"
    echo "   2. Lade Docker Desktop für Mac herunter"
    echo "   3. Installiere und starte Docker Desktop"
    echo "   4. Führe dieses Skript erneut aus"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker läuft nicht!"
    echo ""
    echo "🚀 Starte Docker Desktop..."
    open -a Docker
    echo ""
    echo "⏳ Warte auf Docker Desktop..."
    echo "   (Dies kann einige Sekunden dauern)"
    
    # Wait up to 60 seconds for Docker to start
    for i in {1..60}; do
        if docker info > /dev/null 2>&1; then
            echo "✅ Docker ist bereit!"
            break
        fi
        sleep 1
        if [ $((i % 5)) -eq 0 ]; then
            echo "   Warte noch... ($i/60)"
        fi
    done
    
    if ! docker info > /dev/null 2>&1; then
        echo ""
        echo "❌ Docker konnte nicht gestartet werden."
        echo "   Bitte starte Docker Desktop manuell und versuche es erneut."
        exit 1
    fi
fi

# Start database
echo "📦 Starte PostgreSQL Container..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Warte auf Datenbank..."
sleep 5

# Check if database is ready
until docker-compose exec -T postgres pg_isready -U heyapply > /dev/null 2>&1; do
    echo "   Warte noch..."
    sleep 2
done

echo "✅ Datenbank ist bereit!"
echo ""
echo "📝 Nächste Schritte:"
echo "   1. Stelle sicher, dass deine .env.local folgende DATABASE_URL enthält:"
echo "      DATABASE_URL=\"postgresql://heyapply:heyapply@localhost:5432/heyapply?schema=public\""
echo ""
echo "   2. Pushe das Datenbank-Schema:"
echo "      npx prisma db push"
echo ""
echo "   3. Starte den Development Server:"
echo "      npm run dev"
echo ""
echo "🛑 Datenbank stoppen:"
echo "   docker-compose down"
echo ""

