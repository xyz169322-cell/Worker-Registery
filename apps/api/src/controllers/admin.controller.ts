import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { seed } from '../../seeds/seed';

export const resetDemoData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const isDemo = process.env.DEMO_MODE === 'true';

    if (process.env.NODE_ENV === 'production' && !isDemo) {
      res.status(403).json({ success: false, message: 'Forbidden in production' });
      return;
    }

    if (!isDev && !isDemo) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    // Add 3 second artificial delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Call seed function which deletes everything and recreates it
    const result = await seed();
    
    res.json({ success: true, message: 'Demo data reset. 500 workers seeded.' });
  } catch (error) {
    console.error('Reset Demo Data Error', error);
    res.status(500).json({ success: false, message: 'Server error during reset' });
  }
};
