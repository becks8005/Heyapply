#!/bin/bash

# Heyapply - Startet Server + Tunnel automatisch
# Perfekt für Mobile/Freunde - keine Eingabe nötig!

echo "🚀 Starte Heyapply mit automatischem Tunnel..."
echo ""

# Load .env.local if it exists
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | grep TUNNEL_SUBDOMAIN | xargs)
fi

# Default subdomain if not set
SUBDOMAIN=${TUNNEL_SUBDOMAIN:-"heyapply-$(whoami | tr '[:upper:]' '[:lower:]')"}
PUBLIC_URL="https://${SUBDOMAIN}.loca.lt"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  Keine .env.local Datei gefunden!"
    echo "   Erstelle eine minimale .env.local Datei..."
    ./start-dev.sh
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installiere Dependencies..."
    npm install
fi

# Generate Prisma Client
echo "🔧 Generiere Prisma Client..."
npx prisma generate > /dev/null 2>&1

# Start dev server in background
echo ""
echo "🌟 Starte Development Server..."
npm run dev > /dev/null 2>&1 &
DEV_PID=$!

# Wait for server to be ready
echo "⏳ Warte auf Server..."
for i in {1..30}; do
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        break
    fi
    sleep 1
done

if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ Server konnte nicht gestartet werden"
    kill $DEV_PID 2>/dev/null
    exit 1
fi

echo "✅ Server läuft!"
echo ""

# Start tunnel
echo "🌐 Starte Tunnel..."
echo ""
echo "📱 ÖFFENTLICHE URL: ${PUBLIC_URL}"
echo ""
echo "✅ Diese URL kannst du:"
echo "   - Auf deinem Mobile öffnen"
echo "   - An Freunde weiterleiten"
echo "   - Von überall verwenden"
echo ""
echo "💡 Die URL wurde in .tunnel-url.txt gespeichert"
echo "${PUBLIC_URL}" > .tunnel-url.txt
echo ""
echo "⚠️  WICHTIG: Drücke Ctrl+C zum Beenden (stoppt Server + Tunnel)"
echo ""

# Trap Ctrl+C to cleanup
trap "echo ''; echo '🛑 Stoppe Server und Tunnel...'; kill $DEV_PID 2>/dev/null; exit" INT

# Start tunnel (foreground)
npx --yes localtunnel --port 3000 --subdomain="$SUBDOMAIN"
