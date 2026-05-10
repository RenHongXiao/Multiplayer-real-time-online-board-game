import { Server } from 'socket.io';
import { AuthSocket } from './index';
import { getSession } from './roomHandler';
import { RoomService } from '../services/roomService';
import { GameService } from '../services/gameService';
import { GomokuAI } from '../game-engine/ai/GomokuAI';
import { ChineseChessAI } from '../game-engine/ai/ChineseChessAI';
import { ChineseChess } from '../game-engine/ChineseChess';
import { Gomoku } from '../game-engine/Gomoku';

const gomokuAI = new GomokuAI();
const chessAI = new ChineseChessAI();

function triggerAIMove(io: Server, roomId: string, session: any): void {
  if (!session.isAI) return;

  const game = session.gameInstance;
  const state = game.getState();

  if (state.isOver) return;

  // Only trigger if it's the AI's turn
  if (state.currentTurn !== session.aiColor) return;

  // Small delay so the AI doesn't respond instantly
  setTimeout(async () => {
    try {
      const latestSession = getSession(roomId);
      if (!latestSession) return;

      const latestGame = latestSession.gameInstance;
      const latestState = latestGame.getState();
      if (latestState.isOver) return;
      if (latestState.currentTurn !== latestSession.aiColor) return;

      // Determine which AI to use and calculate move
      let aiMove: { from: { x: number; y: number }; to: { x: number; y: number } };

      if (latestSession.gameType === 'gomoku') {
        const bestPos = gomokuAI.findBestMove(latestGame as Gomoku);
        aiMove = { from: bestPos, to: bestPos };
      } else {
        aiMove = chessAI.findBestMove(latestGame as ChineseChess);
      }

      // Execute AI move
      const success = latestGame.makeMove(aiMove.from.x, aiMove.from.y, aiMove.to.x, aiMove.to.y);
      if (!success) {
        console.error('AI move failed:', aiMove);
        return;
      }

      // Update timer
      if (latestSession.timer) {
        latestSession.timer.lastTick = Date.now();
      }

      const newState = latestGame.getState();
      const lastMove = newState.moves[newState.moves.length - 1];

      // Broadcast AI move
      io.to(roomId).emit('move_made', {
        from: lastMove.from,
        to: lastMove.to,
        piece: lastMove.piece,
        captured: lastMove.captured,
        board: newState.board,
        currentTurn: newState.currentTurn,
        moveCount: newState.moveCount,
      });

      // Save AI move to database
      if (latestSession.recordId) {
        await GameService.addMove(latestSession.recordId, {
          from: lastMove.from,
          to: lastMove.to,
          piece: `${lastMove.piece.color}_${lastMove.piece.type}`,
        });
      }

      // Check game over
      if (newState.isOver && newState.result) {
        await handleGameOver(io, roomId, latestSession);
      }
    } catch (error) {
      console.error('AI move error:', error);
    }
  }, 500);
}

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
      } else {
        // Trigger AI response if applicable
        triggerAIMove(io, roomId, session);
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
      const winner = playerColor === 'red' ? 'black' : playerColor === 'black' && session.gameType === 'chinese-chess' ? 'red' : playerColor === 'black' ? 'white' : 'black';

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
    const session = getSession(roomId);
    if (session?.isAI) {
      // AI automatically rejects draw requests
      socket.emit('draw_response', { accepted: false });
      socket.emit('chat_message', {
        userId: 'system',
        message: 'AI拒绝和棋，继续对弈吧！',
        timestamp: new Date().toISOString(),
      });
      return;
    }
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
    if (winnerColor && !session.isAI) {
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
