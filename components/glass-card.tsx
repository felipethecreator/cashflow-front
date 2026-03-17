'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className, hover = true, ...props }: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        'glass-card p-6 shadow-lg',
        hover && 'transition-all duration-300 hover:shadow-xl hover:border-primary/30',
        className
      )}
      whileHover={hover ? { y: -2 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  )
}
