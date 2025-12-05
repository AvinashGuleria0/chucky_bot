import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { ragService } from '@/lib/services/rag.service'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params
    const body = await req.json()
    const { message, isChangeRequest } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const project = await prisma.project.findUnique({
      where: { 
        shareId,
        isPublic: true
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const response = await ragService.query(message, project.id, isChangeRequest || false)

    return NextResponse.json({
      message: response,
      messageId: Date.now().toString()
    })
  } catch (error) {
    console.error('Error in public chat:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}
