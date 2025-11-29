import { pipeline, env } from '@xenova/transformers'

// Disable local model cache to avoid permission issues
env.cacheDir = './.cache'

export class EmbeddingService {
  private model: any = null
  private modelPromise: Promise<any> | null = null

  private async getModel() {
    if (this.model) return this.model
    
    if (!this.modelPromise) {
      console.log('Loading BGE embedding model...')
      this.modelPromise = pipeline('feature-extraction', 'Xenova/bge-base-en-v1.5')
    }
    
    this.model = await this.modelPromise
    console.log('BGE model loaded successfully')
    return this.model
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const extractor = await this.getModel()
      const output = await extractor(text, { pooling: 'mean', normalize: true })
      
      // Convert to regular array and ensure 768 dimensions
      const embedding = Array.from(output.data) as number[]
      return this.padOrTruncate(embedding, 768)
    } catch (error: any) {
      console.error('Error creating embedding:', error)
      console.warn('Falling back to simple embedding.')
      return this.textToEmbedding(text)
    }
  }

  private textToEmbedding(text: string): number[] {
    const embedding = new Array(768).fill(0)
    const words = text.toLowerCase().split(/\s+/)
    
    for (let i = 0; i < text.length && i < 768; i++) {
      const char = text.charCodeAt(i)
      embedding[i] += Math.sin(char * 0.01) * 0.5
      embedding[(i + 100) % 768] += Math.cos(char * 0.02) * 0.3
    }
    
    words.forEach((word, idx) => {
      const hash = this.simpleHash(word)
      embedding[hash % 768] += 0.1
      embedding[(hash * 7) % 768] += 0.05
    })
    
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  private padOrTruncate(embedding: number[], targetDim: number): number[] {
    if (embedding.length === targetDim) return embedding
    if (embedding.length > targetDim) return embedding.slice(0, targetDim)
    
    const padded = [...embedding]
    while (padded.length < targetDim) {
      padded.push(0)
    }
    return padded
  }

  async createBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddings: number[][] = []
      for (const text of texts) {
        const embedding = await this.createEmbedding(text)
        embeddings.push(embedding)
      }
      return embeddings
    } catch (error) {
      console.error('Error creating batch embeddings:', error)
      return texts.map(text => this.textToEmbedding(text))
    }
  }
}

export const embeddingService = new EmbeddingService()