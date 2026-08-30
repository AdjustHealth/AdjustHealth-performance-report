import postgres from "postgres";

// Vercel's Postgres storage integration (and Neon directly) both auto-inject
// slightly different env var names depending on how you attached the store —
// check whichever one is actually set rather than requiring an exact name.
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  "";

export function isDbConfigured() {
  return !!connectionString;
}

// Lazily created so importing this module never throws when the app isn't
// configured yet — only the first real query attempt does.
let _sql: ReturnType<typeof postgres> | null = null;

export function sql() {
  if (!_sql) {
    if (!connectionString) {
      throw new Error("No database connection string set (DATABASE_URL / POSTGRES_URL).");
    }
    // "prefer" negotiates SSL when the server offers it (Neon/Vercel Postgres
    // both require it) but doesn't fail against a plain local Postgres that
    // has no SSL configured at all.
    _sql = postgres(connectionString, { ssl: "prefer" });
  }
  return _sql;
}
