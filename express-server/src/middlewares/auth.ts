// middlewares/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import dotenv from "dotenv";
import { Pool } from 'mysql2/promise';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

dotenv.config();

// Express Request 인터페이스 확장
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

const authMiddleware = (db: Pool): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let accessToken = req.cookies.accessToken; // 쿠키에서 Access Token 가져오기
    const refreshToken = req.cookies.refreshToken; // 쿠키에서 Refresh Token 가져오기
    
    try {
      if (!accessToken) {
        if (!refreshToken) {
          res.status(401).json({ error: '로그인 하지 않았거나, 자동로그인 기간이 지났습니다. 다시 로그인해주세요.' });
          return;
        } else {
          // 데이터베이스에서 Refresh Token 조회
          const [rows] = await db.query('SELECT * FROM tokens');
          const tokenEntries = rows as any[];

          let tokenEntry = null;
          for (const token of tokenEntries) {
            const isMatch = await bcrypt.compare(refreshToken, token.refresh_token);
            if (isMatch) {
              tokenEntry = token;
              break;
            }
          }

          if (!tokenEntry) {
            res.status(403).json({ error: '유효하지 않은 토큰입니다. 다시 로그인해주세요.' });
            return;
          }

          const userId = tokenEntry.user_id;
          const accessSecret = process.env.ACCESS_TOKEN_SECRET;

          if (!accessSecret) {
            throw new Error('ACCESS_TOKEN_SECRET이 정의되지 않았습니다.');
          }

          // 새로운 Access Token 생성
          const newAccessToken = jwt.sign({ userId }, accessSecret, { expiresIn: '15m' });

          // 새로운 Access Token 쿠키 설정
          res.cookie('accessToken', newAccessToken, {
            httpOnly: true, // 클라이언트의 JS에서 접근 불가
            secure: process.env.NODE_ENV === 'production', // 프로덕션 환경에서만 true
            sameSite: 'strict', // CSRF 방어
            maxAge: 5 * 60 * 1000, // 15분
          });


          // 새로운 Access Token으로 갱신
          accessToken = newAccessToken;
        }
      }
    } catch (error) {
      console.error('Auth Middleware Error:', error);
      res.status(401).json({ error: '자동로그인 기간이 지났습니다. 다시 로그인해주세요.' });
      return; // 함수 종료
    }

    try {
      const accessSecret = process.env.ACCESS_TOKEN_SECRET;
      if (!accessSecret) {
        throw new Error('ACCESS_TOKEN_SECRET이 정의되지 않았습니다.');
      }

      // Access Token 검증
      const decoded = jwt.verify(accessToken, accessSecret) as { userId: number };
      req.userId = decoded.userId; // 요청 객체에 userId 추가

      // 데이터베이스에서 사용자 정보 조회
      const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.userId]);
      const user = (rows as any[])[0];
      if (!user) {
        res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        return; // 함수 종료
      }

      next(); // 다음 미들웨어 또는 라우트 핸들러로 진행
    } catch (error) {
      console.error('Auth Middleware Error:', error);
      res.status(401).json({ error: '유효하지 않은 토큰입니다. 다시 로그인해주세요.' });
      return; // 함수 종료
    }
  };
};

export default authMiddleware;
