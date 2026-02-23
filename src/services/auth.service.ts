import { User, IUser } from '../models/user.model';
import { ApiError } from '../utils/api-error';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export class AuthService {
  async register(userData: Partial<IUser>) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    const user = await User.create(userData);

    const token = this.generateToken(user._id.toString(), user.role);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const token = this.generateToken(user._id.toString(), user.role);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  private generateToken(id: string, role: string): string {
    return jwt.sign({ id, role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }
}
