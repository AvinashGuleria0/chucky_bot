import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { impactService } from '@/lib/services/impact.service'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { projectId, conversationId, changeRequest } = body

    if (!projectId || !changeRequest) {
      return NextResponse.json(
        { error: 'Project ID and change request are required' },
        { status: 400 }
      )
    }

    // Get or create conversation
    let conversation
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      })
    } else {
      conversation = await prisma.conversation.create({
        data: {
          projectId,
          userId: session.user.id
        }
      })
    }

    // Store user message
    await prisma.message.create({
      data: {
        conversationId: conversation!.id,
        sender: 'USER',
        content: changeRequest
      }
    })

    // Analyze the change request
    const { message, analysis } = await impactService.analyzeChangeRequest(
      changeRequest,
      projectId,
      conversation!.id,
      session.user.id
    )

    return NextResponse.json({
      conversationId: conversation!.id,
      message: message,
      analysis: analysis,
      messageId: message.id
    })
  } catch (error) {
    console.error('Error analyzing impact:', error)
    return NextResponse.json(
      { error: 'Failed to analyze impact' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const messageId = searchParams.get('messageId')

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    const report = await impactService.getImpactReport(messageId)

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error fetching impact report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    )
  }
}
