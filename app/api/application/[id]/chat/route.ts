import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { anthropic, getAnthropicConfigError } from "@/lib/anthropic"
import { CV_SYSTEM_PROMPT } from "@/prompts/cv-system-prompt"
import { COVER_LETTER_SYSTEM_PROMPT } from "@/prompts/cover-letter-system-prompt"
import { NextResponse } from "next/server"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  // #region agent log: chat-entry
  fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'build-prisma',hypothesisId:'B',location:'app/api/application/[id]/chat/route.ts:12',message:'POST handler invoked',data:{id:params?.id},timestamp:Date.now()})}).catch(()=>{})
  // #endregion

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { message } = body

    if (!message) {
      return NextResponse.json(
        { error: "Nachricht erforderlich" },
        { status: 400 }
      )
    }

    // Get application
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        user: {
          include: {
            profile: {
              include: {
                experiences: { orderBy: { order: "asc" } },
                education: { orderBy: { order: "asc" } },
                skills: { orderBy: { order: "asc" } },
                languages: { orderBy: { order: "asc" } },
                certifications: { orderBy: { order: "asc" } },
              },
            },
          },
        },
      },
    })

    if (!application || application.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Add user message to chat
    const existingMessages = application.chatMessages 
      ? JSON.parse(application.chatMessages) 
      : []
    const chatMessages = [
      ...existingMessages,
      {
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      },
    ]

    // Determine if this is a CV or cover letter modification request
    // Default to CV if no CV exists yet, or cover letter if CV exists but no cover letter
    const messageLC = message.toLowerCase()
    const explicitCVRequest = messageLC.includes("cv") || messageLC.includes("lebenslauf")
    const explicitCoverLetterRequest = messageLC.includes("anschreiben") || messageLC.includes("cover") || messageLC.includes("motivationsschreiben")
    
    let isCVRequest: boolean
    if (explicitCVRequest && !explicitCoverLetterRequest) {
      // User explicitly asked for CV
      isCVRequest = true
    } else if (explicitCoverLetterRequest && !explicitCVRequest) {
      // User explicitly asked for cover letter
      isCVRequest = false
    } else if (!application.generatedCv) {
      // No CV yet, default to CV mode
      isCVRequest = true
    } else if (!application.coverLetter) {
      // CV exists but no cover letter, default to cover letter mode
      isCVRequest = false
    } else {
      // Both exist, default to CV mode for modifications
      isCVRequest = true
    }

    // Get context
    const profile = application.user.profile
    const user = application.user

    if (!profile) {
      return NextResponse.json(
        { error: "Profil nicht gefunden" },
        { status: 400 }
      )
    }

    // Build context prompt
    let contextPrompt = ""
    if (isCVRequest && application.generatedCv) {
      contextPrompt = `Der aktuelle CV:
${JSON.stringify(application.generatedCv, null, 2)}

Der Benutzer möchte: ${message}

Passe den CV entsprechend an. Antworte mit dem aktualisierten JSON im gleichen Format wie oben.`
    } else if (!isCVRequest && application.coverLetter) {
      contextPrompt = `Das aktuelle Anschreiben:
${application.coverLetter}

Der Benutzer möchte: ${message}

Passe das Anschreiben entsprechend an.`
    }

    // Check if Anthropic is configured
    if (!anthropic) {
      const configError = getAnthropicConfigError()
      return NextResponse.json(
        { error: configError || "Anthropic API ist nicht konfiguriert" },
        { status: 500 }
      )
    }

    // Generate response
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: isCVRequest ? CV_SYSTEM_PROMPT : COVER_LETTER_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: contextPrompt || message,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type")
    }

    const assistantMessage = content.text.trim()

    // Update application based on response
    const updatedChatMessages = [
      ...chatMessages,
      {
        role: "assistant",
        content: assistantMessage,
        timestamp: new Date().toISOString(),
      },
    ]
    let updateData: any = {
      chatMessages: JSON.stringify(updatedChatMessages),
    }

    // If CV was updated, parse and save
    if (isCVRequest) {
      const jsonMatch = assistantMessage.match(/```json\s*(\{[\s\S]*?\})\s*```/)
      const jsonText = jsonMatch ? jsonMatch[1] : assistantMessage.match(/\{[\s\S]*\}/)?.[0]
      
      if (jsonText) {
        try {
          const updatedCv = JSON.parse(jsonText)
          updateData.generatedCv = JSON.stringify(updatedCv)
        } catch (e) {
          console.error("Could not parse CV from chat response")
        }
      }
    } else {
      // Cover letter update
      const coverLetterMatch = assistantMessage.match(/Anschreiben:?\s*([\s\S]*)/i)
      if (coverLetterMatch) {
        updateData.coverLetter = coverLetterMatch[1].trim()
      } else if (assistantMessage.length > 100 && !assistantMessage.includes("```")) {
        updateData.coverLetter = assistantMessage
      }
    }

    const updated = await prisma.application.update({
      where: { id: params.id },
      data: updateData,
    })

    // Parse chatMessages before returning
    const parsedApplication = {
      ...updated,
      chatMessages: updated.chatMessages 
        ? (typeof updated.chatMessages === 'string' 
            ? JSON.parse(updated.chatMessages) 
            : updated.chatMessages)
        : []
    }

    return NextResponse.json({
      application: parsedApplication,
      message: assistantMessage,
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json(
      { error: "Fehler beim Verarbeiten der Nachricht" },
      { status: 500 }
    )
  }
}

