import { prisma } from '@/lib/db/prisma'
import { chunkingService } from './chunking.service'
import { embeddingService } from './embedding.service'
import { vectorService } from './vector.service'
import AdmZip from 'adm-zip'
import path from 'path'

const SUPPORTED_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs',
  '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala', '.sh',
  '.json', '.yaml', '.yml', '.md', '.txt', '.sql', '.html', '.css'
]

export class FileService {
  private detectLanguage(filename: string): string {
    const ext = path.extname(filename).toLowerCase()
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.rb': 'ruby',
      '.php': 'php',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala',
      '.sh': 'bash',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown',
      '.sql': 'sql',
      '.html': 'html',
      '.css': 'css'
    }
    return languageMap[ext] || 'plaintext'
  }

  async processFile(
    projectId: string,
    filename: string,
    content: string,
    filePath: string
  ): Promise<void> {
    try {
      const language = this.detectLanguage(filename)
      const size = Buffer.byteLength(content, 'utf8')

      // Store file
      const file = await prisma.file.create({
        data: {
          projectId,
          name: filename,
          path: filePath,
          language,
          size,
          content
        }
      })

      // Chunk the file
      const chunks = chunkingService.splitIntoChunks(content, filePath, language)

      // Store chunks and create embeddings
      for (const chunk of chunks) {
        const fileChunk = await prisma.fileChunk.create({
          data: {
            fileId: file.id,
            projectId,
            index: chunks.indexOf(chunk),
            content: chunk.content,
            tokenCount: chunk.tokenCount
          }
        })

        // Create embedding
        const embedding = await embeddingService.createEmbedding(chunk.content)
        await vectorService.storeEmbedding(fileChunk.id, projectId, embedding)
      }

      console.log(`Processed file: ${filename}, chunks: ${chunks.length}`)
    } catch (error) {
      console.error(`Error processing file ${filename}:`, error)
      throw error
    }
  }

  async processZipFile(projectId: string, zipBuffer: Buffer): Promise<void> {
    try {
      const zip = new AdmZip(zipBuffer)
      const zipEntries = zip.getEntries()

      for (const entry of zipEntries) {
        if (entry.isDirectory) continue

        const filename = entry.entryName
        const ext = path.extname(filename).toLowerCase()

        // Skip unsupported files
        if (!SUPPORTED_EXTENSIONS.includes(ext)) continue

        // Skip node_modules, .git, etc.
        if (
          filename.includes('node_modules/') ||
          filename.includes('.git/') ||
          filename.includes('dist/') ||
          filename.includes('build/')
        ) {
          continue
        }

        const content = entry.getData().toString('utf8')
        await this.processFile(projectId, path.basename(filename), content, filename)
      }
    } catch (error) {
      console.error('Error processing zip file:', error)
      throw new Error('Failed to process zip file')
    }
  }

  async getProjectFiles(projectId: string) {
    return await prisma.file.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        path: true,
        language: true,
        size: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async deleteFile(fileId: string, projectId: string) {
    await prisma.file.delete({
      where: { id: fileId, projectId }
    })
  }
}

export const fileService = new FileService()
