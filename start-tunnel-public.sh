#!/bin/bash

# Heyapply Tunnel Starter - ngrok mit fester URL
# Erstellt eine öffentliche URL für deine lokale Heyapply-Instanz
# Diese URL bleibt gleich und kann an Freunde weitergegeben werden

echo "🌐 Starte ngrok Tunnel für Heyapply..."
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

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "⚠️  ngrok ist nicht installiert!"
    echo ""
    echo "Installiere ngrok..."
    echo ""
    
    # Detect OS and install
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            echo "📦 Installiere ngrok mit Homebrew..."
            brew install ngrok/ngrok/ngrok
        else
            echo "📦 Installiere ngrok über npx (temporär)..."
            echo ""
            echo "Für eine permanente Installation:"
            echo "1. Erstelle einen kostenlosen Account: https://dashboard.ngrok.com/signup"
            echo "2. Installiere ngrok: https://ngrok.com/download"
            echo "3. Oder: brew install ngrok/ngrok/ngrok (mit Homebrew)"
            echo ""
            echo "Verwende jetzt npx für diese Session..."
            USE_NPX=true
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "📦 Installiere ngrok für Linux..."
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
        sudo apt update && sudo apt install ngrok
    else
        echo "❌ Unbekanntes Betriebssystem."
        echo "Bitte installiere ngrok manuell: https://ngrok.com/download"
        exit 1
    fi
fi

# Check for ngrok auth token
if [ -z "$NGROK_AUTHTOKEN" ]; then
    if [ -f ~/.ngrok2/ngrok.yml ] || [ -f ~/Library/Application\ Support/ngrok/ngrok.yml ]; then
        echo "✅ ngrok Konfiguration gefunden"
    else
        echo ""
        echo "🔑 ngrok Authentifizierung erforderlich!"
        echo ""
        echo "Für eine feste URL brauchst du einen kostenlosen ngrok Account:"
        echo "1. Gehe zu: https://dashboard.ngrok.com/signup"
        echo "2. Erstelle einen kostenlosen Account"
        echo "3. Kopiere deinen Authtoken von: https://dashboard.ngrok.com/get-started/your-authtoken"
        echo ""
        read -p "Füge deinen ngrok Authtoken ein (oder Enter für temporäre URL): " authtoken
        
        if [ ! -z "$authtoken" ]; then
            if command -v ngrok &> /dev/null; then
                ngrok config add-authtoken "$authtoken"
            elif [ "$USE_NPX" = true ]; then
                npx --yes ngrok config add-authtoken "$authtoken"
            fi
            echo "✅ Authtoken gespeichert!"
        else
            echo "⚠️  Ohne Authtoken bekommst du eine temporäre URL (ändert sich bei jedem Start)"
        fi
    fi
fi

echo ""
echo "🚀 Starte Tunnel zu http://localhost:3000"
echo ""

# Ask for subdomain if authtoken is set
if [ -f ~/.ngrok2/ngrok.yml ] || [ -f ~/Library/Application\ Support/ngrok/ngrok.yml ]; then
    echo "💡 Tipp: Mit einem ngrok Account kannst du eine feste Subdomain reservieren"
    echo "   z.B. 'heyapply-test' -> https://heyapply-test.ngrok-free.app"
    echo ""
    read -p "Gib eine Subdomain ein (leer lassen für zufällige URL): " subdomain
    
    if [ ! -z "$subdomain" ]; then
        echo ""
        echo "📱 Öffentliche URL: https://${subdomain}.ngrok-free.app"
        echo "   Diese URL bleibt gleich und kann an Freunde weitergegeben werden!"
        echo ""
        echo "⚠️  WICHTIG: Drücke Ctrl+C zum Beenden des Tunnels"
        echo ""
        
        if command -v ngrok &> /dev/null; then
            ngrok http 3000 --subdomain="$subdomain" --domain="${subdomain}.ngrok-free.app" 2>/dev/null || ngrok http 3000 --subdomain="$subdomain"
        else
            npx --yes ngrok http 3000 --subdomain="$subdomain" --domain="${subdomain}.ngrok-free.app" 2>/dev/null || npx --yes ngrok http 3000 --subdomain="$subdomain"
        fi
    else
        echo "📱 Eine zufällige URL wird generiert..."
        echo "   Diese ändert sich bei jedem Neustart"
        echo ""
        echo "⚠️  WICHTIG: Drücke Ctrl+C zum Beenden des Tunnels"
        echo ""
        
        if command -v ngrok &> /dev/null; then
            ngrok http 3000
        else
            npx --yes ngrok http 3000
        fi
    fi
else
    echo "📱 Eine temporäre URL wird generiert..."
    echo "   Diese ändert sich bei jedem Neustart"
    echo ""
    echo "💡 Für eine feste URL: Erstelle einen ngrok Account und verwende --subdomain"
    echo ""
    echo "⚠️  WICHTIG: Drücke Ctrl+C zum Beenden des Tunnels"
    echo ""
    
    if command -v ngrok &> /dev/null; then
        ngrok http 3000
    else
        npx --yes ngrok http 3000
    fi
fi
