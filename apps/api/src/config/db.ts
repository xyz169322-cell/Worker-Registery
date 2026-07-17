import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env from current dir or parent if running from root
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export interface DB {
  // Define Database Tables here as we go, for Kysely to provide strict types
  businesses: any;
  workers: any;
  users: any;
  verifications: any;
  audit_logs: any;
  refresh_tokens: any;
}

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://wwb_user:wwb_password@localhost:15432/wwb_db',
    max: 10,
    ssl: process.env.DATABASE_URL?.includes('supabase.com') ? { rejectUnauthorized: false } : false,
  })
});

export const db = new Kysely<DB>({
  dialect,
});
