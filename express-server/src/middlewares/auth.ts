import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import * as dotenv from "dotenv";
import process from "process";
import { Pool } from 'mysql2/promise';
import bcrypt from 'bcrypt';
dotenv.config();

const authMiddleware(db: Pool) => async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.jwt; // 쿠키에서 JWT 토큰 가져오기
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
    req.userId = decoded.userId; // 요청 객체에 userId 추가

    // ID와 비밀번호 검증 추가
    const { userId, password } = req.body;
    if (!userId || !password) {
      return res.status(400).json({ error: 'User ID and password are required' });
    }

    // User lookup
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = (rows as any[])[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Password verification
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export default authMiddleware;
