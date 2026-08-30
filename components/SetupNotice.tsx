export default function SetupNotice() {
  return (
    <div style={{ maxWidth: 640, margin: "80px auto", padding: "0 24px" }}>
      <div className="card" style={{ padding: 32 }}>
        <div className="hd" style={{ fontSize: 22, marginBottom: 10 }}>
          Not configured yet
        </div>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.7 }}>
          This app needs a Postgres database (for saved assessments) and a shared password (for
          sign-in). Attach a free Postgres store to this Vercel project under the project&apos;s{" "}
          <strong>Storage</strong> tab, run the SQL in{" "}
          <code>supabase/migrations/0001_init.sql</code> against it, then set{" "}
          <code>DATABASE_URL</code>, <code>AUTH_PASSWORD</code>, and <code>AUTH_SECRET</code> as
          environment variables — locally in <code>.env.local</code>, and in Vercel under Project
          Settings → Environment Variables. See <code>SETUP.md</code> for the full walkthrough.
        </p>
      </div>
    </div>
  );
}
