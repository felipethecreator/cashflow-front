export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  userId: string
  expenseCount: number
  createdAt: string
}

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface Expense {
  id: string
  name: string
  categoryId: string
  category?: Category
  amount: number
  dueDay: number
  priority: Priority
  isRecurring: boolean
  isActive: boolean
  userId: string
  createdAt: string
}

export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE'

export interface Payment {
  id: string
  expenseId: string
  expense?: Expense
  amount: number
  dueDate: string
  status: PaymentStatus
  paidAt?: string
  notes?: string
  userId: string
  createdAt: string
}

export interface DashboardSummary {
  totalExpenses: number
  totalPaid: number
  totalPending: number
  totalOverdue: number
  expenseCount: number
  paidCount: number
  pendingCount: number
  overdueCount: number
  categoryBreakdown: {
    categoryId: string
    categoryName: string
    categoryColor: string
    total: number
  }[]
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => void
}

export interface CategoryState {
  categories: Category[]
  isLoading: boolean
  fetchCategories: () => Promise<void>
  createCategory: (data: Partial<Category>) => Promise<void>
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
}

export interface ExpenseState {
  expenses: Expense[]
  isLoading: boolean
  fetchExpenses: () => Promise<void>
  createExpense: (data: Partial<Expense>) => Promise<void>
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
}

export interface PaymentState {
  payments: Payment[]
  isLoading: boolean
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  fetchPayments: (month: string) => Promise<void>
  markAsPaid: (id: string, notes?: string) => Promise<void>
  markAsUnpaid: (id: string) => Promise<void>
}
