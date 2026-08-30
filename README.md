# Adjust Health — Performance Report

A Next.js app for running athlete performance assessments (adult, Youth 1,
Youth 2) and saving them to a database instead of a one-off PDF export.

## How it's built

- **`public/tool.html`** — the actual assessment tool: intake form, all the
  norm tables and scoring logic, and the printable report layout. This is the
  original single-file app, unchanged in how it works — it's just served as a
  static asset now instead of being the whole site.
- **The Next.js app** (`app/`, `components/`, `lib/`) is a thin shell around
  it: a login page, a list of saved assessments, and an assessment page that
  embeds `tool.html` in an iframe. The two talk to each other over
  `postMessage` — the shell hydrates the tool with saved data on load, and the
  tool posts its current form state back up when you click **Save Assessment**.
- **Postgres** (Vercel Postgres or Neon — whichever free option is available
  to you) stores the saved assessments. **Auth is a single shared password**,
  not per-user accounts — this is a one-clinician internal tool, so a signed
  session cookie is all that's needed; see `lib/auth.ts`.

This split means the tool's actual clinical logic (which took a lot of back
and forth to get right) never had to be rewritten — it's the exact same code,
just wrapped.

## Local development

```bash
npm install
cp .env.local.example .env.local   # then fill in DATABASE_URL, AUTH_PASSWORD, AUTH_SECRET
npm run dev
```

Visit `http://localhost:3000`. Without those set, every page shows a setup
notice instead of crashing — see [`SETUP.md`](./SETUP.md) for the one-time
setup (attach a database, run the SQL migration, pick a password, set env
vars).

`public/tool.html` also still works completely standalone — open it directly
in a browser (or visit `/tool.html`) and it behaves exactly as it always did,
with localStorage autosave and no login, for a quick one-off assessment you
don't need to save.

## Deploying

Push to `main` — Vercel auto-detects the Next.js app (no `vercel.json`
needed). Set `AUTH_PASSWORD` and `AUTH_SECRET` in the Vercel project settings
(and `DATABASE_URL` too, unless you attached Vercel's own Postgres storage,
which sets `POSTGRES_URL` automatically).
