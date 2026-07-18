import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { firebaseAdmin } from '../config/firebase';
import { sendOTP } from '../adapters/sms.adapter';

// In-memory OTP store: phone -> { code, expiresAt }
export const otpStore = new Map<string, { code: string; expiresAt: number; phone: string }>();

export const verifyAndConsumeOtp = (formattedPhone: string, code: string): { success: boolean; message?: string } => {
  const stored = otpStore.get(formattedPhone);
  if (!stored) return { success: false, message: 'No OTP requested for this number' };
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(formattedPhone);
    return { success: false, message: 'OTP has expired. Please request a new one.' };
  }
  if (stored.code !== code) return { success: false, message: 'Invalid OTP code. Please try again.' };
  
  otpStore.delete(formattedPhone);
  return { success: true };
};

const generateTokens = (user: any) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    department: user.department
  };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'secret', {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES || '15m') as any
  });

  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES || '7d') as any
  });

  return { accessToken, refreshToken };
};

export const phoneLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      res.status(400).json({ success: false, message: 'Firebase idToken is required' });
      return;
    }

    // Verify the Firebase Token
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    const phoneNumber = decodedToken.phone_number;

    if (!phoneNumber) {
      res.status(400).json({ success: false, message: 'No phone number associated with this token' });
      return;
    }

    // Look up the worker by phone number
    const worker = await db.selectFrom('workers')
      .selectAll()
      .where('phone', '=', phoneNumber)
      .executeTakeFirst();

    if (!worker) {
      // 404 indicates the worker is not registered yet
      res.status(404).json({ 
        success: false, 
        message: 'Worker not registered', 
        phone: phoneNumber 
      });
      return;
    }

    // Generate tokens for the worker (simulating a user object)
    const workerUser = {
      id: worker.id,
      email: `${worker.cnic}@mobile.wwb`,
      role: 'worker',
      department: undefined
    };

    const { accessToken, refreshToken } = generateTokens(workerUser);

    // Note: We are not inserting into `refresh_tokens` or `users.last_login` 
    // because those tables explicitly reference `users.id` and worker.id isn't in users.
    // For a real production app, we would either add a 'worker_id' column to 'refresh_tokens' 
    // or merge workers and users tables. For now, we return the tokens directly.

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: worker.id,
          name: worker.full_name,
          role: 'worker',
          cnic: worker.cnic
        }
      }
    });

  } catch (error) {
    console.error('Phone login error:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired Firebase token' });
  }
};

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, type = 'login' } = req.body;
    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number is required' });
      return;
    }

    // Format phone to E.164
    const cleaned = phone.replace(/\D/g, '');
    const formattedPhone = cleaned.startsWith('0') ? '+92' + cleaned.substring(1) : '+' + cleaned;

    // Check if worker exists
    const worker = await db.selectFrom('workers')
      .select('id')
      .where('phone', '=', formattedPhone)
      .executeTakeFirst();

    if (type === 'login' && !worker) {
      res.status(404).json({ success: false, message: 'Worker not registered', phone: formattedPhone });
      return;
    }

    if (type === 'register' && worker) {
      res.status(400).json({ success: false, message: 'Phone number already registered' });
      return;
    }

    // Generate 6-digit OTP (use 123456 for demo mode so user can test without seeing console)
    const isMock = process.env.USE_MOCK_APIS !== 'false';
    const code = isMock ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    otpStore.set(formattedPhone, { code, expiresAt, phone: formattedPhone });

    // Send SMS
    await sendOTP(formattedPhone, code);

    console.log(`[OTP] Sent ${code} to ${formattedPhone}`);

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      res.status(400).json({ success: false, message: 'Phone and OTP code are required' });
      return;
    }

    // Format phone
    const cleaned = phone.replace(/\D/g, '');
    const formattedPhone = cleaned.startsWith('0') ? '+92' + cleaned.substring(1) : '+' + cleaned;

    // Verify OTP
    const verification = verifyAndConsumeOtp(formattedPhone, code);
    if (!verification.success) {
      res.status(400).json(verification);
      return;
    }

    // Look up worker by phone
    const worker = await db.selectFrom('workers')
      .selectAll()
      .where('phone', '=', formattedPhone)
      .executeTakeFirst();

    if (!worker) {
      res.status(404).json({
        success: false,
        message: 'Worker not registered',
        phone: formattedPhone
      });
      return;
    }

    // Generate JWT tokens
    const workerUser = {
      id: worker.id,
      email: `${worker.cnic}@mobile.wwb`,
      role: 'worker',
      department: undefined
    };

    const { accessToken, refreshToken } = generateTokens(workerUser);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: worker.id,
          name: worker.full_name,
          role: 'worker',
          cnic: worker.cnic
        }
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await db.selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();

    if (!user || !user.is_active) {
      res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Hash refresh token before saving
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.insertInto('refresh_tokens')
      .values({
        user_id: user.id,
        token_hash: hashedRefreshToken,
        expires_at: expiresAt
      })
      .execute();

    await db.updateTable('users')
      .set({ last_login: new Date() })
      .where('id', '=', user.id)
      .execute();

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.full_name,
          role: user.role,
          department: user.department
        }
      }
    });
  } catch (error) {
    console.error('Login error', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token required' });
      return;
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret') as any;
    
    // Check if token exists in DB and is valid
    const tokens = await db.selectFrom('refresh_tokens')
      .selectAll()
      .where('user_id', '=', decoded.id)
      .execute();

    let isValid = false;
    let validTokenId = null;

    for (const t of tokens) {
      if (await bcrypt.compare(refreshToken, t.token_hash)) {
        isValid = true;
        validTokenId = t.id;
        break;
      }
    }

    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid refresh token' });
      return;
    }

    const user = await db.selectFrom('users')
      .selectAll()
      .where('id', '=', decoded.id)
      .executeTakeFirst();

    if (!user || !user.is_active) {
      res.status(401).json({ success: false, message: 'User not found or inactive' });
      return;
    }

    const tokensPayload = generateTokens(user);
    
    // Delete old refresh token
    if (validTokenId) {
      await db.deleteFrom('refresh_tokens').where('id', '=', validTokenId).execute();
    }

    // Insert new refresh token
    const newHashedRefresh = await bcrypt.hash(tokensPayload.refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insertInto('refresh_tokens')
      .values({
        user_id: user.id,
        token_hash: newHashedRefresh,
        expires_at: expiresAt
      })
      .execute();

    res.json({ success: true, data: { accessToken: tokensPayload.accessToken, refreshToken: tokensPayload.refreshToken } });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken && req.user) {
      const tokens = await db.selectFrom('refresh_tokens')
        .selectAll()
        .where('user_id', '=', req.user.id)
        .execute();

      for (const t of tokens) {
        if (await bcrypt.compare(refreshToken, t.token_hash)) {
          await db.deleteFrom('refresh_tokens').where('id', '=', t.id).execute();
          break;
        }
      }
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const user = await db.selectFrom('users')
    .select(['id', 'full_name', 'email', 'role', 'department', 'is_active'])
    .where('id', '=', req.user.id)
    .executeTakeFirst();

  res.json({ success: true, data: user });
};
