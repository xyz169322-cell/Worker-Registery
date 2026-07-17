import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { firebaseAdmin } from '../config/firebase';

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
