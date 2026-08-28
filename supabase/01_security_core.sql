-- =========================================================================
--  DU LIBRARY / SMART STUDY CENTER  —  SECURITY CORE MIGRATION
-- =========================================================================
--  Supabase Dashboard  ->  SQL Editor  ->  New query  ->  paste  ->  RUN
--
--  This script is IDEMPOTENT: every statement is guarded, so you can run it
--  again at any time without breaking anything.
--
--  WHAT IT DOES
--    1. Creates the base tables if the project is brand new.
--    2. Moves student PINs from plaintext  ->  hashed (`pin_hash`), and DROPS
--       the plaintext `pin` column so it can never leak again.
--    3. Creates an `admins` allow-list table (the server-side source of truth
--       for "who is an administrator").
--    4. Adds `public.is_admin()`, a SECURITY DEFINER helper that answers that
--       question from the *signed JWT* instead of from client-side JavaScript.
--    5. Replaces the wide-open `USING (true)` RLS policies with least-privilege
--       ones.
--    6. Removes `students` from the Realtime publication (Postgres Changes
--       would otherwise broadcast PIN hashes to every connected browser).
--
--  AFTER RUNNING IT
--    * Create a Supabase Auth user for each admin e-mail:
--        Dashboard -> Authentication -> Users -> "Add user" -> enter the e-mail
--        and a password -> tick "Auto Confirm User" -> Create.
--      (Do NOT insert into `auth.users` by hand — that skips `auth.identities`
--      and breaks Google sign-in for the same e-mail.)
--    * Sign in to the admin console with that e-mail + password, or with the
--      matching Google account.
--
--  ⚠️  Rotate the anon key if it was ever shared publicly, and revoke any
--      access token you may have pasted into a chat or an issue.
-- =========================================================================

create extension if not exists pgcrypto with schema extensions;

-- =========================================================================
--  1. BASE TABLES (only created when missing — existing data is untouched)
-- =========================================================================

create table if not exists public.system_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.students (
  phone       text primary key,
  name        text not null,
  email       text,
  student_id  text,
  gender      text default 'male',
  target_exam text,
  pin_hash    text,
  is_blocked  boolean default false,
  created_at  timestamptz not null default timezone('utc'::text, now()),
  last_active timestamptz not null default timezone('utc'::text, now())
);

-- =========================================================================
--  2. PIN HASHING  —  plaintext column -> hashed column
-- =========================================================================

alter table public.students add column if not exists pin_hash text;

-- One-time rescue of PINs that are still stored in the clear. They are stored
-- as an *unsalted* SHA-256 digest (`sha256$<hex>`) which the app recognises as
-- a legacy shape: on the student's next successful PIN check the browser
-- re-derives a salted PBKDF2-SHA256 credential and overwrites this value.
-- The whole block is skipped on a brand-new project where `pin` never existed.
do $do$
declare
  v_pgcrypto_schema text;
begin
  if exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name   = 'students'
       and column_name  = 'pin'
  ) then
    -- pgcrypto lives in `extensions` on Supabase but may be in `public`
    -- elsewhere, so resolve it instead of guessing.
    select n.nspname into v_pgcrypto_schema
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where p.proname = 'digest'
       and p.pronargs = 2
     limit 1;

    if v_pgcrypto_schema is null then
      raise exception 'pgcrypto digest() not found - run: create extension pgcrypto;';
    end if;

    execute format(
      'update public.students
          set pin_hash = %L || encode(%I.digest(pin, %L), %L)
        where pin is not null
          and pin <> %L
          and pin_hash is null',
      'sha256$', v_pgcrypto_schema, 'sha256', 'hex', ''
    );

    raise notice 'Legacy plaintext PINs converted to SHA-256 digests: %',
      (select count(*) from public.students where pin_hash like 'sha256$%');
  else
    raise notice 'No plaintext pin column found - nothing to migrate.';
  end if;
end $do$;

-- Hard-remove the plaintext column. After this statement the database can no
-- longer answer "what is this student's PIN?".
alter table public.students drop column if exists pin;

-- Belt and braces: refuse to store anything that is not a real hash.
alter table public.students drop constraint if exists students_pin_hash_format_chk;
alter table public.students
  add constraint students_pin_hash_format_chk
  check (
    pin_hash is null
    or pin_hash ~ '^pbkdf2\$sha256\$[0-9]+\$[0-9a-f]+\$[0-9a-f]+$'
    or pin_hash ~ '^sha256\$[0-9a-f]{64}$'
  );

-- =========================================================================
--  3. ADMINS ALLOW-LIST  —  the server-side source of truth
-- =========================================================================
--  Client-side whitelists cannot be trusted: every constant shipped to the
--  browser can be read AND rewritten in DevTools. This table is the only thing
--  that decides who is an administrator now.

create table if not exists public.admins (
  email         text primary key check (email = lower(email)),
  name          text,
  role          text not null default 'admin' check (role in ('admin', 'superadmin')),
  branch_access text not null default 'all',
  created_at    timestamptz not null default timezone('utc'::text, now())
);

insert into public.admins (email, name, role, branch_access) values
  ('mohammad.001ekram@gmail.com', 'Mohammad Ekram', 'superadmin', 'all'),
  ('ryanekram001@gmail.com',      'Ryan Ekram',     'superadmin', 'all')
on conflict (email) do nothing;

-- Add / remove administrators later with plain SQL, e.g.:
--   insert into public.admins (email, name, role) values ('you@example.com', 'You', 'admin');
--   delete from public.admins where email = 'you@example.com';

-- =========================================================================
--  4. is_admin()  —  answers "is the caller an admin?" from the signed JWT
-- =========================================================================
--  `auth.jwt()` is populated by PostgREST from the *bearer token* the client
--  presents. The token is signed by Supabase, so a browser cannot change the
--  e-mail inside it without invalidating the signature. SECURITY DEFINER lets
--  the function read `admins` even though RLS hides that table from everyone
--  else.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.admins a
     where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- =========================================================================
--  5. SELF-SERVICE PROFILE UPSERT
-- =========================================================================
--  Anonymous visitors must be able to register / update their OWN profile, but
--  they must not be able to touch `is_blocked` or write an arbitrary
--  `pin_hash`. This SECURITY DEFINER function is the only door: it validates
--  the hash shape and never writes `is_blocked`.

create or replace function public.upsert_student_profile(
  p_name        text,
  p_phone       text,
  p_email       text    default null,
  p_student_id  text    default null,
  p_gender      text    default 'male',
  p_target_exam text    default null,
  p_pin_hash    text    default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if length(v_phone) < 7 then
    raise exception 'A valid phone number is required';
  end if;

  if p_pin_hash is not null
     and p_pin_hash !~ '^pbkdf2\$sha256\$[0-9]+\$[0-9a-f]+\$[0-9a-f]+$' then
    raise exception 'pin_hash must be a PBKDF2-SHA256 credential';
  end if;

  insert into public.students as s
    (phone, name, email, student_id, gender, target_exam, pin_hash, is_blocked, last_active)
  values
    (v_phone, nullif(trim(coalesce(p_name, '')), ''), lower(nullif(trim(coalesce(p_email, '')), '')),
     nullif(trim(coalesce(p_student_id, '')), ''), coalesce(nullif(p_gender, ''), 'male'),
     nullif(trim(coalesce(p_target_exam, '')), ''), p_pin_hash, false, now())
  on conflict (phone) do update set
    name        = coalesce(excluded.name, s.name),
    email       = coalesce(excluded.email, s.email),
    student_id  = coalesce(excluded.student_id, s.student_id),
    gender      = coalesce(excluded.gender, s.gender),
    target_exam = coalesce(excluded.target_exam, s.target_exam),
    -- a null pin_hash means "leave the existing PIN alone", never "clear it"
    pin_hash    = coalesce(excluded.pin_hash, s.pin_hash),
    last_active = now();
  -- NOTE: `is_blocked` is intentionally absent from the UPDATE list.
end;
$$;

revoke all on function public.upsert_student_profile(text, text, text, text, text, text, text) from public;
grant execute on function public.upsert_student_profile(text, text, text, text, text, text, text) to anon, authenticated;

-- Phone lookup for the "welcome back" auto-fill. Returns ONLY non-sensitive
-- fields: no e-mail, no PIN hash.
create or replace function public.lookup_student_by_phone(p_phone text)
returns table (
  name        text,
  phone       text,
  student_id  text,
  gender      text,
  target_exam text,
  is_blocked  boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select s.name, s.phone, s.student_id, s.gender, s.target_exam, s.is_blocked
    from public.students s
   where regexp_replace(coalesce(s.phone, ''), '\D', '', 'g')
         = regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
   limit 1;
$$;

revoke all on function public.lookup_student_by_phone(text) from public;
grant execute on function public.lookup_student_by_phone(text) to anon, authenticated;

-- =========================================================================
--  6. ROW LEVEL SECURITY
-- =========================================================================

alter table public.system_config enable row level security;
alter table public.students      enable row level security;
alter table public.admins        enable row level security;

-- Remove every previous policy so nothing permissive survives.
drop policy if exists "Allow public read system_config"  on public.system_config;
drop policy if exists "Allow public write system_config" on public.system_config;
drop policy if exists "Allow public read students"       on public.students;
drop policy if exists "Allow public write students"      on public.students;
drop policy if exists "system_config_public_read"        on public.system_config;
drop policy if exists "system_config_public_write"       on public.system_config;
drop policy if exists "students_admin_read"              on public.students;
drop policy if exists "students_self_insert"             on public.students;
drop policy if exists "students_admin_update"            on public.students;
drop policy if exists "students_admin_delete"            on public.students;
drop policy if exists "admins_self_read"                 on public.admins;

-- 6a. system_config -------------------------------------------------------
-- The live seat board is public read (that is the product). Writes stay open
-- for now because every browser currently pushes the whole seat state; see
-- section 8 for the optional lockdown.
create policy "system_config_public_read"
  on public.system_config for select
  to anon, authenticated
  using (true);

create policy "system_config_public_write"
  on public.system_config for all
  to anon, authenticated
  using (true)
  with check (true);

-- 6b. students ------------------------------------------------------------
-- Directory (incl. PIN status) is admin-only. Nobody can bulk-download the
-- students table with the anon key any more.
create policy "students_admin_read"
  on public.students for select
  to anon, authenticated
  using (public.is_admin());

-- Self-service registration stays open; profile edits go through the
-- validated RPC created in section 5.
create policy "students_self_insert"
  on public.students for insert
  to anon, authenticated
  with check (true);

create policy "students_admin_update"
  on public.students for update
  to anon, authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "students_admin_delete"
  on public.students for delete
  to anon, authenticated
  using (public.is_admin());

-- 6c. admins --------------------------------------------------------------
-- A signed-in user may confirm that their own e-mail is on the list. There is
-- deliberately NO insert/update/delete policy: the allow-list can only be
-- changed from the SQL editor / service role.
create policy "admins_self_read"
  on public.admins for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

revoke insert, update, delete on public.admins from anon, authenticated;

-- =========================================================================
--  7. REALTIME  —  stop broadcasting the students table
-- =========================================================================
-- `postgres_changes` streams whole rows to every subscribed browser, which
-- would hand out PIN hashes to anyone who opens the page. The seat board
-- (system_config) stays published.

do $$
begin
  begin
    alter publication supabase_realtime add table public.system_config;
  exception
    when duplicate_object then null;   -- already published
  end;

  begin
    alter publication supabase_realtime drop table public.students;
    raise notice 'Removed public.students from the realtime publication.';
  exception
    when undefined_object then null;   -- was never published: nothing to do
  end;
end $$;

-- =========================================================================
--  8. OPTIONAL HARDENING  —  lock system_config writes to admins
-- =========================================================================
--  Uncomment ONLY after you accept the trade-off: with these policies active,
--  a non-admin browser can no longer persist the seat state to Postgres (it
--  still syncs live over Realtime and to its own localStorage). Run it once
--  bookings are driven by an authenticated client or an Edge Function.
--
-- drop policy if exists "system_config_public_write" on public.system_config;
-- create policy "system_config_admin_write"
--   on public.system_config for all
--   to anon, authenticated
--   using (public.is_admin())
--   with check (public.is_admin());

-- =========================================================================
--  9. VERIFY  —  run these after the script to confirm the result
-- =========================================================================
--  select table_name, column_name
--    from information_schema.columns
--   where table_schema = 'public' and table_name = 'students'
--   order by ordinal_position;                  -- `pin` must be GONE
--
--  select polname, polcmd from pg_policy
--   where polrelid = 'public.students'::regclass;
--
--  select email, role from public.admins;
