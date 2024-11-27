import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'mysql2/promise';
import { z } from 'zod';
import * as dotenv from "dotenv";
import process from "process";
import crypto from 'crypto';
dotenv.config();

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
// User registration controller

// Refresh Token 생성 함수
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

const register = (db: Pool) => async (req: Request, res: Response) => {
  try {
    const { email, password } = userSchema.parse(req.body);

    // Check if the user already exists
    const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if ((existingUser as any[]).length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Password hashing
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const hashedPassword = await bcrypt.hash(password, salt);

    // User creation
    const [result] = await db.query(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully', userId: (result as any).insertId });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// User login controller
const login = (db: Pool) => async (req: Request, res: Response) => {
  try {
    const { email, password } = userSchema.parse(req.body);

    // User lookup
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = (rows as any[])[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Password verification
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // JWT generation
    const accessToken = jwt.sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });

    // Generate and hash refresh token
    const refreshToken = generateRefreshToken();
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await db.query('INSERT INTO tokens (user_id, refresh_token) VALUES (?, ?)', [user.id, hashedRefreshToken]);

    // 클라이언트에 HttpOnly 쿠키로 저장
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

// Token refresh controller
const refreshToken = (db: Pool) => async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh Token required' });

  try {
    // 데이터베이스에서 해당 토큰 조회
    const [rows] = await db.query('SELECT * FROM tokens WHERE user_id = ?', [req.userId]);
    const tokenEntry = (rows as any[]).find(async (tokenRow) => {
      return await bcrypt.compare(refreshToken, tokenRow.refresh_token);
    });

    if (!tokenEntry) {
      return res.status(403).json({ error: 'Invalid Refresh Token' });
    }

    // 새로운 Access Token 및 Refresh Token 발급 (토큰 회전)
    const accessToken = jwt.sign({ userId: req.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const newRefreshToken = generateRefreshToken();
    const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);

    // 데이터베이스에 새로운 Refresh Token 저장하고 이전 토큰 삭제
    await db.query('UPDATE tokens SET refresh_token = ? WHERE id = ?', [hashedNewRefreshToken, tokenEntry.id]);

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

// User logout controller
const logout = (db: Pool) => async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  try {
    // 데이터베이스에서 Refresh Token 삭제
    await db.query('DELETE FROM tokens WHERE user_id = ?', [req.userId]);
    // 클라이언트 쿠키에서 Refresh Token 삭제
    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to logout' });
  }
};

export { register, login, refreshToken, logout };