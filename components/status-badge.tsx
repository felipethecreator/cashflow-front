import { cn } from '@/lib/utils'
import type { PaymentStatus, Priority } from '@/lib/types'

interface StatusBadgeProps {
  status: PaymentStatus | Priority
  className?: string
}

const statusConfig: Record<PaymentStatus | Priority, { label: string; className: string }> = {
  PAID: { label: 'Pago', className: 'bg-success/20 text-success border-success/30' },
  PENDING: { label: 'Pendente', className: 'bg-warning/20 text-warning border-warning/30' },
  OVERDUE: { label: 'Atrasado', className: 'bg-destructive/20 text-destructive border-destructive/30' },
  HIGH: { label: 'Alta', className: 'bg-destructive/20 text-destructive border-destructive/30' },
  MEDIUM: { label: 'Média', className: 'bg-warning/20 text-warning border-warning/30' },
  LOW: { label: 'Baixa', className: 'bg-success/20 text-success border-success/30' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
