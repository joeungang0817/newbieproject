import express, { RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'mysql2/promise';
import { z } from 'zod';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const userSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export default function authRouter(db: Pool) {
  const router = express.Router();

  const generateRefreshToken = () => {
    return crypto.randomBytes(40).toString('hex');
  };

  // 회원가입 핸들러
  const registerHandler: RequestHandler = async (req, res) => {
    try {
      const { email, password } = userSchema.parse(req.body);
  
      // 사용자 존재 여부 확인
      const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if ((existingUser as any[]).length > 0) {
        res.status(400).json({ error: '이미 등록된 이메일입니다.' });
        return;
      }
  
      // 비밀번호 해싱
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      // 사용자 생성
      const [result] = await db.query('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', [
        email,
        hashedPassword,
        'user',
      ]);
  
      res.status(201).json({
        message: 'User registered successfully',
      });
    } catch (error) {
      console.error('Register Handler Error:', error); // 오류 로깅
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  

  // 로그인 핸들러
  const loginHandler: RequestHandler = async (req, res) => {
    try {
      const { email, password } = userSchema.parse(req.body);

      // 사용자 조회
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      const user = (rows as any[])[0];
      if (!user) {
        res.status(404).json({ error: '등록되지 않은 이메일입니다.' });
        return;
      }

      // 비밀번호 검증
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ error: '비밀번호가 틀렸습니다.' });
        return;
      }

      // JWT 생성
      const secret = process.env.ACCESS_TOKEN_SECRET;
      if (!secret) {
        throw new Error('ACCESS_TOKEN_SECRET is not defined');
      }
      const accessToken = jwt.sign({ userId: user.id }, secret, { expiresIn: '15m' });

      // Refresh Token 생성 및 저장
      const refreshToken = generateRefreshToken();
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
      await db.query('INSERT INTO tokens (user_id, refresh_token) VALUES (?, ?)', [
        user.id,
        hashedRefreshToken,
      ]);

      res.cookie('accessToken', accessToken, {
        httpOnly: true, // 프로덕션 환경에서만 true
        sameSite: 'strict', // 또는 'lax'
        maxAge: 5 * 60 * 1000, // 15분
      });

      // 클라이언트에 Refresh Token을 쿠키로 설정
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 2 * 60 * 60 * 1000, // 2시간
      });

      res.status(200).json({ message:'Login successful'});
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // 로그아웃 핸들러
  const logoutHandler: RequestHandler = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh Token required' });
      return;
    }

    try {
      // 데이터베이스에서 Refresh Token 삭제
      await db.query('DELETE FROM tokens WHERE refresh_token = ?', [refreshToken]);

      // 클라이언트 쿠키에서 Refresh Token 삭제
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to logout' });
    }
  };

  // 라우트 설정
  router.post('/signup', registerHandler);
  router.post('/login', loginHandler);
  router.post('/logout', logoutHandler);

  return router;
}
