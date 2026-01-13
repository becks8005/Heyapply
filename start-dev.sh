#!/bin/bash

# Heyapply Development Server Starter

echo "🚀 Starte Heyapply Development Server..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  Keine .env.local Datei gefunden!"
    echo ""
    echo "Erstelle eine minimale .env.local Datei..."
    echo ""
    cat > .env.local << 'EOF'
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/heyapply?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Anthropic (Claude AI) - ERFORDERLICH
ANTHROPIC_API_KEY="dein-api-key-hier"

# Stripe (optional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLIC_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_BASIS="price_..."
STRIPE_PRICE_PRO="price_..."

# Supabase (optional, für File Storage)
NEXT_PUBLIC_SUPABASE_URL="https://dein-projekt.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="dein-service-role-key"

# Resend (optional, für E-Mails)
RESEND_API_KEY="re_..."
EMAIL_FROM="Heyapply <noreply@heyapply.ch>"

# LinkedIn OAuth (optional)
LINKEDIN_CLIENT_ID="dein_linkedin_client_id"
LINKEDIN_CLIENT_SECRET="dein_linkedin_client_secret"

# Tunnel (für öffentliche URL - optional)
TUNNEL_SUBDOMAIN="heyapply-test"
EOF
    echo "✅ .env.local wurde erstellt!"
    echo ""
    echo "⚠️  WICHTIG: Bitte bearbeite .env.local und füge deine API-Keys ein!"
    echo "   Mindestens benötigt: DATABASE_URL und ANTHROPIC_API_KEY"
    echo ""
    read -p "Drücke Enter zum Fortfahren..."
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installiere Dependencies..."
    npm install
fi

# Generate Prisma Client
echo "🔧 Generiere Prisma Client..."
npx prisma generate

# Start dev server
echo ""
echo "🌟 Starte Development Server auf http://localhost:3000"
echo ""
npm run dev

