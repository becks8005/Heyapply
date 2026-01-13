# 🖥️ Entwicklungsserver - Status

## Server wurde gestartet!

Der Development Server läuft jetzt im Hintergrund.

### Zugriff

**URL**: http://localhost:3000

Öffne diese URL in deinem Browser, um die Anwendung zu testen.

### Wichtige Hinweise

⚠️ **Bevor du die Anwendung nutzen kannst, musst du folgende Schritte durchführen:**

1. **Datenbank einrichten**
   ```bash
   npx prisma db push
   ```

2. **Umgebungsvariablen anpassen**
   - Öffne `.env.local`
   - Setze mindestens:
     - `DATABASE_URL` (deine PostgreSQL-Verbindung)
     - `NEXTAUTH_SECRET` (generiere mit: `openssl rand -base64 32`)
     - `ANTHROPIC_API_KEY` (für CV-Generierung)

3. **Server neu starten** (nach Änderungen an .env.local)
   ```bash
   # Stoppe den aktuellen Server (Ctrl+C) und starte neu:
   npm run dev
   ```

### Server stoppen

Falls der Server im Terminal läuft:
- Drücke `Ctrl+C`

Falls der Server im Hintergrund läuft:
```bash
# Finde den Prozess
lsof -ti:3000

# Stoppe den Prozess
kill $(lsof -ti:3000)
```

### Server neu starten

```bash
npm run dev
```

### Nützliche Befehle

```bash
# Prisma Studio (Datenbank-GUI)
npm run db:studio

# Datenbank-Schema pushen
npx prisma db push

# Prisma Client neu generieren
npx prisma generate

# Build für Production
npm run build
npm start
```

### Troubleshooting

**Port bereits belegt?**
```bash
PORT=3001 npm run dev
```

**Datenbank-Verbindungsfehler?**
- Prüfe `DATABASE_URL` in `.env.local`
- Stelle sicher, dass PostgreSQL läuft
- Prüfe Firewall/Netzwerk-Einstellungen

**Module nicht gefunden?**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Test-Account erstellen

1. Öffne http://localhost:3000
2. Klicke auf "Jetzt registrieren"
3. Fülle das Formular aus
4. **Wichtig**: E-Mail-Verifizierung funktioniert nur mit konfiguriertem Resend

### Features testen

✅ **Ohne externe Services:**
- Registrierung/Login (lokale Datenbank)
- Profil-Management
- Bewerbungen erstellen

❌ **Benötigt externe Services:**
- CV-Generierung (benötigt Anthropic API Key)
- E-Mail-Verifizierung (benötigt Resend)
- File-Upload (benötigt Supabase)
- Zahlungen (benötigt Stripe)

### Nächste Schritte

1. Richte eine PostgreSQL-Datenbank ein (z.B. Supabase)
2. Hole dir einen Anthropic API Key
3. Konfiguriere die `.env.local` Datei
4. Starte den Server neu
5. Teste die Anwendung!

Viel Erfolg! 🚀

