import { Request, Response } from 'express';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendNotification } from '../adapters/sms.adapter';
import { sendEmail } from '../adapters/email.adapter';
import { verifyNADRA } from '../adapters/nadra.adapter';
import { verifyNTN } from '../adapters/fbr.adapter';

export const createVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { entityType, entityId } = req.params;
    const { status, remarks } = req.body;
    const user = req.user;

    if (!user || !user.department) {
      res.status(403).json({ success: false, message: 'Unauthorized or missing department' });
      return;
    }

    if (!['worker', 'business'].includes(entityType)) {
      res.status(400).json({ success: false, message: 'Invalid entityType' });
      return;
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    // 1. Insert verification record
    await db.insertInto('verifications')
      .values({
        entity_type: entityType,
        entity_id: entityId,
        department: user.department,
        verified_by: user.id,
        status,
        remarks
      })
      .execute();

    // 2. Log to audit trail
    await db.insertInto('audit_logs')
      .values({
        user_id: user.id,
        action: `verify_${entityType}_${status}`,
        entity_type: entityType,
        entity_id: entityId,
        ip_address: req.ip,
        details: JSON.stringify({ department: user.department, status, remarks })
      })
      .execute();

    // 3. Re-evaluate entity overall verification status
    let entityPhone = '';
    
    if (entityType === 'worker') {
      const worker = await db.selectFrom('workers').selectAll().where('id', '=', entityId).executeTakeFirst();
      if (worker) {
        entityPhone = worker.phone || '';
        
        const allVerifications = await db.selectFrom('verifications')
          .select(['department', 'status'])
          .where('entity_type', '=', 'worker')
          .where('entity_id', '=', entityId)
          .execute();

        const latestByDept: Record<string, string> = {};
        for (const v of allVerifications) {
          latestByDept[v.department] = v.status;
        }

        const statuses = Object.values(latestByDept);
        let newStatus = 'pending';
        
        if (statuses.some(s => s === 'rejected')) {
          newStatus = 'flagged';
        } else if (statuses.length === 8 && statuses.every(s => s === 'approved')) {
          newStatus = 'verified';
        } else if (statuses.length > 0 && statuses.every(s => s === 'approved')) {
          newStatus = 'pending'; // DB state stays pending
        }

        // Only update DB if state actually changed to a DB-supported state
        if (newStatus === 'verified' || newStatus === 'flagged') {
          await db.updateTable('workers')
            .set({ verification_status: newStatus })
            .where('id', '=', entityId)
            .execute();
        }

        // SMS / Email Notification Logic
        if (status === 'approved' && entityPhone) {
          await sendNotification(entityPhone, `Your WWB registration was approved by ${user.department}.`);
        }
        if (status === 'rejected') {
          if (entityPhone) {
            await sendNotification(entityPhone, `Your WWB registration was flagged by ${user.department}. Please review your application.`);
          }
          await sendEmail('admin@wwb.punjab.gov.pk', 'Worker Flagged Alert', `Worker ${worker.cnic} was flagged by ${user.department}.`);
        }
      }
    } else if (entityType === 'business') {
      const business = await db.selectFrom('businesses').selectAll().where('id', '=', entityId).executeTakeFirst();
      if (business) {
        entityPhone = business.contact_phone || '';
        const newStatus = status === 'approved' ? 'verified' : (status === 'rejected' ? 'flagged' : 'pending');
        await db.updateTable('businesses')
          .set({ verification_status: newStatus })
          .where('id', '=', entityId)
          .execute();

        if (status === 'approved' && entityPhone) {
          await sendNotification(entityPhone, `Your WWB employer registration has been verified.`);
        }
      }
    }

    res.json({ success: true, message: 'Verification recorded' });
  } catch (error) {
    console.error('Create verification error', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getVerifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { entityType, entityId } = req.params;

    const verifications = await db.selectFrom('verifications')
      .selectAll()
      .where('entity_type', '=', entityType)
      .where('entity_id', '=', entityId)
      .execute();

    res.json({ success: true, data: verifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const nadraCheck = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const worker = await db.selectFrom('workers').select('cnic').where('id', '=', id).executeTakeFirst();
    
    if (!worker) {
      res.status(404).json({ success: false, message: 'Worker not found' });
      return;
    }

    const result = await verifyNADRA(worker.cnic);

    // Save to verifications log
    await db.insertInto('verifications')
      .values({
        entity_type: 'worker',
        entity_id: id,
        department: 'NADRA_MOCK',
        verified_by: req.user?.id,
        status: result.status === 'verified' ? 'approved' : 'rejected',
        remarks: 'System automated check'
      })
      .execute();

    res.json({ success: true, data: { ...result, checkedAt: new Date() } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const fbrCheck = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const business = await db.selectFrom('businesses').select('ntn').where('id', '=', id).executeTakeFirst();
    
    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }

    const result = await verifyNTN(business.ntn);

    await db.insertInto('verifications')
      .values({
        entity_type: 'business',
        entity_id: id,
        department: 'FBR_MOCK',
        verified_by: req.user?.id,
        status: result.status === 'verified' ? 'approved' : 'rejected',
        remarks: 'System automated check'
      })
      .execute();

    res.json({ success: true, data: { ...result, checkedAt: new Date() } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getPendingQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const department = req.user?.department;
    if (!department) {
      res.status(400).json({ success: false, message: 'User does not belong to a department' });
      return;
    }

    const { sql } = await import('kysely');

    // 1. Get Pending Workers (those this department hasn't reviewed yet)
    const pendingWorkers = await db.selectFrom('workers')
      .leftJoin('verifications', (join) =>
        join
          .onRef('verifications.entity_id', '=', 'workers.id')
          .on('verifications.department', '=', department)
          .on('verifications.entity_type', '=', 'worker')
      )
      .select([
        'workers.id',
        'workers.full_name',
        'workers.cnic',
        'workers.job_title',
        'workers.created_at',
      ])
      .where('verifications.id', 'is', null) // Not reviewed by this dept yet
      .where('workers.verification_status', 'in', ['pending', 'flagged']) // Globally still pending/flagged
      .orderBy('workers.created_at', 'asc')
      .execute();

    // 2. Get Metrics for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const metricsQuery = await db.selectFrom('verifications')
      .select([
        sql<number>`SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)`.as('approved_today'),
        sql<number>`SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END)`.as('rejected_today')
      ])
      .where('department', '=', department)
      .where('verified_at', '>=', startOfDay)
      .executeTakeFirst();

    res.json({
      success: true,
      data: {
        pendingCount: pendingWorkers.length,
        approvedToday: Number(metricsQuery?.approved_today || 0),
        rejectedToday: Number(metricsQuery?.rejected_today || 0),
        queue: pendingWorkers
      }
    });

  } catch (error) {
    console.error('Error fetching pending queue:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
