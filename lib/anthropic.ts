import Anthropic from "@anthropic-ai/sdk"

const apiKey = process.env.ANTHROPIC_API_KEY

if (!apiKey && process.env.NODE_ENV === "development") {
  console.warn("⚠️  ANTHROPIC_API_KEY nicht konfiguriert. AI-Features (CV/Anschreiben-Generierung) funktionieren nicht.")
}

export const anthropic = apiKey ? new Anthropic({ apiKey }) : null

/**
 * Prüft ob Anthropic API konfiguriert ist
 */
export function isAnthropicConfigured(): boolean {
  return anthropic !== null
}

/**
 * Gibt eine benutzerfreundliche Fehlermeldung zurück wenn Anthropic nicht konfiguriert ist
 */
export function getAnthropicConfigError(): string | null {
  if (isAnthropicConfigured()) {
    return null
  }
  return "Anthropic API ist nicht konfiguriert. Bitte setze ANTHROPIC_API_KEY in deiner .env.local Datei. Siehe SETUP-FREE-TIERS.md für Anleitung."
}

