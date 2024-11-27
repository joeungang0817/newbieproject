// 예시 Express 미들웨어 (TypeScript)

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import * as dotenv from "dotenv";
import process from "process";
dotenv.config();

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.jwt; // 쿠키에서 JWT 토큰 가져오기

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
    req.userId = decoded.userId;// 요청 객체에 userId 추가
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
 
export default authMiddleware;
