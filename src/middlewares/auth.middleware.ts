import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/* ─────────────────────────────────────────────────────────
   Shared authenticated-request interface.
   Import this in controllers that need req.user.
───────────────────────────────────────────────────────── */
export interface JwtPayload {
  id: string;
  role: 'superadmin' | 'admin' | 'user';
  email: string;
}

export interface AuthRequest extends Request {
  user: JwtPayload;
}

/* ─────────────────────────────────────────────────────────
   authGuard – verifies Bearer token and attaches req.user
───────────────────────────────────────────────────────── */
export const authGuard = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ ok: false, error: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret123'
    ) as JwtPayload;

    (req as AuthRequest).user = decoded;
    next();
  } catch {
    res.status(401).json({ ok: false, error: 'Invalid or expired token' });
  }
};
