# DU-Library — Smart Study Center & Library Management

Real-time library & study center **seat management system** with a live occupancy
grid, away timers, digital passes, dual-branch support, and a full admin dashboard.
Bilingual UI (English + Bengali). Deployed at [du-library.vercel.app](https://du-library.vercel.app/).

## Features

- 🪑 **Live seat grid** across two branches (Science Library & Central Library), grouped by room
  (general, female-only, AC hall, silent zone, discussion).
- ⏱️ **Away timers** with reasons (Prayer, Lunch, Tea, Rest, Emergency, Custom) and
  secondary (temporary) seat bookings while away.
- 🎫 **Digital passes** with a unique pass code on every booking.
- 👩‍🎓 **Student profiles** — Google sign-in (Supabase OAuth), PIN credentials, block-list, profile completion flow.
- 📋 **Attendance tracking** with check-in / check-out and duration.
- 🛠️ **Admin dashboard** — seat/room management, notices, rules, Wi-Fi info, student directory & PIN reset.
- 🔐 **Server-side authorization** — admin access is decided by Postgres (RLS + an `admins` allow-list), not by the browser.
- 🔄 **Real-time sync** between devices via Supabase Realtime.

## Tech stack

- React 19 · TypeScript · Vite 6 · Tailwind CSS v4
- `@supabase/supabase-js` (auth, cloud sync, realtime)
- `lucide-react`, `motion`, `canvas-confetti`
- Bun (lockfile included; `npm` works too)

## Getting started

```bash
# 1. Install dependencies
bun install          # or: npm install

# 2. Configure environment (see .env.example)
cp .env.example .env

# 3. Run the dev server
bun run dev          # or: npm run dev
```

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | No* | Supabase project URL (falls back to a bundled default) |
| `VITE_SUPABASE_ANON_KEY` | No* | Supabase public anon key (falls back to a bundled default) |
| `GEMINI_API_KEY` | No | Reserved for the Gemini AI capability (not used by current UI) |
| `APP_URL` | No | Host URL, injected by the host platform |

\* The Supabase project/anon key are bundled as defaults so the app runs
out-of-the-box; set them in `.env` to point at your own Supabase project.

### Supabase setup

Run [`supabase/01_security_core.sql`](supabase/01_security_core.sql) in the
Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → **RUN**).
The same text is exported as `SUPABASE_SETUP_SQL` from `src/lib/supabase.ts` and
is available through the **Copy SQL** button in the admin console, so the
repository and the button can never drift apart. The script is idempotent.

After running it, create a Supabase Auth user for each administrator:
**Dashboard → Authentication → Users → Add user** → e-mail + password →
tick *Auto Confirm User*. Then sign in to the admin console with that account
(or with the matching Google account). Do not insert into `auth.users` by hand —
that skips `auth.identities` and breaks Google sign-in for the same e-mail.

To add or remove an administrator later:

```sql
insert into public.admins (email, name, role) values ('you@example.com', 'You', 'admin');
delete from public.admins where email = 'you@example.com';
```

## 🔒 Security model

### PINs are never stored in plain text

A PIN is hashed the moment it is entered, in
[`src/lib/crypto.ts`](src/lib/crypto.ts), using only the browser's built-in
Web Crypto API — no library, no server round-trip:

```
raw PIN  482913
stored   pbkdf2$sha256$210000$9f2c1a…$7ab4e0…
                └ algorithm ┘ └iter┘ └salt┘ └derived key┘
```

- **PBKDF2-HMAC-SHA256**, 210,000 rounds, random 16-byte salt per PIN. A bare
  `SHA-256(pin)` would be worthless for a 4-digit PIN — the entire keyspace can
  be pre-computed in milliseconds — so the salt and the stretching are not
  optional extras.
- The plaintext never reaches React state, `localStorage` or the network. The
  admin table shows a **hash fingerprint** and the algorithm, never the number.
- Legacy rows (`sha256$<hex>` from the SQL migration, or pre-hashing plaintext)
  still verify, and are transparently re-hashed on the next successful check.
- The database enforces it too: `students.pin_hash` has a `CHECK` constraint
  that rejects anything that is not a real credential, and the plaintext `pin`
  column is **dropped** by the migration.
- `students` was also removed from the Realtime publication — Postgres Changes
  streams whole rows, which would have broadcast credentials to every browser.

### Admin access is decided by the database

`loginAdmin()` in `src/context/LibraryContext.tsx` no longer contains a password
list or an e-mail/phone whitelist. The flow is:

1. **Authenticate** — Supabase Auth checks the password (`signInWithPassword`).
2. **Authorize** — `checkAdminAccess()` queries the `admins` table, whose RLS
   policy only returns a row when `lower(email) = lower(auth.jwt()->>'email')`.

`auth.jwt()` comes from the *signed* bearer token, so a browser cannot change
the e-mail inside it without invalidating the signature. Editing
`localStorage`, a React state value or the JS bundle in DevTools therefore no
longer grants access. The admin session is deliberately **not** persisted to
`localStorage`; it is re-derived from the Supabase session on every load.

The remaining `ADMIN_EMAILS` / `ADMIN_PHONE_NUMBER` constants are **labels
only** (marked `@deprecated`) and gate nothing.

### What is still open

- `system_config` writes are still permitted for `anon` so the live seat board
  keeps syncing from any device. Section 8 of the SQL file contains the
  commented-out lockdown; enabling it means non-admin browsers can no longer
  persist seat state to Postgres (they still sync over Realtime).
- The anon key is public **by design** — it is not a secret. RLS is the access
  boundary. Rotate it if it was ever shared.
- A hashed PIN protects a PIN that is *stolen at rest*. It cannot protect one
  typed into a page an attacker controls, and a 4-digit PIN is still
  brute-forceable online without rate limiting. Prefer 6+ digits.
- Never paste an access token (GitHub PAT, Supabase service key) into a chat,
  an issue or a commit. If one leaked, revoke it immediately.

## Project structure

```
src/
  App.tsx                      # root, routing (hash-based), modals, error boundary
  context/LibraryContext.tsx   # global state, localStorage persistence, Supabase sync
  data/initialData.ts          # branches, rooms, seed data
  lib/crypto.ts                # PBKDF2-SHA256 PIN hashing (Web Crypto, no deps)
  lib/supabase.ts              # Supabase client, admin authorization, sync/realtime
  types.ts                     # shared TypeScript types
  components/                  # UI: PortalHome, SeatGrid, AdminPage, modals, etc.
supabase/
  01_security_core.sql         # migration: pin_hash, admins table, RLS policies
scripts/
  verify-security.ts           # runs the real crypto module against test vectors
  verify-sql.mjs               # runs the migration on a throwaway PostgreSQL
```

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` / `npm run dev` | Start Vite dev server (port 3000) |
| `bun run build` / `npm run build` | Production build |
| `bun run preview` | Preview the production build |
| `bun run lint` / `npm run lint` | Type-check (`tsc --noEmit`) |
| `npm run verify:security` | Exercise `src/lib/crypto.ts` against known-answer vectors (needs `tsx`, already a devDependency) |
| `npm run verify:sql` | Run the migration on a throwaway PostgreSQL and assert the RLS behaviour (`npm i -D embedded-postgres` first) |
| `npm run verify` | lint + both verifications + production build |
