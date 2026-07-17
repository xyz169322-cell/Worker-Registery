import { Request, Response } from 'express';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { verifyNADRA } from '../adapters/nadra.adapter';
import admin from 'firebase-admin';

export const checkCnic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cnic } = req.body;
    if (!cnic || cnic.length !== 15) {
      res.status(400).json({ success: false, message: 'Invalid CNIC format' });
      return;
    }

    // 1. Check if already registered
    const existing = await db.selectFrom('workers')
      .select('id')
      .where('cnic', '=', cnic)
      .executeTakeFirst();

    if (existing) {
      res.status(400).json({ success: false, message: 'Worker with this CNIC is already registered' });
      return;
    }

    // 2. Perform NADRA Check
    const nadraResult = await verifyNADRA(cnic);
    if (nadraResult.status !== 'verified') {
      res.status(400).json({ success: false, message: 'CNIC verification failed with NADRA' });
      return;
    }

    res.json({
      success: true,
      data: {
        name: (nadraResult as any).fullName,
      }
    });

  } catch (error) {
    console.error('checkCnic error', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const registerWorker = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken, cnic, fullName, employer, jobTitle, payScale, paymentMode, bankName, bankAccount, eobiNumber, address } = req.body;

    if (!idToken) {
      res.status(401).json({ success: false, message: 'Missing authentication token' });
      return;
    }

    // 1. Verify Firebase Token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      console.error('Firebase token verification failed', err);
      res.status(401).json({ success: false, message: 'Invalid authentication token' });
      return;
    }

    const phone = decodedToken.phone_number;
    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number not linked to this token' });
      return;
    }

    // 2. Check if CNIC already exists (Double check)
    const existing = await db.selectFrom('workers')
      .select('id')
      .where('cnic', '=', cnic)
      .executeTakeFirst();

    if (existing) {
      res.status(400).json({ success: false, message: 'Worker with this CNIC is already registered' });
      return;
    }

    // 3. Insert Worker
    await db.insertInto('workers')
      .values({
        cnic,
        full_name: fullName,
        job_title: jobTitle,
        pay_scale: payScale ? parseFloat(payScale) : null,
        payment_mode: paymentMode || 'cash',
        bank_name: bankName || null,
        bank_account: bankAccount || null,
        eobi_number: eobiNumber || null,
        address,
        phone,
        verification_status: 'pending',
        // employer_id mapping is complex for MVP (string vs UUID), so leaving null if we don't have UUID
      })
      .execute();

    workersCache = null; // Invalidate the cache so the new worker appears immediately

    res.json({
      success: true,
      message: 'Registration successful',
    });

  } catch (error) {
    console.error('registerWorker error', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getWorkerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // 1. Fetch Worker and Employer info
    const worker = await db.selectFrom('workers')
      .leftJoin('businesses', 'workers.employer_id', 'businesses.id')
      .select([
        'workers.id',
        'workers.cnic',
        'workers.full_name',
        'workers.job_title',
        'workers.designation',
        'workers.date_of_joining',
        'workers.pay_scale',
        'workers.payment_mode',
        'workers.bank_account',
        'workers.bank_name',
        'workers.eobi_number',
        'workers.social_security_no',
        'workers.address',
        'workers.district',
        'workers.phone',
        'workers.verification_status',
        'workers.created_at',
        'businesses.business_name as employer_name',
        'businesses.ntn as employer_ntn'
      ])
      .where('workers.id', '=', id)
      .executeTakeFirst();

    if (!worker) {
      res.status(404).json({ success: false, message: 'Worker not found' });
      return;
    }

    // 2. Fetch Verification History
    const verifications = await db.selectFrom('verifications')
      .select(['id', 'department', 'status', 'remarks', 'verified_at'])
      .where('entity_type', '=', 'worker')
      .where('entity_id', '=', id)
      .orderBy('verified_at', 'desc')
      .execute();

    res.json({
      success: true,
      data: {
        ...worker,
        verifications
      }
    });

  } catch (error) {
    console.error('getWorkerById error', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

let workersCache: any = null;
let workersCacheTime = 0;
const WORKERS_CACHE_TTL = 30 * 1000; // 30 seconds

export const getAllWorkers = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = Date.now();
    if (workersCache && now - workersCacheTime < WORKERS_CACHE_TTL) {
      res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
      res.json({ success: true, data: workersCache });
      return;
    }

    const workers = await db.selectFrom('workers')
      .leftJoin('businesses', 'workers.employer_id', 'businesses.id')
      .select([
        'workers.id',
        'workers.cnic',
        'workers.full_name',
        'workers.verification_status',
        'workers.created_at',
        'businesses.business_name as employer_name'
      ])
      .orderBy('workers.created_at', 'desc')
      .execute();

    workersCache = workers;
    workersCacheTime = now;

    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    res.json({ success: true, data: workers });
  } catch (error) {
    console.error('getAllWorkers error', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workerId = req.user?.id;
    if (!workerId || req.user?.role !== 'worker') {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }

    const worker = await db.selectFrom('workers')
      .leftJoin('businesses', 'workers.employer_id', 'businesses.id')
      .select([
        'workers.id',
        'workers.cnic',
        'workers.full_name',
        'workers.phone',
        'workers.district',
        'workers.address',
        'workers.job_title',
        'workers.designation',
        'workers.pay_scale',
        'workers.payment_mode',
        'workers.bank_name',
        'workers.bank_account',
        'workers.eobi_number',
        'workers.social_security_no',
        'workers.date_of_joining',
        'workers.verification_status',
        'workers.created_at',
        'businesses.business_name as employer_name',
        'businesses.ntn as employer_ntn'
      ])
      .where('workers.id', '=', workerId)
      .executeTakeFirst();

    if (!worker) {
      res.status(404).json({ success: false, message: 'Worker not found' });
      return;
    }

    const verifications = await db.selectFrom('verifications')
      .selectAll()
      .where('entity_type', '=', 'worker')
      .where('entity_id', '=', workerId)
      .orderBy('verified_at', 'desc')
      .execute();

    res.json({
      success: true,
      data: {
        ...worker,
        verifications
      }
    });

  } catch (error) {
    console.error('getMe error', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
