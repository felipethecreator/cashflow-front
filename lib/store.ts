import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  User,
  Category,
  Expense,
  Payment,
  PaymentStatus,
  AuthState,
  CategoryState,
  ExpenseState,
  PaymentState,
} from './types'
import * as api from './api'
import { toast } from 'sonner'

const PAYMENT_META_STORAGE_KEY = 'cashflow-payment-meta'

type PaymentMeta = {
  paidAt: string
  notes?: string
}

type PaymentMetaById = Record<string, PaymentMeta>
type PaymentMetaByMonth = Record<string, PaymentMetaById>

function getCurrentMonth(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

function toNumber(value: number | string): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function mapApiUser(user: api.UserResponse): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  }
}

function mapApiExpense(expense: api.Expense): Expense {
  return {
    id: expense.id,
    name: expense.name,
    categoryId: expense.categoryId,
    amount: toNumber(expense.amount),
    dueDay: expense.dueDay,
    priority: expense.priority,
    isRecurring: expense.isRecurring,
    isActive: expense.isActive,
    userId: '',
    createdAt: expense.createdAt,
  }
}

function mapApiCategory(category: api.Category, expenseCount = 0): Category {
  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    userId: '',
    expenseCount,
    createdAt: category.createdAt,
  }
}

function buildExpenseCountByCategory(expenses: api.Expense[]): Record<string, number> {
  return expenses.reduce<Record<string, number>>((acc, expense) => {
    if (!expense.categoryId) {
      return acc
    }

    acc[expense.categoryId] = (acc[expense.categoryId] ?? 0) + 1
    return acc
  }, {})
}

function loadPaymentMeta(): PaymentMetaByMonth {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = localStorage.getItem(PAYMENT_META_STORAGE_KEY)
    if (!raw) {
      return {}
    }

    return JSON.parse(raw) as PaymentMetaByMonth
  } catch {
    return {}
  }
}

function savePaymentMeta(meta: PaymentMetaByMonth): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(PAYMENT_META_STORAGE_KEY, JSON.stringify(meta))
}

let paymentMetaCache: PaymentMetaByMonth = loadPaymentMeta()

function getMonthMeta(month: string): PaymentMetaById {
  return paymentMetaCache[month] ?? {}
}

function setMonthMeta(month: string, meta: PaymentMetaById): void {
  paymentMetaCache = {
    ...paymentMetaCache,
    [month]: meta,
  }

  savePaymentMeta(paymentMetaCache)
}

function buildPaymentId(expenseId: string, month: string): string {
  return `${expenseId}:${month}`
}

function parseMonth(monthValue: string): { year: number; monthIndex: number } {
  const [yearRaw, monthRaw] = monthValue.split('-')

  const year = Number(yearRaw)
  const monthIndex = Number(monthRaw) - 1

  if (Number.isNaN(year) || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    const now = new Date()
    return { year: now.getFullYear(), monthIndex: now.getMonth() }
  }

  return { year, monthIndex }
}

function buildDueDate(monthValue: string, dueDay: number): string {
  const { year, monthIndex } = parseMonth(monthValue)
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate()
  const clampedDay = Math.min(Math.max(dueDay, 1), lastDayOfMonth)

  const date = new Date(year, monthIndex, clampedDay)
  return date.toISOString()
}

function getPaymentStatus(dueDate: string, isPaid: boolean): PaymentStatus {
  if (isPaid) {
    return 'PAID'
  }

  const due = new Date(dueDate)
  due.setHours(23, 59, 59, 999)

  if (due.getTime() < Date.now()) {
    return 'OVERDUE'
  }

  return 'PENDING'
}

function buildPaymentsFromExpenses(expenses: Expense[], month: string): Payment[] {
  const monthMeta = getMonthMeta(month)

  return expenses
    .filter((expense) => expense.isActive)
    .map((expense) => {
      const id = buildPaymentId(expense.id, month)
      const meta = monthMeta[id]
      const dueDate = buildDueDate(month, expense.dueDay)
      const isPaid = Boolean(meta?.paidAt)

      return {
        id,
        expenseId: expense.id,
        amount: expense.amount,
        dueDate,
        status: getPaymentStatus(dueDate, isPaid),
        paidAt: meta?.paidAt,
        notes: meta?.notes,
        userId: expense.userId,
        createdAt: expense.createdAt,
      }
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
}

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

        try {
          const response = await api.login({ email, password })
          api.setStoredToken(response.token)

          set({
            user: mapApiUser(response.user),
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true })

        try {
          await api.register({ name, email, password })
          const response = await api.login({ email, password })
          api.setStoredToken(response.token)

          set({
            user: mapApiUser(response.user),
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        api.logout()
        set({ user: null, token: null, isAuthenticated: false })
      },

      checkAuth: () => {
        const stateToken = get().token
        const storedToken = api.getStoredToken()

        if (!stateToken && !storedToken) {
          set({ isAuthenticated: false, token: null, user: null })
          return
        }

        if (stateToken && !storedToken) {
          api.setStoredToken(stateToken)
        }

        if (!stateToken && storedToken) {
          set({ token: storedToken, isAuthenticated: true })
          return
        }

        set({ isAuthenticated: true })
      },
    }),
    {
      name: 'cashflow-auth',
    },
  ),
)

// Categories Store
export const useCategoryStore = create<CategoryState>()((set, get) => ({
  categories: [],
  isLoading: false,

  fetchCategories: async () => {
    set({ isLoading: true })

    try {
      const [apiCategories, apiExpenses] = await Promise.all([
        api.getCategories(),
        api.getExpenses().catch(() => []),
      ])

      const expenseCountByCategory = buildExpenseCountByCategory(apiExpenses)

      const categories = apiCategories.map((category) =>
        mapApiCategory(category, expenseCountByCategory[category.id] ?? 0),
      )

      set({ categories, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar categorias'
      toast.error(message)
      set({ categories: [], isLoading: false })
    }
  },

  createCategory: async (data: Partial<Category>) => {
    set({ isLoading: true })

    try {
      const payload: api.CreateCategoryRequest = {
        name: (data.name ?? '').trim(),
        icon: data.icon ?? 'Folder',
        color: data.color ?? '#6366F1',
      }

      const created = await api.createCategory(payload)

      set((state) => ({
        categories: [...state.categories, mapApiCategory(created, 0)],
        isLoading: false,
      }))
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  updateCategory: async (id: string, data: Partial<Category>) => {
    set({ isLoading: true })

    try {
      const currentCategory = get().categories.find((category) => category.id === id)

      const payload: api.UpdateCategoryRequest = {
        name: (data.name ?? currentCategory?.name ?? '').trim(),
        icon: data.icon ?? currentCategory?.icon,
        color: data.color ?? currentCategory?.color,
      }

      const updated = await api.updateCategory(id, payload)

      set((state) => ({
        categories: state.categories.map((category) =>
          category.id === id
            ? mapApiCategory(updated, category.expenseCount)
            : category,
        ),
        isLoading: false,
      }))
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  deleteCategory: async (id: string) => {
    set({ isLoading: true })

    try {
      await api.deleteCategory(id)

      set((state) => ({
        categories: state.categories.filter((category) => category.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
}))

// Expenses Store
export const useExpenseStore = create<ExpenseState>()((set, get) => ({
  expenses: [],
  isLoading: false,

  fetchExpenses: async () => {
    set({ isLoading: true })

    try {
      const apiExpenses = await api.getExpenses()
      const expenses = apiExpenses.map(mapApiExpense)

      set({ expenses, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar despesas'
      toast.error(message)
      set({ expenses: [], isLoading: false })
    }
  },

  createExpense: async (data: Partial<Expense>) => {
    set({ isLoading: true })

    try {
      const payload: api.CreateExpenseRequest = {
        name: (data.name ?? '').trim(),
        categoryId: data.categoryId ?? '',
        amount: toNumber(data.amount ?? 0),
        dueDay: Number(data.dueDay ?? 1),
        priority: (data.priority ?? 'MEDIUM') as api.ExpensePriority,
        isRecurring: data.isRecurring ?? true,
      }

      const created = await api.createExpense(payload)

      set((state) => ({
        expenses: [...state.expenses, mapApiExpense(created)],
        isLoading: false,
      }))
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  updateExpense: async (id: string, data: Partial<Expense>) => {
    set({ isLoading: true })

    try {
      const currentExpense = get().expenses.find((expense) => expense.id === id)

      if (!currentExpense) {
        throw new Error('Despesa não encontrada')
      }

      const mergedExpense: Expense = {
        ...currentExpense,
        ...data,
      }

      const payload: api.UpdateExpenseRequest = {
        name: mergedExpense.name,
        categoryId: mergedExpense.categoryId,
        amount: toNumber(mergedExpense.amount),
        dueDay: Number(mergedExpense.dueDay),
        priority: mergedExpense.priority as api.ExpensePriority,
        isRecurring: mergedExpense.isRecurring,
        isActive: mergedExpense.isActive,
      }

      const updated = await api.updateExpense(id, payload)

      set((state) => ({
        expenses: state.expenses.map((expense) =>
          expense.id === id ? mapApiExpense(updated) : expense,
        ),
        isLoading: false,
      }))
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  deleteExpense: async (id: string) => {
    set({ isLoading: true })

    try {
      await api.deleteExpense(id)

      set((state) => ({
        expenses: state.expenses.filter((expense) => expense.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
}))

// Payments Store
export const usePaymentStore = create<PaymentState>()((set, get) => ({
  payments: [],
  isLoading: false,
  selectedMonth: getCurrentMonth(),

  setSelectedMonth: (month: string) => {
    set({ selectedMonth: month })
  },

  fetchPayments: async (month: string) => {
    set({ isLoading: true, selectedMonth: month })

    try {
      const apiExpenses = await api.getExpenses()
      const expenses = apiExpenses.map(mapApiExpense)
      const payments = buildPaymentsFromExpenses(expenses, month)

      set({ payments, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar pagamentos'
      toast.error(message)
      set({ payments: [], isLoading: false })
    }
  },

  markAsPaid: async (id: string, notes?: string) => {
    set({ isLoading: true })

    try {
      const month = get().selectedMonth
      const currentMeta = getMonthMeta(month)

      setMonthMeta(month, {
        ...currentMeta,
        [id]: {
          paidAt: new Date().toISOString(),
          notes,
        },
      })

      set((state) => ({
        payments: state.payments.map((payment) =>
          payment.id === id
            ? {
                ...payment,
                status: 'PAID',
                paidAt: getMonthMeta(month)[id]?.paidAt,
                notes,
              }
            : payment,
        ),
        isLoading: false,
      }))
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  markAsUnpaid: async (id: string) => {
    set({ isLoading: true })

    try {
      const month = get().selectedMonth
      const currentMeta = { ...getMonthMeta(month) }
      delete currentMeta[id]
      setMonthMeta(month, currentMeta)

      set((state) =>
        ({
          payments: state.payments.map((payment) =>
            payment.id === id
              ? {
                  ...payment,
                  status: getPaymentStatus(payment.dueDate, false),
                  paidAt: undefined,
                  notes: undefined,
                }
              : payment,
          ),
          isLoading: false,
        }),
      )
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
}))


