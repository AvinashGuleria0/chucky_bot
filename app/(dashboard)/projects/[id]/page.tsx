'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, MessageSquare, ArrowLeft, Send, 
  Loader2, FileCode, Sparkles, FolderOpen, Zap, History, Maximize2, Minimize2
} from 'lucide-react'
import { ChatMessage } from '@/components/chat-message'
import { ThemeToggle } from '@/components/theme-toggle'
import { ChatHistorySidebar } from '@/components/chat-history-sidebar'

interface ProjectData {
  id: string
  name: string
  description: string | null
  files: Array<{
    id: string
    name: string
    path: string
    language: string
    size: number
    createdAt: string
  }>
}

interface Message {
  id: string
  sender: 'USER' | 'AI'
  content: string
  createdAt: string
}

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [project, setProject] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isChangeRequest, setIsChangeRequest] = useState(false)
  const [activeTab, setActiveTab] = useState<'files' | 'chat'>('files')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setProject(data)
      } else {
        toast.error('Project not found')
        router.push('/projects')
      }
    } catch (error) {
      toast.error('Failed to fetch project')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('projectId', projectId)
    acceptedFiles.forEach(file => formData.append('files', file))

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      clearInterval(progressInterval)
      setUploadProgress(100)

      if (res.ok) {
        toast.success(`Processed ${acceptedFiles.length} file(s)`)
        fetchProject()
      } else {
        toast.error('Upload failed')
      }
    } catch (error) {
      toast.error('Upload error')
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }, [projectId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/*': ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.rb', '.php'],
      'application/zip': ['.zip']
    }
  })

  const sendMessage = async () => {
    if (!inputMessage.trim() || sending) return

    const userMessage = inputMessage
    setInputMessage('')
    setSending(true)

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'USER',
      content: userMessage,
      createdAt: new Date().toISOString()
    }])

    try {
      const res = await fetch(isChangeRequest ? '/api/impact' : '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          conversationId,
          [isChangeRequest ? 'changeRequest' : 'message']: userMessage,
          isChangeRequest
        })
      })

      if (res.ok) {
        const data = await res.json()
        setConversationId(data.conversationId)
        
        // Extract content properly - handle both string and object responses
        let messageContent = 'No response'
        if (typeof data.message === 'string') {
          messageContent = data.message
        } else if (data.message?.content) {
          messageContent = data.message.content
        }
        
        setMessages(prev => [...prev, {
          id: data.messageId || Date.now().toString(),
          sender: 'AI',
          content: messageContent,
          createdAt: new Date().toISOString()
        }])
      } else {
        toast.error('Failed to send message')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setSending(false)
    }
  }

  const loadConversation = async (convId: string | null) => {
    if (!convId) {
      setMessages([])
      setConversationId(null)
      return
    }

    try {
      const res = await fetch(`/api/conversations/${convId}`)
      if (res.ok) {
        const data = await res.json()
        setConversationId(data.id)
        setMessages(data.messages.map((msg: any) => ({
          id: msg.id,
          sender: msg.sender,
          content: msg.content,
          createdAt: msg.createdAt
        })))
        setActiveTab('chat')
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
      toast.error('Failed to load conversation')
    }
  }

  const handleNewConversation = () => {
    setMessages([])
    setConversationId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse-soft">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Chat History Sidebar */}
      {!isFullscreen && (
        <ChatHistorySidebar
          projectId={projectId}
          currentConversationId={conversationId}
          onSelectConversation={loadConversation}
          onNewConversation={handleNewConversation}
          isOpen={historyOpen}
          onToggle={() => setHistoryOpen(!historyOpen)}
        />
      )}

      {/* Header */}
      {!isFullscreen && (
        <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => router.push('/projects')}
            className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground font-display">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
            {project.files.length} files
          </Badge>
          <ThemeToggle />
        </div>
      </header>
      )}

      {/* Main Content */}
      <main className={isFullscreen ? "" : "max-w-6xl mx-auto px-6 py-8"}>
        {/* Tabs */}
        {!isFullscreen && (
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab('files')}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === 'files'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              Files
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === 'chat'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
            {activeTab === 'chat' && (
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 bg-secondary text-muted-foreground hover:text-foreground"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setHistoryOpen(true)}
                  className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 bg-secondary text-muted-foreground hover:text-foreground"
                >
                  <History className="w-4 h-4" />
                  History
                </button>
              </div>
            )}
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Upload Area */}
            <div
              {...getRootProps()}
              className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
                isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 bg-card/50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="relative z-10">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors ${
                  isDragActive ? 'bg-primary/20' : 'bg-secondary'
                }`}>
                  <Upload className={`w-8 h-8 transition-colors ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <p className="text-lg font-medium text-foreground mb-2">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files or click to browse'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports code files and ZIP archives
                </p>
              </div>
              
              {/* Animated gradient border on drag */}
              {isDragActive && (
                <div className="absolute inset-0 rounded-2xl animate-shimmer" />
              )}
            </div>

            {uploading && (
              <div className="glass rounded-xl p-4 flex items-center gap-4">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <div className="flex-1">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-amber"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
            )}

            {/* Files Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {project.files.map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass rounded-xl p-4 hover:border-primary/30 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal/20 flex items-center justify-center flex-shrink-0">
                        <FileCode className="w-5 h-5 text-teal" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{file.path}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs bg-transparent border-border text-muted-foreground">
                            {file.language || 'unknown'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {project.files.length === 0 && !uploading && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary flex items-center justify-center">
                  <FolderOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No files uploaded yet. Upload some code to get started!</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {project.files.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber/20 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-amber" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 font-display">No files uploaded</h3>
                <p className="text-muted-foreground mb-4">Upload some code files first to start chatting</p>
                <Button 
                  onClick={() => setActiveTab('files')}
                  className="bg-primary hover:bg-primary/80 text-primary-foreground"
                >
                  Go to Files
                </Button>
              </div>
            ) : (
              <>
                {/* Mode Toggle - Position changes in fullscreen */}
                <div className={`flex gap-2 ${isFullscreen ? 'fixed top-4 left-4 z-[60]' : ''}`}>
                  <button
                    onClick={() => setIsChangeRequest(false)}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                      !isChangeRequest
                        ? 'bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] dark:from-teal dark:to-blue-500 text-white shadow-lg'
                        : isFullscreen 
                          ? 'bg-card/95 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Ask Questions
                  </button>
                  <button
                    onClick={() => setIsChangeRequest(true)}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                      isChangeRequest
                        ? 'bg-gradient-to-r from-[#ed80e9] to-[#f0abfc] dark:from-lavender dark:to-accent text-white shadow-lg'
                        : isFullscreen
                          ? 'bg-card/95 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Impact Analysis
                  </button>
                </div>

                {/* Exit Fullscreen Button - Only visible in fullscreen */}
                {isFullscreen && (
                  <div className="fixed top-4 right-4 z-[60]">
                    <button
                      onClick={() => setIsFullscreen(false)}
                      className="px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 bg-card/95 backdrop-blur-sm border border-border shadow-lg hover:bg-card text-foreground"
                      title="Exit Fullscreen"
                    >
                      <Minimize2 className="w-4 h-4" />
                      Exit Fullscreen
                    </button>
                  </div>
                )}

                {/* Chat Messages */}
                <div className={`overflow-y-auto rounded-2xl p-6 bg-card/50 border border-border/50 transition-all ${
                  isFullscreen ? 'fixed inset-0 z-50 h-[calc(100vh-140px)] pt-20' : 'min-h-[400px] max-h-[500px]'
                }`}>
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-16">
                      <div className={`w-16 h-16 mb-4 rounded-2xl flex items-center justify-center shadow-lg ${
                        isChangeRequest ? 'bg-gradient-to-br from-[#ed80e9] to-[#f0abfc] dark:from-lavender dark:to-lavender/70' : 'bg-gradient-to-br from-[#06b6d4] to-[#3b82f6] dark:from-teal dark:to-teal/70'
                      }`}>
                        {isChangeRequest ? (
                          <Sparkles className="w-8 h-8 text-white" />
                        ) : (
                          <MessageSquare className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2 font-display">
                        {isChangeRequest ? 'Analyze Change Impact' : 'Ask Me Anything'}
                      </h3>
                      <p className="text-muted-foreground max-w-md">
                        {isChangeRequest 
                          ? 'Describe a feature or change and I\'ll analyze the effort, affected files, and risks'
                          : 'I can explain how your code works using simple terms and real-world analogies'
                        }
                      </p>
                    </div>
                  ) : (
                    <div>
                      {messages.map((msg) => (
                        <ChatMessage
                          key={msg.id}
                          sender={msg.sender}
                          content={msg.content}
                          isChangeRequest={isChangeRequest && msg.sender === 'AI'}
                        />
                      ))}
                      {sending && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex gap-4 mb-8"
                        >
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal to-teal/70 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          </div>
                          <div className="glass rounded-2xl px-5 py-4 border border-teal/20">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 rounded-full bg-teal animate-pulse-soft" />
                              <span className="w-2 h-2 rounded-full bg-teal animate-pulse-soft stagger-1" />
                              <span className="w-2 h-2 rounded-full bg-teal animate-pulse-soft stagger-2" />
                            </div>
                          </div>
                        </motion.div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className={`glass rounded-2xl p-4 border border-border transition-all ${
                  isFullscreen ? 'fixed bottom-4 left-4 right-4 z-[51]' : ''
                }`}>
                  <div className="flex gap-3">
                    <Textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={isChangeRequest 
                        ? 'e.g., "Add email verification to the login flow"' 
                        : 'e.g., "How does the authentication system work?"'
                      }
                      className="min-h-[80px] bg-transparent border-0 text-foreground placeholder:text-muted-foreground/50 resize-none focus:ring-0 text-[15px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={sending || !inputMessage.trim()}
                      className="self-end px-6 h-12 bg-gradient-to-r from-primary to-gold-dim hover:opacity-90 text-primary-foreground rounded-xl disabled:opacity-50"
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground/50 mt-3 pl-1">
                    Press Enter to send · Shift+Enter for new line
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </main>
    </div>
  )
}
