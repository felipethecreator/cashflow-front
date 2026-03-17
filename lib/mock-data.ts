import type { User, Category, Expense, Payment } from './types'

export const mockUser: User = {
  id: '1',
  name: 'João Silva',
  email: 'joao@email.com',
  createdAt: '2024-01-01T00:00:00Z'
}

export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Moradia',
    icon: 'Home',
    color: '#6366F1',
    userId: '1',
    expenseCount: 3,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Alimentação',
    icon: 'UtensilsCrossed',
    color: '#10B981',
    userId: '1',
    expenseCount: 2,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Transporte',
    icon: 'Car',
    color: '#F59E0B',
    userId: '1',
    expenseCount: 2,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'Lazer',
    icon: 'Gamepad2',
    color: '#8B5CF6',
    userId: '1',
    expenseCount: 1,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'Saúde',
    icon: 'Heart',
    color: '#EF4444',
    userId: '1',
    expenseCount: 1,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '6',
    name: 'Educação',
    icon: 'GraduationCap',
    color: '#06B6D4',
    userId: '1',
    expenseCount: 1,
    createdAt: '2024-01-01T00:00:00Z'
  }
]

export const mockExpenses: Expense[] = [
  {
    id: '1',
    name: 'Aluguel',
    categoryId: '1',
    amount: 1500,
    dueDay: 5,
    priority: 'HIGH',
    isRecurring: true,
    isActive: true,
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Condomínio',
    categoryId: '1',
    amount: 450,
    dueDay: 10,
    priority: 'HIGH',
    isRecurring: true,
    isActive: true,
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Energia Elétrica',
    categoryId: '1',
    amount: 180,
    dueDay: 15,
    priority: 'MEDIUM',
    isRecurring: true,
    isActive: true,
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'Supermercado',
    categoryId: '2',
    amount: 800,
    dueDay: 1,
    priority: 'HIGH',
    isRecurring: true,
    isActive: true,
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'Restaurantes',
    categoryId: '2',
    amount: 350,
    dueDay: 25,
    priority: 'LOW',
    isRecurring: true,
    isActive: true,
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '6',
    name: 'Combustível',
    categoryId: '3',
    amount: 400,
    dueDay: 20,
    priority: 'MEDIUM',
    isRecurring: true,
    isActive: true,
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '7',
    name: 'Seguro do Carro',
    categoryId: '3',
    amount: 280,
    dueDay: 12,
    priority: 'HIGH',
    isRecurring: true,
    isActive: true,
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '8',
    name: 'Netflix',
    categoryId: '4',
    amount: 55.90,
    dueDay: 8,
    priority: 'LOW',
    isRecurring: true,
    isActive: true,
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '9',
    name: 'Plano de Saúde',
    categoryId: '5',
    amount: 450,
    dueDay: 5,
    priority: 'HIGH',
    isRecurring: true,
    isActive: true,
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '10',
    name: 'Curso de Inglês',
    categoryId: '6',
    amount: 199,
    dueDay: 10,
    priority: 'MEDIUM',
    isRecurring: true,
    isActive: true,
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  }
]

const today = new Date()
const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

function getPaymentDate(day: number): string {
  const date = new Date(today.getFullYear(), today.getMonth(), day)
  return date.toISOString().split('T')[0]
}

function getPaymentStatus(day: number, isPaid: boolean): 'PAID' | 'PENDING' | 'OVERDUE' {
  if (isPaid) return 'PAID'
  if (day < today.getDate()) return 'OVERDUE'
  return 'PENDING'
}

export const mockPayments: Payment[] = [
  {
    id: '1',
    expenseId: '1',
    amount: 1500,
    dueDate: getPaymentDate(5),
    status: getPaymentStatus(5, true),
    paidAt: getPaymentDate(4) + 'T10:30:00Z',
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    expenseId: '2',
    amount: 450,
    dueDate: getPaymentDate(10),
    status: getPaymentStatus(10, true),
    paidAt: getPaymentDate(9) + 'T14:15:00Z',
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    expenseId: '3',
    amount: 180,
    dueDate: getPaymentDate(15),
    status: getPaymentStatus(15, false),
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    expenseId: '4',
    amount: 800,
    dueDate: getPaymentDate(1),
    status: getPaymentStatus(1, true),
    paidAt: getPaymentDate(1) + 'T09:00:00Z',
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    expenseId: '5',
    amount: 350,
    dueDate: getPaymentDate(25),
    status: getPaymentStatus(25, false),
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '6',
    expenseId: '6',
    amount: 400,
    dueDate: getPaymentDate(20),
    status: getPaymentStatus(20, false),
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '7',
    expenseId: '7',
    amount: 280,
    dueDate: getPaymentDate(12),
    status: getPaymentStatus(12, false),
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '8',
    expenseId: '8',
    amount: 55.90,
    dueDate: getPaymentDate(8),
    status: getPaymentStatus(8, true),
    paidAt: getPaymentDate(7) + 'T20:00:00Z',
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '9',
    expenseId: '9',
    amount: 450,
    dueDate: getPaymentDate(5),
    status: getPaymentStatus(5, true),
    paidAt: getPaymentDate(4) + 'T11:00:00Z',
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '10',
    expenseId: '10',
    amount: 199,
    dueDate: getPaymentDate(10),
    status: getPaymentStatus(10, false),
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  }
]

export function getExpenseWithCategory(expense: Expense): Expense {
  return {
    ...expense,
    category: mockCategories.find(c => c.id === expense.categoryId)
  }
}

export function getPaymentWithExpense(payment: Payment): Payment {
  const expense = mockExpenses.find(e => e.id === payment.expenseId)
  return {
    ...payment,
    expense: expense ? getExpenseWithCategory(expense) : undefined
  }
}

export function getCurrentMonth(): string {
  return currentMonth
}
