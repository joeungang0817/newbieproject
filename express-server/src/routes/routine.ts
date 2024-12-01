import express, { RequestHandler } from 'express';
import { Pool } from 'mysql2/promise';
import { z } from 'zod';

export default function routinesRouter(db: Pool) {
    const router = express.Router();

    const routineSchema = z.object({
        name: z.string().min(1, '루틴 이름은 필수입니다.'),
        description: z.string().min(1, '루틴 설명은 필수입니다.'),
        public: z.boolean().optional(),
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
    });

    // 모든 루틴 가져오기
    const getRoutinesHandler: RequestHandler = async (req, res) => {
        try {
            const userId = req.userId;
            const filter = req.query.filter || 'mine';
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const offset = (page - 1) * limit;
    
            let routines;
            let total;
            if (filter === 'mine') {
                const [countResult] = await db.query(
                    'SELECT COUNT(*) as count FROM routines WHERE user_id = ?',
                    [userId]
                );
                total = (countResult as any)[0].count;
    
                [routines] = await db.query(
                    'SELECT * FROM routines WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
                    [userId, limit, offset]
                );
            } else if (filter === 'all') {
                const [countResult] = await db.query(
                    'SELECT COUNT(*) as count FROM routines WHERE public = 1 OR user_id = ?',
                    [userId]
                );
                total = (countResult as any)[0].count;
    
                [routines] = await db.query(
                    `
                    SELECT r.*, u.name AS author, u.tier AS tier
                    FROM routines r
                    LEFT JOIN users u ON r.user_id = u.id
                    WHERE r.public = 1 OR r.user_id = ?
                    ORDER BY r.created_at DESC LIMIT ? OFFSET ?
                    `,
                    [userId, limit, offset]
                );
            }
    
            const routineIds = (routines as any[]).map((routine: any) => routine.id);
    
            // 운동기구 데이터 가져오기
            try{
                const [items] = await db.query(
                    'SELECT * FROM routine_items WHERE routine_id IN (?)',
                    [routineIds]
                );
                const routinesWithItems = (routines as any[]).map((routine: any) => ({
                    ...routine,
                    equipment: (items as any[])
                        .filter((item) => item.routine_id === routine.id)
                        .map((item) => ({
                            name: item.equipment_name, // equipment_name을 name으로 매핑
                            sets: item.sets,
                            reps: item.reps,
                            weight: item.weight,
                        })),
                }));
                
        
                const totalPages = Math.ceil(total / limit);
        
                res.json({
                    data: routinesWithItems,
                    currentPage: page,
                    totalPages,
                    totalItems: total,
                });

            } catch (err){
                res.json("루틴이 현재 없습니다.");
                return;
            }
    
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: '루틴을 가져오는 데 실패했습니다.' });
        }
    };
    

    // 루틴 추가
    const addRoutineHandler: RequestHandler = async (req, res) => {
        try {
            const userId = req.userId;
            const validatedData = routineSchema.parse(req.body);
            const { name, description, public: isPublic, equipment } = validatedData;

            const [result] = await db.execute(
                'INSERT INTO routines (user_id, name, description, public) VALUES (?, ?, ?, ?)',
                [userId, name, description, isPublic || false]
            );

            const routineId = (result as any).insertId;

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

    // 루틴 수정
    const updateRoutineHandler: RequestHandler = async (req, res) => {
        try {
            const userId = req.userId;
            const { id } = req.params;
            const validatedData = routineSchema.parse(req.body);
            const { name, description, public: isPublic, equipment } = validatedData;

            const [routineRows] = await db.query(
                'SELECT * FROM routines WHERE id = ? AND user_id = ?',
                [id, userId]
            );

            if ((routineRows as any[]).length === 0) {
                res.status(404).json({ error: '루틴을 찾을 수 없거나 수정 권한이 없습니다.' });
                return;
            }

            await db.execute(
                'UPDATE routines SET name = ?, description = ?, public = ? WHERE id = ?',
                [name, description, isPublic || false, id]
            );

            await db.execute('DELETE FROM routine_items WHERE routine_id = ?', [id]);

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

    // 루틴 삭제
    const deleteRoutineHandler: RequestHandler = async (req, res) => {
        try {
            const userId = req.userId;
            const { id } = req.params;

            const [routineRows] = await db.query(
                'SELECT * FROM routines WHERE id = ? AND user_id = ?',
                [id, userId]
            );

            if ((routineRows as any[]).length === 0) {
                res.status(404).json({ error: '루틴을 찾을 수 없거나 삭제 권한이 없습니다.' });
                return;
            }

            await db.execute('DELETE FROM routines WHERE id = ?', [id]);
            res.status(200).json({ message: '루틴이 성공적으로 삭제되었습니다.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: '루틴 삭제에 실패했습니다.' });
        }
    };

    const deleteAllRoutineHandler: RequestHandler = async (req, res) => {
        try {
            const userId = req.userId;

            await db.execute('DELETE FROM routines WHERE user_id = ?', [userId]);
            res.status(200).json({ message: '루틴이 성공적으로 삭제되었습니다.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: '루틴 삭제에 실패했습니다.' });
        }
    };

    const useRoutineHandler: RequestHandler = async (req, res) => {
        try {
            const userId = req.userId;
            const { routineId, gymId } = req.body;
    
            console.log('사용자 ID:', userId);
            console.log('루틴 ID:', routineId);
            console.log('헬스장 ID:', gymId);
    
            // 루틴의 운동기구 가져오기
            const [routineItems] = await db.query(
                'SELECT equipment_name FROM routine_items WHERE routine_id = ?',
                [routineId]
            );
    
            // 헬스장의 운동기구 가져오기
            const [gymEquipment] = await db.query(
                'SELECT equipment FROM gyms WHERE id = ? AND user_id = ?',
                [gymId, userId]
            );
    
            if ((gymEquipment as any[]).length === 0) {
                res.status(404).json({ error: '헬스장을 찾을 수 없습니다.' });
                return;
            }
    
            // equipment 필드가 이미 배열인 경우 그대로 사용
            const gymEquipmentList: string[] = (gymEquipment as any[])[0].equipment || [];
            console.log('헬스장 운동기구 리스트:', gymEquipmentList);
    
            const missingEquipment = (routineItems as any[]).filter(
                (item) => !gymEquipmentList.includes(item.equipment_name)
            );
    
            if (missingEquipment.length > 0) {
                res.status(400).json({
                    error: `선택한 헬스장에 없는 운동기구: ${missingEquipment
                        .map((item) => item.equipment_name)
                        .join(', ')}`,
                });
                return;
            }
    
            // 로그 기록
            await db.execute('INSERT INTO logs (user_id, routine_id, used_at) VALUES (?, ?, NOW())', [
                userId,
                routineId,
            ]);
    
            res.status(201).json({ message: '루틴이 성공적으로 사용되었습니다.' });
        } catch (error) {
            console.error('useRoutineHandler 에러:', error);
            res.status(500).json({ error: '루틴 사용에 실패했습니다.' });
        }
    };
    
    
    

    router.get('/', getRoutinesHandler);
    router.post('/', addRoutineHandler);
    router.patch('/:id', updateRoutineHandler);
    router.delete('/:id', deleteRoutineHandler);
    router.post('/logs', useRoutineHandler);
    router.delete('/', deleteAllRoutineHandler);
    return router;
}
