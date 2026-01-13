# 🚀 Quick Start Guide

## Schnellstart für lokalen Test-Server

### Option 1: Automatisches Setup (empfohlen)

```bash
./start-dev.sh
```

Das Script:
- Erstellt automatisch eine `.env.local` Datei falls nicht vorhanden
- Installiert Dependencies
- Generiert Prisma Client
- Startet den Development Server

### Option 2: Manuell

```bash
# 1. Dependencies installieren
npm install

# 2. Prisma Client generieren
npx prisma generate

# 3. .env.local erstellen (siehe SETUP.md)
# Mindestens benötigt:
# - DATABASE_URL (PostgreSQL)
# - NEXTAUTH_URL="http://localhost:3000"
# - NEXTAUTH_SECRET (generiere mit: openssl rand -base64 32)
# - ANTHROPIC_API_KEY

# 4. Datenbank-Schema pushen
npx prisma db push

# 5. Server starten
npm run dev
```

## Minimale .env.local für Tests

```env
DATABASE_URL="postgresql://user:password@localhost:5432/heyapply"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dein-geheimer-schlüssel-hier"
ANTHROPIC_API_KEY="dein-anthropic-key"
```

**Hinweis**: Ohne Supabase/Stripe/Resend funktionieren einige Features nicht, aber die Kernfunktionalität (CV-Generierung, Chat) sollte funktionieren.

## Server starten

Nach dem Setup:

```bash
npm run dev
```

Öffne dann: **http://localhost:3000**

## Erste Schritte

1. **Registrieren**: Erstelle einen Account
2. **Profil**: Fülle dein Profil aus oder lade einen CV hoch
3. **Bewerbung**: Erstelle eine neue Bewerbung mit einem Job-Link
4. **Generieren**: Lass CV und Anschreiben generieren

## Troubleshooting

- **Port bereits belegt?** Ändere den Port: `PORT=3001 npm run dev`
- **Datenbank-Fehler?** Prüfe DATABASE_URL in .env.local
- **Prisma-Fehler?** Führe aus: `npx prisma generate && npx prisma db push`

