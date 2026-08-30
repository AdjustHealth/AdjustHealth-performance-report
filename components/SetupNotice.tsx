export default function SetupNotice() {
  return (
    <div style={{ maxWidth: 640, margin: "80px auto", padding: "0 24px" }}>
      <div className="card" style={{ padding: 32 }}>
        <div className="hd" style={{ fontSize: 22, marginBottom: 10 }}>
          Supabase isn&apos;t configured yet
        </div>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.7 }}>
          This app needs a Supabase project to store saved assessments. Create one at{" "}
          <a href="https://supabase.com/dashboard" style={{ color: "#c6f135" }}>
            supabase.com/dashboard
          </a>
          , run the SQL in <code>supabase/migrations/0001_init.sql</code> in its SQL editor, then set{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (from
          Project Settings → API) as environment variables — locally in <code>.env.local</code>, and
          in Vercel under Project Settings → Environment Variables. See <code>SETUP.md</code> for the
          full walkthrough.
        </p>
      </div>
    </div>
  );
}
