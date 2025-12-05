import { ProcessedChunk } from '@/types'

const CHARS_PER_TOKEN = 4 // Approximate
const MIN_CHUNK_TOKENS = 200
const MAX_CHUNK_TOKENS = 400
const OVERLAP_TOKENS = 50

export class ChunkingService {
  private calculateTokens(text: string): number {
    return Math.ceil(text.length / CHARS_PER_TOKEN)
  }

  private findCodeBoundary(content: string, position: number, direction: 'forward' | 'backward'): number {
    const lines = content.split('\n')
    let charCount = 0
    
    for (let i = 0; i < lines.length; i++) {
      charCount += lines[i].length + 1 // +1 for newline
      
      if (direction === 'forward' && charCount >= position) {
        // Try to find end of function/class
        const line = lines[i].trim()
        if (line === '}' || line === '};' || line === '') {
          return charCount
        }
      }
      
      if (direction === 'backward' && charCount >= position) {
        return charCount - lines[i].length - 1
      }
    }
    
    return position
  }

  splitIntoChunks(content: string, filePath: string, language?: string): ProcessedChunk[] {
    const chunks: ProcessedChunk[] = []
    const lines = content.split('\n')
    
    let currentChunk: string[] = []
    let currentTokens = 0
    let startLine = 1
    let chunkIndex = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineTokens = this.calculateTokens(line)
      
      if (currentTokens + lineTokens > MAX_CHUNK_TOKENS && currentChunk.length > 0) {
        // Create chunk
        const chunkContent = currentChunk.join('\n')
        chunks.push({
          id: `${filePath}-chunk-${chunkIndex}`,
          content: chunkContent,
          filePath,
          startLine,
          endLine: i,
          tokenCount: currentTokens
        })
        
        // Start new chunk with overlap
        const overlapLines = Math.ceil(OVERLAP_TOKENS * CHARS_PER_TOKEN / 50) // Approx lines for overlap
        currentChunk = currentChunk.slice(-overlapLines)
        currentTokens = this.calculateTokens(currentChunk.join('\n'))
        startLine = i - overlapLines + 1
        chunkIndex++
      }
      
      currentChunk.push(line)
      currentTokens += lineTokens
    }
    
    // Add final chunk
    if (currentChunk.length > 0) {
      chunks.push({
        id: `${filePath}-chunk-${chunkIndex}`,
        content: currentChunk.join('\n'),
        filePath,
        startLine,
        endLine: lines.length,
        tokenCount: currentTokens
      })
    }
    
    return chunks
  }

  mergeChunksForContext(chunks: Array<{ content: string, filePath: string }>): string {
    const fileGroups = new Map<string, string[]>()
    
    chunks.forEach(chunk => {
      if (!fileGroups.has(chunk.filePath)) {
        fileGroups.set(chunk.filePath, [])
      }
      fileGroups.get(chunk.filePath)!.push(chunk.content)
    })
    
    let merged = ''
    fileGroups.forEach((contents, filePath) => {
      merged += `\n\n--- File: ${filePath} ---\n\n`
      merged += contents.join('\n...\n')
    })
    
    return merged
  }
}

export const chunkingService = new ChunkingService()
