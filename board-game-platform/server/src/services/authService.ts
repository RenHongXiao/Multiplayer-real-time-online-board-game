import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { config } from '../config';

export class AuthService {
  static async register(username: string, password: string, nickname: string) {
    const existing = await User.findOne({ username });
    if (existing) {
      throw new Error('用户名已存在');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      passwordHash,
      nickname: nickname || username,
    });

    const token = this.generateToken(user._id.toString());
    return {
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        nickname: user.nickname,
        stats: user.stats,
      },
    };
  }

  static async login(username: string, password: string) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error('用户名或密码错误');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('用户名或密码错误');
    }

    const token = this.generateToken(user._id.toString());
    return {
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        nickname: user.nickname,
        stats: user.stats,
      },
    };
  }

  static generateToken(userId: string): string {
    return jwt.sign({ userId }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    } as jwt.SignOptions);
  }
}
