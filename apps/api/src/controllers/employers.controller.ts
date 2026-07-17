import { Request, Response } from 'express';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { sql } from 'kysely';

// Helper to get the business ID for the logged in employer
const getEmployerBusiness = async (userId: string) => {
  return await db.selectFrom('businesses')
    .selectAll()
    .where('registered_by', '=', userId)
    .executeTakeFirst();
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const business = await getEmployerBusiness(userId);
    if (!business) {
      // Employer hasn't registered a business profile yet
      res.json({
        success: true,
        data: {
          businessName: '',
          metrics: { total: 0, verified: 0, pending: 0 }
        }
      });
      return;
    }

    // Get metrics for this business's workers
    const metrics = await db.selectFrom('workers')
      .select([
        sql<number>`count(*)`.as('total'),
        sql<number>`SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END)`.as('verified'),
        sql<number>`SUM(CASE WHEN verification_status IN ('pending', 'flagged') THEN 1 ELSE 0 END)`.as('pending')
      ])
      .where('employer_id', '=', business.id)
      .executeTakeFirst();

    res.json({
      success: true,
      data: {
        businessName: business.business_name,
        metrics: {
          total: Number(metrics?.total || 0),
          verified: Number(metrics?.verified || 0),
          pending: Number(metrics?.pending || 0)
        }
      }
    });

  } catch (error) {
    console.error('getDashboardStats error', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMyWorkers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const business = await getEmployerBusiness(userId);
    if (!business) {
      res.json({ success: true, data: [] });
      return;
    }

    const workers = await db.selectFrom('workers')
      .selectAll()
      .where('employer_id', '=', business.id)
      .orderBy('created_at', 'desc')
      .execute();

    res.json({ success: true, data: workers });

  } catch (error) {
    console.error('getMyWorkers error', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
