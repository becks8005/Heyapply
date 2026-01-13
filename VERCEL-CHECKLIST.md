# ✅ Vercel Setup Checkliste

Verwende diese Checkliste, um sicherzustellen, dass alle Schritte für das Vercel-Setup abgeschlossen sind.

## Phase 1: Vercel Account & Projekt

- [ ] Vercel Account erstellt (vercel.com)
- [ ] Mit GitHub/GitLab/Bitbucket verbunden
- [ ] Projekt auf Vercel importiert/verbunden
- [ ] Projekt-Name konfiguriert: `heyapply`
- [ ] Framework Preset: Next.js (automatisch erkannt)

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

### Optional
- [ ] `STRIPE_SECRET_KEY` gesetzt (falls verwendet)
- [ ] `STRIPE_PUBLIC_KEY` gesetzt (falls verwendet)
- [ ] `STRIPE_WEBHOOK_SECRET` gesetzt (falls verwendet)
- [ ] `STRIPE_PRICE_BASIS` gesetzt (falls verwendet)
- [ ] `STRIPE_PRICE_PRO` gesetzt (falls verwendet)
- [ ] `LINKEDIN_CLIENT_ID` gesetzt (falls verwendet)
- [ ] `LINKEDIN_CLIENT_SECRET` gesetzt (falls verwendet)

### Environment-Auswahl
- [ ] Alle Variablen für **Production** aktiviert
- [ ] Alle Variablen für **Preview** aktiviert (empfohlen)

## Phase 3: Erstes Deployment

- [ ] Erstes Deployment gestartet
- [ ] Deployment erfolgreich abgeschlossen
- [ ] App lädt auf `*.vercel.app` URL
- [ ] Keine kritischen Build-Fehler

## Phase 4: Domain-Konfiguration

- [ ] Domain `app.heyapply.ch` in Vercel hinzugefügt
- [ ] DNS-Werte von Vercel notiert (CNAME oder A-Record)
- [ ] Bei GoDaddy eingeloggt
- [ ] DNS-Verwaltung für `heyapply.ch` geöffnet
- [ ] DNS-Record hinzugefügt:
  - [ ] Typ: CNAME oder A (je nach Vercel-Anweisung)
  - [ ] Name: `app`
  - [ ] Wert: Von Vercel angegebener Wert
  - [ ] TTL: 3600
- [ ] DNS-Record gespeichert
- [ ] Alte/konfliktierende Records entfernt (falls vorhanden)

## Phase 5: DNS-Propagierung & SSL

- [ ] DNS-Propagierung geprüft ([dnschecker.org](https://dnschecker.org))
- [ ] Domain-Status in Vercel: **Valid** oder **Configured**
- [ ] SSL-Zertifikat automatisch ausgestellt
- [ ] SSL-Status: Gültig (grünes Schloss im Browser)

## Phase 6: Finale Konfiguration

- [ ] `NEXTAUTH_URL` auf `https://app.heyapply.ch` aktualisiert
- [ ] Neues Deployment nach `NEXTAUTH_URL`-Änderung gestartet
- [ ] Deployment erfolgreich abgeschlossen

## Phase 7: Tests

- [ ] Domain `https://app.heyapply.ch` lädt im Browser
- [ ] SSL-Zertifikat ist gültig (grünes Schloss)
- [ ] Registrierung funktioniert
- [ ] Login funktioniert
- [ ] E-Mails kommen an (falls Resend konfiguriert)
- [ ] Datenbank-Verbindung funktioniert
- [ ] CV-Generierung funktioniert (falls Anthropic konfiguriert)

## Troubleshooting

Falls etwas nicht funktioniert:

- [ ] Build Logs in Vercel geprüft
- [ ] Domain-Status in Vercel geprüft
- [ ] DNS-Propagierung geprüft
- [ ] Umgebungsvariablen nochmals geprüft
- [ ] Neues Deployment gestartet

## ✅ Fertig!

Wenn alle Punkte abgehakt sind, sollte deine App über `https://app.heyapply.ch` erreichbar sein!

---

**Hilfe:** Siehe [VERCEL-COMPLETE-SETUP.md](./VERCEL-COMPLETE-SETUP.md) für detaillierte Anweisungen.
