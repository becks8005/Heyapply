import fs from "fs/promises"
import path from "path"

/**
 * Lokale Dateispeicherung als Fallback für Development
 * NUR für Development-Modus, nicht für Production!
 */

const UPLOADS_DIR = path.join(process.cwd(), "uploads")
const CVS_DIR = path.join(UPLOADS_DIR, "cvs")
const PROFILE_IMAGES_DIR = path.join(UPLOADS_DIR, "profile-images")

/**
 * Initialisiert die Upload-Verzeichnisse
 */
async function ensureDirectories() {
  if (process.env.NODE_ENV !== "development") {
    return false
  }

  try {
    await fs.mkdir(CVS_DIR, { recursive: true })
    await fs.mkdir(PROFILE_IMAGES_DIR, { recursive: true })
    return true
  } catch (error) {
    console.error("Failed to create upload directories:", error)
    return false
  }
}

/**
 * Speichert eine Datei lokal (nur Development)
 * @param fileBuffer Buffer der Datei
 * @param fileName Dateiname (mit Pfad)
 * @param bucket "cvs" oder "profile-images"
 * @returns Public URL oder null wenn fehlgeschlagen
 */
export async function saveFileLocally(
  fileBuffer: Buffer,
  fileName: string,
  bucket: "cvs" | "profile-images"
): Promise<string | null> {
  // Nur im Development-Modus
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  const dir = bucket === "cvs" ? CVS_DIR : PROFILE_IMAGES_DIR
  const filePath = path.join(dir, fileName)

  try {
    // Stelle sicher, dass das Verzeichnis existiert
    await fs.mkdir(path.dirname(filePath), { recursive: true })

    // Speichere die Datei
    await fs.writeFile(filePath, fileBuffer)

    // Erstelle eine Public URL (für Development)
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const publicUrl = `${baseUrl}/api/uploads/${bucket}/${fileName}`

    console.warn(`⚠️  Lokale Dateispeicherung verwendet (nur Development): ${publicUrl}`)
    return publicUrl
  } catch (error) {
    console.error("Failed to save file locally:", error)
    return null
  }
}

/**
 * Prüft ob lokale Speicherung verfügbar ist
 */
export async function isLocalStorageAvailable(): Promise<boolean> {
  if (process.env.NODE_ENV !== "development") {
    return false
  }
  return await ensureDirectories()
}

/**
 * Löscht eine lokal gespeicherte Datei
 */
export async function deleteLocalFile(
  fileName: string,
  bucket: "cvs" | "profile-images"
): Promise<boolean> {
  if (process.env.NODE_ENV !== "development") {
    return false
  }

  const dir = bucket === "cvs" ? CVS_DIR : PROFILE_IMAGES_DIR
  const filePath = path.join(dir, fileName)

  try {
    await fs.unlink(filePath)
    return true
  } catch (error) {
    // Datei existiert nicht oder kann nicht gelöscht werden - kein Fehler
    return false
  }
}

