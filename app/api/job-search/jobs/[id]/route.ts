import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { id } = params
    const body = await req.json()
    const { status, applicationId } = body

    // Verify job belongs to user
    const job = await prisma.discoveredJob.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job nicht gefunden" }, { status: 404 })
    }

    // Update job
    const updated = await prisma.discoveredJob.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(applicationId && { applicationId }),
      },
    })

    return NextResponse.json({ job: updated })
  } catch (error: any) {
    console.error("Error updating job:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Aktualisieren des Jobs" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { id } = params

    // Verify job belongs to user
    const job = await prisma.discoveredJob.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job nicht gefunden" }, { status: 404 })
    }

    await prisma.discoveredJob.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Job gelöscht" })
  } catch (error: any) {
    console.error("Error deleting job:", error)
    return NextResponse.json(
      { error: error.message || "Fehler beim Löschen des Jobs" },
      { status: 500 }
    )
  }
}
