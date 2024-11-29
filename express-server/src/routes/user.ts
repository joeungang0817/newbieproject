import express, { RequestHandler } from 'express';
import { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';
import {z} from 'zod';

dotenv.config();

export default function userRouter(db: Pool) {
  const router = express.Router();

  // authMiddleware를 모든 라우트에 적용

  const getUserHandler: RequestHandler = async (req, res) => {
    try {
      const userId = req.userId; // authMiddleware에서 설정한 userId 사용
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return; // 함수 종료
      }

      // 데이터베이스에서 사용자 정보 조회
      const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
      const user = (rows as any[])[0];
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return; // 함수 종료
      }

      res.status(200).json({message:"get user successful", user:user});
    } catch (error) {
      console.error('Get User Handler Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
      return; // 함수 종료
    }
  };

  const updateUserHandler: RequestHandler = async (req, res) => {
    try {
      // 업데이트할 필드 정의
      const updateSchema = z.object({
        name: z.string().min(1).optional(),
        squat: z.number().int().min(0).optional(),
        bench: z.number().int().min(0).optional(),
        dead: z.number().int().min(0).optional(),
      });

      const updates = updateSchema.parse(req.body);

      if (Object.keys(updates).length === 0) {
        res.status(400).json({ error: '업데이트할 필드가 없습니다.' });
        return;
      }

      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ error: '인증이 필요합니다.' });
        return;
      }

      // 현재 사용자 정보 조회
      const [rows] = await db.query('SELECT name, squat, bench, dead FROM users WHERE id = ?', [userId]);
      const user = (rows as any[])[0];

      if (!user) {
        res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        return;
      }

      // 업데이트할 값 설정
      const newName = updates.name !== undefined ? updates.name : user.name;
      const newSquat = updates.squat !== undefined ? updates.squat : user.squat;
      const newBench = updates.bench !== undefined ? updates.bench : user.bench;
      const newDead = updates.dead !== undefined ? updates.dead : user.dead;

      // Tier 계산
      const total = newSquat + newBench + newDead;
      let newTier = 'Beginner';

      if (total >= 500) newTier = 'expert';
      else if (total >= 400) newTier = 'advanced';
      else if (total >= 250) newTier = 'Intermediate';
      else newTier = 'Beginner';

      // 사용자 정보 업데이트
      await db.query(
        'UPDATE users SET name = ?, squat = ?, bench = ?, dead = ?, tier = ? WHERE id = ?',
        [newName, newSquat, newBench, newDead, newTier, userId]
      );
      const [rows_update] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
      const user_update = (rows_update as any[])[0];

      res.status(200).json({ message: '사용자 정보가 업데이트되었습니다.',user:user_update});
    } catch (error) {
      console.error('Update User Handler Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  router.get('/info', getUserHandler);
  router.patch('/update', updateUserHandler);

  return router;
}
