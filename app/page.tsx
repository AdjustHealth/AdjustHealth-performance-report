import Link from "next/link";
import { sql, isDbConfigured } from "@/lib/db";
import { isAuthConfigured } from "@/lib/auth";
import { signOut } from "@/lib/actions";
import DeleteAssessmentButton from "@/components/DeleteAssessmentButton";
import SetupNotice from "@/components/SetupNotice";

const TYPE_LABEL: Record<string, string> = {
  performance: "Performance",
  youth: "Youth Performance",
  movestrong: "MoveStrong",
};

type Row = {
  id: string;
  athlete_name: string;
  assess_type: string;
  youth_tier: string | null;
  clinician: string | null;
  assessment_date: string | null;
  overall_score: number | null;
};

export default async function HomePage() {
  if (!isDbConfigured() || !isAuthConfigured()) return <SetupNotice />;

  let assessments: Row[] = [];
  let error: string | null = null;
  try {
    assessments = (await sql()`
      select id, athlete_name, assess_type, youth_tier, clinician, assessment_date::text as assessment_date, overall_score::float8 as overall_score
      from assessments
      order by created_at desc
    `) as unknown as Row[];
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div className="hd" style={{ fontSize: 30, letterSpacing: -0.5 }}>
            Adjust<span className="accent">Health</span>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            Performance Report — saved assessments
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/assessment/new" className="btn btn-primary">
            + New Assessment
          </Link>
          <form action={signOut}>
            <button type="submit" className="btn">
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="card" style={{ padding: 16, color: "#e05252", fontSize: 13 }}>
          Couldn&apos;t load assessments: {error}
        </div>
      )}

      {!error && assessments.length === 0 && (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <div className="muted" style={{ marginBottom: 14 }}>
            No assessments saved yet.
          </div>
          <Link href="/assessment/new" className="btn btn-primary">
            Start your first assessment
          </Link>
        </div>
      )}

      {!error && assessments.length > 0 && (
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #1c2733" }}>
                {["Athlete", "Type", "Clinician", "Date", "Overall", ""].map((h) => (
                  <th
                    key={h}
                    className="muted"
                    style={{
                      padding: "12px 16px",
                      fontSize: 10,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #1c2733" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <Link href={`/assessment/${a.id}`} style={{ fontWeight: 600 }}>
                      {a.athlete_name}
                    </Link>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {TYPE_LABEL[a.assess_type] ?? a.assess_type}
                    {a.youth_tier && (
                      <span className="muted"> · {a.youth_tier === "y1" ? "Youth 1" : "Youth 2"}</span>
                    )}
                  </td>
                  <td className="muted" style={{ padding: "12px 16px" }}>
                    {a.clinician || "—"}
                  </td>
                  <td className="muted" style={{ padding: "12px 16px" }}>
                    {a.assessment_date || "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {a.overall_score != null ? (
                      <span
                        className={`rb ${a.overall_score >= 7.5 ? "rg" : a.overall_score >= 5 ? "ra" : "rp"}`}
                      >
                        {a.overall_score.toFixed(1)}
                      </span>
                    ) : (
                      <span className="rb rn">—</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <DeleteAssessmentButton id={a.id} athleteName={a.athlete_name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
