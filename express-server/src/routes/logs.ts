// src/routes/logsRouter.ts

import express, { Request, Response, Router } from 'express';
import { Pool } from 'mysql2/promise';

export default function logsRouter(db: Pool): Router {
    const router = express.Router();

    // 인터페이스 정의
    interface Log {
        id: number;
        user_id: number;
        routine_id: number;
        used_at: Date;
        routine_name: string;
        routine_description: string;
        exercises: Exercise[];
    }

    interface Exercise {
        equipment_name: string;
        sets: number;
        reps: number;
        weight: number;
    }

    // GET /logs - 로그 목록 가져오기 (페이지네이션 지원) 및 운동내용 포함
    router.get('/', async (req: Request, res: Response) => {
        try {
            const userId = req.userId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const offset = (page - 1) * limit;

            // 총 로그 수 가져오기
            const [countResult] = await db.query(
                'SELECT COUNT(*) as count FROM logs WHERE user_id = ?',
                [userId]
            );
            const totalItems = (countResult as any)[0].count;
            const totalPages = Math.ceil(totalItems / limit);

            // 로그와 루틴 정보, 운동내용 함께 가져오기
            const [logs] = await db.query(
                `SELECT logs.id, logs.user_id, logs.routine_id, logs.used_at,
                        routines.name AS routine_name, routines.description AS routine_description
                 FROM logs
                 JOIN routines ON logs.routine_id = routines.id
                 WHERE logs.user_id = ?
                 ORDER BY logs.used_at DESC
                 LIMIT ? OFFSET ?`,
                [userId, limit, offset]
            );

            // 각 로그에 대해 운동내용 가져오기
            const logsWithExercises: Log[] = [];

            for (const log of logs as any[]) {
                const [exercises] = await db.query(
                    `SELECT equipment_name, sets, reps, weight
                     FROM routine_items
                     WHERE routine_id = ?`,
                    [log.routine_id]
                );

                logsWithExercises.push({
                    id: log.id,
                    user_id: log.user_id,
                    routine_id: log.routine_id,
                    used_at: log.used_at,
                    routine_name: log.routine_name,
                    routine_description: log.routine_description,
                    exercises: exercises as Exercise[],
                });
            }

            res.json({
                data: logsWithExercises,
                currentPage: page,
                totalPages,
                totalItems,
            });
        } catch (error) {
            console.error('GET /logs 에러:', error);
            res.status(500).json({ error: '로그를 가져오는 데 실패했습니다.' });
        }
    });

    // DELETE /logs/:id - 특정 로그 삭제
    router.delete('/:id', async (req: Request, res: Response) => {
        try {
            const userId = req.userId;
            const logId = parseInt(req.params.id);

            // 로그가 존재하고, 사용자에게 속해있는지 확인
            const [logRows] = await db.query(
                'SELECT * FROM logs WHERE id = ? AND user_id = ?',
                [logId, userId]
            );

            if ((logRows as any[]).length === 0) {
                res.status(404).json({ error: '삭제할 로그를 찾을 수 없습니다.' });
                return;
            }

            // 로그 삭제
            await db.execute(
                'DELETE FROM logs WHERE id = ?',
                [logId]
            );

            res.status(200).json({ message: '로그가 성공적으로 삭제되었습니다.' });
        } catch (error) {
            console.error('DELETE /logs/:id 에러:', error);
            res.status(500).json({ error: '로그 삭제에 실패했습니다.' });
        }
    });

    return router;
}
