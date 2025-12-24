import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

export const signToken = (payload: any) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

export const verifyToken = (token: string) =>
  jwt.verify(token, JWT_SECRET);
