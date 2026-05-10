import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  nickname: string;
  avatar: string;
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    rating: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, minlength: 3, maxlength: 20 },
    passwordHash: { type: String, required: true },
    nickname: { type: String, required: true },
    avatar: { type: String, default: '' },
    stats: {
      totalGames: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
      rating: { type: Number, default: 1000 },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
