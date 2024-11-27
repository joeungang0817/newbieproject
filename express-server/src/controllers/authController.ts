import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'mysql2/promise';
import { z } from 'zod';
import * as dotenv from "dotenv";
import process from "process";
dotenv.config();

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
// User registration controller

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
    const refreshToken = jwt.sign({ userId: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '2h' });

    await db.query('INSERT INTO tokens (user_id, refreshtoken) VALUES (?, ?)', [user.id, refreshToken]);

    res.status(200).json({ message: 'Login successful', accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Token refresh controller
const refreshToken = (db: Pool) => async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ error: 'Refresh Token required' });

  try {
    // Check if the token is in the database
    const [rows] = await db.query('SELECT * FROM tokens WHERE token = ?', [token]);
    if ((rows as any[]).length === 0) {
      return res.status(403).json({ error: 'Invalid Refresh Token' });
    }

    const user = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET) as { userId: number };
    const accessToken = jwt.sign({ userId: user.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(403).json({ error: 'Invalid Refresh Token' });
  }
};

// User logout controller
const logout = (db: Pool) => async (req: Request, res: Response) => {
  const { token } = req.body;
  try {
    // Delete refresh token from database
    await db.query('DELETE FROM tokens WHERE token = ?', [token]);
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to logout' });
  }
};

export { register, login, refreshToken, logout };