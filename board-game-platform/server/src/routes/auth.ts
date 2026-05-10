import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6).max(50),
  nickname: z.string().min(1).max(20).optional(),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await AuthService.register(data.username, data.password, data.nickname || data.username);
    res.json({ code: 0, data: result });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ code: 1, message: '输入数据不合法', errors: error.errors });
      return;
    }
    const msg = error instanceof Error ? error.message : '注册失败';
    res.status(400).json({ code: 1, message: msg });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await AuthService.login(data.username, data.password);
    res.json({ code: 0, data: result });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ code: 1, message: '输入数据不合法', errors: error.errors });
      return;
    }
    const msg = error instanceof Error ? error.message : '登录失败';
    res.status(400).json({ code: 1, message: msg });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { User } = await import('../models/User');
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) {
      res.status(404).json({ code: 1, message: '用户不存在' });
      return;
    }
    res.json({ code: 0, data: user });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '获取用户信息失败';
    res.status(500).json({ code: 1, message: msg });
  }
});

export default router;
