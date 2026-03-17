const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getStoredToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem('token');
}

export function setStoredToken(token: string): void {
  if (!isBrowser()) return;
  localStorage.setItem('token', token);
}

export function clearStoredToken(): void {
  if (!isBrowser()) return;
  localStorage.removeItem('token');
}

function getHeaders(includeAuth = true): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

function extractErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return 'Erro na requisição';
  }

  const data = payload as Record<string, unknown>;

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error;
  }

  if (typeof data.detail === 'string' && data.detail.trim()) {
    return data.detail;
  }

  return 'Erro na requisição';
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);

    if (response.status === 401) {
      clearStoredToken();
      if (isBrowser()) {
        window.location.href = '/login';
      }
    }

    throw new Error(extractErrorMessage(errorPayload));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export type ExpensePriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  icon: string;
  color: string;
}

export interface UpdateCategoryRequest {
  name: string;
  icon?: string;
  color?: string;
}

export interface Expense {
  id: string;
  name: string;
  categoryName: string;
  categoryId: string;
  amount: number;
  dueDay: number;
  priority: ExpensePriority;
  isActive: boolean;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseRequest {
  name: string;
  categoryId: string;
  amount: number;
  dueDay: number;
  priority: ExpensePriority;
  isRecurring: boolean;
}

export interface UpdateExpenseRequest extends CreateExpenseRequest {
  isActive: boolean;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify(data),
  });

  return handleResponse<AuthResponse>(response);
}

export async function register(data: RegisterRequest): Promise<UserResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify(data),
  });

  return handleResponse<UserResponse>(response);
}

export function logout(): void {
  clearStoredToken();
}

export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_URL}/categories`, {
    headers: getHeaders(),
  });

  return handleResponse<Category[]>(response);
}

export async function createCategory(data: CreateCategoryRequest): Promise<Category> {
  const response = await fetch(`${API_URL}/categories/create`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<Category>(response);
}

export async function updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<Category>(response);
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  await handleResponse<void>(response);
}

export async function getExpenses(): Promise<Expense[]> {
  const response = await fetch(`${API_URL}/expenses`, {
    headers: getHeaders(),
  });

  return handleResponse<Expense[]>(response);
}

export async function createExpense(data: CreateExpenseRequest): Promise<Expense> {
  const response = await fetch(`${API_URL}/expenses`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<Expense>(response);
}

export async function updateExpense(id: string, data: UpdateExpenseRequest): Promise<Expense> {
  const response = await fetch(`${API_URL}/expenses/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<Expense>(response);
}

export async function deleteExpense(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/expenses/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  await handleResponse<void>(response);
}
