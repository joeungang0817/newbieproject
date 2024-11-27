import { Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'mysql2/promise';
import express from 'express';
import { register,login,refreshToken,logout } from '../controllers/authController';

const authRouter = (db: Pool) => {
  const router = express.Router();

  router.post('/register', register(db));
  router.post('/login', login(db));
  router.post('/refresh-token', refreshToken(db));
  router.post('/logout', logout(db));

  return router;
};

export default authRouter;
