# ✅ Netlify Setup Checkliste

Verwende diese Checkliste, um sicherzustellen, dass alle Schritte für das Netlify-Setup abgeschlossen sind.

## Phase 1: Netlify Account & Projekt

- [ ] Netlify Account erstellt (netlify.com)
- [ ] Mit GitHub/GitLab/Bitbucket verbunden
- [ ] Projekt auf Netlify importiert/verbunden
- [ ] Projekt-Name konfiguriert: `heyapply`
- [ ] Build Command: `npm run build`
- [ ] Publish Directory: `.next`

## Phase 2: Umgebungsvariablen

### Erforderlich
- [ ] `DATABASE_URL` gesetzt (PostgreSQL-Verbindung)
- [ ] `NEXTAUTH_URL` gesetzt (vorerst temporäre URL, später `https://app.heyapply.ch`)
- [ ] `NEXTAUTH_SECRET` gesetzt (mit `openssl rand -base64 32` generiert)
- [ ] `ANTHROPIC_API_KEY` gesetzt

### Wichtig
- [ ] `NEXT_PUBLIC_SUPABASE_URL` gesetzt (falls verwendet)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` gesetzt (falls verwendet)
- [ ] `RESEND_API_KEY` gesetzt (falls verwendet)
- [ ] `EMAIL_FROM` gesetzt (falls verwendet)
- [ ] `CRON_SECRET` gesetzt (für externe Cron Jobs)

### Optional
- [ ] `STRIPE_SECRET_KEY` gesetzt (falls verwendet)
- [ ] `STRIPE_PUBLIC_KEY` gesetzt (falls verwendet)
- [ ] `STRIPE_WEBHOOK_SECRET` gesetzt (falls verwendet)
- [ ] `STRIPE_PRICE_BASIS` gesetzt (falls verwendet)
- [ ] `STRIPE_PRICE_PRO` gesetzt (falls verwendet)
- [ ] `LINKEDIN_CLIENT_ID` gesetzt (falls verwendet)
- [ ] `LINKEDIN_CLIENT_SECRET` gesetzt (falls verwendet)

### Scope-Auswahl
- [ ] Alle Variablen für **Production** aktiviert
- [ ] Alle Variablen für **Deploy previews** aktiviert (empfohlen)

## Phase 3: Erstes Deployment

- [ ] Erstes Deployment gestartet
- [ ] Deployment erfolgreich abgeschlossen
- [ ] App lädt auf `*.netlify.app` URL
- [ ] Keine kritischen Build-Fehler
- [ ] `@netlify/plugin-nextjs` ist installiert

## Phase 4: Domain-Konfiguration

- [ ] Domain `app.heyapply.ch` in Netlify hinzugefügt
- [ ] DNS-Werte von Netlify notiert (CNAME)
- [ ] Bei GoDaddy eingeloggt
- [ ] DNS-Verwaltung für `heyapply.ch` geöffnet
- [ ] DNS-Record hinzugefügt:
  - [ ] Typ: CNAME
  - [ ] Name: `app`
  - [ ] Wert: Von Netlify angegebener Wert (z.B. `heyapply-xyz.netlify.app`)
  - [ ] TTL: 3600
- [ ] DNS-Record gespeichert
- [ ] Alte/konfliktierende Records entfernt (falls vorhanden)

## Phase 5: DNS-Propagierung & SSL

- [ ] DNS-Propagierung geprüft ([dnschecker.org](https://dnschecker.org))
- [ ] Domain-Status in Netlify: **SSL certificate active**
- [ ] SSL-Zertifikat automatisch ausgestellt
- [ ] SSL-Status: Gültig (grünes Schloss im Browser)

## Phase 6: Cron Jobs

- [ ] Externer Cron Service gewählt (z.B. cron-job.org)
- [ ] Account beim Cron Service erstellt
- [ ] Cron Job konfiguriert:
  - [ ] URL: `https://app.heyapply.ch/api/job-search/cron`
  - [ ] Schedule: `0 9 * * *` (täglich um 9:00 UTC)
  - [ ] Method: GET
  - [ ] Authorization Header: `Bearer CRON_SECRET`
- [ ] Cron Job getestet

## Phase 7: Finale Konfiguration

- [ ] `NEXTAUTH_URL` auf `https://app.heyapply.ch` aktualisiert
- [ ] Neues Deployment nach `NEXTAUTH_URL`-Änderung gestartet
- [ ] Deployment erfolgreich abgeschlossen

## Phase 8: Tests

- [ ] Domain `https://app.heyapply.ch` lädt im Browser
- [ ] SSL-Zertifikat ist gültig (grünes Schloss)
- [ ] Registrierung funktioniert
- [ ] Login funktioniert
- [ ] E-Mails kommen an (falls Resend konfiguriert)
- [ ] Datenbank-Verbindung funktioniert
- [ ] CV-Generierung funktioniert (falls Anthropic konfiguriert)
- [ ] API-Endpoints funktionieren
- [ ] Cron Job wurde erfolgreich ausgeführt

## Troubleshooting

Falls etwas nicht funktioniert:

- [ ] Deploy Logs in Netlify geprüft
- [ ] Domain-Status in Netlify geprüft
- [ ] DNS-Propagierung geprüft
- [ ] Umgebungsvariablen nochmals geprüft
- [ ] Neues Deployment gestartet
- [ ] `@netlify/plugin-nextjs` installiert

## ✅ Fertig!

Wenn alle Punkte abgehakt sind, sollte deine App über `https://app.heyapply.ch` erreichbar sein!

---

**Hilfe:** Siehe [NETLIFY-COMPLETE-SETUP.md](./NETLIFY-COMPLETE-SETUP.md) für detaillierte Anweisungen.
