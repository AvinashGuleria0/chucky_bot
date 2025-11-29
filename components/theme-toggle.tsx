'use client'

import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full bg-secondary border border-border transition-colors overflow-hidden"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          background: theme === 'dark' 
            ? 'linear-gradient(135deg, rgba(212, 168, 83, 0.1), transparent)'
            : 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), transparent)'
        }}
      />
      
      {/* Toggle circle */}
      <motion.div
        className="absolute top-1 w-5 h-5 rounded-full flex items-center justify-center"
        animate={{
          left: theme === 'dark' ? '4px' : '32px',
          background: theme === 'dark' 
            ? 'linear-gradient(135deg, #d4a853, #a68332)'
            : 'linear-gradient(135deg, #fbbf24, #f59e0b)'
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {theme === 'dark' ? (
          <Moon className="w-3 h-3 text-[#0f0e0c]" />
        ) : (
          <Sun className="w-3 h-3 text-white" />
        )}
      </motion.div>
    </motion.button>
  )
}
