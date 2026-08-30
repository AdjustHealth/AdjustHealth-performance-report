# Setup — Supabase project

This app needs its own Supabase project (separate from anything else — nothing
here is shared with the KPI dashboard). Do this once.

## 1. Create the project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. Pick any name/region/password — the password is only for the Postgres superuser, you won't need it day to day.
3. Wait for the project to finish provisioning (a couple of minutes).

## 2. Run the schema

1. In the project, open **SQL Editor** in the left sidebar.
2. Paste the entire contents of [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) and click **Run**.
3. You should see a new `assessments` table under **Table Editor**.

## 3. Create your login

This is a single-clinician internal tool, so there's no public sign-up page —
you create your own account directly in Supabase:

1. Go to **Authentication → Users** in the left sidebar.
2. Click **Add user → Create new user**.
3. Enter your email and a password. Tick **Auto Confirm User** (so you don't need to click an email link).
4. That's the email/password you'll use to sign in to the app.

## 4. Get your API keys

1. Go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon / public** key (not the `service_role` key — that one should never be exposed to the browser).

## 5. Set environment variables

**Locally**, copy `.env.local.example` to `.env.local` and fill in the two values:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Then `npm install && npm run dev` and visit `http://localhost:3000`.

**On Vercel** (for the deployed app): go to the project → **Settings → Environment
Variables** and add the same two variables, then redeploy.

## Done

Once the env vars are set, `/` will show the sign-in page instead of the setup
notice. Sign in with the account you created in step 3, and you're in.

---

### If you ever need to start over

The whole thing lives in one table (`assessments`). Dropping and re-running
`0001_init.sql` wipes all saved assessments — the tool itself (`/tool.html`)
never breaks, since it works standalone with no database at all.
