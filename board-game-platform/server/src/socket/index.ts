import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { setupRoomHandlers, removeSession, getSession } from './roomHandler';
import { setupGameHandlers } from './gameHandler';
import { Room } from '../models/Room';

interface AuthSocket extends Socket {
  userId?: string;
}

export function initSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('未登录'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('认证无效'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    console.log(`User connected: ${socket.userId}`);

    setupRoomHandlers(io, socket);
    setupGameHandlers(io, socket);

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);
      if (!socket.userId) return;

      // Clean up ghost rooms (waiting rooms created by this user)
      await Room.deleteMany({ hostId: socket.userId, status: 'waiting' });
      // Finish playing rooms involving this user
      await Room.updateMany(
        { $or: [{ hostId: socket.userId }, { player2Id: socket.userId }], status: 'playing' },
        { status: 'finished' }
      );

      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          socket.to(roomId).emit('opponent_disconnect', {
            userId: socket.userId,
            timestamp: new Date().toISOString(),
          });
          const session = getSession(roomId);
          if (session) {
            if (session.timer?.interval) clearInterval(session.timer.interval);
            removeSession(roomId);
          }
        }
      }
    });
  });

  return io;
}

export type { AuthSocket };
