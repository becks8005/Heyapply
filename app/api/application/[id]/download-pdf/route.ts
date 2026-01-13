import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { generateCVPdf, generateCoverLetterPdf } from "@/lib/pdf-generator"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") // "cv" or "cover-letter"

    if (!type || !["cv", "cover-letter"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type" },
        { status: 400 }
      )
    }

    // Get application
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        user: {
          include: {
            profile: true,
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

    if (type === "cv" && !application.generatedCv) {
      return NextResponse.json(
        { error: "CV not generated" },
        { status: 400 }
      )
    }

    if (type === "cover-letter" && !application.coverLetter) {
      return NextResponse.json(
        { error: "Cover letter not generated" },
        { status: 400 }
      )
    }

    // Generate PDF
    let pdfDoc: React.ReactElement

    if (type === "cv") {
      const cvData = application.generatedCv 
        ? JSON.parse(application.generatedCv) 
        : {}
      pdfDoc = generateCVPdf(
        cvData,
        application.user,
        application.user.profileImageUrl || undefined
      )
    } else {
      // Parse CV data if available to use CV header in cover letter
      let cvData = null
      if (application.generatedCv) {
        try {
          cvData = JSON.parse(application.generatedCv)
        } catch (error) {
          console.error("Error parsing CV data for cover letter:", error)
        }
      }
      
      pdfDoc = generateCoverLetterPdf(
        application.coverLetter!,
        application.user,
        application.user.profile || {},
        application.jobTitle,
        application.company,
        application.user.profileImageUrl || undefined,
        cvData
      )
    }

    // Render to buffer
    const buffer = await renderToBuffer(pdfDoc)

    // Generate filename
    const firstName = application.user.firstName || ""
    const lastName = application.user.lastName || ""
    const company = application.company.replace(/[^a-zA-Z0-9]/g, "_")
    const filename = type === "cv"
      ? `CV_${firstName}${lastName}_${company}.pdf`
      : `Anschreiben_${firstName}${lastName}_${company}.pdf`

    // Return PDF
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json(
      { error: "Fehler beim Generieren des PDFs" },
      { status: 500 }
    )
  }
}

