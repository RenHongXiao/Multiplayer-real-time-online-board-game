import { GameRecord } from '../models/GameRecord';
import { User } from '../models/User';
import { Types } from 'mongoose';

export class GameService {
  static async createRecord(params: {
    roomId: string;
    gameType: 'chinese-chess' | 'gomoku';
    player1Id: string;
    player2Id: string;
    player1Color: string;
    player2Color: string;
  }) {
    return GameRecord.create({
      roomId: params.roomId,
      gameType: params.gameType,
      players: [
        { userId: new Types.ObjectId(params.player1Id), color: params.player1Color },
        { userId: new Types.ObjectId(params.player2Id), color: params.player2Color },
      ],
      moves: [],
      result: { winner: null, reason: 'draw' },
      startedAt: new Date(),
      endedAt: new Date(),
    });
  }

  static async addMove(recordId: string, move: { from: { x: number; y: number }; to: { x: number; y: number }; piece: string }) {
    return GameRecord.findByIdAndUpdate(
      recordId,
      { $push: { moves: { ...move, timestamp: new Date() } } },
      { new: true }
    );
  }

  static async finishGame(
    recordId: string,
    winnerId: string | null,
    reason: 'checkmate' | 'resign' | 'timeout' | 'five-in-row' | 'draw'
  ) {
    const record = await GameRecord.findById(recordId);
    if (!record) return null;

    record.result = {
      winner: winnerId ? new Types.ObjectId(winnerId) : null,
      reason,
    };
    record.endedAt = new Date();
    await record.save();

    if (winnerId) {
      await User.findByIdAndUpdate(winnerId, {
        $inc: { 'stats.wins': 1, 'stats.totalGames': 1, 'stats.rating': 25 },
      });
    }

    const loserId = record.players.find(p => p.userId.toString() !== winnerId)?.userId;
    if (loserId && winnerId) {
      await User.findByIdAndUpdate(loserId, {
        $inc: { 'stats.losses': 1, 'stats.totalGames': 1, 'stats.rating': -15 },
      });
    }

    if (!winnerId) {
      const playerIds = record.players.map(p => p.userId);
      await User.updateMany(
        { _id: { $in: playerIds } },
        { $inc: { 'stats.draws': 1, 'stats.totalGames': 1 } }
      );
    }

    return record;
  }

  static async getRecord(recordId: string) {
    return GameRecord.findById(recordId)
      .populate('players.userId', 'nickname username');
  }

  static async getUserRecords(userId: string) {
    return GameRecord.find({ 'players.userId': new Types.ObjectId(userId) })
      .populate('players.userId', 'nickname username')
      .sort({ endedAt: -1 })
      .limit(50);
  }
}
