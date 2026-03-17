'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Calendar, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useCategoryStore, useExpenseStore } from '@/lib/store'
import type { Expense, Priority } from '@/lib/types'
import { GlassCard } from '@/components/glass-card'
import { StatusBadge } from '@/components/status-badge'
import { CategoryIcon } from '@/components/category-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'HIGH', label: 'Alta', color: 'text-destructive' },
  { value: 'MEDIUM', label: 'Média', color: 'text-warning' },
  { value: 'LOW', label: 'Baixa', color: 'text-success' },
]

export default function ExpensesPage() {
  const { categories, fetchCategories } = useCategoryStore()
  const { expenses, fetchExpenses, createExpense, updateExpense, deleteExpense, isLoading } = useExpenseStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [showInactive, setShowInactive] = useState(false)

  // Form
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    amount: '',
    dueDay: '',
    priority: 'MEDIUM' as Priority,
    isRecurring: true,
    isActive: true
  })

  useEffect(() => {
    fetchCategories()
    fetchExpenses()
  }, [fetchCategories, fetchExpenses])

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      if (filterCategory !== 'all' && expense.categoryId !== filterCategory) return false
      if (filterPriority !== 'all' && expense.priority !== filterPriority) return false
      if (!showInactive && !expense.isActive) return false
      return true
    })
  }, [expenses, filterCategory, filterPriority, showInactive])

  const openCreateModal = () => {
    setEditingExpense(null)
    setFormData({
      name: '',
      categoryId: categories[0]?.id || '',
      amount: '',
      dueDay: '1',
      priority: 'MEDIUM',
      isRecurring: true,
      isActive: true
    })
    setIsModalOpen(true)
  }

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      name: expense.name,
      categoryId: expense.categoryId,
      amount: expense.amount.toString(),
      dueDay: expense.dueDay.toString(),
      priority: expense.priority,
      isRecurring: expense.isRecurring,
      isActive: expense.isActive
    })
    setIsModalOpen(true)
  }

  const openDeleteDialog = (expense: Expense) => {
    setExpenseToDelete(expense)
    setIsDeleteOpen(true)
  }

  const formatCurrencyInput = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    const amount = parseFloat(numbers) / 100
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const parseCurrencyInput = (value: string) => {
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    
    if (!formData.categoryId) {
      toast.error('Selecione uma categoria')
      return
    }
    
    setIsSaving(true)
    
    try {
      const data = {
        name: formData.name,
        categoryId: formData.categoryId,
        amount: parseCurrencyInput(formData.amount),
        dueDay: parseInt(formData.dueDay) || 1,
        priority: formData.priority,
        isRecurring: formData.isRecurring,
        isActive: formData.isActive
      }
      
      if (editingExpense) {
        await updateExpense(editingExpense.id, data)
        toast.success('Despesa atualizada!')
      } else {
        await createExpense(data)
        toast.success('Despesa criada!')
      }
      setIsModalOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!expenseToDelete) return
    
    try {
      await deleteExpense(expenseToDelete.id)
      toast.success('Despesa deletada!')
      setIsDeleteOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao deletar')
    }
  }

  const handleToggleActive = async (expense: Expense) => {
    try {
      await updateExpense(expense.id, { isActive: !expense.isActive })
      toast.success(expense.isActive ? 'Despesa desativada' : 'Despesa ativada')
    } catch (error) {
      toast.error('Erro ao atualizar')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Despesas Recorrentes</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas despesas mensais</p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Despesa
        </Button>
      </div>

      {/* Filters */}
      <GlassCard hover={false} className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex gap-4 flex-wrap">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px] bg-surface">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[150px] bg-surface">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {priorityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className={opt.color}>{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={showInactive}
              onCheckedChange={setShowInactive}
              id="show-inactive"
            />
            <Label htmlFor="show-inactive" className="text-sm text-muted-foreground cursor-pointer">
              Mostrar inativas
            </Label>
          </div>
        </div>
      </GlassCard>

      {/* Expenses List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : filteredExpenses.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredExpenses.map((expense) => {
            const category = categories.find(c => c.id === expense.categoryId)
            
            return (
              <motion.div key={expense.id} variants={itemVariants}>
                <GlassCard className={`group ${!expense.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{expense.name}</h3>
                      <StatusBadge status={expense.priority} />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(expense)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => openDeleteDialog(expense)}
                        className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {category && (
                      <div className="flex items-center gap-2">
                        <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                        <span className="text-sm text-muted-foreground">{category.name}</span>
                      </div>
                    )}

                    <p className="text-2xl font-bold font-mono text-primary">
                      {formatCurrency(expense.amount)}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        Vence dia {expense.dueDay}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {expense.isRecurring && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary">
                            <RefreshCw className="w-3 h-3 inline mr-1" />
                            Recorrente
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <Label htmlFor={`active-${expense.id}`} className="text-sm cursor-pointer">
                        {expense.isActive ? 'Ativa' : 'Inativa'}
                      </Label>
                      <Switch
                        id={`active-${expense.id}`}
                        checked={expense.isActive}
                        onCheckedChange={() => handleToggleActive(expense)}
                      />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </motion.div>
      ) : (
        <GlassCard hover={false} className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-4">
            <CategoryIcon icon="Receipt" size="lg" className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Nenhuma despesa encontrada</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            {filterCategory !== 'all' || filterPriority !== 'all' 
              ? 'Tente ajustar os filtros'
              : 'Crie sua primeira despesa'}
          </p>
          <Button onClick={openCreateModal} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Nova Despesa
          </Button>
        </GlassCard>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
            </DialogTitle>
            <DialogDescription>
              {editingExpense
                ? 'Atualize os dados da despesa'
                : 'Preencha os dados para criar uma nova despesa'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Aluguel"
                className="bg-surface"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger className="bg-surface">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: formatCurrencyInput(e.target.value) })}
                  placeholder="0,00"
                  className="bg-surface font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDay">Dia do vencimento</Label>
                <Input
                  id="dueDay"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dueDay}
                  onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                  className="bg-surface"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}
              >
                <SelectTrigger className="bg-surface">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className={opt.color}>{opt.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="recurring" className="cursor-pointer">
                Despesa recorrente
              </Label>
              <Switch
                id="recurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : editingExpense ? (
                  'Salvar'
                ) : (
                  'Criar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar despesa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a despesa{' '}
              <strong>{expenseToDelete?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
