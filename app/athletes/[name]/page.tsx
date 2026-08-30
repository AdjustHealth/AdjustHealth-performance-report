import Link from "next/link";
import { notFound } from "next/navigation";
import { sql, isDbConfigured } from "@/lib/db";
import { isAuthConfigured } from "@/lib/auth";
import SetupNotice from "@/components/SetupNotice";
import ScoreSparkline from "@/components/ScoreSparkline";

const TYPE_LABEL: Record<string, string> = {
  performance: "Performance",
  youth: "Youth Performance",
  movestrong: "MoveStrong",
};

type Row = {
  id: string;
  assess_type: string;
  youth_tier: string | null;
  clinician: string | null;
  assessment_date: string | null;
  overall_score: number | null;
  athlete_name: string;
};

export default async function AthleteDetailPage({ params }: { params: Promise<{ name: string }> }) {
  if (!isDbConfigured() || !isAuthConfigured()) return <SetupNotice />;
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  let rows: Row[] = [];
  let error: string | null = null;
  try {
    rows = (await sql()`
      select id, athlete_name, assess_type, youth_tier, clinician,
        assessment_date::text as assessment_date, overall_score::float8 as overall_score
      from assessments
      where lower(athlete_name) = lower(${decoded})
      order by assessment_date asc nulls last, created_at asc
    `) as unknown as Row[];
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  if (!error && rows.length === 0) notFound();

  const displayName = rows[0]?.athlete_name || decoded;
  const scored = rows.filter((r) => r.overall_score != null);
  const first = scored[0];
  const latest = scored[scored.length - 1];
  const delta = first && latest && first !== latest ? Math.round((latest.overall_score! - first.overall_score!) * 10) / 10 : null;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <div className="hd" style={{ fontSize: 30, letterSpacing: -0.5 }}>
            {displayName}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            {rows.length} saved assessment{rows.length === 1 ? "" : "s"}
            {rows[0]?.assessment_date && rows[rows.length - 1]?.assessment_date
              ? ` · ${rows[0].assessment_date} → ${rows[rows.length - 1].assessment_date}`
              : ""}
          </div>
        </div>
        <Link href="/athletes" className="btn" style={{ padding: "7px 14px", fontSize: 12 }}>
          ← All Athletes
        </Link>
      </div>

      {error && (
        <div className="card" style={{ padding: 16, color: "#e05252", fontSize: 13 }}>
          Couldn&apos;t load history: {error}
        </div>
      )}

      {!error && (
        <>
          <div
            className="card"
            style={{
              padding: 24,
              marginBottom: 24,
              display: "grid",
              gridTemplateColumns: "1fr 200px",
              gap: 24,
              alignItems: "center",
            }}
          >
            <div>
              <div className="slbl" style={{ fontSize: 11, color: "#7a8fa6", marginBottom: 8 }}>
                Overall Score Trend
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                {latest && (
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 44,
                      fontWeight: 900,
                      color: latest.overall_score! >= 7.5 ? "#4cdb7a" : latest.overall_score! >= 5 ? "#f5a623" : "#e05252",
                    }}
                  >
                    {latest.overall_score!.toFixed(1)}
                  </span>
                )}
                {delta != null && (
                  <span style={{ fontSize: 14, fontWeight: 700, color: delta >= 0 ? "#4cdb7a" : "#e05252" }}>
                    {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)} since first assessment
                  </span>
                )}
                {!latest && <span className="muted">No scored assessments yet.</span>}
              </div>
            </div>
            <ScoreSparkline
              points={scored.map((r) => ({ date: r.assessment_date || "", score: r.overall_score! }))}
            />
          </div>

          <div className="slbl" style={{ marginBottom: 14 }}>
            Assessment History
          </div>
          <div className="card" style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #1c2733" }}>
                  {["Date", "Type", "Clinician", "Overall", ""].map((h) => (
                    <th
                      key={h}
                      className="muted"
                      style={{ padding: "12px 16px", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...rows].reverse().map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid #1c2733" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600 }}>{a.assessment_date || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {TYPE_LABEL[a.assess_type] ?? a.assess_type}
                      {a.youth_tier && <span className="muted"> · {a.youth_tier === "y1" ? "Youth 1" : "Youth 2"}</span>}
                    </td>
                    <td className="muted" style={{ padding: "12px 16px" }}>
                      {a.clinician || "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {a.overall_score != null ? (
                        <span className={`rb ${a.overall_score >= 7.5 ? "rg" : a.overall_score >= 5 ? "ra" : "rp"}`}>
                          {a.overall_score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="rb rn">—</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      {/* Plain <a>, not <Link> — see note on the home page:
                          soft nav into a page that embeds a fresh iframe
                          unreliably fails to deliver the initial postMessage
                          handshake; a full navigation always works. */}
                      <a href={`/assessment/${a.id}`} className="btn" style={{ padding: "6px 12px", fontSize: 11 }}>
                        Open →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
