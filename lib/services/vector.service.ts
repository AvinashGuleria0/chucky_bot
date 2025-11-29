import { prisma } from '@/lib/db/prisma'
import { embeddingService } from './embedding.service'

export class VectorService {
  async storeEmbedding(
    fileChunkId: string,
    projectId: string,
    embedding: number[]
  ): Promise<void> {
    try {
      // Convert embedding array to PostgreSQL vector format
      const vectorString = `[${embedding.join(',')}]`
      
      await prisma.$executeRaw`
        INSERT INTO chunk_embeddings (id, "fileChunkId", "projectId", embedding, "createdAt")
        VALUES (gen_random_uuid(), ${fileChunkId}, ${projectId}, ${vectorString}::vector, NOW())
        ON CONFLICT ("fileChunkId") DO UPDATE 
        SET embedding = ${vectorString}::vector
      `
    } catch (error) {
      console.error('Error storing embedding:', error)
      throw new Error('Failed to store embedding')
    }
  }

  async findSimilarChunks(
    queryEmbedding: number[],
    projectId: string,
    limit: number = 5
  ): Promise<Array<{ content: string; filePath: string; similarity: number }>> {
    try {
      const vectorString = `[${queryEmbedding.join(',')}]`
      
      const results = await prisma.$queryRaw<
        Array<{
          content: string
          file_path: string
          similarity: number
        }>
      >`
        SELECT 
          fc.content,
          f.path as file_path,
          1 - (ce.embedding <=> ${vectorString}::vector) as similarity
        FROM chunk_embeddings ce
        JOIN file_chunks fc ON fc.id = ce."fileChunkId"
        JOIN files f ON f.id = fc."fileId"
        WHERE ce."projectId" = ${projectId}
        ORDER BY ce.embedding <=> ${vectorString}::vector
        LIMIT ${limit}
      `
      
      return results.map(r => ({
        content: r.content,
        filePath: r.file_path,
        similarity: Number(r.similarity)
      }))
    } catch (error) {
      console.error('Error finding similar chunks:', error)
      throw new Error('Failed to find similar chunks')
    }
  }

  async searchByQuery(
    query: string,
    projectId: string,
    limit: number = 5
  ): Promise<Array<{ content: string; filePath: string; similarity: number }>> {
    try {
      // Create embedding for query
      const queryEmbedding = await embeddingService.createEmbedding(query)
      
      // Find similar chunks
      return await this.findSimilarChunks(queryEmbedding, projectId, limit)
    } catch (error) {
      console.error('Error searching by query:', error)
      throw new Error('Failed to search by query')
    }
  }
}

export const vectorService = new VectorService()
