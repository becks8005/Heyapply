# 🚀 Netlify Setup - Komplette Schritt-für-Schritt-Anleitung

Diese Anleitung führt dich Schritt für Schritt durch das komplette Setup von Heyapply auf Netlify mit der Domain `app.heyapply.ch`.

## 📋 Übersicht

Du wirst folgende Schritte durchführen:
1. ✅ Netlify Account erstellen
2. ✅ Projekt auf Netlify verbinden
3. ✅ Umgebungsvariablen konfigurieren
4. ✅ Erstes Deployment durchführen
5. ✅ Domain hinzufügen
6. ✅ DNS bei GoDaddy konfigurieren
7. ✅ Cron Jobs einrichten
8. ✅ Finale Konfiguration

**Geschätzte Zeit:** 30-45 Minuten (inkl. DNS-Propagierung)

---

## Schritt 1: Netlify Account erstellen

### 1.1 Account anlegen

1. **Gehe zu Netlify:**
   - Öffne [netlify.com](https://netlify.com) im Browser
   - Klicke auf **Sign up** (oben rechts)

2. **Anmeldung:**
   - Du kannst dich mit **GitHub**, **GitLab** oder **Bitbucket** anmelden
   - **Empfehlung:** Nutze GitHub, da dein Code wahrscheinlich dort ist
   - Folge den Anweisungen zur Anmeldung

3. **Account bestätigen:**
   - Prüfe deine E-Mail und bestätige den Account falls nötig

✅ **Fertig wenn:** Du bist auf dem Netlify Dashboard eingeloggt

---

## Schritt 2: Projekt auf Netlify verbinden

### Option A: Über GitHub (empfohlen)

**Voraussetzung:** Dein Code muss auf GitHub sein

1. **Projekt importieren:**
   - Im Netlify Dashboard klicke auf **Add new site** → **Import an existing project**
   - Falls du GitHub verbunden hast, siehst du deine Repositories
   - Suche nach `Heyapply` oder deinem Repository-Namen
   - Klicke auf **Import**

2. **Projekt konfigurieren:**
   - **Branch to deploy:** `main` oder `master` (je nach deinem Branch)
   - **Build command:** `npm run build` (sollte automatisch erkannt werden)
   - **Publish directory:** `.next` (sollte automatisch erkannt werden)
   - **Base directory:** Leer lassen (Standard)

3. **Weiter klicken:**
   - Klicke auf **Deploy site** (wir konfigurieren Umgebungsvariablen später)

### Option B: Über Netlify CLI (falls kein GitHub)

**Falls dein Code noch nicht auf GitHub ist:**

1. **Netlify CLI installieren:**
   ```bash
   npm install -g netlify-cli
   ```

2. **In deinem Projekt-Verzeichnis:**
   ```bash
   cd /Users/pascalbeck/Heyapply
   netlify login
   ```

3. **Projekt verbinden:**
   ```bash
   netlify init
   ```
   - Folge den Anweisungen
   - Wähle "Create & configure a new site"
   - Bestätige die Konfiguration

✅ **Fertig wenn:** Das Projekt ist auf Netlify erstellt (auch wenn das erste Deployment fehlschlägt, ist das OK)

---

## Schritt 3: Umgebungsvariablen konfigurieren

**WICHTIG:** Diese Variablen müssen in Netlify gesetzt werden, damit die App funktioniert.

### 3.1 Zu den Umgebungsvariablen navigieren

1. **Im Netlify Dashboard:**
   - Klicke auf dein **Heyapply-Projekt**
   - Gehe zu **Site configuration** → **Environment variables**
   - Oder: **Site settings** → **Build & deploy** → **Environment**

### 3.2 Variablen hinzufügen

**Für jede Variable:**
- Klicke auf **Add a variable**
- Gib den **Key** ein
- Gib den **Value** ein
- Wähle die **Scopes** aus (Production, Deploy previews, Branch deploys)
- Klicke auf **Save**

**Hinweis:** Für Production sollte `NEXTAUTH_URL` später `https://app.heyapply.ch` sein, aber erstmal kannst du eine temporäre URL verwenden.

### 3.3 Liste der benötigten Variablen

#### 🔴 ERFORDERLICH (muss gesetzt werden):

```env
# Database (PostgreSQL - z.B. Supabase)
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public

# NextAuth
NEXTAUTH_URL=https://app.heyapply.ch
NEXTAUTH_SECRET=dein-sicheres-secret-hier

# Anthropic (Claude AI)
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**NEXTAUTH_SECRET generieren:**
```bash
openssl rand -base64 32
```
Kopiere den Output und verwende ihn als Wert.

#### 🟡 WICHTIG (für vollständige Funktionalität):

```env
# Supabase (für File Storage)
NEXT_PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend (für E-Mails)
RESEND_API_KEY=re_...
EMAIL_FROM=Heyapply <noreply@heyapply.ch>
```

#### 🟢 OPTIONAL (für erweiterte Features):

```env
# Stripe (für Zahlungen)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIS=price_...
STRIPE_PRICE_PRO=price_...

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...

# Cron Job Secret (für externe Cron Jobs)
CRON_SECRET=dein-sicheres-secret-hier
```

### 3.4 Scope-Auswahl

**Für jede Variable wähle:**
- ✅ **Production** (für live App)
- ✅ **Deploy previews** (für Test-Deployments)
- ✅ **Branch deploys** (optional)

### 3.5 Checkliste

- [ ] `DATABASE_URL` gesetzt
- [ ] `NEXTAUTH_URL` gesetzt (vorerst temporäre URL, später ändern wir zu `https://app.heyapply.ch`)
- [ ] `NEXTAUTH_SECRET` gesetzt (mit `openssl rand -base64 32` generiert)
- [ ] `ANTHROPIC_API_KEY` gesetzt
- [ ] `NEXT_PUBLIC_SUPABASE_URL` gesetzt (falls verwendet)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` gesetzt (falls verwendet)
- [ ] `RESEND_API_KEY` gesetzt (falls verwendet)
- [ ] `EMAIL_FROM` gesetzt (falls verwendet)
- [ ] `CRON_SECRET` gesetzt (für externe Cron Jobs)

✅ **Fertig wenn:** Alle erforderlichen Variablen sind gesetzt

---

## Schritt 4: Erstes Deployment

### 4.1 Deployment auslösen

**Option A: Über GitHub (automatisch):**
- Wenn dein Code auf GitHub ist und verbunden ist, wird automatisch deployed wenn du pusht
- Oder: Gehe zu **Deploys** → **Trigger deploy** → **Deploy site**

**Option B: Über Netlify Dashboard:**
- Gehe zu **Deploys**
- Klicke auf **Trigger deploy** → **Deploy site**

**Option C: Über CLI:**
```bash
netlify deploy --prod
```

### 4.2 Deployment prüfen

1. **Warte auf Abschluss:**
   - Das Deployment dauert 2-5 Minuten
   - Du siehst den Fortschritt im Dashboard

2. **Prüfe das Ergebnis:**
   - Wenn erfolgreich: Du siehst eine URL wie `heyapply-xyz.netlify.app`
   - Öffne diese URL im Browser
   - **Erwartung:** Die Seite sollte laden (auch wenn einige Features noch nicht funktionieren)

3. **Bei Fehlern:**
   - Klicke auf das Deployment
   - Prüfe die **Deploy log**
   - Häufige Probleme:
     - Fehlende Umgebungsvariablen → Prüfe Schritt 3
     - Build-Fehler → Prüfe die Logs
     - Next.js Plugin fehlt → Netlify installiert es automatisch, aber falls Probleme auftreten:
       ```bash
       npm install @netlify/plugin-nextjs
       ```
       Oder füge es zu `package.json` hinzu:
       ```bash
       npm install --save-dev @netlify/plugin-nextjs
       ```

✅ **Fertig wenn:** Deployment erfolgreich und die App lädt (auch wenn noch nicht über die richtige Domain)

---

## Schritt 5: Domain hinzufügen

### 5.1 Domain in Netlify hinzufügen

1. **Zu Domain-Einstellungen:**
   - Im Netlify Dashboard: **Site configuration** → **Domain management**
   - Oder: **Site settings** → **Domain management**

2. **Domain eingeben:**
   - Klicke auf **Add custom domain**
   - Gib ein: `app.heyapply.ch`
   - Klicke auf **Verify**

3. **DNS-Konfiguration anzeigen:**
   - Netlify zeigt dir jetzt die DNS-Einstellungen
   - **WICHTIG:** Notiere dir diese Werte!
   - Du siehst entweder:
     - **CNAME:** Ein Wert wie `heyapply-xyz.netlify.app`
     - **A-Record:** Eine IP-Adresse (seltener bei Netlify)

4. **Status prüfen:**
   - Der Status zeigt zunächst **Pending verification** oder **DNS configuration needed**
   - Das ist normal, solange die DNS-Einstellungen noch nicht bei GoDaddy gesetzt sind

✅ **Fertig wenn:** Domain ist in Netlify hinzugefügt und du hast die DNS-Werte notiert

---

## Schritt 6: DNS bei GoDaddy konfigurieren

### 6.1 Bei GoDaddy einloggen

1. **Gehe zu GoDaddy:**
   - Öffne [godaddy.ch](https://godaddy.ch)
   - Logge dich mit deinem Account ein

2. **Zu Domain-Verwaltung:**
   - Klicke auf **Meine Produkte** (oben rechts)
   - Suche nach `heyapply.ch`
   - Klicke auf die Domain

### 6.2 DNS-Records öffnen

1. **DNS-Verwaltung finden:**
   - Suche nach **DNS** oder **DNS-Verwaltung**
   - Oder: **Manage DNS** / **DNS verwalten**
   - Klicke darauf

2. **Records anzeigen:**
   - Du siehst eine Liste mit DNS-Records
   - Suche nach dem Abschnitt **Records** oder **DNS-Records**

### 6.3 CNAME-Record hinzufügen

**Netlify verwendet normalerweise CNAME:**

1. **Neuen Record hinzufügen:**
   - Klicke auf **Hinzufügen** oder **Add Record**
   - Wähle **CNAME** als Typ

2. **Werte eintragen:**
   - **Name** oder **Host:** `app`
   - **Wert** oder **Points to:** Der Wert von Netlify (z.B. `heyapply-xyz.netlify.app`)
   - **TTL:** `3600` (Standard, oder 1 Stunde)

3. **Speichern:**
   - Klicke auf **Speichern** oder **Save**

### 6.4 Alte Records prüfen

**Wichtig:** Stelle sicher, dass keine alten/konfliktierenden Records existieren:
- Prüfe, ob es bereits einen `app` Record gibt
- Falls ja, lösche ihn oder ändere ihn zu dem neuen Wert

### 6.5 DNS-Propagierung warten

**Nach dem Speichern:**
- DNS-Änderungen brauchen Zeit zur Verbreitung
- **Normal:** 15-30 Minuten
- **Maximum:** Bis zu 48 Stunden (selten)

**DNS-Status prüfen:**
- Verwende [dnschecker.org](https://dnschecker.org)
- Gib `app.heyapply.ch` ein
- Prüfe, ob der neue Wert weltweit propagiert ist

✅ **Fertig wenn:** DNS-Record ist bei GoDaddy gesetzt

---

## Schritt 7: SSL-Zertifikat prüfen

### 7.1 In Netlify prüfen

1. **Domain-Status prüfen:**
   - Gehe zurück zu Netlify: **Domain management**
   - Prüfe den Status von `app.heyapply.ch`
   - Nach erfolgreicher DNS-Konfiguration sollte Netlify automatisch ein SSL-Zertifikat ausstellen

2. **Status-Interpretation:**
   - ✅ **SSL certificate active:** Alles OK!
   - ⏳ **Provisioning certificate:** Warte noch ein paar Minuten
   - ❌ **DNS configuration needed:** Prüfe DNS-Einstellungen erneut

### 7.2 SSL kann einige Minuten dauern

- Netlify stellt automatisch SSL-Zertifikate über Let's Encrypt aus
- Dies geschieht automatisch nach erfolgreicher DNS-Verifizierung
- Normalerweise 5-15 Minuten nach DNS-Propagierung

✅ **Fertig wenn:** Domain zeigt **SSL certificate active** in Netlify

---

## Schritt 8: Cron Jobs einrichten

**WICHTIG:** Netlify hat keine eingebauten Cron Jobs wie Vercel. Du musst einen externen Service verwenden.

### Option A: Externer Cron Service (empfohlen)

**Verwende einen kostenlosen Service wie cron-job.org:**

1. **Account erstellen:**
   - Gehe zu [cron-job.org](https://cron-job.org) (kostenlos)
   - Oder: [cronitor.io](https://cronitor.io) (kostenloser Plan verfügbar)

2. **Cron Job erstellen:**
   - **URL:** `https://app.heyapply.ch/api/job-search/cron`
   - **Schedule:** `0 9 * * *` (täglich um 9:00 UTC)
   - **Method:** GET
   - **Headers:** `Authorization: Bearer DEIN_CRON_SECRET`
   - Verwende den `CRON_SECRET` den du in Schritt 3 gesetzt hast

3. **Testen:**
   - Klicke auf "Test now" um zu prüfen ob es funktioniert

### Option B: Netlify Scheduled Functions (erweitert)

**Falls du Scheduled Functions verwenden möchtest:**

1. **Erstelle eine Netlify Function:**
   ```javascript
   // netlify/functions/job-search-cron.js
   exports.handler = async (event, context) => {
     // Rufe deinen API-Endpoint auf
     const response = await fetch('https://app.heyapply.ch/api/job-search/cron', {
       headers: {
         'Authorization': `Bearer ${process.env.CRON_SECRET}`
       }
     });
     return { statusCode: 200, body: JSON.stringify({ success: true }) };
   };
   ```

2. **Konfiguriere in netlify.toml:**
   ```toml
   [[plugins]]
     package = "@netlify/plugin-scheduled-functions"
   ```

**Hinweis:** Option A ist einfacher und empfohlen für den Start.

✅ **Fertig wenn:** Cron Job ist eingerichtet und getestet

---

## Schritt 9: NEXTAUTH_URL aktualisieren

### 9.1 Umgebungsvariable ändern

**Jetzt, wo die Domain funktioniert:**

1. **Zu Environment Variables:**
   - Netlify Dashboard → **Site configuration** → **Environment variables**

2. **NEXTAUTH_URL finden:**
   - Suche nach `NEXTAUTH_URL`
   - Klicke auf das Bearbeiten-Symbol (Stift)

3. **Wert ändern:**
   - Ändere den Wert zu: `https://app.heyapply.ch`
   - Stelle sicher, dass **Production** ausgewählt ist
   - Klicke auf **Save**

### 9.2 Neues Deployment

**Nach Änderung der Umgebungsvariable:**

1. **Deployment auslösen:**
   - Gehe zu **Deploys**
   - Klicke auf **Trigger deploy** → **Deploy site**
   - Oder: Pushe einen neuen Commit zu GitHub

2. **Warten:**
   - Warte auf Abschluss des Deployments (2-5 Minuten)

✅ **Fertig wenn:** `NEXTAUTH_URL` ist auf `https://app.heyapply.ch` gesetzt und neues Deployment ist fertig

---

## Schritt 10: Finale Tests

### 10.1 Domain testen

1. **Öffne die Domain:**
   - Gehe zu `https://app.heyapply.ch` im Browser
   - Die Seite sollte laden

2. **SSL prüfen:**
   - Prüfe, ob ein grünes Schloss-Symbol in der Adressleiste ist
   - Klicke darauf → sollte "Zertifikat ist gültig" zeigen

3. **Funktionalität testen:**
   - Registrierung testen
   - Login testen
   - Prüfe, ob E-Mails ankommen (falls Resend konfiguriert)
   - Teste API-Endpoints

### 10.2 Häufige Probleme prüfen

**Problem: Domain lädt nicht**
- ✅ Prüfe DNS-Propagierung: [dnschecker.org](https://dnschecker.org)
- ✅ Prüfe Domain-Status in Netlify
- ✅ Prüfe Deployment-Status

**Problem: SSL-Fehler**
- ✅ Warte 10-15 Minuten nach DNS-Propagierung
- ✅ Prüfe Domain-Status in Netlify
- ✅ Lösche Domain in Netlify und füge sie erneut hinzu

**Problem: Authentifizierung funktioniert nicht**
- ✅ Prüfe `NEXTAUTH_URL` in Umgebungsvariablen
- ✅ Stelle sicher, dass neues Deployment nach Änderung gestartet wurde
- ✅ Prüfe `NEXTAUTH_SECRET` ist gesetzt

**Problem: Datenbank-Fehler**
- ✅ Prüfe `DATABASE_URL` in Umgebungsvariablen
- ✅ Stelle sicher, dass die Datenbank von außen erreichbar ist (nicht nur localhost)
- ✅ Prüfe Firewall-Einstellungen der Datenbank

**Problem: Build-Fehler**
- ✅ Prüfe Deploy Logs in Netlify
- ✅ Stelle sicher, dass `@netlify/plugin-nextjs` installiert ist
- ✅ Prüfe ob alle Dependencies korrekt sind

✅ **Fertig wenn:** Alles funktioniert und `app.heyapply.ch` läuft!

---

## 🎉 Erfolg!

Deine Heyapply-App sollte jetzt über `https://app.heyapply.ch` erreichbar sein!

### Nächste Schritte (optional)

- **Weitere Domains:** Falls du auch `heyapply.ch` (ohne Subdomain) verwenden möchtest, füge es als zusätzliche Domain hinzu
- **Monitoring:** Setze Netlify Analytics oder andere Monitoring-Tools auf
- **Backups:** Stelle sicher, dass deine Datenbank regelmäßig gesichert wird

### Wichtige Links

- **Netlify Dashboard:** [app.netlify.com](https://app.netlify.com)
- **Domain-Verwaltung:** Site settings → Domain management
- **DNS Checker:** [dnschecker.org](https://dnschecker.org)
- **Cron Service:** [cron-job.org](https://cron-job.org)

---

## 📊 Limits & Credits

**Wichtig:** Der Netlify Free Plan hat 300 Credits/Monat.

**Was bedeutet das für dein Projekt?**
- ✅ ~1 Million Requests/Monat möglich (~10,000 aktive User)
- ✅ ~30 GB Bandwidth/Monat
- ✅ ~20 Production Deployments/Monat

**📖 Detaillierte Analyse:** Siehe [NETLIFY-LIMITS-ANALYSIS.md](./NETLIFY-LIMITS-ANALYSIS.md)

**Empfehlung:** Starte mit Free Plan, monitore deinen Verbrauch, upgrade wenn nötig!

---

## 📞 Hilfe

Falls du Probleme hast:
1. Prüfe die **Deploy Logs** in Netlify
2. Prüfe die **Domain-Status** in Netlify
3. Verwende [dnschecker.org](https://dnschecker.org) für DNS-Probleme
4. Prüfe die [Netlify Dokumentation](https://docs.netlify.com)
5. Prüfe deinen **Credit-Verbrauch** im Dashboard