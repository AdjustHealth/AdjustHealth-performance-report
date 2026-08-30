import { login } from "@/lib/actions";
import { isAuthConfigured } from "@/lib/auth";
import SetupNotice from "@/components/SetupNotice";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!isAuthConfigured()) return <SetupNotice />;
  const { error } = await searchParams;

  async function handleLogin(formData: FormData) {
    "use server";
    const password = String(formData.get("password") || "");
    const result = await login(password);
    if (result && "error" in result) {
      const { redirect } = await import("next/navigation");
      redirect("/login?error=1");
    }
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
      <form action={handleLogin} className="card" style={{ width: 360, padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div className="hd" style={{ fontSize: 28, letterSpacing: -0.5 }}>
            Adjust<span className="accent">Health</span>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Performance Report — sign in
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label className="muted" style={{ fontSize: 11, display: "block", marginBottom: 6 }}>
            Password
          </label>
          <input className="input" type="password" name="password" required autoFocus autoComplete="current-password" />
        </div>
        {error && (
          <div style={{ color: "#e05252", fontSize: 12, marginBottom: 14 }}>Incorrect password.</div>
        )}
        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
          Sign In
        </button>
      </form>
    </div>
  );
}
