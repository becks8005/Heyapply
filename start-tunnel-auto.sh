#!/bin/bash

# Heyapply Auto Tunnel - Keine Eingabe nötig!
# Liest die Subdomain aus .env.local und startet automatisch

echo "🌐 Starte automatischen Tunnel für Heyapply..."
echo ""

# Load .env.local if it exists
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | grep TUNNEL_SUBDOMAIN | xargs)
fi

# Default subdomain if not set
SUBDOMAIN=${TUNNEL_SUBDOMAIN:-"heyapply-$(whoami | tr '[:upper:]' '[:lower:]')"}

# Check if dev server is running
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Kein Server auf Port 3000 gefunden!"
    echo ""
    echo "Bitte starte zuerst den Development Server:"
    echo "  npm run dev"
    echo ""
    exit 1
fi

# Check if npx is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx ist nicht verfügbar. Bitte installiere Node.js."
    exit 1
fi

PUBLIC_URL="https://${SUBDOMAIN}.loca.lt"

echo "🚀 Starte Tunnel..."
echo ""
echo "📱 Öffentliche URL: ${PUBLIC_URL}"
echo ""
echo "✅ Diese URL bleibt gleich und kann geteilt werden!"
echo "   - Auf Mobile öffnen"
echo "   - An Freunde weiterleiten"
echo ""
echo "⚠️  WICHTIG: Drücke Ctrl+C zum Beenden des Tunnels"
echo ""

# Save URL to file for easy sharing
echo "${PUBLIC_URL}" > .tunnel-url.txt
echo ""
echo "💡 Die URL wurde auch in .tunnel-url.txt gespeichert"
echo ""

# Start tunnel with fixed subdomain
npx --yes localtunnel --port 3000 --subdomain="$SUBDOMAIN" 2>&1 | tee .tunnel-log.txt
