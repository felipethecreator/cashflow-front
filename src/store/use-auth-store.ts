import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '@/lib/api';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,

      login: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const response = await api.login({ email, password });
          api.setStoredToken(response.token);

          set({
            user: {
              id: response.user.id,
              name: response.user.name,
              email: response.user.email,
            },
            token: response.token,
            loading: false,
          });
          toast.success('Login realizado com sucesso!');
        } catch (error) {
          set({ loading: false });
          const message = error instanceof Error ? error.message : 'Erro ao fazer login';
          toast.error(message);
          throw error;
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ loading: true });
        try {
          await api.register({ name, email, password });
          const auth = await api.login({ email, password });
          api.setStoredToken(auth.token);

          set({
            user: {
              id: auth.user.id,
              name: auth.user.name,
              email: auth.user.email,
            },
            token: auth.token,
            loading: false,
          });
          toast.success('Conta criada!');
        } catch (error) {
          set({ loading: false });
          const message = error instanceof Error ? error.message : 'Erro ao registrar';
          toast.error(message);
          throw error;
        }
      },

      logout: () => {
        api.logout();
        set({ user: null, token: null });
        toast.info('Você saiu da conta');
      },

      checkAuth: () => {
        const token = get().token ?? api.getStoredToken();
        return !!token;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
