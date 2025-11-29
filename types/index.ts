export interface FileChunk {
  id: string
  content: string
  filePath: string
  startLine: number
  endLine: number
  tokenCount: number
}

export interface EmbeddingResult {
  chunkId: string
  embedding: number[]
}

export interface RAGContext {
  chunks: Array<{
    content: string
    filePath: string
    similarity: number
  }>
  query: string
}

export interface ChatMessage {
  id: string
  sender: 'USER' | 'AI'
  content: string
  timestamp: Date
}

export interface ImpactAnalysis {
  effortBucket: 'XS' | 'S' | 'M' | 'L' | 'XL'
  timeRange: string
  affectedFiles: string[]
  edgeCases: string[]
  challenges: string[]
  recommendations: string[]
}

export interface ProjectUpload {
  files: File[]
  projectId: string
}

export interface ChunkWithEmbedding {
  id: string
  content: string
  filePath: string
  embedding?: number[]
}
