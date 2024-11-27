import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

// User registration controller
export const register = async (req: Request, res: Response) => {
  try {
    const { password, profile_picture } = req.body;

    // Password hashing
    const hashedPassword = await bcrypt.hash(password, 10);

    // User creation
    const user = await User.create({
      password: hashedPassword,
      profile_picture,
    });

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// User login controller
export const login = async (req: Request, res: Response) => {
  try {
    const { id, password } = req.body;

    // User lookup
    const user = await User.findOne({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Password verification
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // JWT generation
    const token = jwt.sign({ userId: user.id }, 'YOUR_SECRET_KEY', { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
