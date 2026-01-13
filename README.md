# Heyapply - AI-Powered Job Application SaaS

Ein vollständiges SaaS-Tool für die automatisierte Erstellung von CVs und Anschreiben basierend auf Stelleninseraten.

## Features

- ✅ Benutzer-Authentifizierung (Register, Login, Email-Verifizierung, Passwort vergessen)
- ✅ Profil mit CV-Upload (PDF, DOCX, PPTX), LinkedIn-Integration und Profilbild-Cropping
- ✅ Chat-basierte Bewerbungsgenerierung mit Claude AI
- ✅ Editierbare CV- und Anschreiben-Artefakte (WYSIWYG)
- ✅ PDF-Export
- ✅ Ordner-System für Bewerbungen
- ✅ Subscription-Tiers mit Stripe (Free/Basis/Pro)
- ✅ Usage-Tracking und Limits

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), Tailwind CSS, shadcn/ui, Zustand
- **Backend:** Next.js API Routes, Prisma, PostgreSQL (Supabase)
- **Authentication:** NextAuth.js v5
- **AI:** Anthropic Claude API
- **Payments:** Stripe
- **Storage:** Supabase Storage
- **Email:** Resend

## Setup

1. **Dependencies installieren:**
   ```bash
   npm install
   ```

2. **Umgebungsvariablen konfigurieren:**
   ```bash
   cp .env.example .env.local
   ```
   
   Fülle alle erforderlichen Variablen in `.env.local` aus.

3. **Datenbank einrichten:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```

5. Öffne [http://localhost:3000](http://localhost:3000) im Browser.

## 🌐 Öffentliche URL für Mobile & Freunde

**Einfachste Lösung - Keine Terminal-Eingabe nötig!**

### Alles automatisch starten (empfohlen)

```bash
npm run start:tunnel
```

**Das macht automatisch:**
- ✅ Startet Server + Tunnel
- ✅ Erstellt eine feste URL (bleibt gleich!)
- ✅ Speichert URL in `.tunnel-url.txt`
- ✅ **Keine Eingabe nötig!**

Die URL kannst du dann:
- 📱 Auf deinem Mobile öffnen
- 👥 An Freunde weiterleiten
- 💻 Von überall verwenden

### Feste URL konfigurieren

Füge in `.env.local` hinzu:
```env
TUNNEL_SUBDOMAIN="heyapply-test"
```

Dann ist die URL immer: `https://heyapply-test.loca.lt`

### Weitere Optionen

- **Nur Tunnel** (wenn Server schon läuft): `npm run tunnel:auto`
- **Mit Eingabe**: `npm run tunnel`
- **Mit ngrok**: `npm run tunnel:public`

📖 **Detaillierte Anleitung:** Siehe [TUNNEL-SETUP.md](./TUNNEL-SETUP.md)

**Wichtig:**
- Die URL ist nur für dich/Freunde gedacht - nicht für Kunden!
- Die URL bleibt gleich bei jedem Neustart (mit fester Subdomain)
- Der Tunnel läuft nur, solange das Terminal offen ist

## 🌍 Production Domain Setup

Für die Production-Umgebung mit der Domain `app.heyapply.ch`:

### 🚀 Start hier!

**📖 [VERCEL-START-HIER.md](./VERCEL-START-HIER.md)** - Übersicht und Einstiegspunkt

### 📚 Dokumentation

**Für Anfänger (noch nie Vercel verwendet):**
📖 **[VERCEL-COMPLETE-SETUP.md](./VERCEL-COMPLETE-SETUP.md)** ⭐ **STARTE HIER!** - Detaillierte Anleitung von Anfang bis Ende

**Checkliste verwenden:**
✅ **[VERCEL-CHECKLIST.md](./VERCEL-CHECKLIST.md)** - Schritt-für-Schritt Checkliste

**Schnelle Referenz:**
⚡ **[VERCEL-QUICK-REFERENCE.md](./VERCEL-QUICK-REFERENCE.md)** - Häufige Befehle und Links

**Für Fortgeschrittene (nur Domain-Konfiguration):**
📖 **[VERCEL-DOMAIN-SETUP.md](./VERCEL-DOMAIN-SETUP.md)** - Schnelle Anleitung für Domain-Setup

### Kurze Zusammenfassung

1. Vercel Account erstellen und Projekt verbinden
2. Umgebungsvariablen in Vercel konfigurieren
3. Erstes Deployment durchführen
4. Domain `app.heyapply.ch` in Vercel hinzufügen
5. DNS-Record bei GoDaddy konfigurieren (CNAME oder A-Record)
6. `NEXTAUTH_URL` in Vercel auf `https://app.heyapply.ch` setzen
7. Neues Deployment starten

**Die vollständige Schritt-für-Schritt-Anleitung:** [VERCEL-COMPLETE-SETUP.md](./VERCEL-COMPLETE-SETUP.md)

## Projektstruktur

```
heyapply/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth Pages
│   ├── (dashboard)/       # Dashboard Pages
│   └── api/               # API Routes
├── components/            # React Components
│   ├── ui/               # shadcn/ui Components
│   ├── auth/             # Auth Components
│   ├── layout/           # Layout Components
│   └── ...
├── lib/                   # Utilities & Configs
├── stores/               # Zustand Stores
├── prisma/               # Prisma Schema
└── ...
```

## Wichtige Hinweise

- Alle Texte sind auf Schweizer Deutsch
- Währung: CHF
- Datumsformat: DD.MM.YYYY
- IMMER Doppel-S statt ß
- NIEMALS em-dashes (—)

## License

Proprietary - Alle Rechte vorbehalten

