/**
 * End-to-end check of `supabase/01_security_core.sql` against a REAL PostgreSQL
 * server (embedded, thrown away afterwards).
 *
 * It reproduces the project's current production shape — a `students` table
 * with a plaintext `pin` column and wide-open `USING (true)` policies — runs
 * the migration, and then asserts that:
 *
 *   * the plaintext column is physically gone and the values became digests,
 *   * `admins` + `is_admin()` decide access from the JWT, not from the client,
 *   * an anonymous caller can no longer read the student directory,
 *   * `upsert_student_profile()` cannot flip `is_blocked` or store a raw PIN,
 *   * the script is idempotent (running it twice changes nothing).
 *
 *   node scripts/verify-sql.mjs
 */
import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const MIGRATION = readFileSync(new URL('../supabase/01_security_core.sql', import.meta.url), 'utf8');

let passed = 0;
let failed = 0;
const check = (name, ok, detail) => {
  if (ok) { passed += 1; console.log(`  \u2713 ${name}`); }
  else { failed += 1; console.log(`  \u2717 ${name}${detail ? `\n      ${detail}` : ''}`); }
};

const db = new EmbeddedPostgres({
  databaseDir: '/tmp/du-lib-pg-data',
  user: 'postgres',
  password: 'postgres',
  port: 55432,
  persistent: false,
});

let admin; // superuser client

/** Run SQL as a given role with a given (faked) Supabase JWT. */
async function asRole(role, jwtEmail, sql, params) {
  const client = new pg.Client({
    host: '127.0.0.1', port: 55432, user: 'postgres', password: 'postgres', database: 'postgres',
  });
  await client.connect();
  await client.query(`set role ${role}`);
  await client.query(`select set_config('request.jwt.claims', $1, false)`, [
    JSON.stringify(jwtEmail ? { role, email: jwtEmail } : { role }),
  ]);
  try {
    return await client.query(sql, params);
  } finally {
    await client.end();
  }
}

try {
  await db.initialise();
  await db.start();
  admin = new pg.Client({
    host: '127.0.0.1', port: 55432, user: 'postgres', password: 'postgres', database: 'postgres',
  });
  await admin.connect();

  // ---------------------------------------------------------------------
  // Recreate a Supabase-like environment
  // ---------------------------------------------------------------------
  await admin.query(`
    create schema if not exists auth;
    create schema if not exists extensions;

    create role anon nologin;
    create role authenticated nologin;
    grant usage on schema public, extensions, auth to anon, authenticated;

    -- Stand-in for Supabase's auth.jwt(): reads the claims PostgREST injects.
    create or replace function auth.jwt() returns jsonb language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
    $$;

    create publication supabase_realtime;
    create extension pgcrypto with schema extensions;

    -- Supabase grants these by default via "alter default privileges"; without
    -- them the roles below cannot touch any public object at all.
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant all on functions to anon, authenticated;
  `);

  // ---------------------------------------------------------------------
  // The pre-migration production state (plaintext PINs + open RLS)
  // ---------------------------------------------------------------------
  await admin.query(`
    create table public.system_config (
      key text primary key,
      value jsonb not null,
      updated_at timestamptz not null default timezone('utc'::text, now())
    );

    create table public.students (
      phone text primary key,
      name text not null,
      email text,
      student_id text,
      gender text default 'male',
      target_exam text,
      pin text,
      is_blocked boolean default false,
      created_at timestamptz not null default timezone('utc'::text, now()),
      last_active timestamptz not null default timezone('utc'::text, now())
    );

    alter table public.system_config enable row level security;
    alter table public.students enable row level security;

    create policy "Allow public read students" on public.students
      for select to anon, authenticated using (true);
    create policy "Allow public write students" on public.students
      for all to anon, authenticated using (true) with check (true);

    alter publication supabase_realtime add table public.system_config;
    alter publication supabase_realtime add table public.students;

    insert into public.students (phone, name, email, pin) values
      ('01711111111', 'Rahim Uddin',  'rahim@example.com',  '4829'),
      ('01722222222', 'Karim Uddin',  'karim@example.com',  '9137'),
      ('01733333333', 'Fatema Begum', 'fatema@example.com', null);
  `);

  // Sanity: before the migration, an anonymous caller can read every PIN.
  const before = await asRole('anon', null, 'select phone, pin from public.students order by phone');
  check('BEFORE: the anon key can download every plaintext PIN (the bug)',
    before.rowCount === 3 && before.rows[0].pin === '4829',
    JSON.stringify(before.rows));

  // ---------------------------------------------------------------------
  // Run the migration
  // ---------------------------------------------------------------------
  await admin.query(MIGRATION);

  console.log('\nSchema after migration');
  const cols = await admin.query(`
    select column_name from information_schema.columns
     where table_schema='public' and table_name='students' order by ordinal_position`);
  const colNames = cols.rows.map((r) => r.column_name);
  check('plaintext `pin` column has been dropped', !colNames.includes('pin'), colNames.join(', '));
  check('`pin_hash` column exists', colNames.includes('pin_hash'));

  const migrated = await admin.query('select phone, pin_hash from public.students order by phone');
  const expectedDigest = (p) => 'sha256$' + createHash('sha256').update(p).digest('hex');
  check('plaintext 4829 became its SHA-256 digest',
    migrated.rows[0].pin_hash === expectedDigest('4829'), migrated.rows[0].pin_hash);
  check('plaintext 9137 became its SHA-256 digest',
    migrated.rows[1].pin_hash === expectedDigest('9137'), migrated.rows[1].pin_hash);
  check('a student without a PIN keeps NULL', migrated.rows[2].pin_hash === null);
  check('no plaintext PIN survives anywhere in the table',
    !JSON.stringify(migrated.rows).includes('"4829"'));

  const admins = await admin.query('select email, role from public.admins order by email');
  check('admins allow-list is seeded', admins.rowCount === 2, JSON.stringify(admins.rows));
  check('owner e-mail is on the allow-list',
    admins.rows.some((r) => r.email === 'mohammad.001ekram@gmail.com' && r.role === 'superadmin'));

  const policies = await admin.query(`
    select polname from pg_policy where polrelid = 'public.students'::regclass order by polname`);
  const policyNames = policies.rows.map((r) => r.polname);
  check('old permissive student policies are gone',
    !policyNames.includes('Allow public read students') && !policyNames.includes('Allow public write students'),
    policyNames.join(', '));
  check('new least-privilege student policies exist',
    ['students_admin_read', 'students_self_insert', 'students_admin_update', 'students_admin_delete']
      .every((n) => policyNames.includes(n)), policyNames.join(', '));

  const pub = await admin.query(`
    select schemaname, tablename from pg_publication_tables where pubname='supabase_realtime'`);
  const pubTables = pub.rows.map((r) => r.tablename);
  check('system_config is still published for realtime', pubTables.includes('system_config'));
  check('students was REMOVED from the realtime publication', !pubTables.includes('students'),
    pubTables.join(', '));

  console.log('\nRow Level Security, enforced by the server');
  const anonRead = await asRole('anon', null, 'select phone, pin_hash from public.students');
  check('anon can no longer read the student directory', anonRead.rowCount === 0,
    `${anonRead.rowCount} rows`);

  const stranger = await asRole('authenticated', 'stranger@example.com',
    'select phone from public.students');
  check('a signed-in non-admin still gets zero rows', stranger.rowCount === 0,
    `${stranger.rowCount} rows`);

  const ownerRead = await asRole('authenticated', 'mohammad.001ekram@gmail.com',
    'select phone, pin_hash from public.students');
  check('the allow-listed admin e-mail CAN read the directory', ownerRead.rowCount === 3,
    `${ownerRead.rowCount} rows`);

  const ownerCheck = await asRole('authenticated', 'mohammad.001ekram@gmail.com', 'select public.is_admin() as a');
  const strangerCheck = await asRole('authenticated', 'stranger@example.com', 'select public.is_admin() as a');
  const anonCheck = await asRole('anon', null, 'select public.is_admin() as a');
  check('is_admin() is true for the owner JWT', ownerCheck.rows[0].a === true);
  check('is_admin() is false for a stranger JWT', strangerCheck.rows[0].a === false);
  check('is_admin() is false for anonymous', anonCheck.rows[0].a === false);

  // DevTools-style spoof: claim the owner's phone/email in client state. The
  // JWT is what counts, so this must still fail.
  const spoof = await asRole('authenticated', 'attacker@example.com',
    `select count(*)::int as n from public.students
      where phone = '01581624202' or email = 'mohammad.001ekram@gmail.com'`);
  check('a spoofed client-side identity leaks nothing', spoof.rows[0].n === 0);

  const anonWrite = await asRole('anon', null,
    `update public.students set is_blocked = true where phone = '01711111111'`).catch((e) => e);
  check('anon cannot UPDATE the students table directly', anonWrite instanceof Error || anonWrite.rowCount === 0);

  const anonDelete = await asRole('anon', null,
    `delete from public.students where phone = '01711111111'`).catch((e) => e);
  check('anon cannot DELETE students', anonDelete instanceof Error || anonDelete.rowCount === 0);

  console.log('\nSelf-service RPC');
  await asRole('anon', null, `select public.upsert_student_profile(
      'Nusrat Jahan', '01744444444', 'nusrat@example.com', 'DU-4444', 'female', 'BCS 47',
      'pbkdf2$sha256$210000$00112233445566778899aabbccddeeff$' ||
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')`);
  const inserted = await admin.query(
    `select name, gender, pin_hash, is_blocked from public.students where phone='01744444444'`);
  check('anon can register a new profile through the RPC', inserted.rowCount === 1);
  check('the RPC stores the PBKDF2 credential verbatim',
    (inserted.rows[0]?.pin_hash || '').startsWith('pbkdf2$sha256$210000$'));

  const rawPinRejected = await asRole('anon', null,
    `select public.upsert_student_profile('Bad Actor','01755555555',null,null,'male',null,'1234')`
  ).catch((e) => e);
  check('the RPC refuses a raw plaintext PIN', rawPinRejected instanceof Error,
    rawPinRejected instanceof Error ? rawPinRejected.message : 'no error thrown');

  await asRole('anon', null,
    `select public.upsert_student_profile('Nusrat Jahan','01744444444',null,null,null,null,null)`);
  const blocked = await admin.query(
    `select pin_hash, is_blocked from public.students where phone='01744444444'`);
  check('a profile update with no PIN leaves the existing hash untouched',
    (blocked.rows[0]?.pin_hash || '').startsWith('pbkdf2$'));

  const privilegeEscalation = await asRole('anon', null, `
    update public.students set is_blocked = false where phone='01744444444'`).catch((e) => e);
  await admin.query(`update public.students set is_blocked = true where phone='01744444444'`);
  await asRole('anon', null,
    `select public.upsert_student_profile('Nusrat Jahan','01744444444',null,null,null,null,null)`);
  const stillBlocked = await admin.query(
    `select is_blocked from public.students where phone='01744444444'`);
  check('the RPC cannot un-block an account (is_blocked is write-protected)',
    stillBlocked.rows[0]?.is_blocked === true,
    `is_blocked=${stillBlocked.rows[0]?.is_blocked}`);
  void privilegeEscalation;

  const lookup = await asRole('anon', null,
    `select * from public.lookup_student_by_phone('0171 111 1111')`);
  check('phone lookup returns the profile for auto-fill', lookup.rowCount === 1 &&
    lookup.rows[0].name === 'Rahim Uddin', JSON.stringify(lookup.rows));
  check('phone lookup never returns the PIN hash',
    !('pin_hash' in (lookup.rows[0] || {})) && !('email' in (lookup.rows[0] || {})));

  const badHash = await admin.query(
    `insert into public.students (phone, name, pin_hash) values ('01799999999','X','1234')`
  ).catch((e) => e);
  check('the CHECK constraint rejects a plaintext value in pin_hash', badHash instanceof Error,
    badHash instanceof Error ? badHash.message.split('\n')[0] : 'no error thrown');

  console.log('\nIdempotency');
  await admin.query(MIGRATION);
  const afterSecond = await admin.query(
    `select count(*)::int as n from public.students where pin_hash is not null`);
  // 3 of the 4 rows have a credential: two migrated digests + one PBKDF2 value
  // written through the RPC. The third student never had a PIN.
  check('running the script a second time succeeds and changes nothing',
    afterSecond.rows[0].n === 3, `hashed rows=${afterSecond.rows[0].n}`);
  const adminsAfter = await admin.query('select count(*)::int as n from public.admins');
  check('the admins allow-list is not duplicated', adminsAfter.rows[0].n === 2);

  console.log(`\n${failed === 0 ? 'PASS' : 'FAIL'} — ${passed} passed, ${failed} failed\n`);
} catch (err) {
  console.error('\nERROR during SQL verification:', err && err.message ? err.message : err);
  if (err && err.position) console.error(err.detail || '');
  failed += 1;
} finally {
  if (admin) await admin.end().catch(() => {});
  await db.stop().catch(() => {});
}

process.exitCode = failed > 0 ? 1 : 0;
