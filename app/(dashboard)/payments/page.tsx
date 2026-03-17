'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Clock, AlertCircle, Calendar, Loader2, ChevronDown, PartyPopper } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { useCategoryStore, useExpenseStore, usePaymentStore } from '@/lib/store'
import type { Payment } from '@/lib/types'
import { GlassCard } from '@/components/glass-card'
import { StatusBadge } from '@/components/status-badge'
import { CategoryIcon } from '@/components/category-icon'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
}

export default function PaymentsPage() {
  const { categories, fetchCategories } = useCategoryStore()
  const { expenses, fetchExpenses } = useExpenseStore()
  const { payments, fetchPayments, markAsPaid, selectedMonth, isLoading } = usePaymentStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [paidExpanded, setPaidExpanded] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchExpenses()
    fetchPayments(selectedMonth)
  }, [fetchCategories, fetchExpenses, fetchPayments, selectedMonth])

  const groupedPayments = useMemo(() => {
    const overdue = payments.filter(p => p.status === 'OVERDUE')
    const pending = payments.filter(p => p.status === 'PENDING')
    const paid = payments.filter(p => p.status === 'PAID')
    
    // Sort by due date
    const sortByDate = (a: Payment, b: Payment) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    
    return {
      overdue: overdue.sort(sortByDate),
      pending: pending.sort(sortByDate),
      paid: paid.sort((a, b) => 
        new Date(b.paidAt || b.dueDate).getTime() - new Date(a.paidAt || a.dueDate).getTime()
      )
    }
  }, [payments])

  const summary = useMemo(() => {
    return {
      total: payments.length,
      paid: groupedPayments.paid.length,
      pending: groupedPayments.pending.length,
      overdue: groupedPayments.overdue.length
    }
  }, [payments, groupedPayments])

  const triggerConfetti = () => {
    const duration = 2000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)
  }

  const openPayModal = (payment: Payment) => {
    setSelectedPayment(payment)
    setNotes('')
    setIsModalOpen(true)
  }

  const handleMarkAsPaid = async () => {
    if (!selectedPayment) return
    
    setIsSaving(true)
    
    try {
      await markAsPaid(selectedPayment.id, notes || undefined)
      
      const expense = expenses.find(e => e.id === selectedPayment.expenseId)
      toast.success(`${expense?.name || 'Pagamento'} marcado como pago!`, {
        icon: <PartyPopper className="w-5 h-5 text-success" />
      })
      
      triggerConfetti()
      setIsModalOpen(false)
    } catch (error) {
      toast.error('Erro ao marcar como pago')
    } finally {
      setIsSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getExpenseInfo = (payment: Payment) => {
    const expense = expenses.find(e => e.id === payment.expenseId)
    const category = expense ? categories.find(c => c.id === expense.categoryId) : null
    return { expense, category }
  }

  const PaymentCard = ({ payment, showPayButton = false }: { payment: Payment; showPayButton?: boolean }) => {
    const { expense, category } = getExpenseInfo(payment)
    
    return (
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between p-4 rounded-xl bg-surface/50 hover:bg-surface transition-colors"
      >
        <div className="flex items-center gap-4">
          {category && (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <CategoryIcon icon={category.icon} color={category.color} size="sm" />
            </div>
          )}
          <div>
            <p className="font-medium text-foreground">{expense?.name || 'Despesa'}</p>
            <p className="text-sm text-muted-foreground">
              {payment.status === 'PAID' && payment.paidAt
                ? `Pago em ${format(parseISO(payment.paidAt), "dd/MM 'às' HH:mm", { locale: ptBR })}`
                : payment.status === 'OVERDUE'
                ? `Venceu em ${format(parseISO(payment.dueDate), 'dd/MM', { locale: ptBR })}`
                : `Vence em ${format(parseISO(payment.dueDate), 'dd/MM', { locale: ptBR })}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <p className="font-mono font-semibold text-foreground">
            {formatCurrency(payment.amount)}
          </p>
          
          {showPayButton ? (
            <Button
              size="sm"
              onClick={() => openPayModal(payment)}
              className={payment.status === 'OVERDUE' 
                ? 'bg-destructive hover:bg-destructive/90' 
                : 'bg-success hover:bg-success/90'}
            >
              {payment.status === 'OVERDUE' ? 'Pagar agora' : 'Marcar como pago'}
            </Button>
          ) : (
            <CheckCircle2 className="w-5 h-5 text-success" />
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pagamentos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os pagamentos do mês</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {summary.total} pagamentos
          </span>
          <span className="text-success">{summary.paid} pagos</span>
          <span className="text-warning">{summary.pending} pendentes</span>
          {summary.overdue > 0 && (
            <span className="text-destructive">{summary.overdue} atrasados</span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue Section */}
          {groupedPayments.overdue.length > 0 && (
            <GlassCard hover={false} className="border-destructive/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-destructive/20">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Atrasados</h2>
                  <p className="text-sm text-muted-foreground">
                    {groupedPayments.overdue.length} pagamento(s) vencido(s)
                  </p>
                </div>
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {groupedPayments.overdue.map((payment) => (
                  <PaymentCard key={payment.id} payment={payment} showPayButton />
                ))}
              </motion.div>
            </GlassCard>
          )}

          {/* Pending Section */}
          {groupedPayments.pending.length > 0 && (
            <GlassCard hover={false} className="border-warning/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-warning/20">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Pendentes</h2>
                  <p className="text-sm text-muted-foreground">
                    {groupedPayments.pending.length} pagamento(s) a vencer
                  </p>
                </div>
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {groupedPayments.pending.map((payment) => (
                  <PaymentCard key={payment.id} payment={payment} showPayButton />
                ))}
              </motion.div>
            </GlassCard>
          )}

          {/* Paid Section */}
          {groupedPayments.paid.length > 0 && (
            <Collapsible open={paidExpanded} onOpenChange={setPaidExpanded}>
              <GlassCard hover={false} className="border-success/50">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/20">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-semibold text-foreground">Pagos</h2>
                      <p className="text-sm text-muted-foreground">
                        {groupedPayments.paid.length} pagamento(s) realizado(s)
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${paidExpanded ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3 mt-4"
                  >
                    {groupedPayments.paid.map((payment) => (
                      <PaymentCard key={payment.id} payment={payment} />
                    ))}
                  </motion.div>
                </CollapsibleContent>
              </GlassCard>
            </Collapsible>
          )}

          {/* Empty State */}
          {payments.length === 0 && (
            <GlassCard hover={false} className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-4">
                <Calendar className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Nenhum pagamento</h3>
              <p className="text-muted-foreground mt-1">
                Não há pagamentos registrados para este mês
              </p>
            </GlassCard>
          )}
        </div>
      )}

      {/* Mark as Paid Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              Marque esta despesa como paga
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              {/* Payment Info */}
              <div className="p-4 rounded-xl bg-surface">
                {(() => {
                  const { expense, category } = getExpenseInfo(selectedPayment)
                  return (
                    <div className="flex items-center gap-4">
                      {category && (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <CategoryIcon icon={category.icon} color={category.color} />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{expense?.name || 'Despesa'}</p>
                        <p className="text-sm text-muted-foreground">{category?.name}</p>
                      </div>
                      <p className="text-xl font-bold font-mono text-primary">
                        {formatCurrency(selectedPayment.amount)}
                      </p>
                    </div>
                  )
                })()}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione uma observação..."
                  className="bg-surface resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={isSaving}
              className="bg-success hover:bg-success/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
