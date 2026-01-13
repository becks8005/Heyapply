# Production Fix für NextAuth 500-Fehler

## Problem
Auf Production (`app.heyapply.ch`) tritt ein 500-Fehler beim `/api/auth/session` Endpoint auf mit der Fehlermeldung "Configuration".

## Ursache
Der `PrismaAdapter` wurde mit der JWT-Strategie verwendet, was in NextAuth v5 zu Konfigurationsfehlern führt.

## Lösung

### 1. Code-Änderungen (bereits gemacht)
- ✅ PrismaAdapter entfernt aus `lib/auth.ts`
- ✅ `trustHost: true` hinzugefügt
- ✅ Secret-Konfiguration verbessert

### 2. Production Deployment
Die folgenden Änderungen müssen auf Production deployed werden:

**Datei: `lib/auth.ts`**
- PrismaAdapter ist entfernt (Zeile 18 auskommentiert)
- `trustHost: true` ist gesetzt (Zeile 21)

**Wichtig**: Nach dem Deployment muss der Server neu gestartet werden.

### 3. Umgebungsvariablen prüfen
Auf Production müssen folgende Variablen gesetzt sein:
- `AUTH_SECRET` oder `NEXTAUTH_SECRET` (muss vorhanden sein)
- `NEXTAUTH_URL="https://app.heyapply.ch"` (muss auf Production-URL gesetzt sein)

### 4. Deployment-Schritte
1. Code committen und pushen
2. Build auf Production ausführen: `npm run build`
3. Server neu starten
4. Testen: `https://app.heyapply.ch/login`

## Verifikation
Nach dem Deployment sollte:
- ✅ `/api/auth/session` mit Status 200 antworten
- ✅ Login funktionieren
- ✅ Keine "Configuration" Fehler mehr auftreten
