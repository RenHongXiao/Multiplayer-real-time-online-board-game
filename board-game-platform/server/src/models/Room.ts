import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRoom extends Document {
  roomId: string;
  mode: 'pvp' | 'ai';
  gameType: 'chinese-chess' | 'gomoku';
  hostId: Types.ObjectId;
  player2Id: Types.ObjectId | null;
  status: 'waiting' | 'playing' | 'finished';
  maxPlayers: number;
  createdAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    roomId: { type: String, required: true, unique: true },
    mode: { type: String, enum: ['pvp', 'ai'], default: 'pvp' },
    gameType: { type: String, required: true, enum: ['chinese-chess', 'gomoku'] },
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    player2Id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' },
    maxPlayers: { type: Number, default: 2 },
  },
  { timestamps: true }
);

export const Room = mongoose.model<IRoom>('Room', roomSchema);
