import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { RoomService } from '../services/roomService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const createRoomSchema = z.object({
  gameType: z.enum(['chinese-chess', 'gomoku']),
  mode: z.enum(['pvp', 'ai']).optional().default('pvp'),
});

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const gameType = req.query.gameType as string | undefined;
    const rooms = await RoomService.getRooms(gameType);
    res.json({ code: 0, data: rooms });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '获取房间列表失败';
    res.status(500).json({ code: 1, message: msg });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createRoomSchema.parse(req.body);
    const room = await RoomService.createRoom(req.userId!, data.gameType, data.mode);
    res.json({ code: 0, data: room });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ code: 1, message: '输入数据不合法', errors: error.errors });
      return;
    }
    const msg = error instanceof Error ? error.message : '创建房间失败';
    res.status(500).json({ code: 1, message: msg });
  }
});

router.post('/:id/join', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const room = await RoomService.joinRoom(req.params.id, req.userId!);
    res.json({ code: 0, data: room });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '加入房间失败';
    res.status(400).json({ code: 1, message: msg });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const room = await RoomService.getRoom(req.params.id);
    if (!room) {
      res.status(404).json({ code: 1, message: '房间不存在' });
      return;
    }
    res.json({ code: 0, data: room });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '获取房间信息失败';
    res.status(500).json({ code: 1, message: msg });
  }
});

export default router;
