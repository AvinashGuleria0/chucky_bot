export interface FileChunk {
  id: string
  content: string
  filePath: string
  similarity: number
}

export interface ProcessedChunk {
  id: string
  content: string
  filePath: string
  startLine: number
  endLine: number
  tokenCount: number
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
