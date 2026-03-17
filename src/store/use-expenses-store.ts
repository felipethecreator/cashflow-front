import { create } from 'zustand';
import * as api from '@/lib/api';
import { toast } from 'sonner';

interface ExpensesState {
  expenses: api.Expense[];
  loading: boolean;
  
  fetchExpenses: () => Promise<void>;
  createExpense: (data: api.CreateExpenseRequest) => Promise<void>;
  updateExpense: (id: string, data: api.UpdateExpenseRequest) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

export const useExpensesStore = create<ExpensesState>((set, get) => ({
  expenses: [],
  loading: false,

  fetchExpenses: async () => {
    set({ loading: true });
    try {
      const expenses = await api.getExpenses();
      set({ expenses, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error('Erro ao carregar despesas');
      console.error(error);
    }
  },

  createExpense: async (data) => {
    try {
      const newExpense = await api.createExpense(data);
      set((state) => ({ 
        expenses: [...state.expenses, newExpense] 
      }));
      toast.success('Despesa criada com sucesso!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar despesa';
      toast.error(message);
      throw error;
    }
  },

  updateExpense: async (id, data) => {
    try {
      const updated = await api.updateExpense(id, data);
      set((state) => ({
        expenses: state.expenses.map((exp) => 
          exp.id === id ? updated : exp
        )
      }));
      toast.success('Despesa atualizada!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar';
      toast.error(message);
      throw error;
    }
  },

  deleteExpense: async (id) => {
    try {
      await api.deleteExpense(id);
      set((state) => ({
        expenses: state.expenses.filter((exp) => exp.id !== id)
      }));
      toast.success('Despesa deletada!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar';
      toast.error(message);
      throw error;
    }
  },
}));