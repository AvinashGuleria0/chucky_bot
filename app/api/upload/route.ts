import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fileService } from '@/lib/services/file.service'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const projectId = formData.get('projectId') as string
    const files = formData.getAll('files') as File[]

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const results = []

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        
        // Check if it's a zip file
        if (file.name.endsWith('.zip')) {
          await fileService.processZipFile(projectId, buffer)
          results.push({ file: file.name, status: 'success', type: 'zip' })
        } else {
          const content = buffer.toString('utf-8')
          await fileService.processFile(projectId, file.name, content, file.name)
          results.push({ file: file.name, status: 'success', type: 'file' })
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        results.push({ file: file.name, status: 'error', error: String(error) })
      }
    }

    return NextResponse.json({ 
      message: 'Upload completed',
      results 
    })
  } catch (error) {
    console.error('Error handling upload:', error)
    return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const files = await fileService.getProjectFiles(projectId)
    return NextResponse.json(files)
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}
