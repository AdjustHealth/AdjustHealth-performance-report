# Setup — database + accounts

This app needs a Postgres database (to store assessments) and one or more
named accounts (to gate access). No third-party account is required beyond
the Vercel account you're already deploying with.

## 1. Attach a Postgres database

1. Open this project in the [Vercel dashboard](https://vercel.com/dashboard).
2. Go to the **Storage** tab → **Create Database** → choose **Postgres**.
3. Follow the prompts to create and connect it to this project. Vercel will
   automatically add a `POSTGRES_URL` environment variable (among others) —
   this app reads that automatically, nothing else to do here.

If your plan doesn't offer a free Postgres store, [neon.tech](https://neon.tech)
has its own free tier and gives you a plain connection string — create a
project there instead and use its connection string as `DATABASE_URL` in
step 4 below.

## 2. Run the schema

Open the SQL editor for whichever database you created (Vercel's Storage tab
has a **Query** tab; Neon has its own SQL editor in its dashboard) and run
the entire contents of [`db/migrations/0001_init.sql`](./db/migrations/0001_init.sql).

You should see a new `assessments` table afterwards.

## 3. Set up accounts and a secret

- `AUTH_USERS` — one account per person, as a single-line JSON object of
  `"Name": "password"` pairs:
  ```
  {"Michael":"correcthorse1","Sarah":"correcthorse2"}
  ```
  Everyone still just types a password to sign in — there's no separate
  username field — the tool works out who it is from which password
  matched, and uses that name to pre-fill Clinician on new assessments and
  show "Signed in as ___".
- `AUTH_SECRET` — a random string used to sign the login session so it can't
  be forged. Generate one with `openssl rand -hex 32` (or any long random
  string) and never share it.

To add or remove a person later, edit the `AUTH_USERS` value and redeploy —
no code changes needed.

(Legacy: `AUTH_PASSWORD` — a single password shared by everyone, with no
name attached. Still works if you haven't set `AUTH_USERS` yet, but once
`AUTH_USERS` is set it takes over completely.)

## 4. Set environment variables

**Locally**, copy `.env.local.example` to `.env.local` and fill in:

```
DATABASE_URL=<your connection string, if not using Vercel's auto-injected POSTGRES_URL>
AUTH_USERS={"Michael":"correcthorse1","Sarah":"correcthorse2"}
AUTH_SECRET=<your random secret>
```

Then `npm install && npm run dev` and visit `http://localhost:3000`.

**On Vercel**: if you attached Vercel Postgres in step 1, `POSTGRES_URL` is
already set. Add `AUTH_USERS` and `AUTH_SECRET` under Project Settings →
Environment Variables, then redeploy.

## Done

Once those are set, `/` will show the sign-in page (just a password field)
instead of the setup notice.

---

### If you ever need to start over

Everything lives in one table (`assessments`). Dropping and re-running
`0001_init.sql` wipes all saved assessments — the tool itself (`/tool.html`)
never breaks, since it works standalone with no database at all.
