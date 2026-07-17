import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    department?: string;
  };
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'secret') as any;

    // Check if user is active, handling 'worker' role separately
    if (decoded.role === 'worker') {
      const worker = await db.selectFrom('workers')
        .select(['id'])
        .where('id', '=', decoded.id)
        .executeTakeFirst();
      
      if (!worker) {
        res.status(403).json({ success: false, message: 'Worker account not found' });
        return;
      }
    } else {
      const user = await db.selectFrom('users')
        .select(['is_active'])
        .where('id', '=', decoded.id)
        .executeTakeFirst();

      if (!user || !user.is_active) {
        res.status(403).json({ success: false, message: 'Account disabled or not found' });
        return;
      }
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      department: decoded.department,
    };
    
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const checkRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Forbidden: Insufficient role permissions' });
      return;
    }
    next();
  };
};
