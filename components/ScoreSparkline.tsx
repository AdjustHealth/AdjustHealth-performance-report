type Point = { date: string; score: number };

export default function ScoreSparkline({ points }: { points: Point[] }) {
  const W = 100;
  const H = 100;
  const padX = 4;
  const padY = 10;

  const scored = points.filter((p) => p.score != null);
  if (scored.length < 2) {
    return (
      <div
        className="muted"
        style={{ fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", height: 90 }}
      >
        Needs 2+ scored assessments for a trend
      </div>
    );
  }

  const scores = scored.map((p) => p.score);
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 10);
  const range = max - min || 1;

  const coords = scored.map((p, i) => {
    const x = padX + (i / (scored.length - 1)) * (W - padX * 2);
    const y = H - padY - ((p.score - min) / range) * (H - padY * 2);
    return { x, y, score: p.score };
  });

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1];
  const first = coords[0];
  const trendUp = last.score >= first.score;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 90 }}>
      <path d={path} fill="none" stroke={trendUp ? "#4cdb7a" : "#e05252"} strokeWidth={2} />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={i === coords.length - 1 ? 2.6 : 1.6} fill={trendUp ? "#4cdb7a" : "#e05252"} />
      ))}
    </svg>
  );
}
