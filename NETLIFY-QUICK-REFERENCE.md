# ⚡ Netlify Quick Reference

Schnelle Referenz für häufige Netlify-Aufgaben.

## 🔗 Wichtige Links

- **Netlify Dashboard:** https://app.netlify.com
- **Domain-Verwaltung:** Site settings → Domain management
- **Umgebungsvariablen:** Site configuration → Environment variables
- **Deployments:** Deploys Tab
- **DNS Checker:** https://dnschecker.org
- **Cron Service:** https://cron-job.org

## 📝 Häufige Befehle

### Netlify CLI (falls installiert)

```bash
# Login
netlify login

# Projekt verbinden
netlify init

# Production Deployment
netlify deploy --prod

# Umgebungsvariable hinzufügen
netlify env:set VARIABLE_NAME "value" --context production
```

### NEXTAUTH_SECRET generieren

```bash
openssl rand -base64 32
```

## 🔧 Umgebungsvariablen (Production)

### Erforderlich
```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://app.heyapply.ch
NEXTAUTH_SECRET=<generiert-mit-openssl>
ANTHROPIC_API_KEY=sk-ant-...
```

### Wichtig
```env
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
EMAIL_FROM=Heyapply <noreply@heyapply.ch>
CRON_SECRET=<generiert-mit-openssl>
```

## 🌐 DNS-Konfiguration

### CNAME (Standard bei Netlify)
- **Typ:** CNAME
- **Name:** `app`
- **Wert:** Von Netlify angegeben (z.B. `heyapply-xyz.netlify.app`)
- **TTL:** 3600

## 🚀 Deployment

### Neues Deployment starten
1. Netlify Dashboard → Deploys
2. Klicke auf **Trigger deploy** → **Deploy site**

### Nach Umgebungsvariablen-Änderung
- **WICHTIG:** Immer neues Deployment starten!
- Umgebungsvariablen werden nur bei neuem Deployment geladen

## ⏰ Cron Jobs

### Externer Service (empfohlen)

**cron-job.org Setup:**
- URL: `https://app.heyapply.ch/api/job-search/cron`
- Schedule: `0 9 * * *` (täglich um 9:00 UTC)
- Method: GET
- Headers: `Authorization: Bearer DEIN_CRON_SECRET`

## 🔍 Troubleshooting

### Domain lädt nicht
1. DNS-Propagierung prüfen: https://dnschecker.org
2. Domain-Status in Netlify prüfen
3. Deployment-Status prüfen

### SSL-Fehler
1. Warte 10-15 Minuten nach DNS-Propagierung
2. Prüfe Domain-Status in Netlify
3. Domain löschen und erneut hinzufügen

### Build-Fehler
1. Deploy Logs in Netlify prüfen
2. Umgebungsvariablen prüfen
3. Lokal testen: `npm run build`
4. Stelle sicher, dass `@netlify/plugin-nextjs` installiert ist

### Authentifizierung funktioniert nicht
1. `NEXTAUTH_URL` prüfen (muss `https://app.heyapply.ch` sein)
2. `NEXTAUTH_SECRET` prüfen
3. Neues Deployment nach Änderung starten

### Next.js Plugin fehlt
```bash
npm install @netlify/plugin-nextjs
```

## 📚 Vollständige Dokumentation

- **Komplette Anleitung:** [NETLIFY-COMPLETE-SETUP.md](./NETLIFY-COMPLETE-SETUP.md)
- **Checkliste:** [NETLIFY-CHECKLIST.md](./NETLIFY-CHECKLIST.md)
- **Alternativen:** [DEPLOYMENT-ALTERNATIVES.md](./DEPLOYMENT-ALTERNATIVES.md)
