# Heyapply - Setup-Anleitung

## 1. Umgebungsvariablen einrichten

Erstelle eine `.env.local` Datei im Root-Verzeichnis mit folgenden Variablen:

```env
# Database (PostgreSQL - z.B. Supabase)
DATABASE_URL="postgresql://user:password@localhost:5432/heyapply?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generiere-ein-sicheres-secret-mit-openssl-rand-base64-32"

# Anthropic (Claude AI)
ANTHROPIC_API_KEY="dein-anthropic-api-key"

# Stripe (optional für Zahlungen)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLIC_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_BASIS="price_..."
STRIPE_PRICE_PRO="price_..."

# Supabase (für File Storage)
NEXT_PUBLIC_SUPABASE_URL="https://dein-projekt.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="dein-service-role-key"

# Resend (für E-Mails)
RESEND_API_KEY="re_..."
EMAIL_FROM="Heyapply <noreply@heyapply.ch>"

# LinkedIn OAuth (optional)
LINKEDIN_CLIENT_ID="dein_linkedin_client_id"
LINKEDIN_CLIENT_SECRET="dein_linkedin_client_secret"
```

## 2. Datenbank einrichten

```bash
# Prisma Client generieren
npx prisma generate

# Datenbank-Schema pushen
npx prisma db push
```

## 3. Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung läuft dann auf: http://localhost:3000

## 4. Erste Schritte

1. Registriere einen neuen Account
2. Fülle dein Profil aus (CV hochladen oder manuell eingeben)
3. Erstelle eine neue Bewerbung mit einem Job-Link
4. Lass den CV und das Anschreiben generieren

## Wichtige Hinweise

- **Datenbank**: Du brauchst eine PostgreSQL-Datenbank (z.B. von Supabase)
- **Supabase Storage**: Erstelle zwei Buckets: `cvs` und `profile-images`
- **Stripe**: Für Zahlungen benötigst du Stripe-Account und Price-IDs
- **Anthropic API**: Du brauchst einen API-Key von Anthropic für Claude AI

## Test-Modus

Für Tests ohne externe Services kannst du:
- Dummy-Werte für Stripe verwenden (Zahlungen funktionieren dann nicht)
- LinkedIn OAuth weglassen (nur CV-Upload nutzen)
- Lokale PostgreSQL-Datenbank verwenden

