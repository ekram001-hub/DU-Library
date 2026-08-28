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
- 👩‍🎓 **Student profiles** — Google sign-in (Supabase OAuth), PIN login, block-list, profile completion flow.
- 📋 **Attendance tracking** with check-in / check-out and duration.
- 🛠️ **Admin dashboard** — seat/room management, notices, rules, Wi-Fi info, student directory & PIN reset.
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

Run the SQL in `SUPABASE_SETUP_SQL` (exported from `src/lib/supabase.ts`) in your
Supabase SQL Editor to create the `system_config` and `students` tables, enable
RLS, and register them for Realtime.

## ⚠️ Security notes (read before production use)

This project is a **client-side demo** and its authentication/data model is not
production-grade. In particular:

1. **Admin auth is client-only** (`loginAdmin` in `src/context/LibraryContext.tsx`).
   Anyone can bypass it by editing `localStorage` or the JS bundle. Move admin
   checks to Supabase Auth + RLS or an Edge Function.
2. **The bundled RLS policies are fully permissive** (`USING (true)` for `anon` and
   `authenticated`) so that live seat sync works without a backend. Anyone with the
   anon key can read/write `students` (including PINs). Restrict `students` access
   and hash PINs before storing them.
3. **PINs and phone numbers are stored in plain text** (localStorage + Supabase).
   Hash PINs (e.g. Web Crypto SHA-256) and avoid exposing PII to the anon role.
4. **The anon key is public by design** — it is not a secret; RLS is the real
   access-control boundary.

## Project structure

```
src/
  App.tsx                      # root, routing (hash-based), modals, error boundary
  context/LibraryContext.tsx   # global state, localStorage persistence, Supabase sync
  data/initialData.ts          # branches, rooms, seed data
  lib/supabase.ts              # Supabase client, RLS SQL, sync/realtime helpers
  types.ts                     # shared TypeScript types
  components/                  # UI: PortalHome, SeatGrid, AdminPage, modals, etc.
```

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` / `npm run dev` | Start Vite dev server (port 3000) |
| `bun run build` / `npm run build` | Production build |
| `bun run preview` | Preview the production build |
| `bun run lint` / `npm run lint` | Type-check (`tsc --noEmit`) |
