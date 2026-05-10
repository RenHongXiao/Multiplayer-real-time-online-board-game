import { create } from 'zustand';
import api from '../services/api';

interface RoomInfo {
  _id: string;
  roomId: string;
  gameType: 'chinese-chess' | 'gomoku';
  hostId: {
    _id: string;
    nickname: string;
    username: string;
    stats: { rating: number };
  };
  player2Id: any;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: string;
}

interface LobbyState {
  rooms: RoomInfo[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  fetchRooms: (gameType?: string) => Promise<void>;
  createRoom: (gameType: 'chinese-chess' | 'gomoku', mode?: 'pvp' | 'ai') => Promise<string | null>;
  joinRoom: (roomId: string) => Promise<void>;
}

export const useLobbyStore = create<LobbyState>((set) => ({
  rooms: [],
  loading: false,
  error: null,
  creating: false,

  fetchRooms: async (gameType?) => {
    set({ loading: true, error: null });
    try {
      const params = gameType ? { gameType } : {};
      const { data } = await api.get('/rooms', { params });
      if (data.code === 0) {
        set({ rooms: data.data, loading: false });
      } else {
        set({ error: data.message, loading: false });
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '获取房间列表失败', loading: false });
    }
  },

  createRoom: async (gameType, mode = 'pvp') => {
    set({ creating: true, error: null });
    try {
      const { data } = await api.post('/rooms', { gameType, mode });
      if (data.code === 0) {
        set({ creating: false });
        return data.data.roomId;
      }
      set({ error: data.message, creating: false });
      return null;
    } catch (err: any) {
      set({ error: err.response?.data?.message || '创建房间失败', creating: false });
      return null;
    }
  },

  joinRoom: async (roomId) => {
    set({ error: null });
    try {
      const { data } = await api.post(`/rooms/${roomId}/join`);
      if (data.code !== 0) {
        set({ error: data.message });
        throw new Error(data.message);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || '加入房间失败';
      set({ error: msg });
      throw new Error(msg);
    }
  },
}));
