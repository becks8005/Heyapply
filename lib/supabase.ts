import { createClient, SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase: SupabaseClient | null = 
  supabaseUrl && supabaseKey 
    ? createClient(supabaseUrl, supabaseKey)
    : null

/**
 * Prüft ob Supabase konfiguriert ist
 * 
 * Auf der Client-Seite wird nur NEXT_PUBLIC_SUPABASE_URL geprüft,
 * da SUPABASE_SERVICE_ROLE_KEY aus Sicherheitsgründen nicht verfügbar ist.
 * 
 * @param checkServerSide Wenn true, wird auch SUPABASE_SERVICE_ROLE_KEY geprüft (nur serverseitig)
 * @returns true wenn Supabase konfiguriert ist, false sonst
 */
export function isSupabaseConfigured(checkServerSide: boolean = false): boolean {
  if (checkServerSide) {
    // Server-seitige Prüfung: beide Variablen müssen gesetzt sein
    return supabase !== null
  } else {
    // Client-seitige Prüfung: nur die öffentliche URL muss gesetzt sein
    return !!supabaseUrl
  }
}

/**
 * Gibt eine benutzerfreundliche Fehlermeldung zurück wenn Supabase nicht konfiguriert ist
 * @param featureName Name des Features das Supabase benötigt (z.B. "CV-Upload")
 * @param checkServerSide Wenn true, wird auch SUPABASE_SERVICE_ROLE_KEY geprüft (nur serverseitig)
 * @returns Fehlermeldung oder null wenn konfiguriert
 */
export function getSupabaseConfigError(featureName: string, checkServerSide: boolean = false): string | null {
  if (isSupabaseConfigured(checkServerSide)) {
    return null
  }
  
  const missingVars: string[] = []
  if (!supabaseUrl) missingVars.push("NEXT_PUBLIC_SUPABASE_URL")
  if (checkServerSide && !supabaseKey) missingVars.push("SUPABASE_SERVICE_ROLE_KEY")
  
  return `${featureName} erfordert Supabase. Bitte konfiguriere ${missingVars.join(" und ")} in deiner .env.local Datei. Siehe SETUP-FREE-TIERS.md für Anleitung.`
}

