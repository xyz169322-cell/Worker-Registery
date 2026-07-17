import { Request, Response } from 'express';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// ─── Simple in-memory cache ───────────────────────────────────────────────────
let summaryCache: { data: any; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000; // 60 seconds

export const getSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Return cached result if still fresh
    if (summaryCache && Date.now() < summaryCache.expiresAt) {
      res.json({ success: true, data: summaryCache.data, cached: true });
      return;
    }

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    // ── Run all independent queries in parallel ────────────────────────────
    const [
      workersCountResult,
      employersCountResult,
      verificationStatsQuery,
      pendingWorkers,
      byDistrict,
      byIndustry,
      deptVerifications,
      monthlyRegistrationsData,
    ] = await Promise.all([
      db.selectFrom('workers')
        .select((eb) => eb.fn.count('id').as('count'))
        .executeTakeFirst(),

      db.selectFrom('businesses')
        .select((eb) => eb.fn.count('id').as('count'))
        .executeTakeFirst(),

      db.selectFrom('workers')
        .select(['verification_status', (eb) => eb.fn.count('id').as('count')])
        .groupBy('verification_status')
        .execute(),

      db.selectFrom('workers')
        .select('id')
        .where('verification_status', '=', 'pending')
        .execute(),

      db.selectFrom('workers')
        .select(['district', (eb) => eb.fn.count('id').as('count')])
        .groupBy('district')
        .orderBy('count', 'desc')
        .limit(10)
        .execute(),

      db.selectFrom('workers')
        .innerJoin('businesses', 'workers.employer_id', 'businesses.id')
        .select(['businesses.industry_type as industry', (eb) => eb.fn.count('workers.id').as('count')])
        .groupBy('businesses.industry_type')
        .orderBy('count', 'desc')
        .execute(),

      db.selectFrom('verifications')
        .select(['department', 'status', (eb) => eb.fn.count('id').as('count')])
        .where('entity_type', '=', 'worker')
        .groupBy(['department', 'status'])
        .execute(),

      db.selectFrom('workers')
        .select([
          (eb) => eb.fn('to_char', ['created_at', eb.val('YYYY-MM')]).as('month'),
          (eb) => eb.fn.count('id').as('count')
        ])
        .where('created_at', '>=', twelveMonthsAgo)
        .groupBy('month')
        .orderBy('month', 'asc')
        .execute(),
    ]);

    // ── Process results ────────────────────────────────────────────────────
    const totalWorkers = Number(workersCountResult?.count || 0);
    const totalEmployers = Number(employersCountResult?.count || 0);

    const verificationStats = { verified: 0, pending: 0, flagged: 0, partially_verified: 0 };

    let partiallyVerifiedCount = 0;
    let strictlyPendingCount = 0;

    if (pendingWorkers.length > 0) {
      const verificationsCounts = await db.selectFrom('verifications')
        .select(['entity_id', (eb) => eb.fn.count('id').as('count')])
        .where('entity_type', '=', 'worker')
        .where('entity_id', 'in', pendingWorkers.map(w => w.id))
        .groupBy('entity_id')
        .execute();

      const countsMap = new Map(verificationsCounts.map(v => [v.entity_id, Number(v.count)]));
      for (const w of pendingWorkers) {
        const count = countsMap.get(w.id) || 0;
        if (count > 0 && count < 8) partiallyVerifiedCount++;
        else strictlyPendingCount++;
      }
    }

    for (const row of verificationStatsQuery) {
      if (row.verification_status === 'verified') verificationStats.verified = Number(row.count);
      if (row.verification_status === 'flagged') verificationStats.flagged = Number(row.count);
    }
    verificationStats.pending = strictlyPendingCount;
    verificationStats.partially_verified = partiallyVerifiedCount;

    const deptMap: Record<string, { department: string; verified: number; pending: number; rejected: number }> = {};
    for (const row of deptVerifications) {
      if (!deptMap[row.department]) {
        deptMap[row.department] = { department: row.department, verified: 0, pending: 0, rejected: 0 };
      }
      if (row.status === 'approved') deptMap[row.department].verified += Number(row.count);
      if (row.status === 'pending')  deptMap[row.department].pending  += Number(row.count);
      if (row.status === 'rejected') deptMap[row.department].rejected += Number(row.count);
    }

    const result = {
      totalWorkers,
      totalEmployers,
      verificationStats,
      byDistrict: byDistrict.map(d => ({ district: d.district || 'Unknown', count: Number(d.count) })),
      byIndustry: byIndustry.map(i => ({ industry: i.industry || 'Unknown', count: Number(i.count) })),
      byDepartment: Object.values(deptMap),
      monthlyRegistrations: monthlyRegistrationsData.map(m => ({ month: m.month, count: Number(m.count) }))
    };

    // Store in cache
    summaryCache = { data: result, expiresAt: Date.now() + CACHE_TTL_MS };

    res.json({ success: true, data: result });

  } catch (error) {
    console.error('Analytics Error', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const exportWorkersCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).send('Unauthorized');
      return;
    }

    const workers = await db.selectFrom('workers')
      .leftJoin('businesses', 'workers.employer_id', 'businesses.id')
      .select([
        'workers.cnic',
        'workers.full_name',
        'businesses.business_name as employer',
        'workers.job_title',
        'workers.date_of_joining',
        'workers.pay_scale',
        'workers.payment_mode',
        'workers.bank_name',
        'workers.bank_account',
        'workers.eobi_number',
        'workers.social_security_no',
        'workers.district',
        'workers.verification_status'
      ])
      .execute();

    // RBAC: Mask pay_scale for Police
    const isPolice = user.department === 'Police';

    const headers = ['CNIC', 'Full Name', 'Employer', 'Job Title', 'Date of Joining', 'Pay Scale', 'Payment Mode', 'Bank', 'Account', 'EOBI No', 'Social Security No', 'District', 'Status'];
    const rows = workers.map(w => [
      w.cnic,
      w.full_name,
      w.employer || '',
      w.job_title || '',
      w.date_of_joining ? new Date(w.date_of_joining as any).toISOString().split('T')[0] : '',
      isPolice ? '***' : (w.pay_scale || ''),
      w.payment_mode || '',
      w.bank_name || '',
      w.bank_account || '',
      w.eobi_number || '',
      w.social_security_no || '',
      w.district || '',
      w.verification_status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=workers_export.csv');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const exportPdfData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Generate JSON payload that frontend uses to render PDF report
    const byDistrict = await db.selectFrom('workers')
      .select(['district', (eb) => eb.fn.count('id').as('count')])
      .groupBy('district')
      .execute();

    res.json({
      success: true,
      data: {
        reportDate: new Date().toISOString(),
        generatedBy: req.user?.email,
        department: req.user?.department,
        districtData: byDistrict
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
