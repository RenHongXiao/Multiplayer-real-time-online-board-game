import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../stores/gameStore';

let socket: Socket | null = null;

function setupListeners(s: Socket) {
  s.on('game_start', (data: any) => {
    console.log('game_start received:', data);
    const store = useGameStore.getState();
    store.setGameState(data.gameState);
    store.setGameType(data.gameType);
    const userStr = localStorage.getItem('user');
    console.log('[socket] user from localStorage:', userStr);
    console.log('[socket] players from server:', data.players);
    if (userStr && data.players) {
      try {
        const user = JSON.parse(userStr);
        console.log('[socket] my userId:', user.id);
        const myColor = data.players[user.id];
        if (myColor) {
          store.setMyColor(myColor);
          console.log('[socket] My color:', myColor);
        } else {
          console.error('[socket] userId', user.id, 'NOT found in players map! Keys:', Object.keys(data.players));
        }
      } catch (e) { console.error('[socket] error parsing user:', e); }
    } else {
      console.error('[socket] missing user or players:', !!userStr, !!data.players);
    }
  });

  s.on('move_made', (data: any) => {
    const store = useGameStore.getState();
    if (store.gameState) {
      store.setGameState({
        ...store.gameState,
        board: data.board || store.gameState.board,
        currentTurn: data.currentTurn,
        moveCount: data.moveCount,
        moves: [...store.gameState.moves, {
          from: data.from,
          to: data.to,
          piece: data.piece,
          captured: data.captured,
        }],
      });
    }
  });

  s.on('game_over', (data: any) => {
    const store = useGameStore.getState();
    if (store.gameState) {
      store.setGameState({
        ...store.gameState,
        board: data.gameState?.board || store.gameState.board,
        isOver: true,
        result: data.result,
      });
    }
  });

  s.on('timer_update', (data: { red: number; black: number }) => {
    useGameStore.getState().setTimer(data);
  });

  s.on('chat_message', (data: { userId: string; message: string; timestamp: string }) => {
    useGameStore.getState().addChatMessage(data);
  });

  s.on('draw_requested', () => {
    useGameStore.getState().addChatMessage({
      userId: 'system',
      message: '对方请求和棋',
      timestamp: new Date().toISOString(),
    });
  });

  s.on('draw_response', (data: { accepted: boolean }) => {
    if (!data.accepted) {
      useGameStore.getState().addChatMessage({
        userId: 'system',
        message: '对方拒绝了和棋请求',
        timestamp: new Date().toISOString(),
      });
    }
  });

  s.on('rematch_request', (data: any) => {
    const store = useGameStore.getState();
    store.setRematchRequested(true);
    store.addChatMessage({
      userId: 'system',
      message: '对方邀请再来一局，点击"再来一局"同意',
      timestamp: new Date().toISOString(),
    });
  });

  s.on('opponent_disconnect', () => {
    useGameStore.getState().setOpponentDisconnected(true);
  });

  s.on('error', (data: { message: string }) => {
    console.error('Game error:', data.message);
  });
}

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io('/', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  setupListeners(socket);

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
