import { create } from 'zustand';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

interface UserInfo {
  id: string;
  username: string;
  nickname: string;
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    rating: number;
  };
}

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
  loadUser: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { username, password });
      if (data.code === 0) {
        const { token, user } = data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        connectSocket(token);
        set({ user, token, loading: false });
      } else {
        set({ error: data.message, loading: false });
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '登录失败', loading: false });
    }
  },

  register: async (username, password, nickname) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { username, password, nickname });
      if (data.code === 0) {
        const { token, user } = data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        connectSocket(token);
        set({ user, token, loading: false });
      } else {
        set({ error: data.message, loading: false });
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '注册失败', loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
    set({ user: null, token: null });
  },

  loadUser: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token });
        connectSocket(token);
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  },

  clearError: () => set({ error: null }),
}));
