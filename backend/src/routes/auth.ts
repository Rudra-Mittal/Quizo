import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { z } from 'zod';

const router = express.Router();

const userSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
});

router.post('/signup', async (req:any, res:any) => {
  try {
    const { username, password } = userSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    )
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({ token });
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: 'Invalid request' });
  }
});

router.post('/login', async (req:any, res:any) => {
  try {
    const { username, password } = userSchema.parse(req.body);
    console.log(username,password,pool);
    
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    const user = result.rows[0];
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(400).json({ message: 'Invalid request' });
  }
});

export default router;