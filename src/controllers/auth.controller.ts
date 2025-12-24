import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/user.model';
import { signToken } from '../utils/jwt';

/* ======================
   REGISTER (1 MONTH TRIAL)
====================== */
export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const hashed = await bcrypt.hash(password, 10);

  const trialEndsAt = new Date();
  trialEndsAt.setMonth(trialEndsAt.getMonth() + 1);

  const user = await User.create({
    name,
    email,
    password: hashed,
    trialEndsAt
  });

  return res.json({
    ok: true,
    message: 'Registered successfully',
    trialEndsAt
  });
};

/* ======================
   LOGIN
====================== */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Account disabled' });
  }

  if (user.trialEndsAt && new Date() > user.trialEndsAt) {
    return res.status(403).json({ error: 'Free trial expired' });
  }

  const token = signToken({
    id: user._id,
    role: user.role
  });

  return res.json({
    ok: true,
    token,
    role: user.role,
    trialEndsAt: user.trialEndsAt
  });
};
