import express, { RequestHandler } from 'express';
import { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';
import {z} from 'zod';

dotenv.config();

export default function gymsRouter(db: Pool) {
    const router = express.Router();
  
    // authMiddleware를 모든 라우트에 적용
    const gymSchema = z.object({
      name: z.string(),
      equipment: z.array(z.string()).min(1, "At least one equipment is required"), // 최소 1개의 운동기구 필요
      notes: z.string().optional(), // 특이사항은 선택적
    });
  
    const getGymsHandler: RequestHandler = async (req, res) => {
      try {
        const userId = req.userId; // authMiddleware에서 설정한 userId 사용
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page-1)*limit;

        if (!userId) {
          res.status(400).json({ error: 'User ID is required' });
          return; // 함수 종료
        }
  
        // 데이터베이스에서 사용자 정보 조회
        const [countResult] = await db.query(
          'SELECT COUNT(*) as count FROM gyms WHERE user_id = ?',
          [userId]
        );

        const total = (countResult as any)[0].count;
        const totalPages = Math.ceil(total / limit);
  
        const [rows] = await db.query(
          'SELECT * FROM gyms WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
          [userId, limit, offset]
        );

        res.json({
          data: rows,
          currentPage: page,
          totalPages,
          totalItems: total,
        });

      } catch (error) {
        console.error('Get Gyms Handler Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        return; // 함수 종료
      }
    };
  
    const postGymsHandler: RequestHandler = async (req, res) => {
      try {
        const validatedData = gymSchema.parse(req.body);
        const { name, equipment, notes } = validatedData;
        const postid = req.userId;

        if (!name || !equipment || !postid) {
          res.status(400).json({ message: 'Name, equipment, and user_id are required' });
          return;
        }

        const [result] = await db.execute(
          'INSERT INTO gyms (name, equipment, notes, user_id) VALUES (?, ?, ?, ?)',
          [name, JSON.stringify(equipment), notes, postid]
        );
        res.status(201).json({ message:'Gym Post Successful'});
        return;
  
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({ error: error.errors });
          return;
        }

        console.error('Post Gyms Handler Error:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
    };

    const updateGymsHandler: RequestHandler = async (req,res) =>{
      const { id } = req.params;
      const validatedData = gymSchema.parse(req.body);
      const { name, equipment, notes } = validatedData;

      try {
          const [existing] = await db.query('SELECT * FROM gyms WHERE id = ?', [id]);
          if ((existing as any[]).length === 0) {
              res.status(404).json({ message: 'Gym not found' });
              return;
          }

          const updatedName = name || (existing as any[])[0].name;
          const updatedEquipment = equipment ? JSON.stringify(equipment) : (existing as any[])[0].equipment;
          const updatedNotes = notes !== undefined ? notes : (existing as any[])[0].notes;

          await db.execute(
              'UPDATE gyms SET name = ?, equipment = ?, notes = ? WHERE id = ?',
              [updatedName, updatedEquipment, updatedNotes, id]
          );

          res.status(200).json({message: "Update Successful"});
          return;
      } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Server Error' });
          return;
      }
    }

    const deleteGymsHandler: RequestHandler = async (req,res) =>{
      try {
        const { id } = req.params;

        const [result] = await db.execute('DELETE FROM gyms WHERE id = ?', [id]);
        if (!result) {
            res.status(404).json({ message: 'Gym not found' });
            return;
        }
        res.status(200).json({ message: 'Gym deleted successfully' });
        return;
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
        return;
      }
    }

    const deleteAllGymsHandler: RequestHandler = async (req, res) => {
      try {
        const userId = req.userId; // authMiddleware에서 설정한 userId 사용
        if (!userId) {
          res.status(400).json({ message: 'User ID is required' });
          return;
        }
    
        await db.execute('DELETE FROM gyms WHERE user_id = ?', [userId]);
        res.status(200).json({ message: 'All gyms deleted successfully' });
        return;
      } catch (error) {
        console.error('Delete All Gyms Error:', error);
        res.status(500).json({ message: 'Failed to delete all gyms' });
        return;
      }
    };
    
    // 전체 삭제 라우트 추가
    router.delete('/all', deleteAllGymsHandler);
    router.get('/', getGymsHandler);
    router.post('/',postGymsHandler);
    router.patch('/:id', updateGymsHandler);
    router.delete('/:id', deleteGymsHandler);
  
    return router;
  }
  
