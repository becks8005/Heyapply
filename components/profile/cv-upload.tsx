"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CVUploadProps {
  onUpload: (file: File) => Promise<void>
  isUploading?: boolean
}

export function CVUpload({ onUpload, isUploading }: CVUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setIsProcessing(true)
    try {
      await onUpload(file)
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10 MB
  })

  const isLoading = isUploading || isProcessing

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
        transition-colors
        ${isDragActive ? "border-[var(--accent-500)] bg-[var(--accent-500)]/10" : "border-[var(--border-default)] hover:border-[var(--border-strong)]"}
        ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input {...getInputProps()} disabled={isLoading} />
      {isLoading ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-[var(--accent-500)] animate-spin" />
          <div>
            <p className="text-lg font-medium text-[var(--text-primary)]">
              {isUploading ? "CV wird hochgeladen..." : "CV wird analysiert..."}
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Bitte warten...</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Upload className="h-12 w-12 text-[var(--text-muted)]" />
          <div>
            <p className="text-lg font-medium text-[var(--text-primary)]">
              {isDragActive ? "Datei hier ablegen" : "Klicken zum Hochladen oder Datei hier ablegen"}
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              PDF, DOCX, PPTX werden akzeptiert
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

