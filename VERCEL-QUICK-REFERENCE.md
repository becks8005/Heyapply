# ⚡ Vercel Quick Reference

Schnelle Referenz für häufige Vercel-Aufgaben.

## 🔗 Wichtige Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Domain-Verwaltung:** Settings → Domains
- **Umgebungsvariablen:** Settings → Environment Variables
- **Deployments:** Deployments Tab
- **DNS Checker:** https://dnschecker.org

## 📝 Häufige Befehle

### Vercel CLI (falls installiert)

```bash
# Login
vercel login

# Projekt verbinden
vercel

# Production Deployment
vercel --prod

# Umgebungsvariable hinzufügen
vercel env add VARIABLE_NAME production
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
```

## 🌐 DNS-Konfiguration

### CNAME (meistens)
- **Typ:** CNAME
- **Name:** `app`
- **Wert:** Von Vercel angegeben (z.B. `cname.vercel-dns.com`)
- **TTL:** 3600

### A-Record (falls Vercel IP zeigt)
- **Typ:** A
- **Name:** `app`
- **Wert:** IP-Adresse von Vercel
- **TTL:** 3600

## 🚀 Deployment

### Neues Deployment starten
1. Vercel Dashboard → Deployments
2. Klicke auf neuestes Deployment
3. Klicke auf **Redeploy**

### Nach Umgebungsvariablen-Änderung
- **WICHTIG:** Immer neues Deployment starten!
- Umgebungsvariablen werden nur bei neuem Deployment geladen

## 🔍 Troubleshooting

### Domain lädt nicht
1. DNS-Propagierung prüfen: https://dnschecker.org
2. Domain-Status in Vercel prüfen
3. Deployment-Status prüfen

### SSL-Fehler
1. Warte 10-15 Minuten nach DNS-Propagierung
2. Prüfe Domain-Status in Vercel
3. Domain löschen und erneut hinzufügen

### Build-Fehler
1. Build Logs in Vercel prüfen
2. Umgebungsvariablen prüfen
3. Lokal testen: `npm run build`

### Authentifizierung funktioniert nicht
1. `NEXTAUTH_URL` prüfen (muss `https://app.heyapply.ch` sein)
2. `NEXTAUTH_SECRET` prüfen
3. Neues Deployment nach Änderung starten

## 📚 Vollständige Dokumentation

- **Komplette Anleitung:** [VERCEL-COMPLETE-SETUP.md](./VERCEL-COMPLETE-SETUP.md)
- **Checkliste:** [VERCEL-CHECKLIST.md](./VERCEL-CHECKLIST.md)
- **Domain-Setup:** [VERCEL-DOMAIN-SETUP.md](./VERCEL-DOMAIN-SETUP.md)
