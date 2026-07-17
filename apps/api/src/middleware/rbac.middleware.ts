import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (req.user.role === 'super_admin' || allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
  };
};

export const requireDepartment = (allowedDepartments: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // super_admin bypasses dept checks
    if (req.user.role === 'super_admin' || req.user.role === 'wwb_admin') {
      next();
      return;
    }

    if (req.user.department && allowedDepartments.includes(req.user.department)) {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Department access denied' });
    }
  };
};
