"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SetupNotice from "@/components/SetupNotice";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return <SetupNotice />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <form onSubmit={onSubmit} className="card" style={{ width: 360, padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div className="hd" style={{ fontSize: 28, letterSpacing: -0.5 }}>
            Adjust<span className="accent">Health</span>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Performance Report — sign in
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="muted" style={{ fontSize: 11, display: "block", marginBottom: 6 }}>
            Email
          </label>
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label className="muted" style={{ fontSize: 11, display: "block", marginBottom: 6 }}>
            Password
          </label>
          <input
            className="input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && (
          <div style={{ color: "#e05252", fontSize: 12, marginBottom: 14 }}>{error}</div>
        )}
        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
