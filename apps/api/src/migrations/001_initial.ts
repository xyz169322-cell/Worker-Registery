import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // users
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('full_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('email', 'varchar(255)', (col) => col.unique().notNull())
    .addColumn('password_hash', 'text', (col) => col.notNull())
    .addColumn('role', 'varchar(30)', (col) => col.notNull().check(sql`role IN ('super_admin','wwb_admin','dept_officer','employer')`))
    .addColumn('department', 'varchar(100)')
    .addColumn('is_active', 'boolean', (col) => col.defaultTo(true))
    .addColumn('last_login', 'timestamp')
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`NOW()`))
    .execute();

  // businesses
  await db.schema
    .createTable('businesses')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('ntn', 'varchar(15)', (col) => col.unique().notNull())
    .addColumn('business_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('industry_type', 'varchar(100)')
    .addColumn('address', 'text')
    .addColumn('district', 'varchar(100)')
    .addColumn('contact_person', 'varchar(255)')
    .addColumn('contact_phone', 'varchar(20)')
    .addColumn('verification_status', 'varchar(20)', (col) => col.defaultTo('pending').check(sql`verification_status IN ('pending','verified','flagged')`))
    .addColumn('registered_by', 'uuid', (col) => col.references('users.id'))
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamp', (col) => col.defaultTo(sql`NOW()`))
    .execute();

  // workers
  await db.schema
    .createTable('workers')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('cnic', 'varchar(15)', (col) => col.unique().notNull())
    .addColumn('full_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('employer_id', 'uuid', (col) => col.references('businesses.id'))
    .addColumn('job_title', 'varchar(150)')
    .addColumn('designation', 'varchar(150)')
    .addColumn('date_of_joining', 'date')
    .addColumn('pay_scale', 'numeric')
    .addColumn('payment_mode', 'varchar(10)', (col) => col.check(sql`payment_mode IN ('bank','cash')`))
    .addColumn('bank_account', 'varchar(30)')
    .addColumn('bank_name', 'varchar(100)')
    .addColumn('eobi_number', 'varchar(30)')
    .addColumn('social_security_no', 'varchar(30)')
    .addColumn('address', 'text')
    .addColumn('district', 'varchar(100)')
    .addColumn('phone', 'varchar(20)')
    .addColumn('verification_status', 'varchar(20)', (col) => col.defaultTo('pending').check(sql`verification_status IN ('pending','verified','flagged')`))
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamp', (col) => col.defaultTo(sql`NOW()`))
    .execute();

  // verifications
  await db.schema
    .createTable('verifications')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('entity_type', 'varchar(20)', (col) => col.check(sql`entity_type IN ('worker','business')`))
    .addColumn('entity_id', 'uuid', (col) => col.notNull())
    .addColumn('department', 'varchar(100)', (col) => col.notNull())
    .addColumn('verified_by', 'uuid', (col) => col.references('users.id'))
    .addColumn('status', 'varchar(20)', (col) => col.check(sql`status IN ('approved','rejected','pending')`))
    .addColumn('remarks', 'text')
    .addColumn('verified_at', 'timestamp', (col) => col.defaultTo(sql`NOW()`))
    .execute();

  // audit_logs
  await db.schema
    .createTable('audit_logs')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.references('users.id'))
    .addColumn('action', 'varchar(100)', (col) => col.notNull())
    .addColumn('entity_type', 'varchar(50)')
    .addColumn('entity_id', 'uuid')
    .addColumn('ip_address', 'varchar(45)')
    .addColumn('details', 'jsonb')
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`NOW()`))
    .execute();

  // refresh_tokens
  await db.schema
    .createTable('refresh_tokens')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.references('users.id').onDelete('cascade'))
    .addColumn('token_hash', 'text', (col) => col.notNull())
    .addColumn('expires_at', 'timestamp', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`NOW()`))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('refresh_tokens').execute();
  await db.schema.dropTable('audit_logs').execute();
  await db.schema.dropTable('verifications').execute();
  await db.schema.dropTable('workers').execute();
  await db.schema.dropTable('businesses').execute();
  await db.schema.dropTable('users').execute();
}
