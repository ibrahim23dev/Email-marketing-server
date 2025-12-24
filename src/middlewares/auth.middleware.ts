import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authGuard = (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret123'
    );
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
