import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const db = new Kysely<any>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('supabase.com') ? { rejectUnauthorized: false } : false,
      max: 10,
    }),
  }),
});

const departments = [
  'Labour Dept', 'Police', 'EOBI', 'Social Security',
  'FBR', 'Excise & Taxation', 'Civil Defense', 'District Administration'
];

async function clearAndSetupRealSystem() {
  console.log('🗑️  Clearing all mock/seed data...');

  // Clear all data in correct order (foreign keys)
  await db.deleteFrom('verifications').execute();
  await db.deleteFrom('audit_logs').execute();
  await db.deleteFrom('refresh_tokens').execute();
  await db.deleteFrom('workers').execute();
  await db.deleteFrom('businesses').execute();
  await db.deleteFrom('users').execute();

  console.log('✅ All mock data cleared.');

  // Create only the essential admin accounts
  console.log('👤 Creating admin accounts...');

  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
  const deptPasswordHash = await bcrypt.hash('Dept@123', 10);

  await db.insertInto('users').values([
    {
      full_name: 'Super Admin',
      email: 'admin@wwb.punjab.gov.pk',
      password_hash: adminPasswordHash,
      role: 'super_admin',
    },
    {
      full_name: 'WWB Admin',
      email: 'wwb.admin@wwb.punjab.gov.pk',
      password_hash: adminPasswordHash,
      role: 'wwb_admin',
    },
    ...departments.map(dept => ({
      full_name: `${dept} Officer`,
      email: `${dept.toLowerCase().replace(/[^a-z0-9]/g, '')}@wwb.punjab.gov.pk`,
      password_hash: deptPasswordHash,
      role: 'dept_officer',
      department: dept,
    })),
  ]).execute();

  console.log('✅ Admin accounts created.');
  console.log('');
  console.log('🎉 System is ready for REAL DATA!');
  console.log('');
  console.log('📋 Admin Login Credentials:');
  console.log('   Super Admin  → admin@wwb.punjab.gov.pk       | Admin@123456');
  console.log('   WWB Admin    → wwb.admin@wwb.punjab.gov.pk   | Admin@123456');
  console.log('   Dept Officer → labourdept@wwb.punjab.gov.pk  | Dept@123');
  console.log('');
  console.log('📌 Workers = 0  |  Businesses = 0  |  Ready for real entry!');
}

clearAndSetupRealSystem()
  .then(() => db.destroy())
  .catch((err) => {
    console.error('❌ Error:', err);
    db.destroy();
    process.exit(1);
  });
