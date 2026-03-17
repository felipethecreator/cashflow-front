import { create } from 'zustand';
import * as api from '@/lib/api';
import { toast } from 'sonner';

interface CategoriesState {
  categories: api.Category[];
  loading: boolean;
  
  fetchCategories: () => Promise<void>;
  createCategory: (data: api.CreateCategoryRequest) => Promise<void>;
  updateCategory: (id: string, data: api.CreateCategoryRequest) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  loading: false,

  fetchCategories: async () => {
    set({ loading: true });
    try {
      const categories = await api.getCategories();
      set({ categories, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error('Erro ao carregar categorias');
      console.error(error);
    }
  },

  createCategory: async (data) => {
    try {
      const newCategory = await api.createCategory(data);
      set((state) => ({ 
        categories: [...state.categories, newCategory] 
      }));
      toast.success('Categoria criada com sucesso!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar categoria';
      toast.error(message);
      throw error;
    }
  },

  updateCategory: async (id, data) => {
    try {
      const updated = await api.updateCategory(id, data);
      set((state) => ({
        categories: state.categories.map((cat) => 
          cat.id === id ? updated : cat
        )
      }));
      toast.success('Categoria atualizada!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar';
      toast.error(message);
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      await api.deleteCategory(id);
      set((state) => ({
        categories: state.categories.filter((cat) => cat.id !== id)
      }));
      toast.success('Categoria deletada!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar';
      toast.error(message);
      throw error;
    }
  },
}));