import { Room } from '../models/Room';
import { Types } from 'mongoose';

function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export class RoomService {
  static async createRoom(userId: string, gameType: 'chinese-chess' | 'gomoku') {
    const roomId = generateRoomId();
    const room = await Room.create({
      roomId,
      gameType,
      hostId: new Types.ObjectId(userId),
    });
    return room;
  }

  static async getRooms(gameType?: string) {
    const filter: Record<string, unknown> = { status: 'waiting' };
    if (gameType) filter.gameType = gameType;
    return Room.find(filter)
      .populate('hostId', 'nickname username stats')
      .sort({ createdAt: -1 });
  }

  static async joinRoom(roomId: string, userId: string) {
    const room = await Room.findOne({ roomId });
    if (!room) throw new Error('房间不存在');
    if (room.status !== 'waiting') throw new Error('房间已开始游戏');
    if (room.hostId.toString() === userId) throw new Error('不能加入自己的房间');
    if (room.player2Id) throw new Error('房间已满');

    room.player2Id = new Types.ObjectId(userId);
    room.status = 'playing';
    await room.save();
    return room;
  }

  static async getRoom(roomId: string) {
    return Room.findOne({ roomId })
      .populate('hostId', 'nickname username stats')
      .populate('player2Id', 'nickname username stats');
  }

  static async finishRoom(roomId: string) {
    return Room.findOneAndUpdate({ roomId }, { status: 'finished' }, { new: true });
  }

  static async playerLeave(roomId: string) {
    return Room.findOneAndUpdate(
      { roomId },
      { status: 'finished' },
      { new: true }
    );
  }
}
