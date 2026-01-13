#!/bin/bash

# Vercel Environment Variables Checker
# Prüft, welche Umgebungsvariablen für Vercel benötigt werden

echo "🔍 Vercel Environment Variables Checker"
echo "========================================"
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Prüfe ob .env.local existiert
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  Keine .env.local Datei gefunden${NC}"
    echo ""
else
    echo -e "${GREEN}✅ .env.local gefunden${NC}"
    echo ""
fi

echo "📋 Benötigte Umgebungsvariablen für Vercel:"
echo ""

# Erforderliche Variablen
echo -e "${RED}🔴 ERFORDERLICH:${NC}"
echo "  - DATABASE_URL"
echo "  - NEXTAUTH_URL (sollte https://app.heyapply.ch sein)"
echo "  - NEXTAUTH_SECRET"
echo "  - ANTHROPIC_API_KEY"
echo ""

# Wichtige Variablen
echo -e "${YELLOW}🟡 WICHTIG (für vollständige Funktionalität):${NC}"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - RESEND_API_KEY"
echo "  - EMAIL_FROM"
echo ""

# Optionale Variablen
echo -e "${GREEN}🟢 OPTIONAL (für erweiterte Features):${NC}"
echo "  - STRIPE_SECRET_KEY"
echo "  - STRIPE_PUBLIC_KEY"
echo "  - STRIPE_WEBHOOK_SECRET"
echo "  - STRIPE_PRICE_BASIS"
echo "  - STRIPE_PRICE_PRO"
echo "  - LINKEDIN_CLIENT_ID"
echo "  - LINKEDIN_CLIENT_SECRET"
echo ""

echo "📝 NEXTAUTH_SECRET generieren:"
echo "   openssl rand -base64 32"
echo ""

echo "📖 Vollständige Anleitung:"
echo "   Siehe VERCEL-COMPLETE-SETUP.md"
echo ""
