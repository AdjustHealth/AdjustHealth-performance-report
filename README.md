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
- **Supabase** (Postgres + Auth) stores the saved assessments and gates access
  behind a login.

This split means the tool's actual clinical logic (which took a lot of back
and forth to get right) never had to be rewritten — it's the exact same code,
just wrapped.

## Local development

```bash
npm install
cp .env.local.example .env.local   # then fill in your Supabase project's URL + anon key
npm run dev
```

Visit `http://localhost:3000`. Without Supabase configured, every page shows
a setup notice instead of crashing — see [`SETUP.md`](./SETUP.md) for the
one-time Supabase project setup (create project, run the SQL migration,
create your login, set env vars).

`public/tool.html` also still works completely standalone — open it directly
in a browser (or visit `/tool.html`) and it behaves exactly as it always did,
with localStorage autosave and no login, for a quick one-off assessment you
don't need to save.

## Deploying

Push to `main` — Vercel auto-detects the Next.js app (no `vercel.json`
needed). Set the two Supabase env vars in the Vercel project settings.
