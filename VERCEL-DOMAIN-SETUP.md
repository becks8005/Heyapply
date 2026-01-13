# Vercel Domain Setup - app.heyapply.ch

Diese Anleitung erklärt, wie du die Domain `app.heyapply.ch` für Heyapply auf Vercel einrichtest.

## Voraussetzungen

- ✅ Domain `heyapply.ch` bei GoDaddy erworben
- ✅ Vercel Account vorhanden
- ✅ Projekt bereits auf Vercel deployed

## Schritt 1: Domain in Vercel hinzufügen

1. **Öffne das Vercel Dashboard:**
   - Gehe zu [vercel.com](https://vercel.com)
   - Wähle dein Heyapply-Projekt aus

2. **Navigiere zu Domain-Einstellungen:**
   - Klicke auf **Settings** → **Domains**
   - Oder direkt: `https://vercel.com/[dein-team]/[dein-projekt]/settings/domains`

3. **Domain hinzufügen:**
   - Klicke auf **Add Domain**
   - Gib `app.heyapply.ch` ein
   - Klicke auf **Add**

4. **Domain-Konfiguration:**
   - Vercel zeigt dir die DNS-Einstellungen an, die du bei GoDaddy konfigurieren musst
   - **Wichtig:** Notiere dir die angezeigten DNS-Werte (siehe Schritt 2)

## Schritt 2: DNS-Einstellungen bei GoDaddy konfigurieren

1. **Logge dich bei GoDaddy ein:**
   - Gehe zu [godaddy.ch](https://godaddy.ch)
   - Melde dich mit deinem Account an

2. **DNS-Verwaltung öffnen:**
   - Gehe zu **Meine Produkte** → **Domains**
   - Klicke auf `heyapply.ch`
   - Wähle **DNS** oder **DNS-Verwaltung**

3. **CNAME-Record hinzufügen:**
   - Suche nach dem Abschnitt **Records** oder **DNS-Records**
   - Klicke auf **Hinzufügen** oder **Add Record**
   - Wähle **CNAME** als Typ
   - **Name/Host:** `app`
   - **Wert/Points to:** Der Wert, den Vercel dir angezeigt hat (z.B. `cname.vercel-dns.com` oder ähnlich)
   - **TTL:** 3600 (Standard)
   - Speichere den Record

   **Alternativ:** Wenn Vercel eine A-Record-Konfiguration zeigt:
   - Wähle **A** als Typ
   - **Name/Host:** `app`
   - **Wert/Points to:** Die IP-Adresse, die Vercel dir angezeigt hat
   - **TTL:** 3600

4. **Warte auf DNS-Propagierung:**
   - DNS-Änderungen können 5 Minuten bis 48 Stunden dauern
   - Normalerweise funktioniert es nach 15-30 Minuten

## Schritt 3: SSL-Zertifikat prüfen

1. **In Vercel prüfen:**
   - Gehe zurück zu **Settings** → **Domains** in Vercel
   - Nach erfolgreicher DNS-Konfiguration sollte Vercel automatisch ein SSL-Zertifikat ausstellen
   - Der Status sollte auf **Valid** oder **Configured** stehen

2. **SSL-Zertifikat kann einige Minuten dauern:**
   - Vercel stellt automatisch SSL-Zertifikate über Let's Encrypt aus
   - Dies geschieht automatisch nach erfolgreicher DNS-Verifizierung

## Schritt 4: Umgebungsvariablen aktualisieren

Nach erfolgreicher Domain-Konfiguration musst du die Umgebungsvariablen in Vercel aktualisieren:

1. **In Vercel:**
   - Gehe zu **Settings** → **Environment Variables**
   - Suche nach `NEXTAUTH_URL`
   - Aktualisiere den Wert zu: `https://app.heyapply.ch`
   - Stelle sicher, dass die Variable für **Production** gesetzt ist

2. **Weitere Variablen prüfen:**
   - Falls du `NEXT_PUBLIC_*` Variablen hast, die URLs enthalten, aktualisiere diese ebenfalls
   - Prüfe Stripe Webhook URLs (falls verwendet)
   - Prüfe LinkedIn OAuth Redirect URLs (falls verwendet)

## Schritt 5: Deployment neu starten

1. **Neues Deployment auslösen:**
   - Gehe zu **Deployments** in Vercel
   - Klicke auf das neueste Deployment
   - Klicke auf **Redeploy** (oder pushe einen neuen Commit)

2. **Testen:**
   - Öffne `https://app.heyapply.ch` im Browser
   - Stelle sicher, dass die Seite lädt
   - Prüfe, dass SSL funktioniert (grünes Schloss-Symbol)

## Schritt 6: Redirects konfigurieren (optional)

Falls du auch `heyapply.ch` (ohne Subdomain) auf `app.heyapply.ch` weiterleiten möchtest:

1. **In Vercel:**
   - Füge `heyapply.ch` als zusätzliche Domain hinzu
   - Gehe zu **Settings** → **Domains**
   - Füge `heyapply.ch` hinzu
   - Konfiguriere einen Redirect in `vercel.json` (siehe unten)

## Troubleshooting

### Domain wird nicht erkannt
- **Problem:** Vercel zeigt "Invalid Configuration"
- **Lösung:** Prüfe, ob der DNS-Record korrekt bei GoDaddy gesetzt ist
- **Prüfung:** Verwende `dig app.heyapply.ch` oder [dnschecker.org](https://dnschecker.org)

### SSL-Zertifikat wird nicht ausgestellt
- **Problem:** Domain zeigt "Pending" oder "Invalid"
- **Lösung:** Warte 10-15 Minuten und prüfe erneut
- **Alternative:** Lösche die Domain in Vercel und füge sie erneut hinzu

### Seite lädt nicht
- **Problem:** 404 oder Timeout
- **Lösung:** 
  - Prüfe, ob das Projekt korrekt deployed ist
  - Prüfe die Umgebungsvariablen (besonders `NEXTAUTH_URL`)
  - Starte ein neues Deployment

### DNS-Propagierung dauert zu lange
- **Problem:** Änderungen werden nicht übernommen
- **Lösung:**
  - Prüfe die DNS-Einstellungen bei GoDaddy erneut
  - Stelle sicher, dass keine alten Records existieren
  - Verwende einen DNS-Cache-Flush (z.B. `sudo dscacheutil -flushcache` auf macOS)

## Nützliche Links

- [Vercel Domain Documentation](https://vercel.com/docs/concepts/projects/domains)
- [GoDaddy DNS Hilfe](https://www.godaddy.com/help)
- [DNS Checker](https://dnschecker.org)

## Wichtige Hinweise

- ⚠️ **DNS-Propagierung:** Änderungen können bis zu 48 Stunden dauern (normalerweise 15-30 Minuten)
- ⚠️ **SSL:** Vercel stellt automatisch SSL-Zertifikate aus, dies kann einige Minuten dauern
- ⚠️ **Umgebungsvariablen:** Vergiss nicht, `NEXTAUTH_URL` zu aktualisieren!
- ⚠️ **Deployment:** Nach Domain-Änderungen sollte ein neues Deployment gestartet werden
