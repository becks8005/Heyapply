#!/bin/bash

# Heyapply Tunnel Starter - LocalTunnel
# Erstellt eine öffentliche URL für deine lokale Heyapply-Instanz

echo "🌐 Starte LocalTunnel für Heyapply..."
echo ""

# Check if dev server is running
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Kein Server auf Port 3000 gefunden!"
    echo ""
    echo "Bitte starte zuerst den Development Server:"
    echo "  npm run dev"
    echo ""
    echo "Oder in einem anderen Terminal:"
    echo "  ./start-dev.sh"
    echo ""
    read -p "Drücke Enter, wenn der Server läuft, oder Ctrl+C zum Abbrechen..."
fi

# Check if localtunnel is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx ist nicht verfügbar. Bitte installiere Node.js."
    exit 1
fi

echo ""
echo "🚀 Starte Tunnel zu http://localhost:3000"
echo ""
echo "📱 Die öffentliche URL wird in wenigen Sekunden angezeigt..."
echo "   Du kannst diese URL von überall verwenden (Mobile, anderer Laptop, etc.)"
echo ""
echo "⚠️  WICHTIG: Diese URL ist nur für dich gedacht - nicht für Kunden!"
echo "   Drücke Ctrl+C zum Beenden des Tunnels"
echo ""

# Ask for subdomain
echo "💡 Tipp: Du kannst eine feste Subdomain angeben (z.B. 'heyapply-test')"
echo "   Dann bleibt die URL gleich: https://heyapply-test.loca.lt"
echo ""
read -p "Gib eine Subdomain ein (leer lassen für zufällige URL): " subdomain

if [ ! -z "$subdomain" ]; then
    echo ""
    echo "📱 Öffentliche URL: https://${subdomain}.loca.lt"
    echo "   Diese URL bleibt gleich und kann an Freunde weitergegeben werden!"
    echo ""
    echo "⚠️  WICHTIG: Drücke Ctrl+C zum Beenden des Tunnels"
    echo ""
    npx --yes localtunnel --port 3000 --subdomain="$subdomain"
else
    echo ""
    echo "📱 Eine zufällige URL wird generiert..."
    echo "   Diese ändert sich bei jedem Neustart"
    echo ""
    echo "⚠️  WICHTIG: Drücke Ctrl+C zum Beenden des Tunnels"
    echo ""
    npx --yes localtunnel --port 3000
fi
