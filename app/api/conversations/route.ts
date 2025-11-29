import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        projectId,
        userId: session.user.id
      },
      include: {
        _count: {
          select: { messages: true }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            sender: true,
            createdAt: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Add preview from first message
    const conversationsWithPreview = conversations.map(conv => ({
      ...conv,
      preview: conv.messages[0]?.content?.slice(0, 60) || 'New conversation'
    }))

    return NextResponse.json(conversationsWithPreview)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}
