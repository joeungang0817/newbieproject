import express, { RequestHandler } from 'express';
import { Pool } from 'mysql2/promise';
import { z } from 'zod';

export default function routinesRouter(db: Pool) {
    const router = express.Router();

    const routineSchema = z.object({
        name: z.string().min(1, '루틴 이름은 필수입니다.'),
        gymId: z.number().int().positive(),
        equipment: z
            .array(
                z.object({
                    name: z.string(),
                    sets: z.number().positive(),
                    reps: z.number().positive(),
                    weight: z.number().positive(),
                })
            )
            .min(1, '운동기구는 최소 1개 이상이어야 합니다.'),
        public: z.boolean().optional(),
    });

    const getRoutinesHandler: RequestHandler = async (req, res) => {
        try {
            const userId = req.user.id; // Assume user is authenticated
            const filter = req.query.filter || 'mine';
        
            let routines;
            if (filter === 'mine') {
              // 내 루틴만 가져오기
              [routines] = await db.query('SELECT * FROM routines WHERE user_id = ?', [userId]);
            } else if (filter === 'all') {
              // 공개 루틴 가져오기
              [routines] = await db.query(
                'SELECT * FROM routines WHERE public = 1 OR user_id = ?',
                [userId]
              );
            }
        
            res.json(routines);
          } catch (err) {
            console.error(err);
            res.status(500).json({ error: '루틴을 가져오는 데 실패했습니다.' });
          }
    };

    const addRoutineHandler: RequestHandler = async (req, res) => {
        try {
            const userId = req.userId; // authMiddleware에서 설정된 사용자 ID
            const validatedData = routineSchema.parse(req.body);
            const { name, gymId, equipment, public: isPublic } = validatedData;
    
            // 루틴 삽입
            const [result] = await db.execute(
                'INSERT INTO routines (user_id, name, gym_id, public) VALUES (?, ?, ?, ?)',
                [userId, name, gymId, isPublic || false]
            );
    
            const routineId = (result as any).insertId;
    
            // 루틴 항목 삽입
            const itemPromises = equipment.map((item) =>
                db.execute(
                    'INSERT INTO routine_items (routine_id, equipment_name, sets, reps, weight) VALUES (?, ?, ?, ?, ?)',
                    [routineId, item.name, item.sets, item.reps, item.weight]
                )
            );
            await Promise.all(itemPromises);
    
            res.status(201).json({ message: '루틴이 성공적으로 추가되었습니다.' });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ error: error.errors });
            } else {
                console.error(error);
                res.status(500).json({ error: '루틴 추가에 실패했습니다.' });
            }
        }
    };

    const updateRoutineHandler: RequestHandler = async (req, res) => {
        try {
            const userId = req.userId; // 사용자 ID
            const { id } = req.params; // 수정할 루틴 ID
            const validatedData = routineSchema.parse(req.body);
            const { name, gymId, equipment, public: isPublic } = validatedData;
    
            // 루틴의 소유권 확인
            const [routineRows] = await db.query('SELECT * FROM routines WHERE id = ? AND user_id = ?', [id, userId]);
            if ((routineRows as any[]).length === 0) {
                return res.status(404).json({ error: '루틴을 찾을 수 없거나 수정 권한이 없습니다.' });
            }
    
            // 루틴 수정
            await db.execute(
                'UPDATE routines SET name = ?, gym_id = ?, public = ? WHERE id = ?',
                [name, gymId, isPublic || false, id]
            );
    
            // 기존 루틴 항목 삭제
            await db.execute('DELETE FROM routine_items WHERE routine_id = ?', [id]);
    
            // 새 루틴 항목 추가
            const itemPromises = equipment.map((item) =>
                db.execute(
                    'INSERT INTO routine_items (routine_id, equipment_name, sets, reps, weight) VALUES (?, ?, ?, ?, ?)',
                    [id, item.name, item.sets, item.reps, item.weight]
                )
            );
            await Promise.all(itemPromises);
    
            res.status(200).json({ message: '루틴이 성공적으로 수정되었습니다.' });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ error: error.errors });
            } else {
                console.error(error);
                res.status(500).json({ error: '루틴 수정에 실패했습니다.' });
            }
        }
    };

    const deleteRoutineHandler: RequestHandler = async (req, res) => {
        try {
            const userId = req.userId; // 사용자 ID
            const { id } = req.params; // 삭제할 루틴 ID
    
            // 루틴의 소유권 확인
            const [routineRows] = await db.query('SELECT * FROM routines WHERE id = ? AND user_id = ?', [id, userId]);
            if ((routineRows as any[]).length === 0) {
                return res.status(404).json({ error: '루틴을 찾을 수 없거나 삭제 권한이 없습니다.' });
            }
    
            // 루틴 삭제 (루틴 항목도 CASCADE로 삭제)
            await db.execute('DELETE FROM routines WHERE id = ?', [id]);
    
            res.status(200).json({ message: '루틴이 성공적으로 삭제되었습니다.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: '루틴 삭제에 실패했습니다.' });
        }
    };

    const useRoutineHandler: RequestHandler = async (req, res) => {
        try {
            const userId = req.userId; // authMiddleware에서 설정된 사용자 ID
            const { routineId } = req.body;
    
            // 루틴 사용 기록 삽입
            await db.execute(
                'INSERT INTO logs (user_id, routine_id, used_at) VALUES (?, ?, CURDATE())',
                [userId, routineId]
            );
    
            res.status(201).json({ message: '루틴이 성공적으로 사용되었습니다.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: '루틴 사용에 실패했습니다.' });
        }
    };
    
    const getLogsHandler = (db: Pool): RequestHandler => async (req, res) => {
        try {
            const userId = req.userId;
            const [rows] = await db.query(
                `SELECT logs.id, logs.routine_id AS routineId, logs.used_at AS usedAt, routines.name AS routineName
                 FROM logs
                 INNER JOIN routines ON logs.routine_id = routines.id
                 WHERE logs.user_id = ?`,
                [userId]
            );
    
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch logs' });
        }
    };

    const deleteLogHandler = (db: Pool): RequestHandler => async (req, res) => {
        try {
            const userId = req.userId;
            const { id } = req.params;
    
            const [logRows] = await db.query('SELECT * FROM logs WHERE id = ? AND user_id = ?', [id, userId]);
            if ((logRows as any[]).length === 0) {
                return res.status(404).json({ error: 'Log not found' });
            }
    
            await db.execute('DELETE FROM logs WHERE id = ?', [id]);
            res.status(200).json({ message: 'Log deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to delete log' });
        }
    };


    router.get('/', getRoutinesHandler);
    router.post('/', addRoutineHandler);
    router.patch('/:id', updateRoutineHandler); // 루틴 수정
    router.delete('/:id', deleteRoutineHandler); // 루틴 삭제
    router.get('/logs', getLogsHandler);
    router.post('/logs', useRoutineHandler);
    router.delete('/logs/:id', deleteLogHandler);

    // 라우터에 연결된 핸들러 추가
    return router;
}
