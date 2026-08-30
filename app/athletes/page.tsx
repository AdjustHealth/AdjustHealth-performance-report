import Link from "next/link";
import { sql, isDbConfigured } from "@/lib/db";
import { isAuthConfigured } from "@/lib/auth";
import SetupNotice from "@/components/SetupNotice";

const TYPE_LABEL: Record<string, string> = {
  performance: "Performance",
  youth: "Youth Performance",
  movestrong: "MoveStrong",
};

type Row = {
  athlete_name: string;
  count: number;
  first_date: string | null;
  last_date: string | null;
  latest_score: number | null;
  latest_type: string;
  latest_youth_tier: string | null;
  prev_score: number | null;
};

export default async function AthletesPage() {
  if (!isDbConfigured() || !isAuthConfigured()) return <SetupNotice />;

  let rows: Row[] = [];
  let error: string | null = null;
  try {
    // Rank each athlete's own assessments newest-first so we can pull out the
    // latest score (for display) and the one before it (to show a trend arrow)
    // without a second round trip.
    rows = (await sql()`
      with ranked as (
        select
          athlete_name,
          assess_type,
          youth_tier,
          assessment_date::text as assessment_date,
          overall_score::float8 as overall_score,
          row_number() over (partition by lower(athlete_name) order by assessment_date desc nulls last, created_at desc) as rn
        from assessments
      )
      select
        min(athlete_name) as athlete_name,
        count(*)::int as count,
        min(assessment_date) as first_date,
        max(assessment_date) as last_date,
        max(overall_score) filter (where rn = 1) as latest_score,
        max(assess_type) filter (where rn = 1) as latest_type,
        max(youth_tier) filter (where rn = 1) as latest_youth_tier,
        max(overall_score) filter (where rn = 2) as prev_score
      from ranked
      group by lower(athlete_name)
      order by max(assessment_date) desc nulls last
    `) as unknown as Row[];
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <div className="hd" style={{ fontSize: 30, letterSpacing: -0.5 }}>
            Athletes
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            Every athlete with a saved assessment, grouped by name
          </div>
        </div>
        <Link href="/" className="btn" style={{ padding: "7px 14px", fontSize: 12 }}>
          ← All Assessments
        </Link>
      </div>

      {error && (
        <div className="card" style={{ padding: 16, color: "#e05252", fontSize: 13 }}>
          Couldn&apos;t load athletes: {error}
        </div>
      )}

      {!error && rows.length === 0 && (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <div className="muted">No athletes yet — save an assessment to see them show up here.</div>
        </div>
      )}

      {!error && rows.length > 0 && (
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #1c2733" }}>
                {["Athlete", "Assessments", "Last Type", "Last Seen", "Latest Score", ""].map((h) => (
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
              {rows.map((a) => {
                const delta =
                  a.latest_score != null && a.prev_score != null
                    ? Math.round((a.latest_score - a.prev_score) * 10) / 10
                    : null;
                return (
                  <tr key={a.athlete_name} style={{ borderBottom: "1px solid #1c2733" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <Link href={`/athletes/${encodeURIComponent(a.athlete_name)}`} style={{ fontWeight: 600 }}>
                        {a.athlete_name}
                      </Link>
                    </td>
                    <td className="muted" style={{ padding: "12px 16px" }}>
                      {a.count}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {TYPE_LABEL[a.latest_type] ?? a.latest_type}
                      {a.latest_youth_tier && (
                        <span className="muted"> · {a.latest_youth_tier === "y1" ? "Youth 1" : "Youth 2"}</span>
                      )}
                    </td>
                    <td className="muted" style={{ padding: "12px 16px" }}>
                      {a.last_date || "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {a.latest_score != null ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <span
                            className={`rb ${a.latest_score >= 7.5 ? "rg" : a.latest_score >= 5 ? "ra" : "rp"}`}
                          >
                            {a.latest_score.toFixed(1)}
                          </span>
                          {delta != null && delta !== 0 && (
                            <span
                              className="muted"
                              style={{ fontSize: 11, color: delta > 0 ? "#4cdb7a" : "#e05252" }}
                            >
                              {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="rb rn">—</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <Link
                        href={`/athletes/${encodeURIComponent(a.athlete_name)}`}
                        className="btn"
                        style={{ padding: "6px 12px", fontSize: 11 }}
                      >
                        History →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
