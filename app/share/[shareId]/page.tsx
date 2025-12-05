'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Send, Loader2, Sparkles, MessageSquare } from 'lucide-react'
import { ChatMessage } from '@/components/chat-message'

interface Message {
  id: string
  sender: 'USER' | 'AI'
  content: string
  createdAt: string
}

export default function SharePage() {
  const params = useParams()
  const shareId = params.shareId as string
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [projectName, setProjectName] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isChangeRequest, setIsChangeRequest] = useState(false)

  useEffect(() => {
    fetchProjectInfo()
  }, [shareId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchProjectInfo = async () => {
    try {
      const res = await fetch(`/api/share/${shareId}`)
      if (res.ok) {
        const data = await res.json()
        setProjectName(data.name)
      } else {
        toast.error('Project not found or not shared')
      }
    } catch (error) {
      toast.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

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
      const res = await fetch(`/api/share/${shareId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          isChangeRequest
        })
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, {
          id: data.messageId || Date.now().toString(),
          sender: 'AI',
          content: data.message,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading chatbot...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card/80 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-gold-dim flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{projectName}</h1>
              <p className="text-xs text-muted-foreground">AI Assistant</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsChangeRequest(false)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                !isChangeRequest
                  ? 'bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white shadow-lg'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Questions
            </button>
            <button
              onClick={() => setIsChangeRequest(true)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                isChangeRequest
                  ? 'bg-gradient-to-r from-[#ed80e9] to-[#f0abfc] text-white shadow-lg'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Impact Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className={`w-16 h-16 mb-4 rounded-2xl flex items-center justify-center shadow-lg ${
                isChangeRequest ? 'bg-gradient-to-br from-[#ed80e9] to-[#f0abfc]' : 'bg-gradient-to-br from-[#06b6d4] to-[#3b82f6]'
              }`}>
                {isChangeRequest ? (
                  <Sparkles className="w-8 h-8 text-white" />
                ) : (
                  <MessageSquare className="w-8 h-8 text-white" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {isChangeRequest ? 'Analyze Change Impact' : 'Ask Me Anything'}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {isChangeRequest 
                  ? 'Describe a feature or change and I\'ll analyze the effort, affected files, and risks'
                  : 'I can explain how the code works using simple terms and real-world analogies'
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
                      <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                      <span className="w-2 h-2 rounded-full bg-teal animate-pulse delay-75" />
                      <span className="w-2 h-2 rounded-full bg-teal animate-pulse delay-150" />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-border bg-card/80 backdrop-blur-sm px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-3">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isChangeRequest 
                ? 'e.g., "Add email verification to the login flow"' 
                : 'e.g., "How does the authentication system work?"'
              }
              className="min-h-[60px] bg-background border-border text-foreground resize-none"
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
              className="self-end h-[60px] px-6 bg-gradient-to-r from-primary to-gold-dim hover:opacity-90 text-primary-foreground"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
