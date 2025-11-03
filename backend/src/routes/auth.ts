import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const isUsernameValid = username === config.adminUsername;
  const isPasswordValid = await bcrypt.compare(password, config.adminPasswordHash);

  if (!isUsernameValid || !isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ username: config.adminUsername }, config.jwtSecret, {
    expiresIn: '1d', // Token expires in 1 day
  });

  res.json({ token });
});

export default router;
