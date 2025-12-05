import { prisma } from '@/lib/db/prisma'
import { ragService } from './rag.service'
import { ImpactAnalysis } from '@/types'

export class ImpactService {
  async analyzeChangeRequest(userRequest: string, projectId: string, conversationId: string, userId: string): Promise<{ message: any, analysis: ImpactAnalysis }> {
    try {
      const response = await ragService.query(userRequest, projectId, true)

      let analysis: any
      try {
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/{[\s\S]*}/)
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response
        analysis = JSON.parse(jsonStr)
      } catch (e) {
        console.error('Failed to parse impact analysis JSON:', e)
        analysis = {
          overview: response.substring(0, 200),
          affectedFiles: [],
          edgeCases: [],
          challenges: [],
          risks: [],
          recommendedApproach: response,
          effortBucket: 'M',
          timeRange: '2-3 days',
          detailedBreakdown: response
        }
      }

      // Store the parsed analysis object directly (not stringified)
      const message = await prisma.message.create({
        data: {
          conversationId,
          sender: 'AI',
          content: JSON.stringify(analysis),
          rawContext: analysis
        }
      })

      await prisma.impactReport.create({
        data: {
          messageId: message.id,
          effortBucket: analysis.effortBucket || 'M',
          timeRange: analysis.timeRange || 'Unknown',
          edgeCases: analysis.edgeCases || [],
          challenges: analysis.challenges || [],
          affectedFiles: analysis.affectedFiles || []
        }
      })

      return {
        message: {
          id: message.id,
          content: analysis  // Return the parsed object, not stringified
        },
        analysis: {
          effortBucket: analysis.effortBucket,
          timeRange: analysis.timeRange,
          affectedFiles: analysis.affectedFiles,
          edgeCases: analysis.edgeCases,
          challenges: analysis.challenges,
          recommendations: analysis.recommendedApproach ? [analysis.recommendedApproach] : []
        }
      }
    } catch (error) {
      console.error('Error analyzing change request:', error)
      throw new Error('Failed to analyze change request')
    }
  }

  async getImpactReport(messageId: string) {
    return await prisma.impactReport.findUnique({
      where: { messageId },
      include: { message: true }
    })
  }
}

export const impactService = new ImpactService()
