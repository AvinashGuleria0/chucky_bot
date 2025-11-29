import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { ragService } from '@/lib/services/rag.service'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { projectId, conversationId, message, isChangeRequest } = body

    if (!projectId || !message) {
      return NextResponse.json(
        { error: 'Project ID and message are required' },
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
        content: message
      }
    })

    // Generate AI response
    const response = await ragService.query(message, projectId, isChangeRequest || false)

    // Store AI message
    const aiMessage = await prisma.message.create({
      data: {
        conversationId: conversation!.id,
        sender: 'AI',
        content: response
      }
    })

    return NextResponse.json({
      conversationId: conversation!.id,
      message: response,
      messageId: aiMessage.id
    })
  } catch (error) {
    console.error('Error in chat:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}
