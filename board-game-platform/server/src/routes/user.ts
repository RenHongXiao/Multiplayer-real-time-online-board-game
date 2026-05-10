import { Router, Response } from 'express';
import { User } from '../models/User';
import { GameService } from '../services/gameService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
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

router.get('/records', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const records = await GameService.getUserRecords(req.userId!);
    res.json({ code: 0, data: records });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '获取对局记录失败';
    res.status(500).json({ code: 1, message: msg });
  }
});

export default router;
