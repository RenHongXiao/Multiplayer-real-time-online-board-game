import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMove {
  from: { x: number; y: number };
  to: { x: number; y: number };
  piece: string;
  timestamp: Date;
}

export interface IGameRecord extends Document {
  roomId: string;
  gameType: 'chinese-chess' | 'gomoku';
  players: Array<{
    userId: Types.ObjectId;
    color: 'red' | 'black' | 'white';
  }>;
  moves: IMove[];
  result: {
    winner: Types.ObjectId | null;
    reason: 'checkmate' | 'resign' | 'timeout' | 'five-in-row' | 'draw';
  };
  startedAt: Date;
  endedAt: Date;
}

const gameRecordSchema = new Schema<IGameRecord>({
  roomId: { type: String, required: true },
  gameType: { type: String, required: true, enum: ['chinese-chess', 'gomoku'] },
  players: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      color: { type: String, enum: ['red', 'black', 'white'], required: true },
    },
  ],
  moves: [
    {
      from: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
      },
      to: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
      },
      piece: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  result: {
    winner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reason: {
      type: String,
      enum: ['checkmate', 'resign', 'timeout', 'five-in-row', 'draw'],
      required: true,
    },
  },
  startedAt: { type: Date, required: true },
  endedAt: { type: Date, required: true },
});

export const GameRecord = mongoose.model<IGameRecord>('GameRecord', gameRecordSchema);
