'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  History, MessageSquare, ChevronRight, Plus, Trash2, 
  Clock, Sparkles, X 
} from 'lucide-react'
import { format } from 'date-fns'

interface Conversation {
  id: string
  createdAt: string
  updatedAt: string
  _count?: {
    messages: number
  }
  messages?: Array<{
    id: string
    content: string
    sender: 'USER' | 'AI'
    createdAt: string
  }>
  preview?: string
}

interface ChatHistorySidebarProps {
  projectId: string
  currentConversationId: string | null
  onSelectConversation: (conversationId: string | null) => void
  onNewConversation: () => void
  isOpen: boolean
  onToggle: () => void
}

export function ChatHistorySidebar({
  projectId,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isOpen,
  onToggle
}: ChatHistorySidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchConversations()
    }
  }, [isOpen, projectId])

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/conversations?projectId=${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== id))
        if (currentConversationId === id) {
          onNewConversation()
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const getPreview = (conversation: Conversation) => {
    if (conversation.preview) return conversation.preview
    const firstMessage = conversation.messages?.[0]
    if (firstMessage) {
      return firstMessage.content.slice(0, 50) + (firstMessage.content.length > 50 ? '...' : '')
    }
    return 'New conversation'
  }

  return (
    <>
      {/* Toggle Button (visible when sidebar is closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={onToggle}
            className="fixed left-4 top-24 z-40 w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:border-primary/30 transition-colors shadow-lg"
          >
            <History className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Sidebar Panel */}
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-card border-r border-border z-50 flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <History className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-semibold text-foreground">Chat History</h2>
                </div>
                <button
                  onClick={onToggle}
                  className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* New Chat Button */}
              <div className="p-4">
                <button
                  onClick={() => {
                    onNewConversation()
                    onToggle()
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-gold-dim text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  New Conversation
                </button>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center animate-pulse">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">Loading history...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
                      <MessageSquare className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      No conversations yet.<br />Start chatting to create history!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conversation, index) => (
                      <motion.div
                        key={conversation.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          onSelectConversation(conversation.id)
                          onToggle()
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all group cursor-pointer ${
                          currentConversationId === conversation.id
                            ? 'bg-primary/10 border-primary/30'
                            : 'bg-secondary/50 border-transparent hover:border-border hover:bg-secondary'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              currentConversationId === conversation.id
                                ? 'text-primary'
                                : 'text-foreground'
                            }`}>
                              {getPreview(conversation)}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(conversation.updatedAt), 'MMM d, h:mm a')}
                              </span>
                              {conversation._count?.messages && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground">
                                    {conversation._count.messages} messages
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => deleteConversation(e, conversation.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
