import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/board-game',
  jwtSecret: process.env.JWT_SECRET || 'board-game-secret-key-2024',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
