'use client'

import { useEffect, useState } from 'react'

interface ModelLoadingProgressProps {
  onComplete?: () => void
}

export function ModelLoadingProgress({ onComplete }: ModelLoadingProgressProps) {
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkProgress = async () => {
      try {
        const response = await fetch('/api/warmup')
        const data = await response.json()
        
        if (data.status === 'ready' && data.progress === 100) {
          setProgress(100)
          setIsLoading(false)
          onComplete?.()
        } else {
          setProgress(data.progress || 0)
          setTimeout(checkProgress, 1000)
        }
      } catch (error) {
        console.error('Failed to check model loading:', error)
        setTimeout(checkProgress, 2000)
      }
    }

    checkProgress()
  }, [onComplete])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full mx-4 shadow-lg">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-32 h-32">
            <svg 
              className="w-full h-full animate-spin" 
              viewBox="0 0 100 100" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className="text-muted opacity-20"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${progress * 2.827}, 282.7`}
                className="transition-all duration-500"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className="text-primary" stopColor="currentColor" />
                  <stop offset="100%" className="text-gold-dim" stopColor="currentColor" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-gold-dim bg-clip-text text-transparent">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Loading AI Model...</span>
              <span className="font-semibold text-foreground">{Math.round(progress)}%</span>
            </div>
            
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary to-gold-dim h-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Preparing embedding model for optimal performance
          </p>
        </div>
      </div>
    </div>
  )
}
