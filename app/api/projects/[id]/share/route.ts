import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { randomBytes } from 'crypto'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const projectId = id

    const project = await prisma.project.findFirst({
      where: { 
        id: projectId, 
        createdById: session.user.id 
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.shareId) {
      return NextResponse.json({ shareId: project.shareId })
    }

    const shareId = randomBytes(16).toString('hex')

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { 
        shareId,
        isPublic: true
      }
    })

    return NextResponse.json({ shareId: updated.shareId })
  } catch (error) {
    console.error('Error generating share link:', error)
    return NextResponse.json({ error: 'Failed to generate share link' }, { status: 500 })
  }
}
