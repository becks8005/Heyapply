# 🚀 Vercel Setup - Komplette Schritt-für-Schritt-Anleitung

Diese Anleitung führt dich Schritt für Schritt durch das komplette Setup von Heyapply auf Vercel mit der Domain `app.heyapply.ch`.

## 📋 Übersicht

Du wirst folgende Schritte durchführen:
1. ✅ Vercel Account erstellen
2. ✅ Projekt auf Vercel verbinden
3. ✅ Umgebungsvariablen konfigurieren
4. ✅ Erstes Deployment durchführen
5. ✅ Domain hinzufügen
6. ✅ DNS bei GoDaddy konfigurieren
7. ✅ Finale Konfiguration

**Geschätzte Zeit:** 30-45 Minuten (inkl. DNS-Propagierung)

---

## Schritt 1: Vercel Account erstellen

### 1.1 Account anlegen

1. **Gehe zu Vercel:**
   - Öffne [vercel.com](https://vercel.com) im Browser
   - Klicke auf **Sign Up** (oben rechts)

2. **Anmeldung:**
   - Du kannst dich mit **GitHub**, **GitLab** oder **Bitbucket** anmelden
   - **Empfehlung:** Nutze GitHub, da dein Code wahrscheinlich dort ist
   - Folge den Anweisungen zur Anmeldung

3. **Account bestätigen:**
   - Prüfe deine E-Mail und bestätige den Account falls nötig

✅ **Fertig wenn:** Du bist auf dem Vercel Dashboard eingeloggt

---

## Schritt 2: Projekt auf Vercel verbinden

### Option A: Über GitHub (empfohlen)

**Voraussetzung:** Dein Code muss auf GitHub sein

1. **Projekt importieren:**
   - Im Vercel Dashboard klicke auf **Add New...** → **Project**
   - Falls du GitHub verbunden hast, siehst du deine Repositories
   - Suche nach `Heyapply` oder deinem Repository-Namen
   - Klicke auf **Import**

2. **Projekt konfigurieren:**
   - **Project Name:** `heyapply` (oder wie du möchtest)
   - **Framework Preset:** Next.js (sollte automatisch erkannt werden)
   - **Root Directory:** `./` (Standard)
   - **Build Command:** `npm run build` (Standard)
   - **Output Directory:** `.next` (Standard)
   - **Install Command:** `npm install` (Standard)

3. **Weiter klicken:**
   - Klicke auf **Deploy** (wir konfigurieren Umgebungsvariablen später)

### Option B: Über Vercel CLI (falls kein GitHub)

**Falls dein Code noch nicht auf GitHub ist:**

1. **Vercel CLI installieren:**
   ```bash
   npm install -g vercel
   ```

2. **In deinem Projekt-Verzeichnis:**
   ```bash
   cd /Users/pascalbeck/Heyapply
   vercel login
   ```

3. **Projekt verbinden:**
   ```bash
   vercel
   ```
   - Folge den Anweisungen
   - Wähle "Link to existing project" oder "Create new project"
   - Wähle dein Team/Account
   - Bestätige die Konfiguration

✅ **Fertig wenn:** Das Projekt ist auf Vercel erstellt (auch wenn das erste Deployment fehlschlägt, ist das OK)

---

## Schritt 3: Umgebungsvariablen konfigurieren

**WICHTIG:** Diese Variablen müssen in Vercel gesetzt werden, damit die App funktioniert.

### 3.1 Zu den Umgebungsvariablen navigieren

1. **Im Vercel Dashboard:**
   - Klicke auf dein **Heyapply-Projekt**
   - Gehe zu **Settings** (oben im Menü)
   - Klicke auf **Environment Variables** (links im Menü)

### 3.2 Variablen hinzufügen

**Für jede Variable:**
- Klicke auf **Add New**
- Gib den **Name** ein
- Gib den **Value** ein
- Wähle die **Environments** aus (Production, Preview, Development)
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
```

### 3.4 Environment-Auswahl

**Für jede Variable wähle:**
- ✅ **Production** (für live App)
- ✅ **Preview** (für Test-Deployments)
- ❌ **Development** (nur für lokale Entwicklung)

### 3.5 Checkliste

- [ ] `DATABASE_URL` gesetzt
- [ ] `NEXTAUTH_URL` gesetzt (vorerst temporäre URL, später ändern wir zu `https://app.heyapply.ch`)
- [ ] `NEXTAUTH_SECRET` gesetzt (mit `openssl rand -base64 32` generiert)
- [ ] `ANTHROPIC_API_KEY` gesetzt
- [ ] `NEXT_PUBLIC_SUPABASE_URL` gesetzt (falls verwendet)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` gesetzt (falls verwendet)
- [ ] `RESEND_API_KEY` gesetzt (falls verwendet)
- [ ] `EMAIL_FROM` gesetzt (falls verwendet)

✅ **Fertig wenn:** Alle erforderlichen Variablen sind gesetzt

---

## Schritt 4: Erstes Deployment

### 4.1 Deployment auslösen

**Option A: Über GitHub (automatisch):**
- Wenn dein Code auf GitHub ist und verbunden ist, wird automatisch deployed wenn du pusht
- Oder: Gehe zu **Deployments** → **Redeploy** beim letzten Deployment

**Option B: Über Vercel Dashboard:**
- Gehe zu **Deployments**
- Klicke auf das neueste Deployment
- Klicke auf **Redeploy**

**Option C: Über CLI:**
```bash
vercel --prod
```

### 4.2 Deployment prüfen

1. **Warte auf Abschluss:**
   - Das Deployment dauert 2-5 Minuten
   - Du siehst den Fortschritt im Dashboard

2. **Prüfe das Ergebnis:**
   - Wenn erfolgreich: Du siehst eine URL wie `heyapply-xyz.vercel.app`
   - Öffne diese URL im Browser
   - **Erwartung:** Die Seite sollte laden (auch wenn einige Features noch nicht funktionieren)

3. **Bei Fehlern:**
   - Klicke auf das Deployment
   - Prüfe die **Build Logs**
   - Häufige Probleme:
     - Fehlende Umgebungsvariablen → Prüfe Schritt 3
     - Build-Fehler → Prüfe die Logs

✅ **Fertig wenn:** Deployment erfolgreich und die App lädt (auch wenn noch nicht über die richtige Domain)

---

## Schritt 5: Domain hinzufügen

### 5.1 Domain in Vercel hinzufügen

1. **Zu Domain-Einstellungen:**
   - Im Vercel Dashboard: **Settings** → **Domains**
   - Oder direkt: Klicke auf dein Projekt → **Settings** → **Domains**

2. **Domain eingeben:**
   - Klicke auf **Add Domain**
   - Gib ein: `app.heyapply.ch`
   - Klicke auf **Add**

3. **DNS-Konfiguration anzeigen:**
   - Vercel zeigt dir jetzt die DNS-Einstellungen
   - **WICHTIG:** Notiere dir diese Werte!
   - Du siehst entweder:
     - **CNAME:** Ein Wert wie `cname.vercel-dns.com`
     - **A-Record:** Eine IP-Adresse wie `76.76.21.21`

4. **Status prüfen:**
   - Der Status zeigt zunächst **Invalid Configuration** oder **Pending**
   - Das ist normal, solange die DNS-Einstellungen noch nicht bei GoDaddy gesetzt sind

✅ **Fertig wenn:** Domain ist in Vercel hinzugefügt und du hast die DNS-Werte notiert

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

### 6.3 CNAME-Record hinzufügen (wenn Vercel CNAME zeigt)

**Wenn Vercel einen CNAME-Wert angezeigt hat:**

1. **Neuen Record hinzufügen:**
   - Klicke auf **Hinzufügen** oder **Add Record**
   - Wähle **CNAME** als Typ

2. **Werte eintragen:**
   - **Name** oder **Host:** `app`
   - **Wert** oder **Points to:** Der Wert von Vercel (z.B. `cname.vercel-dns.com`)
   - **TTL:** `3600` (Standard, oder 1 Stunde)

3. **Speichern:**
   - Klicke auf **Speichern** oder **Save**

### 6.4 A-Record hinzufügen (wenn Vercel A-Record zeigt)

**Wenn Vercel eine IP-Adresse angezeigt hat:**

1. **Neuen Record hinzufügen:**
   - Klicke auf **Hinzufügen** oder **Add Record**
   - Wähle **A** als Typ

2. **Werte eintragen:**
   - **Name** oder **Host:** `app`
   - **Wert** oder **Points to:** Die IP-Adresse von Vercel (z.B. `76.76.21.21`)
   - **TTL:** `3600` (Standard)

3. **Speichern:**
   - Klicke auf **Speichern** oder **Save**

### 6.5 Alte Records prüfen

**Wichtig:** Stelle sicher, dass keine alten/konfliktierenden Records existieren:
- Prüfe, ob es bereits einen `app` Record gibt
- Falls ja, lösche ihn oder ändere ihn zu dem neuen Wert

### 6.6 DNS-Propagierung warten

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

### 7.1 In Vercel prüfen

1. **Domain-Status prüfen:**
   - Gehe zurück zu Vercel: **Settings** → **Domains**
   - Prüfe den Status von `app.heyapply.ch`
   - Nach erfolgreicher DNS-Konfiguration sollte Vercel automatisch ein SSL-Zertifikat ausstellen

2. **Status-Interpretation:**
   - ✅ **Valid** oder **Configured:** Alles OK!
   - ⏳ **Pending:** Warte noch ein paar Minuten
   - ❌ **Invalid Configuration:** Prüfe DNS-Einstellungen erneut

### 7.2 SSL kann einige Minuten dauern

- Vercel stellt automatisch SSL-Zertifikate über Let's Encrypt aus
- Dies geschieht automatisch nach erfolgreicher DNS-Verifizierung
- Normalerweise 5-15 Minuten nach DNS-Propagierung

✅ **Fertig wenn:** Domain zeigt **Valid** oder **Configured** in Vercel

---

## Schritt 8: NEXTAUTH_URL aktualisieren

### 8.1 Umgebungsvariable ändern

**Jetzt, wo die Domain funktioniert:**

1. **Zu Environment Variables:**
   - Vercel Dashboard → **Settings** → **Environment Variables**

2. **NEXTAUTH_URL finden:**
   - Suche nach `NEXTAUTH_URL`
   - Klicke auf das Bearbeiten-Symbol (Stift)

3. **Wert ändern:**
   - Ändere den Wert zu: `https://app.heyapply.ch`
   - Stelle sicher, dass **Production** ausgewählt ist
   - Klicke auf **Save**

### 8.2 Neues Deployment

**Nach Änderung der Umgebungsvariable:**

1. **Deployment auslösen:**
   - Gehe zu **Deployments**
   - Klicke auf **Redeploy** beim neuesten Deployment
   - Oder: Pushe einen neuen Commit zu GitHub

2. **Warten:**
   - Warte auf Abschluss des Deployments (2-5 Minuten)

✅ **Fertig wenn:** `NEXTAUTH_URL` ist auf `https://app.heyapply.ch` gesetzt und neues Deployment ist fertig

---

## Schritt 9: Finale Tests

### 9.1 Domain testen

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

### 9.2 Häufige Probleme prüfen

**Problem: Domain lädt nicht**
- ✅ Prüfe DNS-Propagierung: [dnschecker.org](https://dnschecker.org)
- ✅ Prüfe Domain-Status in Vercel
- ✅ Prüfe Deployment-Status

**Problem: SSL-Fehler**
- ✅ Warte 10-15 Minuten nach DNS-Propagierung
- ✅ Prüfe Domain-Status in Vercel
- ✅ Lösche Domain in Vercel und füge sie erneut hinzu

**Problem: Authentifizierung funktioniert nicht**
- ✅ Prüfe `NEXTAUTH_URL` in Umgebungsvariablen
- ✅ Stelle sicher, dass neues Deployment nach Änderung gestartet wurde
- ✅ Prüfe `NEXTAUTH_SECRET` ist gesetzt

**Problem: Datenbank-Fehler**
- ✅ Prüfe `DATABASE_URL` in Umgebungsvariablen
- ✅ Stelle sicher, dass die Datenbank von außen erreichbar ist (nicht nur localhost)
- ✅ Prüfe Firewall-Einstellungen der Datenbank

✅ **Fertig wenn:** Alles funktioniert und `app.heyapply.ch` läuft!

---

## 🎉 Erfolg!

Deine Heyapply-App sollte jetzt über `https://app.heyapply.ch` erreichbar sein!

### Nächste Schritte (optional)

- **Weitere Domains:** Falls du auch `heyapply.ch` (ohne Subdomain) verwenden möchtest, füge es als zusätzliche Domain hinzu
- **Monitoring:** Setze Vercel Analytics oder andere Monitoring-Tools auf
- **Backups:** Stelle sicher, dass deine Datenbank regelmäßig gesichert wird

### Wichtige Links

- **Vercel Dashboard:** [vercel.com/dashboard](https://vercel.com/dashboard)
- **Domain-Verwaltung:** [vercel.com/[dein-team]/[dein-projekt]/settings/domains](https://vercel.com)
- **DNS Checker:** [dnschecker.org](https://dnschecker.org)

---

## 📞 Hilfe

Falls du Probleme hast:
1. Prüfe die **Build Logs** in Vercel
2. Prüfe die **Domain-Status** in Vercel
3. Verwende [dnschecker.org](https://dnschecker.org) für DNS-Probleme
4. Prüfe die [Vercel Dokumentation](https://vercel.com/docs)
