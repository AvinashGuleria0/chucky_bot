import { NextResponse } from 'next/server'
import { embeddingService } from '@/lib/services/embedding.service'

// Vercel function warming endpoint
export async function GET() {
  try {
    // Pre-load the embedding model
    await embeddingService.createEmbedding('warmup')
    
    return NextResponse.json({ 
      status: 'ready',
      message: 'Embedding model loaded',
      progress: embeddingService.getLoadingProgress()
    })
  } catch (error) {
    console.error('Warmup failed:', error)
    return NextResponse.json({ 
      status: 'error',
      message: 'Failed to load model'
    }, { status: 500 })
  }
}

// Prevent timeout
export const maxDuration = 60
