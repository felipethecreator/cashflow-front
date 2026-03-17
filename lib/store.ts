import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Category, Expense, Payment, AuthState, CategoryState, ExpenseState, PaymentState } from './types'
import { mockUser, mockCategories, mockExpenses, mockPayments, getExpenseWithCategory, getPaymentWithExpense, getCurrentMonth } from './mock-data'

// Auth Store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (email === 'joao@email.com' && password === '123456') {
          const token = 'mock-jwt-token-' + Date.now()
          set({ 
            user: mockUser, 
            token, 
            isAuthenticated: true, 
            isLoading: false 
          })
        } else if (email && password.length >= 6) {
          // Allow any valid email/password for demo
          const token = 'mock-jwt-token-' + Date.now()
          set({ 
            user: { ...mockUser, email, name: email.split('@')[0] }, 
            token, 
            isAuthenticated: true, 
            isLoading: false 
          })
        } else {
          set({ isLoading: false })
          throw new Error('Credenciais inválidas')
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true })
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        if (name && email && password.length >= 6) {
          const token = 'mock-jwt-token-' + Date.now()
          const newUser: User = {
            id: Date.now().toString(),
            name,
            email,
            createdAt: new Date().toISOString()
          }
          set({ 
            user: newUser, 
            token, 
            isAuthenticated: true, 
            isLoading: false 
          })
        } else {
          set({ isLoading: false })
          throw new Error('Dados inválidos')
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },

      checkAuth: () => {
        const { token } = get()
        if (!token) {
          set({ isAuthenticated: false })
        }
      }
    }),
    {
      name: 'cashflow-auth'
    }
  )
)

// Categories Store
export const useCategoryStore = create<CategoryState>()((set, get) => ({
  categories: [],
  isLoading: false,

  fetchCategories: async () => {
    set({ isLoading: true })
    await new Promise(resolve => setTimeout(resolve, 500))
    set({ categories: mockCategories, isLoading: false })
  },

  createCategory: async (data: Partial<Category>) => {
    set({ isLoading: true })
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const newCategory: Category = {
      id: Date.now().toString(),
      name: data.name || 'Nova Categoria',
      icon: data.icon || 'Folder',
      color: data.color || '#6366F1',
      userId: '1',
      expenseCount: 0,
      createdAt: new Date().toISOString()
    }
    
    set(state => ({ 
      categories: [...state.categories, newCategory],
      isLoading: false 
    }))
  },

  updateCategory: async (id: string, data: Partial<Category>) => {
    set({ isLoading: true })
    await new Promise(resolve => setTimeout(resolve, 500))
    
    set(state => ({
      categories: state.categories.map(cat => 
        cat.id === id ? { ...cat, ...data } : cat
      ),
      isLoading: false
    }))
  },

  deleteCategory: async (id: string) => {
    const category = get().categories.find(c => c.id === id)
    if (category && category.expenseCount > 0) {
      throw new Error(`Não é possível deletar categoria com ${category.expenseCount} despesa(s) vinculada(s)`)
    }
    
    set({ isLoading: true })
    await new Promise(resolve => setTimeout(resolve, 500))
    
    set(state => ({
      categories: state.categories.filter(cat => cat.id !== id),
      isLoading: false
    }))
  }
}))

// Expenses Store
export const useExpenseStore = create<ExpenseState>()((set) => ({
  expenses: [],
  isLoading: false,

  fetchExpenses: async () => {
    set({ isLoading: true })
    await new Promise(resolve => setTimeout(resolve, 500))
    set({ 
      expenses: mockExpenses.map(getExpenseWithCategory), 
      isLoading: false 
    })
  },

  createExpense: async (data: Partial<Expense>) => {
    set({ isLoading: true })
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const newExpense: Expense = {
      id: Date.now().toString(),
      name: data.name || 'Nova Despesa',
      categoryId: data.categoryId || '1',
      amount: data.amount || 0,
      dueDay: data.dueDay || 1,
      priority: data.priority || 'MEDIUM',
      isRecurring: data.isRecurring ?? true,
      isActive: data.isActive ?? true,
      userId: '1',
      createdAt: new Date().toISOString()
    }
    
    set(state => ({ 
      expenses: [...state.expenses, getExpenseWithCategory(newExpense)],
      isLoading: false 
    }))
  },

  updateExpense: async (id: string, data: Partial<Expense>) => {
    set({ isLoading: true })
    await new Promise(resolve => setTimeout(resolve, 500))
    
    set(state => ({
      expenses: state.expenses.map(exp => 
        exp.id === id ? getExpenseWithCategory({ ...exp, ...data }) : exp
      ),
      isLoading: false
    }))
  },

  deleteExpense: async (id: string) => {
    set({ isLoading: true })
    await new Promise(resolve => setTimeout(resolve, 500))
    
    set(state => ({
      expenses: state.expenses.filter(exp => exp.id !== id),
      isLoading: false
    }))
  }
}))

// Payments Store
export const usePaymentStore = create<PaymentState>()((set) => ({
  payments: [],
  isLoading: false,
  selectedMonth: getCurrentMonth(),

  setSelectedMonth: (month: string) => {
    set({ selectedMonth: month })
  },

  fetchPayments: async (month: string) => {
    set({ isLoading: true, selectedMonth: month })
    await new Promise(resolve => setTimeout(resolve, 500))
    set({ 
      payments: mockPayments.map(getPaymentWithExpense), 
      isLoading: false 
    })
  },

  markAsPaid: async (id: string, notes?: string) => {
    set({ isLoading: true })
    await new Promise(resolve => setTimeout(resolve, 800))
    
    set(state => ({
      payments: state.payments.map(p => 
        p.id === id 
          ? { ...p, status: 'PAID' as const, paidAt: new Date().toISOString(), notes } 
          : p
      ),
      isLoading: false
    }))
  },

  markAsUnpaid: async (id: string) => {
    set({ isLoading: true })
    await new Promise(resolve => setTimeout(resolve, 500))
    
    set(state => ({
      payments: state.payments.map(p => 
        p.id === id 
          ? { ...p, status: 'PENDING' as const, paidAt: undefined, notes: undefined } 
          : p
      ),
      isLoading: false
    }))
  }
}))
