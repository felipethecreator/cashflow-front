'use client'

import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { useCategoryStore, useExpenseStore, usePaymentStore } from '@/lib/store'
import { GlassCard } from '@/components/glass-card'
import { StatusBadge } from '@/components/status-badge'
import { CategoryIcon } from '@/components/category-icon'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function DashboardPage() {
  const { categories, fetchCategories, isLoading: categoriesLoading } = useCategoryStore()
  const { expenses, fetchExpenses, isLoading: expensesLoading } = useExpenseStore()
  const { payments, fetchPayments, markAsPaid, selectedMonth, isLoading: paymentsLoading } = usePaymentStore()

  useEffect(() => {
    fetchCategories()
    fetchExpenses()
    fetchPayments(selectedMonth)
  }, [fetchCategories, fetchExpenses, fetchPayments, selectedMonth])

  const summary = useMemo(() => {
    const total = payments.reduce((acc, p) => acc + p.amount, 0)
    const paid = payments.filter(p => p.status === 'PAID').reduce((acc, p) => acc + p.amount, 0)
    const pending = payments.filter(p => p.status === 'PENDING').reduce((acc, p) => acc + p.amount, 0)
    const overdue = payments.filter(p => p.status === 'OVERDUE').reduce((acc, p) => acc + p.amount, 0)
    
    return {
      total,
      paid,
      pending,
      overdue,
      count: payments.length,
      paidCount: payments.filter(p => p.status === 'PAID').length,
      pendingCount: payments.filter(p => p.status === 'PENDING').length,
      overdueCount: payments.filter(p => p.status === 'OVERDUE').length,
      paidPercentage: total > 0 ? (paid / total) * 100 : 0
    }
  }, [payments])

  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, { name: string; color: string; total: number }> = {}
    
    payments.forEach(payment => {
      const expense = expenses.find(e => e.id === payment.expenseId)
      if (expense) {
        const category = categories.find(c => c.id === expense.categoryId)
        if (category) {
          if (!breakdown[category.id]) {
            breakdown[category.id] = { name: category.name, color: category.color, total: 0 }
          }
          breakdown[category.id].total += payment.amount
        }
      }
    })
    
    return Object.values(breakdown)
  }, [payments, expenses, categories])

  const handleMarkAsPaid = async (paymentId: string, paymentName: string) => {
    try {
      await markAsPaid(paymentId)
      toast.success(`${paymentName} marcado como pago!`)
    } catch (error) {
      toast.error('Erro ao marcar como pago')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const isLoading = categoriesLoading || expensesLoading || paymentsLoading

  const summaryCards = [
    {
      title: 'Total de Despesas',
      value: summary.total,
      icon: TrendingUp,
      badge: `${summary.count} despesas`,
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary'
    },
    {
      title: 'Total Pago',
      value: summary.paid,
      icon: CheckCircle2,
      badge: `${Math.round(summary.paidPercentage)}%`,
      iconBg: 'bg-success/20',
      iconColor: 'text-success',
      showProgress: true
    },
    {
      title: 'Total Pendente',
      value: summary.pending,
      icon: Clock,
      badge: `${summary.pendingCount} pendentes`,
      iconBg: 'bg-warning/20',
      iconColor: 'text-warning'
    },
    {
      title: 'Atrasados',
      value: summary.overdue,
      icon: AlertCircle,
      badge: `${summary.overdueCount} atrasados`,
      iconBg: 'bg-destructive/20',
      iconColor: 'text-destructive'
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral das suas finanças</p>
      </div>

      {/* Summary Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {summaryCards.map((card, index) => (
          <motion.div key={index} variants={itemVariants}>
            <GlassCard>
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${card.iconBg}`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${card.iconBg} ${card.iconColor}`}>
                  {card.badge}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-32 mt-1" />
                ) : (
                  <p className={`text-2xl font-bold font-mono ${card.iconColor}`}>
                    {formatCurrency(card.value)}
                  </p>
                )}
              </div>
              <div className="mt-3 h-2">
                {card.showProgress ? (
                  <Progress
                    value={summary.paidPercentage}
                    className="h-2"
                  />
                ) : null}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-1"
        >
          <GlassCard hover={false} className="h-full">
            <h2 className="text-lg font-semibold text-foreground mb-4">Despesas por Categoria</h2>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Skeleton className="w-48 h-48 rounded-full" />
              </div>
            ) : categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Sem dados para exibir
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Payments Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <GlassCard hover={false}>
            <h2 className="text-lg font-semibold text-foreground mb-4">Pagamentos do Mês</h2>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : payments.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Despesa</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.slice(0, 8).map((payment) => {
                      const expense = expenses.find(e => e.id === payment.expenseId)
                      const category = expense ? categories.find(c => c.id === expense.categoryId) : null
                      
                      return (
                        <TableRow key={payment.id} className="border-border">
                          <TableCell className="font-medium">
                            {expense?.name || 'Despesa'}
                          </TableCell>
                          <TableCell>
                            {category && (
                              <div className="flex items-center gap-2">
                                <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                                <span className="text-sm text-muted-foreground">{category.name}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {format(parseISO(payment.dueDate), 'dd/MM', { locale: ptBR })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={payment.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            {payment.status !== 'PAID' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsPaid(payment.id, expense?.name || 'Pagamento')}
                                className="text-success border-success hover:bg-success hover:text-white"
                              >
                                Pagar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                Nenhum pagamento encontrado
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}

