import express, { RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'mysql2/promise';
import { z } from 'zod';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
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
        res.status(400).json({ error: 'User already exists' });
        return; // 반환값 없음
      }

      // 비밀번호 해싱
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 사용자 생성
      const [result] = await db.query('INSERT INTO users (email, password) VALUES (?, ?)', [
        email,
        hashedPassword,
      ]);

      res.status(201).json({
        message: 'User registered successfully',
      });
    } catch (error) {
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
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // 비밀번호 검증
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid credentials' });
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

      // 클라이언트에 Refresh Token을 쿠키로 설정
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true, // HTTPS를 사용하는 경우
        sameSite: 'strict',
        maxAge: 2 * 60 * 60 * 1000, // 2시간
      });

      res.status(200).json({ message: 'Login successful', accessToken });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // 토큰 갱신 핸들러
  const refreshTokenHandler: RequestHandler = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh Token required' });
      return;
    }

    try {
      // 데이터베이스에서 해당 토큰 조회
      const [rows] = await db.query('SELECT * FROM tokens WHERE refresh_token = ?', [refreshToken]);
      const tokenEntry = (rows as any[])[0];

      if (!tokenEntry) {
        res.status(403).json({ error: 'Invalid Refresh Token' });
        return;
      }

      const userId = tokenEntry.user_id;

      // 새로운 Access Token 및 Refresh Token 발급
      const secret = process.env.ACCESS_TOKEN_SECRET;
      if (!secret) {
        throw new Error('ACCESS_TOKEN_SECRET is not defined');
      }
      const accessToken = jwt.sign({ userId }, secret, { expiresIn: '15m' });
      const newRefreshToken = generateRefreshToken();
      const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);

      // 데이터베이스에 새로운 Refresh Token 저장하고 이전 토큰 업데이트
      await db.query('UPDATE tokens SET refresh_token = ? WHERE id = ?', [
        hashedNewRefreshToken,
        tokenEntry.id,
      ]);

      // 새로운 Refresh Token을 클라이언트 쿠키에 저장
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 2 * 60 * 60 * 1000,
      });

      res.status(200).json({ accessToken });
    } catch (error) {
      res.status(403).json({ error: 'Invalid Refresh Token' });
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
      res.clearCookie('refreshToken');
      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to logout' });
    }
  };

  // 라우트 설정
  router.post('/register', registerHandler);
  router.post('/login', loginHandler);
  router.post('/refresh-token', refreshTokenHandler);
  router.post('/logout', logoutHandler);

  return router;
}
