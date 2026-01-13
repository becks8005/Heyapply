# 🗄️ Datenbank Setup

Die Anwendung benötigt eine PostgreSQL-Datenbank. Hier sind die Optionen:

## Option 1: Docker (Empfohlen für lokale Entwicklung)

### Voraussetzungen
- Docker Desktop installiert und gestartet

### Schritte

1. **Docker Desktop starten**
   - Öffne Docker Desktop auf deinem Mac
   - Warte, bis Docker vollständig gestartet ist

2. **Datenbank starten**
   ```bash
   ./start-db.sh
   ```
   
   Oder manuell:
   ```bash
   docker-compose up -d
   ```

3. **Umgebungsvariable setzen**
   
   Stelle sicher, dass deine `.env.local` folgende Zeile enthält:
   ```env
   DATABASE_URL="postgresql://heyapply:heyapply@localhost:5432/heyapply?schema=public"
   ```

4. **Datenbank-Schema pushen**
   ```bash
   npx prisma db push
   ```

5. **Fertig!** Die Datenbank läuft jetzt.

### Datenbank stoppen
```bash
docker-compose down
```

### Datenbank löschen (alle Daten gehen verloren!)
```bash
docker-compose down -v
```

---

## Option 2: Supabase (Cloud-Datenbank, kostenlos)

### Schritte

1. **Supabase Account erstellen**
   - Gehe zu https://supabase.com
   - Erstelle einen kostenlosen Account
   - Erstelle ein neues Projekt

2. **Datenbank-URL kopieren**
   - Gehe zu Project Settings → Database
   - Kopiere die "Connection string" (URI)
   - Sie sieht aus wie: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`

3. **Umgebungsvariable setzen**
   
   Füge in deine `.env.local` ein:
   ```env
   DATABASE_URL="postgresql://postgres:[DEIN-PASSWORT]@db.[DEIN-PROJEKT].supabase.co:5432/postgres"
   ```
   (Ersetze `[DEIN-PASSWORT]` und `[DEIN-PROJEKT]` mit deinen Werten)

4. **Datenbank-Schema pushen**
   ```bash
   npx prisma db push
   ```

---

## Option 3: Lokale PostgreSQL-Installation

### Installation mit Homebrew

```bash
# PostgreSQL installieren
brew install postgresql@16

# PostgreSQL starten
brew services start postgresql@16

# Datenbank erstellen
createdb heyapply
```

### Umgebungsvariable setzen

```env
DATABASE_URL="postgresql://$(whoami)@localhost:5432/heyapply?schema=public"
```

Oder mit Passwort:
```env
DATABASE_URL="postgresql://postgres:dein-passwort@localhost:5432/heyapply?schema=public"
```

### Datenbank-Schema pushen

```bash
npx prisma db push
```

---

## Troubleshooting

### "Can't reach database server at 'localhost:5432'"

**Lösung 1: Docker verwenden**
- Stelle sicher, dass Docker Desktop läuft
- Führe `./start-db.sh` aus

**Lösung 2: PostgreSQL-Service prüfen**
```bash
# Mit Homebrew
brew services list | grep postgres

# Mit Docker
docker ps | grep postgres
```

**Lösung 3: Port prüfen**
```bash
# Prüfe ob Port 5432 belegt ist
lsof -i :5432
```

### "Authentication failed"

- Prüfe die `DATABASE_URL` in `.env.local`
- Stelle sicher, dass Benutzername und Passwort korrekt sind
- Bei Docker: Verwende `heyapply:heyapply`
- Bei Supabase: Verwende das Passwort aus den Project Settings

### "Database does not exist"

- Erstelle die Datenbank manuell:
  ```bash
  # Mit Docker
  docker-compose exec postgres psql -U heyapply -c "CREATE DATABASE heyapply;"
  
  # Mit lokaler Installation
  createdb heyapply
  ```

### Datenbank zurücksetzen

```bash
# Mit Docker
docker-compose down -v
docker-compose up -d
npx prisma db push

# Mit lokaler Installation
dropdb heyapply
createdb heyapply
npx prisma db push
```

---

## Nützliche Befehle

```bash
# Prisma Studio öffnen (Datenbank-GUI)
npm run db:studio

# Datenbank-Schema pushen
npx prisma db push

# Prisma Client neu generieren
npx prisma generate

# Migrationen erstellen (für Production)
npx prisma migrate dev --name init
```

