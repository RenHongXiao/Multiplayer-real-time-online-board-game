import { Server } from 'socket.io';
import { AuthSocket } from './index';
import { RoomService } from '../services/roomService';
import { GameService } from '../services/gameService';
import { ChineseChess } from '../game-engine/ChineseChess';
import { Gomoku } from '../game-engine/Gomoku';

interface GameSession {
  roomId: string;
  gameType: 'chinese-chess' | 'gomoku';
  players: Map<string, string>; // socketId -> color
  gameInstance: ChineseChess | Gomoku;
  recordId: string | null;
  timer: any;
}

const sessions = new Map<string, GameSession>();

export function getSession(roomId: string): GameSession | undefined {
  return sessions.get(roomId);
}

export function setSession(roomId: string, session: GameSession): void {
  sessions.set(roomId, session);
}

export function removeSession(roomId: string): void {
  sessions.delete(roomId);
}

const DEFAULT_TIME = 20 * 60;

function getColors(gameType: string): { p1: string; p2: string } {
  return gameType === 'chinese-chess'
    ? { p1: 'red', p2: 'black' }
    : { p1: 'black', p2: 'white' };
}

async function tryStartGame(io: Server, roomId: string, socket: AuthSocket): Promise<void> {
  const room = await RoomService.getRoom(roomId);
  if (!room || room.status !== 'playing') return;

  const hostId = room.hostId._id?.toString();
  const player2Id = room.player2Id?._id?.toString();
  if (!player2Id) return;

  const { p1, p2 } = getColors(room.gameType);

  let session = getSession(roomId);

  if (!session) {
    const gameInstance = room.gameType === 'chinese-chess' ? new ChineseChess() : new Gomoku();
    gameInstance.initialize();

    const record = await GameService.createRecord({
      roomId,
      gameType: room.gameType,
      player1Id: hostId!,
      player2Id,
      player1Color: p1,
      player2Color: p2,
    });

    const timer: any = { lastTick: Date.now(), interval: null };
    timer[p1] = DEFAULT_TIME;
    timer[p2] = DEFAULT_TIME;

    session = {
      roomId,
      gameType: room.gameType,
      players: new Map(),
      gameInstance,
      recordId: record._id.toString(),
      timer,
    };

    // Start the timer
    session.timer.interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - session!.timer.lastTick) / 1000;
      session!.timer.lastTick = now;

      const currentTurn = session!.gameInstance.getState().currentTurn;
      session!.timer[currentTurn] = Math.max(0, (session!.timer[currentTurn] || DEFAULT_TIME) - elapsed);

      const tu: any = {};
      tu[p1] = Math.floor(session!.timer[p1]);
      tu[p2] = Math.floor(session!.timer[p2]);
      io.to(roomId).emit('timer_update', tu);

      if (session!.timer[p1] <= 0 || session!.timer[p2] <= 0) {
        clearInterval(session!.timer.interval);
        session!.timer.interval = null;
        const winner: any = session!.timer[p1] <= 0 ? p2 : p1;
        session!.gameInstance['isOver'] = true;
        session!.gameInstance['result'] = { winner, reason: 'timeout' } as any;
        io.to(roomId).emit('game_over', {
          result: { winner, reason: 'timeout' },
          gameState: session!.gameInstance.getState(),
        });
        RoomService.finishRoom(roomId);
        removeSession(roomId);
      }
    }, 1000);

    setSession(roomId, session);
  }

  // Add current player
  const userId = socket.userId!;
  const color = userId === hostId ? p1 : p2;
  session.players.set(socket.id, color);

  // Add any other sockets already in the room
  const roomSockets = await io.in(roomId).fetchSockets();
  for (const s of roomSockets) {
    if (!session.players.has(s.id)) {
      const realSocket = io.sockets.sockets.get(s.id) as any;
      if (realSocket?.userId) {
        const sockColor = realSocket.userId === hostId ? p1 : p2;
        session.players.set(s.id, sockColor);
      }
    }
  }

  console.log(`Player ${userId} added to session ${roomId} as ${color}, total: ${session.players.size}`);

  if (session.players.size >= 2) {
    const gameState = session.gameInstance.getState();
    const playerColors: Record<string, string> = {};
    for (const [sid, pColor] of session.players) {
      const realSocket = io.sockets.sockets.get(sid) as any;
      if (realSocket?.userId) {
        playerColors[realSocket.userId] = pColor;
      }
    }

    const startData = { gameState, players: playerColors, gameType: room.gameType };
    console.log(`[SERVER] game_start to ${roomId}:`, JSON.stringify(startData));
    io.to(roomId).emit('game_start', startData);
  }
}

export function setupRoomHandlers(io: Server, socket: AuthSocket): void {
  // Rematch: restart the game in the same room
  socket.on('rematch_request', ({ roomId }: { roomId: string }) => {
    socket.to(roomId).emit('rematch_request', {
      fromUser: socket.userId,
    });
  });

  socket.on('rematch_accept', async ({ roomId }: { roomId: string }) => {
    const session = getSession(roomId);
    if (!session) {
      socket.emit('error', { message: '游戏会话不存在' });
      return;
    }

    // Stop old timer
    if (session.timer?.interval) clearInterval(session.timer.interval);

    // Reset the game
    session.gameInstance.initialize();
    if (session.timer) {
      session.timer.lastTick = Date.now();
      const { p1, p2 } = getColors(session.gameType);
      session.timer[p1] = DEFAULT_TIME;
      session.timer[p2] = DEFAULT_TIME;
    }

    // Broadcast new game_start
    const gameState = session.gameInstance.getState();
    const playerColors: Record<string, string> = {};
    for (const [sid, pColor] of session.players) {
      const realSocket = io.sockets.sockets.get(sid) as any;
      if (realSocket?.userId) playerColors[realSocket.userId] = pColor;
    }

    io.to(roomId).emit('game_start', {
      gameState,
      players: playerColors,
      gameType: session.gameType,
    });
  });

  socket.on('join_room', async ({ roomId }: { roomId: string }) => {
    try {
      const room = await RoomService.getRoom(roomId);
      if (!room) {
        socket.emit('error', { message: '房间不存在' });
        return;
      }
      await socket.join(roomId);
      const roomData = await RoomService.getRoom(roomId);
      io.to(roomId).emit('room_update', { room: roomData });
      if (room.status === 'playing') {
        await tryStartGame(io, roomId, socket);
      }
      console.log(`User ${socket.userId} joined room ${roomId}`);
    } catch (error) {
      socket.emit('error', { message: '加入房间失败' });
    }
  });

  socket.on('leave_room', async ({ roomId }: { roomId: string }) => {
    try {
      await socket.leave(roomId);
      const room = await RoomService.getRoom(roomId);
      if (room) io.to(roomId).emit('room_update', { room });
      const session = getSession(roomId);
      if (session) {
        session.players.delete(socket.id);
        if (session.players.size === 0) {
          if (session.timer?.interval) clearInterval(session.timer.interval);
          removeSession(roomId);
        }
      }
    } catch (error) {
      socket.emit('error', { message: '离开房间失败' });
    }
  });

  socket.on('chat_message', ({ roomId, message }: { roomId: string; message: string }) => {
    if (!message || message.trim().length === 0) return;
    if (message.length > 500) return;
    io.to(roomId).emit('chat_message', {
      userId: socket.userId,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    });
  });
}

export { sessions };
