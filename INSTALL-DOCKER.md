# 🐳 Docker Desktop Installation

## Schritt 1: Docker Desktop herunterladen

1. Gehe zu: **https://www.docker.com/products/docker-desktop**
2. Klicke auf "Download for Mac"
3. Wähle die richtige Version:
   - **Apple Silicon (M1/M2/M3)**: Docker Desktop für Apple Silicon
   - **Intel Mac**: Docker Desktop für Intel

## Schritt 2: Docker Desktop installieren

1. Öffne die heruntergeladene `.dmg` Datei
2. Ziehe Docker in den Applications-Ordner
3. Öffne Docker Desktop aus dem Applications-Ordner
4. Folge den Installationsanweisungen
5. **Wichtig**: Docker Desktop muss laufen (Icon in der Menüleiste)

## Schritt 3: Datenbank starten

Nach der Installation:

```bash
./start-db.sh
```

Das Skript wird automatisch:
- Docker Desktop starten (falls nicht läuft)
- PostgreSQL Container starten
- Auf die Datenbank warten

## Schritt 4: Datenbank-Schema einrichten

```bash
# Stelle sicher, dass .env.local die richtige DATABASE_URL hat:
# DATABASE_URL="postgresql://heyapply:heyapply@localhost:5432/heyapply?schema=public"

npx prisma db push
```

## Alternative: Homebrew Installation

```bash
brew install --cask docker
```

Dann Docker Desktop öffnen und starten.

