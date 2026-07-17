import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8081', 'http://127.0.0.1:8081'],
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

import authRoutes from './routes/auth.routes';
import verificationsRoutes from './routes/verifications.routes';
import analyticsRoutes from './routes/analytics.routes';
import adminRoutes from './routes/admin.routes';
import workersRoutes from './routes/workers.routes';
import employersRoutes from './routes/employers.routes';
import { nadraCheck, fbrCheck } from './controllers/verifications.controller';
import { exportWorkersCSV, exportPdfData } from './controllers/analytics.controller';
import { verifyToken, checkRole } from './middleware/auth.middleware';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/verifications', verificationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/workers', workersRoutes);
app.use('/api/employers', employersRoutes);

// Mock Check Endpoints
app.post('/api/workers/:id/nadra-check', verifyToken, checkRole('wwb_admin', 'dept_officer', 'super_admin'), nadraCheck);
app.post('/api/employers/:id/fbr-check', verifyToken, checkRole('wwb_admin', 'dept_officer', 'super_admin'), fbrCheck);

// Export Endpoints
app.get('/api/workers/export/csv', verifyToken, checkRole('wwb_admin', 'dept_officer', 'super_admin'), exportWorkersCSV);
app.get('/api/reports/export/pdf-data', verifyToken, checkRole('wwb_admin', 'dept_officer', 'super_admin'), exportPdfData);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
  });
}

export default app;
