# 🆓 Setup-Anleitung für kostenlose Service-Tiers

Diese Anleitung zeigt dir, wie du alle benötigten Services für Heyapply mit kostenlosen Tiers einrichtest.

## Übersicht der kostenlosen Limits

| Service | Free Tier Limit | Für MVP ausreichend? |
|---------|----------------|---------------------|
| **Supabase** | 500MB Storage, 2GB Bandwidth/Monat | ✅ Ja |
| **Resend** | 100 E-Mails/Tag, 3000/Monat | ✅ Ja |
| **Anthropic** | Pay-as-you-go (~$0.25/1M Tokens) | ✅ Ja (sehr günstig) |
| **LinkedIn OAuth** | Kostenlos, unbegrenzt | ✅ Ja |
| **Stripe Test Mode** | Kostenlos, unbegrenzt | ✅ Ja |

---

## 1. Supabase (File Storage) - Free Tier

### Warum Supabase?
- Speichert CVs und Profilbilder
- 500MB Storage reichen für ~500 CVs (je ~1MB)
- 2GB Bandwidth/Monat für Downloads

### Setup-Schritte

1. **Account erstellen**
   - Gehe zu https://supabase.com/
   - Klicke auf "Start your project"
   - Erstelle einen neuen Account (kostenlos)

2. **Neues Projekt erstellen**
   - Klicke auf "New Project"
   - Wähle eine Organisation
   - Projektname: `heyapply` (oder dein Name)
   - Datenbank-Passwort: Wähle ein sicheres Passwort (speichere es!)
   - Region: Wähle die nächstgelegene Region
   - Klicke auf "Create new project" (dauert ~2 Minuten)

3. **API Keys holen**
   - Gehe zu Project Settings → API
   - Kopiere `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Kopiere `service_role` Key → `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **Wichtig**: Der `service_role` Key hat Admin-Rechte, niemals im Frontend verwenden!

4. **Storage Buckets erstellen**
   - Gehe zu Storage im linken Menü
   - Klicke auf "New bucket"
   - **Bucket 1**: Name `cvs`, Public: ✅ Ja
   - **Bucket 2**: Name `profile-images`, Public: ✅ Ja
   - Beide Buckets müssen öffentlich lesbar sein (für Public URLs)

5. **In .env.local eintragen**
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

### Kosten
- **Free Tier**: 500MB Storage, 2GB Bandwidth/Monat
- **Kostenlos für MVP**: ✅ Ja

---

## 2. Resend (E-Mail) - Free Tier

### Warum Resend?
- Versendet E-Mail-Verifizierungslinks
- Versendet Passwort-Reset-Links
- 100 E-Mails/Tag reichen für MVP-Tests

### Setup-Schritte

1. **Account erstellen**
   - Gehe zu https://resend.com/
   - Klicke auf "Get Started"
   - Erstelle einen kostenlosen Account

2. **API Key erstellen**
   - Gehe zu API Keys
   - Klicke auf "Create API Key"
   - Name: `heyapply-production` (oder `heyapply-development`)
   - Kopiere den API Key (beginnt mit `re_`)

3. **Domain verifizieren (optional für Production)**
   - Für Development kannst du die Standard-Domain verwenden
   - Für Production: Füge deine Domain hinzu und verifiziere sie

4. **In .env.local eintragen**
   ```env
   RESEND_API_KEY="re_..."
   EMAIL_FROM="Heyapply <noreply@heyapply.ch>"
   ```
   - Für Development: Verwende `onboarding@resend.dev` (funktioniert ohne Domain-Verifizierung)
   - Für Production: Verwende deine verifizierte Domain

### Kosten
- **Free Tier**: 100 E-Mails/Tag, 3000/Monat
- **Kostenlos für MVP**: ✅ Ja

### Ohne Resend
- E-Mail-Verifizierung wird automatisch übersprungen
- User kann direkt nach Registrierung einloggen
- Passwort-Reset funktioniert nicht

---

## 3. Anthropic Claude API

### Warum Anthropic?
- Generiert CVs und Anschreiben mit Claude AI
- Sehr günstig: ~$0.25 pro 1M Input Tokens
- Für MVP: ~$1-5 für 100 Bewerbungen

### Setup-Schritte

1. **Account erstellen**
   - Gehe zu https://console.anthropic.com/
   - Klicke auf "Sign Up"
   - Erstelle einen Account

2. **API Key erstellen**
   - Gehe zu API Keys
   - Klicke auf "Create Key"
   - Name: `heyapply`
   - Kopiere den API Key (beginnt mit `sk-ant-`)

3. **Credits aufladen (Pay-as-you-go)**
   - Gehe zu Billing
   - Füge eine Zahlungsmethode hinzu
   - Mindestbetrag: $5 (für MVP-Tests ausreichend)

4. **In .env.local eintragen**
   ```env
   ANTHROPIC_API_KEY="sk-ant-..."
   ```

### Kosten
- **Pay-as-you-go**: ~$0.25 pro 1M Input Tokens
- **Typische Kosten pro Bewerbung**: ~$0.01-0.05
- **Für 100 Bewerbungen**: ~$1-5

### ⚠️ Wichtig
- Anthropic API ist **ERFORDERLICH** für CV/Anschreiben-Generierung
- Ohne API Key funktionieren die AI-Features nicht

---

## 4. LinkedIn OAuth - Kostenlos

### Warum LinkedIn?
- Importiert Profildaten automatisch
- Spart Zeit beim Profil-Ausfüllen
- Kostenlos, keine Limits

### Setup-Schritte

1. **LinkedIn App erstellen**
   - Gehe zu https://www.linkedin.com/developers/apps
   - Klicke auf "Create app"
   - App Name: `Heyapply`
   - Company: Wähle deine Firma oder erstelle eine
   - Privacy Policy URL: `https://heyapply.ch/privacy` (oder deine URL)
   - App Logo: Optional
   - Klicke auf "Create app"

2. **OAuth 2.0 konfigurieren**
   - Gehe zu "Auth" im linken Menü
   - Unter "Redirect URLs" füge hinzu:
     - Development: `http://localhost:3000/api/profile/linkedin?action=callback`
     - Production: `https://heyapply.ch/api/profile/linkedin?action=callback`
   - Scopes: Aktiviere `openid`, `profile`, `email`

3. **API Keys holen**
   - Gehe zu "Auth"
   - Kopiere `Client ID` → `LINKEDIN_CLIENT_ID`
   - Kopiere `Client Secret` → `LINKEDIN_CLIENT_SECRET`

4. **In .env.local eintragen**
   ```env
   LINKEDIN_CLIENT_ID="..."
   LINKEDIN_CLIENT_SECRET="..."
   ```

### Kosten
- **Kostenlos**: ✅ Ja, keine Limits

### Ohne LinkedIn
- LinkedIn-Import funktioniert nicht
- User muss Profil manuell ausfüllen oder CV hochladen

---

## 5. Stripe (Zahlungen) - Test Mode

### Warum Stripe?
- Verwaltet Subscriptions (Basis/Pro)
- Test Mode: Kostenlos, unbegrenzt
- Für Production: 2.9% + 0.30 CHF pro Transaktion

### Setup-Schritte

1. **Account erstellen**
   - Gehe zu https://stripe.com/
   - Klicke auf "Start now"
   - Erstelle einen Account

2. **Test Mode aktivieren**
   - Stripe läuft standardmäßig im Test Mode
   - Test API Keys beginnen mit `sk_test_` und `pk_test_`

3. **API Keys holen**
   - Gehe zu Developers → API Keys
   - Kopiere `Secret key` → `STRIPE_SECRET_KEY`
   - (Public key wird nicht benötigt für Backend)

4. **Products & Prices erstellen**
   - Gehe zu Products
   - Klicke auf "Add product"
   
   **Product 1: Basis-Abo**
   - Name: `Basis`
   - Description: `10 Bewerbungen pro Monat`
   - Pricing: Recurring, CHF 9.99/Monat
   - Kopiere `Price ID` (beginnt mit `price_`) → `STRIPE_PRICE_BASIS`
   
   **Product 2: Pro-Abo**
   - Name: `Pro`
   - Description: `Unlimitiert Bewerbungen`
   - Pricing: Recurring, CHF 19.99/Monat
   - Kopiere `Price ID` → `STRIPE_PRICE_PRO`

5. **Webhook konfigurieren**
   - Gehe zu Developers → Webhooks
   - Klicke auf "Add endpoint"
   - Endpoint URL: `https://heyapply.ch/api/stripe/webhook` (für Production)
   - Für lokale Tests: Verwende Stripe CLI (siehe unten)
   - Events: Wähle `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Kopiere `Signing secret` → `STRIPE_WEBHOOK_SECRET`

6. **In .env.local eintragen**
   ```env
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   STRIPE_PRICE_BASIS="price_..."
   STRIPE_PRICE_PRO="price_..."
   ```

### Stripe CLI für lokale Tests

Für lokale Webhook-Tests:

```bash
# Stripe CLI installieren
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Webhook weiterleiten
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Kosten
- **Test Mode**: ✅ Kostenlos, unbegrenzt
- **Production**: 2.9% + 0.30 CHF pro Transaktion

### Ohne Stripe
- Zahlungen funktionieren nicht
- User kann keine Abos abschließen
- App läuft trotzdem (mit FREE Tier)

---

## Quick Start Checkliste

- [ ] Supabase Account erstellt und Buckets konfiguriert
- [ ] Resend Account erstellt und API Key geholt
- [ ] Anthropic Account erstellt und API Key geholt (ERFORDERLICH)
- [ ] LinkedIn App erstellt und OAuth konfiguriert (optional)
- [ ] Stripe Account erstellt und Products/Prices erstellt (optional)
- [ ] Alle Keys in `.env.local` eingetragen
- [ ] Server neu gestartet: `npm run dev`

## MVP Minimum

Für ein funktionierendes MVP benötigst du **mindestens**:
1. ✅ Anthropic API Key (für AI-Features)
2. ✅ Supabase (für File Uploads)
3. ✅ Resend (für E-Mail-Verifizierung)

**Optional aber empfohlen:**
- LinkedIn OAuth (für Profil-Import)
- Stripe (für Zahlungen)

## Hilfe & Support

- **Supabase Docs**: https://supabase.com/docs
- **Resend Docs**: https://resend.com/docs
- **Anthropic Docs**: https://docs.anthropic.com/
- **LinkedIn Docs**: https://learn.microsoft.com/en-us/linkedin/
- **Stripe Docs**: https://stripe.com/docs

