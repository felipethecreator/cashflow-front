'use client'

import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryIconProps {
  icon: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-8 h-8'
}

export function CategoryIcon({ icon, color, size = 'md', className }: CategoryIconProps) {
  const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[icon] || LucideIcons.Folder
  
  return (
    <IconComponent 
      className={cn(sizeClasses[size], className)} 
      style={{ color: color || 'currentColor' }}
    />
  )
}

export const availableIcons = [
  'Home', 'UtensilsCrossed', 'Car', 'Gamepad2', 'Heart', 'GraduationCap',
  'ShoppingCart', 'Plane', 'Briefcase', 'Music', 'Film', 'Book',
  'Dumbbell', 'Coffee', 'Wifi', 'Phone', 'CreditCard', 'Gift',
  'PiggyBank', 'Building', 'Shirt', 'Scissors', 'Wrench', 'Zap',
  'Droplets', 'Flame', 'Tv', 'Smartphone', 'Headphones', 'Camera'
]
