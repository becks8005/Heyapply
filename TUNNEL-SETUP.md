# 🌐 Tunnel-Setup für Mobile & Freunde

## Einfachste Lösung - Alles automatisch!

### Option 1: Alles auf einmal starten (empfohlen)

```bash
npm run start:tunnel
```

Oder direkt:
```bash
./start-with-tunnel.sh
```

**Das macht automatisch:**
- ✅ Startet den Development Server
- ✅ Startet den Tunnel mit fester URL
- ✅ Zeigt dir die öffentliche URL
- ✅ Speichert die URL in `.tunnel-url.txt`

**Keine Eingabe nötig!** Die URL bleibt immer gleich.

### Option 2: Nur Tunnel (wenn Server schon läuft)

```bash
npm run tunnel:auto
```

Oder direkt:
```bash
./start-tunnel-auto.sh
```

## Feste URL konfigurieren

Füge in deine `.env.local` Datei hinzu:

```env
# Tunnel Subdomain (für feste URL)
TUNNEL_SUBDOMAIN="heyapply-test"
```

**Wichtig:** 
- Die Subdomain muss eindeutig sein (wird automatisch generiert, wenn nicht gesetzt)
- Die URL ist dann: `https://heyapply-test.loca.lt`
- Diese URL bleibt immer gleich!

## Die öffentliche URL verwenden

1. **Die URL wird angezeigt** wenn du den Tunnel startest
2. **Oder schaue in `.tunnel-url.txt`** - dort steht die URL
3. **Teile die URL** mit Freunden oder öffne sie auf deinem Mobile

**Beispiel:**
```
https://heyapply-test.loca.lt
```

## Für Freunde

Einfach die URL weiterleiten - sie können sie direkt im Browser öffnen:
- ✅ Auf Mobile
- ✅ Auf Laptop
- ✅ Von überall

**Keine Installation oder Terminal nötig!**

## Troubleshooting

**Subdomain bereits vergeben?**
- Ändere `TUNNEL_SUBDOMAIN` in `.env.local` zu etwas anderem
- Z.B. `TUNNEL_SUBDOMAIN="heyapply-deinname"`

**Server läuft nicht?**
- Starte zuerst: `npm run dev`
- Dann: `npm run tunnel:auto`

**URL funktioniert nicht?**
- Stelle sicher, dass der Tunnel läuft
- Prüfe, ob der Server auf Port 3000 läuft
- Warte ein paar Sekunden nach dem Start
