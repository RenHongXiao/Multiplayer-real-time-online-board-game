import { Server } from 'socket.io';
import { AuthSocket } from './index';
import { getSession } from './roomHandler';
import { RoomService } from '../services/roomService';
import { GameService } from '../services/gameService';

export function setupGameHandlers(io: Server, socket: AuthSocket): void {
  // Make a move
  socket.on('make_move', async ({
    roomId,
    from,
    to,
  }: {
    roomId: string;
    from: { x: number; y: number };
    to: { x: number; y: number };
  }) => {
    try {
      const session = getSession(roomId);
      if (!session) {
        socket.emit('error', { message: '游戏未开始' });
        return;
      }

      const game = session.gameInstance;
      const state = game.getState();
      const playerColor = session.players.get(socket.id);

      if (playerColor !== state.currentTurn) {
        socket.emit('error', { message: '现在不是你的回合' });
        return;
      }

      const success = game.makeMove(from.x, from.y, to.x, to.y);
      if (!success) {
        socket.emit('error', { message: '无效的走法' });
        return;
      }

      // Update timer to switch to opponent
      if (session.timer) {
        session.timer.lastTick = Date.now();
      }

      const newState = game.getState();
      const lastMove = newState.moves[newState.moves.length - 1];

      // Broadcast move + full board to room
      io.to(roomId).emit('move_made', {
        from: lastMove.from,
        to: lastMove.to,
        piece: lastMove.piece,
        captured: lastMove.captured,
        board: newState.board,
        currentTurn: newState.currentTurn,
        moveCount: newState.moveCount,
      });

      // Save move to database
      if (session.recordId) {
        await GameService.addMove(session.recordId, {
          from: lastMove.from,
          to: lastMove.to,
          piece: `${lastMove.piece.color}_${lastMove.piece.type}`,
        });
      }

      // Check game over
      if (newState.isOver && newState.result) {
        await handleGameOver(io, roomId, session);
      }
    } catch (error) {
      socket.emit('error', { message: '走棋失败' });
    }
  });

  // Resign
  socket.on('resign', async ({ roomId }: { roomId: string }) => {
    try {
      const session = getSession(roomId);
      if (!session) {
        socket.emit('error', { message: '游戏未开始' });
        return;
      }

      const playerColor = session.players.get(socket.id);
      const winner = playerColor === 'red' ? 'black' : 'red';

      const game = session.gameInstance;
      game['isOver'] = true;
      game['result'] = { winner, reason: 'resign' };

      await handleGameOver(io, roomId, session);
    } catch (error) {
      socket.emit('error', { message: '操作失败' });
    }
  });

  // Request draw
  socket.on('request_draw', ({ roomId }: { roomId: string }) => {
    socket.to(roomId).emit('draw_requested', {
      fromUser: socket.userId,
    });
  });

  // Respond to draw request
  socket.on('respond_draw', async ({ roomId, accept }: { roomId: string; accept: boolean }) => {
    try {
      if (accept) {
        const session = getSession(roomId);
        if (session) {
          const game = session.gameInstance;
          game['isOver'] = true;
          game['result'] = { winner: null, reason: 'draw' };
          await handleGameOver(io, roomId, session);
        }
      } else {
        socket.to(roomId).emit('draw_response', { accepted: false });
      }
    } catch (error) {
      socket.emit('error', { message: '操作失败' });
    }
  });
}

async function handleGameOver(io: Server, roomId: string, session: any): Promise<void> {
  // Stop timer
  if (session.timer?.interval) {
    clearInterval(session.timer.interval);
    session.timer.interval = null;
  }

  const gameState = session.gameInstance.getState();

  // Update game record in database
  if (session.recordId && gameState.result) {
    const result = gameState.result;
    const winnerColor = result.winner;

    let winnerId: string | null = null;
    if (winnerColor) {
      const sockets = await io.in(roomId).fetchSockets();
      for (const s of sockets) {
        const sock = s as any;
        const color = session.players.get(sock.id);
        if (color === winnerColor && sock.userId) {
          winnerId = sock.userId;
          break;
        }
      }
    }

    await GameService.finishGame(session.recordId, winnerId, result.reason as any);
  }

  // Update room status
  await RoomService.finishRoom(roomId);

  io.to(roomId).emit('game_over', {
    result: gameState.result,
    gameState,
  });
}
