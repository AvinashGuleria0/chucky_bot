import Groq from 'groq-sdk'
import { vectorService } from './vector.service'
import { chunkingService } from './chunking.service'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export class RAGService {
  async query(userQuery: string, projectId: string, isChangeRequest: boolean = false): Promise<string> {
    try {
      const similarChunks = await vectorService.searchByQuery(userQuery, projectId, 5)
      const context = chunkingService.mergeChunksForContext(similarChunks)
      
      // Truncate context if too long (max ~8000 chars to leave room for prompt and response)
      const maxContextLength = 8000
      const truncatedContext = context.length > maxContextLength 
        ? context.substring(0, maxContextLength) + '\n... [truncated]'
        : context
      
      const prompt = isChangeRequest 
        ? this.buildChangeRequestPrompt(userQuery, truncatedContext) 
        : this.buildExplanationPrompt(userQuery, truncatedContext)
      
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 2000
      })

      return completion.choices[0]?.message?.content || 'No response generated'
    } catch (error) {
      console.error('Error in RAG query:', error)
      throw new Error('Failed to generate response')
    }
  }

  private buildExplanationPrompt(query: string, context: string): string {
    return `You are a helpful AI assistant explaining code to a non-technical person. Be smart about your response format.

Codebase Context:
\`\`\`
${context}
\`\`\`

Question: ${query}

IMPORTANT: Analyze the question complexity and user intent:

**For SIMPLE/DIRECT questions** (like "how to log in", "how do I log in", "what does X do", "where is Y"):
- Give a SHORT, DIRECT answer in 1-3 sentences maximum
- Focus ONLY on what the user asked - no technical details, no file paths, no routes
- Use plain language like explaining to a friend
- Example: "To log in, click the Login with Google button and it will authenticate your account."
- DO NOT include: file paths, routes, technical implementation details, or code structure
- Keep it conversational and human-friendly

**For COMPLEX/TECHNICAL questions** (like "explain the authentication flow", "how does the system architecture work", "explain the entire authentication process"):
- Use the structured format below with ## headings
- Include technical details, file paths, and implementation specifics
- **ALWAYS include architecture diagrams using mermaid syntax when explaining flows or system architecture**

Structure for COMPLEX responses:

## Overview
Provide a clear 1-2 sentence summary using simple language. Use **bold** for key concepts.

## Architecture Diagram
Use mermaid to visualize the flow or architecture:

\`\`\`mermaid
graph TD
    A[User] -->|Action| B[Component]
    B -->|Request| C[API]
    C -->|Query| D[Database]
    D -->|Response| C
    C -->|Result| B
    B -->|Display| A
\`\`\`

## How It Works
Explain using bullet points:
- **First**: What happens initially
- **Then**: Next action in the flow
- **Next**: Following step
- **Finally**: End result

## Real-World Analogy  
Compare to something familiar:

This is like a **[everyday concept]** where:
- Component A works like [familiar thing]
- Process B is similar to [relatable action]

## Key Points
- **Important insight 1**
- **Important insight 2**
- **Important insight 3**

Rules:
- BE SMART: Simple question = Simple answer (1-3 sentences max, no technical details)
- Complex question = Detailed structured response with mermaid diagrams
- Use **bold** for emphasis
- Use \`code\` only when necessary
- Always prioritize clarity and brevity for simple questions`
  }

  private buildChangeRequestPrompt(query: string, context: string): string {
    return `Analyze this code change request and respond with ONLY valid JSON (no markdown, no extra text).

Codebase:
\`\`\`
${context}
\`\`\`

Request: ${query}

Respond with this exact JSON structure:
{
  "overview": "2-3 sentences explaining what needs to change",
  "affectedFiles": ["file1.ts", "file2.tsx", "file3.ts"],
  "recommendedApproach": "1. First step\\n2. Second step\\n3. Third step\\n4. Testing approach",
  "edgeCases": ["Edge case 1", "Edge case 2"],
  "challenges": ["Challenge 1", "Challenge 2"],
  "risks": ["Risk 1", "Risk 2"],
  "effortBucket": "M",
  "timeRange": "1-3 days",
  "detailedBreakdown": "Detailed explanation of the work involved"
}

Effort levels: XS=1-4h, S=4-8h, M=1-3d, L=3-7d, XL=1-4w

IMPORTANT: Give me the response easy to be read by a non-technical client and make sure that the response follow the client centricity principle.
IMPORTANT: Return ONLY the JSON object, nothing else!`
  }

}

export const ragService = new RAGService()
