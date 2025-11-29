'use client'

import { motion } from 'framer-motion'
import { Sparkles, User, Lightbulb, AlertTriangle, FileCode, Clock, ArrowRight, CheckCircle2, XCircle, Code2, Wrench, Zap } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMessageProps {
  sender: 'USER' | 'AI'
  content: string
  isChangeRequest?: boolean
}

export function ChatMessage({ sender, content, isChangeRequest }: ChatMessageProps) {
  if (sender === 'USER') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-end gap-3 mb-4"
      >
        <div className="max-w-[70%]">
          <div className="bg-gradient-to-br from-[#ec4899] to-[#f472b6] dark:from-[#db2777] dark:to-[#ec4899] text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-md border border-white/10">
            <p className="text-[14px] leading-relaxed">{content}</p>
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ec4899] to-[#f472b6] dark:from-[#db2777] dark:to-[#ec4899] flex items-center justify-center flex-shrink-0 shadow-md">
          <User className="w-4 h-4 text-white" />
        </div>
      </motion.div>
    )
  }

  // Try to parse as JSON for impact analysis
  let parsedContent: any = null
  if (isChangeRequest) {
    try {
      // Ensure content is a string
      if (typeof content !== 'string') {
        console.error('Content is not a string:', typeof content)
        return <ExplanationCard content={String(content)} />
      }

      // Try to extract JSON from various formats
      let jsonStr = content
      
      // Remove markdown code blocks
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      
      // Try to find JSON object
      const jsonMatch = jsonStr.match(/{[\s\S]*}/)
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0])
        
        // Validate it has the expected structure
        if (parsedContent && (parsedContent.overview || parsedContent.effortBucket)) {
          return <ImpactAnalysisCard data={parsedContent} />
        }
      }
    } catch (e) {
      console.error('Failed to parse impact analysis:', e)
    }
  }

  return <ExplanationCard content={content} />
}

function ImpactAnalysisCard({ data }: { data: any }) {
  const effortColors: Record<string, { bg: string; border: string; badge: string }> = {
    XS: { bg: 'bg-emerald-50/60 dark:bg-card/60', border: 'border-emerald-300/40 dark:border-emerald-500/20', badge: 'bg-emerald-500 text-white' },
    S: { bg: 'bg-cyan-50/60 dark:bg-card/60', border: 'border-cyan-300/40 dark:border-cyan-500/20', badge: 'bg-cyan-500 text-white' },
    M: { bg: 'bg-pink-50/60 dark:bg-card/60', border: 'border-pink-300/40 dark:border-pink-500/20', badge: 'bg-pink-500 text-white' },
    L: { bg: 'bg-orange-50/60 dark:bg-card/60', border: 'border-orange-300/40 dark:border-orange-500/20', badge: 'bg-orange-500 text-white' },
    XL: { bg: 'bg-red-50/60 dark:bg-card/60', border: 'border-red-300/40 dark:border-red-500/20', badge: 'bg-red-500 text-white' },
  }

  const effort = effortColors[data.effortBucket] || effortColors.M

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex gap-3 mb-4"
    >
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#ec4899] to-[#f472b6] dark:from-[#db2777] dark:to-[#ec4899] flex items-center justify-center flex-shrink-0 shadow-md">
        <Sparkles className="w-4 h-4 text-white" />
      </div>

      <div className="flex-1 space-y-3 max-w-[92%]">
        {/* Overview */}
        {data.overview && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl p-5 border border-pink-300/40 dark:border-pink-500/20 bg-pink-50/60 dark:bg-card/60 shadow-sm"
          >
            <h4 className="text-base font-bold text-pink-700 dark:text-pink-400 tracking-tight mb-2">
              Overview
            </h4>
            <p className="text-[14px] text-gray-700 dark:text-foreground/85 leading-relaxed">{data.overview}</p>
          </motion.div>
        )}

        {/* Effort */}
        {data.effortBucket && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`rounded-xl p-5 border ${effort.border} ${effort.bg} shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-gray-800 dark:text-foreground tracking-tight mb-1">
                  Effort Estimate
                </h4>
                <p className="text-sm text-gray-600 dark:text-foreground/70">{data.timeRange || 'Estimated time'}</p>
              </div>
              <div className={`px-4 py-2 rounded-lg ${effort.badge} font-bold text-lg shadow-sm`}>
                {data.effortBucket}
              </div>
            </div>
          </motion.div>
        )}

        {/* Affected Files */}
        {data.affectedFiles?.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-5 border border-rose-300/40 dark:border-rose-500/20 bg-rose-50/60 dark:bg-card/60 shadow-sm"
          >
            <h4 className="text-base font-bold text-rose-700 dark:text-rose-400 tracking-tight mb-3">
              Files to Modify
            </h4>
            <div className="space-y-2">
              {data.affectedFiles.map((file: string, i: number) => (
                <div 
                  key={i}
                  className="flex items-center gap-2 text-gray-700 dark:text-foreground/85 text-sm"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                  <code className="text-[13px] font-mono">{file}</code>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recommended Approach */}
        {data.recommendedApproach && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl p-5 border border-fuchsia-300/40 dark:border-fuchsia-500/20 bg-fuchsia-50/60 dark:bg-card/60 shadow-sm"
          >
            <h4 className="text-base font-bold text-fuchsia-700 dark:text-fuchsia-400 tracking-tight mb-3">
              Recommended Approach
            </h4>
            <div className="text-[14px] text-gray-700 dark:text-foreground/85 leading-relaxed whitespace-pre-line">
              {data.recommendedApproach}
            </div>
          </motion.div>
        )}

        {/* Edge Cases & Challenges */}
        {(data.edgeCases?.length > 0 || data.challenges?.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl p-5 border border-amber-300/40 dark:border-amber-500/20 bg-amber-50/60 dark:bg-card/60 shadow-sm"
          >
            <h4 className="text-base font-bold text-amber-700 dark:text-amber-400 tracking-tight mb-3">
              Watch Out For
            </h4>
            <ul className="space-y-2">
              {[...(data.edgeCases || []), ...(data.challenges || [])].map((item: string, i: number) => (
                <li 
                  key={i}
                  className="flex items-start gap-2 text-gray-700 dark:text-foreground/85 text-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 mt-2 flex-shrink-0"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Potential Risks */}
        {data.risks?.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-xl p-5 border border-red-300/40 dark:border-red-500/20 bg-red-50/60 dark:bg-card/60 shadow-sm"
          >
            <h4 className="text-base font-bold text-red-700 dark:text-red-400 tracking-tight mb-3">
              Potential Risks
            </h4>
            <ul className="space-y-2">
              {data.risks.map((risk: string, i: number) => (
                <li 
                  key={i}
                  className="flex items-start gap-2 text-gray-700 dark:text-foreground/85 text-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400 mt-2 flex-shrink-0"></span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

function ExplanationCard({ content }: { content: string }) {
  // Parse content into sections by ## headings
  const sections = parseContentIntoSections(content)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex gap-3 mb-4"
    >
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#ec4899] to-[#f472b6] dark:from-[#db2777] dark:to-[#ec4899] flex items-center justify-center flex-shrink-0 shadow-md">
        <Sparkles className="w-4 h-4 text-white" />
      </div>

      <div className="flex-1 max-w-[92%] space-y-3">
        {sections.map((section, index) => (
          <SectionBlock key={index} section={section} delay={index * 0.08} />
        ))}
      </div>
    </motion.div>
  )
}

interface Section {
  title: string
  content: string
  icon?: string
}

function parseContentIntoSections(content: string): Section[] {
  const sections: Section[] = []
  const lines = content.split('\n')
  let currentSection: Section | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Check if it's a heading (## Title or ## 📋 Title)
    const headingMatch = line.match(/^##\s*(.+)$/)
    
    if (headingMatch) {
      // Save previous section
      if (currentSection && currentSection.content.trim()) {
        sections.push(currentSection)
      }
      
      // Start new section
      const titleText = headingMatch[1].trim()
      const emojiMatch = titleText.match(/^([^\w\s]+)\s*(.+)$/)
      
      currentSection = {
        title: emojiMatch ? emojiMatch[2] : titleText,
        icon: emojiMatch ? emojiMatch[1] : '✨',
        content: ''
      }
    } else if (currentSection) {
      // Add line to current section (keep empty lines for formatting)
      currentSection.content += line + '\n'
    } else if (line.trim()) {
      // Content before first heading - create a default section
      if (!currentSection) {
        currentSection = {
          title: 'Response',
          content: '',
          icon: '💬'
        }
      }
      currentSection.content += line + '\n'
    }
  }

  // Add last section
  if (currentSection && currentSection.content.trim()) {
    sections.push(currentSection)
  }

  // If no sections found, treat entire content as one section
  if (sections.length === 0 && content.trim()) {
    sections.push({
      title: 'Response',
      content: content,
      icon: '💬'
    })
  }

  return sections
}

function SectionBlock({ section, delay }: { section: Section; delay: number }) {
  // Pink-themed colors for all sections
  const sectionColors: Record<string, { bg: string; border: string; title: string }> = {
    'Overview': { bg: 'bg-pink-50/60 dark:bg-card/60', border: 'border-pink-300/40 dark:border-pink-500/20', title: 'text-pink-700 dark:text-pink-400' },
    'How It Works': { bg: 'bg-rose-50/60 dark:bg-card/60', border: 'border-rose-300/40 dark:border-rose-500/20', title: 'text-rose-700 dark:text-rose-400' },
    'Real-World Analogy': { bg: 'bg-fuchsia-50/60 dark:bg-card/60', border: 'border-fuchsia-300/40 dark:border-fuchsia-500/20', title: 'text-fuchsia-700 dark:text-fuchsia-400' },
    'Files Involved': { bg: 'bg-pink-50/60 dark:bg-card/60', border: 'border-pink-300/40 dark:border-pink-500/20', title: 'text-pink-700 dark:text-pink-400' },
    'Key Points': { bg: 'bg-rose-50/60 dark:bg-card/60', border: 'border-rose-300/40 dark:border-rose-500/20', title: 'text-rose-700 dark:text-rose-400' },
  }

  const colors = sectionColors[section.title] || sectionColors['Overview']

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`rounded-xl p-5 border ${colors.border} ${colors.bg} shadow-sm`}
    >
      <h3 className={`text-base font-bold ${colors.title} tracking-tight mb-3`}>
        {section.title}
      </h3>
      
      <div className="prose prose-sm max-w-none dark:prose-invert
        prose-p:text-gray-700 dark:prose-p:text-foreground/85 prose-p:leading-relaxed prose-p:my-2 prose-p:text-[14px]
        prose-strong:text-gray-900 dark:prose-strong:text-foreground prose-strong:font-bold
        prose-em:text-gray-600 dark:prose-em:text-foreground/75 prose-em:italic
        prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-pink-100/50 dark:prose-code:bg-pink-900/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded 
        prose-code:before:content-[''] prose-code:after:content-[''] prose-code:font-mono prose-code:text-[13px] prose-code:font-medium
        prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:border prose-pre:border-gray-700 dark:prose-pre:border-gray-800 prose-pre:rounded-lg prose-pre:my-3 prose-pre:p-3 prose-pre:text-[13px]
        prose-pre:code:bg-transparent prose-pre:code:p-0 prose-pre:code:text-gray-100 dark:prose-pre:code:text-foreground/80
        prose-li:text-gray-700 dark:prose-li:text-foreground/85 prose-li:my-1.5 prose-li:leading-relaxed prose-li:text-[14px] prose-li:list-item
        prose-li>strong:font-bold prose-li>strong:text-gray-900 dark:prose-li>strong:text-foreground
        prose-ul:my-3 prose-ol:my-3 prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-6 prose-ol:pl-6 prose-ul:space-y-1 prose-ol:space-y-1
        prose-ul:marker:text-pink-500 dark:prose-ul:marker:text-pink-400 prose-ol:marker:text-pink-500 dark:prose-ol:marker:text-pink-400 prose-ol:marker:font-semibold
        prose-ul>li:ml-0 prose-ol>li:ml-0 prose-ul>li:pl-2 prose-ol>li:pl-2
        prose-blockquote:border-l-3 prose-blockquote:border-l-pink-400 dark:prose-blockquote:border-l-pink-500 prose-blockquote:bg-pink-50/50 dark:prose-blockquote:bg-pink-900/10 
        prose-blockquote:py-2 prose-blockquote:px-3 prose-blockquote:rounded-r-lg prose-blockquote:text-gray-700 dark:prose-blockquote:text-foreground/80 prose-blockquote:italic prose-blockquote:text-[14px]
        prose-a:text-pink-600 dark:prose-a:text-pink-400 prose-a:no-underline prose-a:font-medium hover:prose-a:underline
        prose-hr:border-gray-300 dark:prose-hr:border-border prose-hr:my-3
        prose-h3:text-sm prose-h3:font-semibold prose-h3:text-gray-800 dark:prose-h3:text-foreground prose-h3:mt-3 prose-h3:mb-2
        prose-h4:text-sm prose-h4:font-semibold prose-h4:text-gray-700 dark:prose-h4:text-foreground/90 prose-h4:mt-2 prose-h4:mb-1.5
        [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:block [&_ol]:block
        [&_li]:block [&_li]:list-item [&_li_strong]:font-bold [&_li_strong]:text-gray-900 dark:[&_li_strong]:text-foreground">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {section.content}
        </ReactMarkdown>
      </div>
    </motion.div>
  )
}

interface Section {
  title: string
  content: string
  icon?: string
}

