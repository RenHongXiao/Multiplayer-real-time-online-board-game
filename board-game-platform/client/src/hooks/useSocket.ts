import { useEffect } from 'react';
import { getSocket } from '../services/socket';
import { useGameStore } from '../stores/gameStore';

export function useSocket(roomId?: string) {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const rId = roomId || useGameStore.getState().roomId;
    if (rId) {
      console.log('Emitting join_room for', rId);
      socket.emit('join_room', { roomId: rId });
    }
  }, [roomId]);
}
