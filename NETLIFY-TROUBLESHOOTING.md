# 🔧 Netlify Troubleshooting Guide

## Problem: 404 "Page not found" auf app.heyapply.ch

### Diagnose-Schritte

1. **Teste die Netlify-Subdomain:**
   - Öffne: `joyful-kleicha-67fb84.netlify.app`
   - Funktioniert diese URL? → Wenn NEIN: Problem liegt an der App-Konfiguration
   - Funktioniert diese URL? → Wenn JA: Problem liegt an der Domain/DNS-Konfiguration

2. **Prüfe Deploy Logs:**
   - Netlify Dashboard → Deploys → Klicke auf das neueste Deployment
   - Prüfe, ob der Build erfolgreich war
   - Prüfe, ob Fehler in den Logs stehen

3. **Prüfe Environment Variables:**
   - Netlify Dashboard → Site configuration → Environment variables
   - Stelle sicher, dass ALLE erforderlichen Variablen gesetzt sind (siehe unten)

---

## Häufige Probleme & Lösungen

### ❌ Problem 1: Fehlende Environment Variables

**Symptome:**
- 404-Fehler
- App lädt nicht
- Fehler in Deploy Logs über fehlende Variablen

**Lösung:**
Setze diese **MINDESTENS erforderlichen** Environment Variables in Netlify:

```env
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
NEXTAUTH_URL=https://app.heyapply.ch
NEXTAUTH_SECRET=<generiere-mit-openssl-rand-base64-32>
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Wo setzen:**
1. Netlify Dashboard → Site configuration → Environment variables
2. Für jede Variable: Add variable → Key & Value eingeben → Scopes wählen (Production) → Save

**NEXTAUTH_SECRET generieren:**
```bash
openssl rand -base64 32
```

---

### ❌ Problem 2: Falsche netlify.toml Konfiguration

**Symptome:**
- Build erfolgreich, aber 404-Fehler
- Routing funktioniert nicht

**Lösung:**
Die `netlify.toml` sollte so aussehen:

```toml
[build]
  command = "npx prisma generate && npm run build"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  node_bundler = "esbuild"
```

**Wichtig:**
- ❌ KEIN `publish = ".next"` Feld (Plugin verwaltet das automatisch)
- ❌ KEINE manuellen Redirects (Plugin verwaltet das automatisch)
- ✅ `@netlify/plugin-nextjs` Plugin MUSS vorhanden sein

---

### ❌ Problem 3: Next.js Plugin fehlt

**Symptome:**
- Build-Fehler
- "Plugin not found" Fehler

**Lösung:**
1. **Prüfe package.json:**
   ```bash
   npm list @netlify/plugin-nextjs
   ```

2. **Falls nicht vorhanden:**
   ```bash
   npm install --save-dev @netlify/plugin-nextjs
   ```

3. **Commit & Push:**
   ```bash
   git add package.json package-lock.json
   git commit -m "Add @netlify/plugin-nextjs"
   git push
   ```

4. Netlify wird automatisch neu deployen

---

### ❌ Problem 4: DATABASE_URL ist falsch oder nicht erreichbar

**Symptome:**
- App lädt, aber alle Datenbank-Operationen schlagen fehl
- Fehler in Browser Console über Database Connection

**Lösung:**
1. **Prüfe DATABASE_URL:**
   - Stelle sicher, dass die URL korrekt ist
   - Stelle sicher, dass die Datenbank von Netlify aus erreichbar ist (nicht localhost!)
   - Bei Supabase: Nutze die Connection Pooling URL oder die normale URL

2. **Prüfe Datenbank-Zugriff:**
   - Bei Supabase: Prüfe, ob "Allow connections from anywhere" aktiviert ist
   - Prüfe Firewall-Einstellungen

---

### ❌ Problem 5: NEXTAUTH_URL ist falsch

**Symptome:**
- Login funktioniert nicht
- Redirect-Loops
- Cookies werden nicht gesetzt

**Lösung:**
1. **Für Production:**
   ```env
   NEXTAUTH_URL=https://app.heyapply.ch
   ```

2. **KEINE trailing slash:**
   - ❌ `https://app.heyapply.ch/`
   - ✅ `https://app.heyapply.ch`

3. **HTTP vs HTTPS:**
   - Immer HTTPS verwenden (auch wenn Let's Encrypt noch läuft)

---

### ❌ Problem 6: Domain-DNS ist nicht richtig konfiguriert

**Symptome:**
- Netlify-Subdomain funktioniert
- Custom Domain zeigt 404

**Lösung:**
1. **Prüfe DNS-Einstellungen:**
   - Bei GoDaddy (oder deinem DNS-Provider):
     - Typ: `CNAME`
     - Name: `app`
     - Wert: `joyful-kleicha-67fb84.netlify.app`

2. **Prüfe DNS-Propagierung:**
   - Besuche: https://dnschecker.org
   - Gebe ein: `app.heyapply.ch`
   - Prüfe, ob der CNAME-Record weltweit propagiert ist

3. **Warte auf DNS-Propagierung:**
   - Kann 5 Minuten bis 48 Stunden dauern
   - Normalerweise: 10-30 Minuten

---

### ❌ Problem 7: Build schlägt fehl

**Symptome:**
- Deployment zeigt "Failed"
- Fehler in Deploy Logs

**Lösung:**
1. **Prüfe Deploy Logs:**
   - Klicke auf das fehlgeschlagene Deployment
   - Scroll zu den Fehlermeldungen

2. **Häufige Build-Fehler:**

   **"Module not found":**
   ```bash
   # Lokal testen:
   npm install
   npm run build
   ```

   **"Prisma Client not generated":**
   - Stelle sicher, dass `npx prisma generate` im Build Command ist
   - Oder: Füge `postinstall` Script zu package.json hinzu:
     ```json
     "scripts": {
       "postinstall": "prisma generate"
     }
     ```

   **"Environment variable not found":**
   - Prüfe, ob alle Environment Variables in Netlify gesetzt sind

---

## ✅ Checkliste: Alles OK?

- [ ] Netlify-Subdomain (`joyful-kleicha-67fb84.netlify.app`) funktioniert
- [ ] Build ist erfolgreich (grüner Status in Netlify)
- [ ] Alle Environment Variables sind gesetzt:
  - [ ] `DATABASE_URL`
  - [ ] `NEXTAUTH_URL`
  - [ ] `NEXTAUTH_SECRET`
  - [ ] `ANTHROPIC_API_KEY`
- [ ] `netlify.toml` ist korrekt konfiguriert
- [ ] `@netlify/plugin-nextjs` ist in `package.json`
- [ ] DNS ist korrekt konfiguriert (CNAME Record)
- [ ] DNS ist propagiert (prüfe mit dnschecker.org)
- [ ] SSL-Zertifikat ist aktiv (Let's Encrypt)

---

## 🆘 Nächste Schritte wenn nichts hilft

1. **Prüfe Netlify Support:**
   - Netlify Dashboard → Support
   - Erstelle ein Ticket mit:
     - Deploy Logs
     - netlify.toml Inhalt
     - Liste der Environment Variables (KEINE Werte!)

2. **Prüfe Next.js Dokumentation:**
   - https://docs.netlify.com/integrations/frameworks/nextjs/

3. **Lokaler Test:**
   ```bash
   # Stelle sicher, dass lokal alles funktioniert:
   npm run build
   npm start
   ```

---

## 📚 Nützliche Links

- **Netlify Next.js Docs:** https://docs.netlify.com/integrations/frameworks/nextjs/
- **Environment Variables:** https://docs.netlify.com/environment-variables/overview/
- **DNS Checker:** https://dnschecker.org
- **Netlify Status:** https://www.netlifystatus.com/
