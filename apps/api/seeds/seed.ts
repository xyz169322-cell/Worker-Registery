import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const db = new Kysely<any>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://wwb_user:wwb_password@localhost:15432/wwb_db',
      max: 10,
    }),
  }),
});

const districts = ['Lahore', 'Faisalabad', 'Gujranwala', 'Rawalpindi', 'Multan', 'Sialkot'];

const departments = [
  'Labour Dept', 'Police', 'EOBI', 'Social Security', 
  'FBR', 'Excise & Taxation', 'Civil Defense', 'District Administration'
];

// Helper to generate a random date within the last 12 months
function getRandomDateLast12Months() {
  const now = new Date();
  const past = new Date();
  past.setMonth(now.getMonth() - 11);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime())).toISOString();
}

// Generate verification status with distribution: 60% verified, 25% pending, 15% flagged
function getRandomStatus() {
  const rand = Math.random();
  if (rand < 0.6) return 'verified';
  if (rand < 0.85) return 'pending';
  return 'flagged';
}

export async function seed() {
  console.log('Seeding database...');
  
  // Clear old data safely
  await db.deleteFrom('verifications').execute();
  await db.deleteFrom('audit_logs').execute();
  await db.deleteFrom('refresh_tokens').execute();
  await db.deleteFrom('workers').execute();
  await db.deleteFrom('businesses').execute();
  await db.deleteFrom('users').execute();

  const passwordHash = await bcrypt.hash('Dept@123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);

  // 1. Users
  console.log('Inserting Users...');
  const usersToInsert = [
    { full_name: 'Super Admin', email: 'admin@wwb.punjab.gov.pk', password_hash: adminPasswordHash, role: 'super_admin' },
    { full_name: 'WWB Admin', email: 'wwb.admin@wwb.punjab.gov.pk', password_hash: adminPasswordHash, role: 'wwb_admin' },
    ...departments.map(dept => ({
      full_name: `${dept} Officer`,
      email: `${dept.toLowerCase().replace(/[^a-z0-9]/g, '')}@wwb.punjab.gov.pk`,
      password_hash: passwordHash,
      role: 'dept_officer',
      department: dept
    })),
    { full_name: 'Employer 1', email: 'employer1@test.com', password_hash: passwordHash, role: 'employer' },
    { full_name: 'Employer 2', email: 'employer2@test.com', password_hash: passwordHash, role: 'employer' },
    { full_name: 'Employer 3', email: 'employer3@test.com', password_hash: passwordHash, role: 'employer' }
  ];

  const insertedUsers = await db.insertInto('users').values(usersToInsert).returning(['id', 'role']).execute();
  const employerUsers = insertedUsers.filter(u => u.role === 'employer');

  // 2. Businesses (30 fictional employers)
  console.log('Inserting Businesses...');
  const businesses = [];
  for (let i = 1; i <= 30; i++) {
    businesses.push({
      ntn: `1000${i.toString().padStart(3, '0')}-1`,
      business_name: `Punjab Textiles ${i} Pvt Ltd`,
      industry_type: 'Textile',
      address: `Industrial Estate ${i}, ${districts[i % districts.length]}`,
      district: districts[i % districts.length],
      contact_person: `Manager ${i}`,
      contact_phone: `030012345${i.toString().padStart(2, '0')}`,
      verification_status: getRandomStatus(),
      registered_by: employerUsers[i % employerUsers.length].id,
      created_at: getRandomDateLast12Months()
    });
  }
  const insertedBusinesses = await db.insertInto('businesses').values(businesses).returning('id').execute();

  // 3. Workers (500 dummy records)
  console.log('Inserting Workers...');
  const workers = [];
  for (let i = 1; i <= 500; i++) {
    const status = getRandomStatus();
    workers.push({
      cnic: `35201-${i.toString().padStart(7, '0')}-${i % 9}`,
      full_name: `Worker Name ${i}`,
      employer_id: insertedBusinesses[i % 30].id,
      job_title: 'Machine Operator',
      designation: 'Staff',
      date_of_joining: new Date(2020 + (i % 4), i % 12, (i % 28) + 1).toISOString().split('T')[0],
      pay_scale: 18000 + (i * 100),
      payment_mode: i % 2 === 0 ? 'bank' : 'cash',
      bank_account: i % 2 === 0 ? `PK12MEZN${i.toString().padStart(10, '0')}` : null,
      bank_name: i % 2 === 0 ? 'Meezan Bank' : null,
      eobi_number: `EOBI-${i.toString().padStart(6, '0')}`,
      social_security_no: `SS-${i.toString().padStart(6, '0')}`,
      address: `House ${i}, Street ${i % 10}, ${districts[i % districts.length]}`,
      district: districts[i % districts.length],
      phone: `03211234${i.toString().padStart(3, '0')}`,
      verification_status: status,
      created_at: getRandomDateLast12Months()
    });
  }

  // Insert workers in batches of 100
  for (let i = 0; i < workers.length; i += 100) {
    const batch = workers.slice(i, i + 100);
    await db.insertInto('workers').values(batch).execute();
  }

  console.log('Inserting Verifications for analytics...');
  const first50Workers = await db.selectFrom('workers').select(['id', 'verification_status']).limit(50).execute();
  const verificationsData = [];
  
  for (const w of first50Workers) {
    if (w.verification_status === 'verified') {
      departments.forEach(dept => {
        verificationsData.push({
          entity_type: 'worker',
          entity_id: w.id,
          department: dept,
          status: 'approved',
          verified_by: null
        });
      });
    } else if (w.verification_status === 'flagged') {
      verificationsData.push({
        entity_type: 'worker',
        entity_id: w.id,
        department: departments[0],
        status: 'rejected',
        verified_by: null
      });
    }
  }
  
  if (verificationsData.length > 0) {
    for (let i = 0; i < verificationsData.length; i += 100) {
      const batch = verificationsData.slice(i, i + 100);
      await db.insertInto('verifications').values(batch).execute();
    }
  }

  console.log('Database seeded successfully! (500 workers, 30 businesses)');
  return { success: true, message: 'Database seeded successfully! (500 workers, 30 businesses)' };
}

if (require.main === module) {
  seed().then(() => db.destroy()).catch(console.error);
}
