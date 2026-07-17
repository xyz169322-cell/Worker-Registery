import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { db } from '../config/db';

export const auditLog = (action: string, entityType?: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    // We want to log *after* the request completes to capture success/failure, 
    // or log the attempt. We'll hook into res.on('finish') to log it.
    
    res.on('finish', async () => {
      // Only log successful state changes or important failures
      if (res.statusCode >= 200 && res.statusCode < 400) {
        try {
          const entityId = req.params.id || req.body?.id || null;
          
          await db.insertInto('audit_logs').values({
            user_id: req.user?.id || null,
            action,
            entity_type: entityType || 'system',
            entity_id: entityId,
            ip_address: req.ip || req.socket.remoteAddress || 'unknown',
            details: JSON.stringify({
              method: req.method,
              url: req.originalUrl,
              body: req.method !== 'GET' ? req.body : undefined, // careful with passwords
              status: res.statusCode
            })
          }).execute();
        } catch (error) {
          console.error('Failed to write audit log', error);
        }
      }
    });

    next();
  };
};
