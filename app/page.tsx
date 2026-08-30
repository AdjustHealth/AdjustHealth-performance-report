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

const ASSESSMENT_TYPES = [
  {
    key: "performance",
    type: "performance",
    tier: null as string | null,
    name: "Performance",
    desc: "The full adult battery — Injury Screen, Mobility, Power, Strength & Energy Systems, rated against senior athlete norms.",
  },
  {
    key: "youth1",
    type: "youth",
    tier: "y1",
    name: "Youth 1",
    sub: "Ages 8–12",
    desc: "Bodyweight, bands & machine-based only — no barbell testing. Includes the Youth 1 → 2 readiness screen.",
  },
  {
    key: "youth2",
    type: "youth",
    tier: "y2",
    name: "Youth 2",
    sub: "Ages 13–18",
    desc: "Same battery as Youth 1, with barbell testing progressively introduced under qualified coaching.",
  },
  {
    key: "movestrong",
    type: "movestrong",
    tier: null as string | null,
    name: "MoveStrong",
    desc: "Adjust Health's own protocol, built from the ONero & LiftMore trials.",
  },
];

function filterMatches(a: Row, filterKey: string) {
  if (filterKey === "all") return true;
  if (filterKey === "performance") return a.assess_type === "performance";
  if (filterKey === "movestrong") return a.assess_type === "movestrong";
  if (filterKey === "youth1") return a.assess_type === "youth" && a.youth_tier === "y1";
  if (filterKey === "youth2") return a.assess_type === "youth" && a.youth_tier === "y2";
  return true;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  if (!isDbConfigured() || !isAuthConfigured()) return <SetupNotice />;
  const { filter } = await searchParams;
  const activeFilter = filter || "all";

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

  const counts = {
    all: assessments.length,
    performance: assessments.filter((a) => filterMatches(a, "performance")).length,
    youth1: assessments.filter((a) => filterMatches(a, "youth1")).length,
    youth2: assessments.filter((a) => filterMatches(a, "youth2")).length,
    movestrong: assessments.filter((a) => filterMatches(a, "movestrong")).length,
  };
  const filtered = assessments.filter((a) => filterMatches(a, activeFilter));

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <div className="hd" style={{ fontSize: 30, letterSpacing: -0.5 }}>
            Adjust<span className="accent">Health</span>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            Performance Report
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/athletes" className="btn" style={{ padding: "7px 14px", fontSize: 12 }}>
            Athletes
          </Link>
          <form action={signOut}>
            <button type="submit" className="btn">
              Sign Out
            </button>
          </form>
        </div>
      </div>

      <div className="slbl" style={{ marginBottom: 14 }}>
        Start an Assessment
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 36,
        }}
      >
        {ASSESSMENT_TYPES.map((t) => (
          <a
            key={t.key}
            href={`/assessment/new?type=${t.type}${t.tier ? `&tier=${t.tier}` : ""}`}
            className="card"
            style={{
              padding: 20,
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              transition: "border-color .12s, transform .12s",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <div className="hd" style={{ fontSize: 20 }}>
                {t.name}
              </div>
              {t.sub && (
                <span className="muted" style={{ fontSize: 11 }}>
                  {t.sub}
                </span>
              )}
            </div>
            <div className="muted" style={{ fontSize: 12, lineHeight: 1.6, flex: 1 }}>
              {t.desc}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#c6f135", marginTop: 4 }}>
              Start →
            </div>
          </a>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div className="slbl" style={{ marginBottom: 0 }}>
          Saved Assessments
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            ["all", "All"],
            ["performance", "Performance"],
            ["youth1", "Youth 1"],
            ["youth2", "Youth 2"],
            ["movestrong", "MoveStrong"],
          ].map(([key, label]) => (
            <Link
              key={key}
              href={key === "all" ? "/" : `/?filter=${key}`}
              className="btn"
              style={{
                padding: "6px 12px",
                fontSize: 11,
                background: activeFilter === key ? "#c6f135" : undefined,
                color: activeFilter === key ? "#0d1117" : undefined,
                borderColor: activeFilter === key ? "#c6f135" : undefined,
              }}
            >
              {label} ({counts[key as keyof typeof counts]})
            </Link>
          ))}
        </div>
      </div>

      {error && (
        <div className="card" style={{ padding: 16, color: "#e05252", fontSize: 13 }}>
          Couldn&apos;t load assessments: {error}
        </div>
      )}

      {!error && assessments.length === 0 && (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <div className="muted">No assessments saved yet — pick a type above to start your first one.</div>
        </div>
      )}

      {!error && assessments.length > 0 && filtered.length === 0 && (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <div className="muted">No assessments of this type yet.</div>
        </div>
      )}

      {!error && filtered.length > 0 && (
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
              {filtered.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #1c2733" }}>
                  <td style={{ padding: "12px 16px" }}>
                    {/* Plain <a>, not <Link> — soft client-side nav into a page that
                        embeds a fresh iframe unreliably fails to deliver the initial
                        postMessage handshake; a full navigation always works. */}
                    <a href={`/assessment/${a.id}`} style={{ fontWeight: 600 }}>
                      {a.athlete_name}
                    </a>{" "}
                    <Link
                      href={`/athletes/${encodeURIComponent(a.athlete_name)}`}
                      className="muted"
                      style={{ fontSize: 11 }}
                      title="View history"
                    >
                      (history)
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
