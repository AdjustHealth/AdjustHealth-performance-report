// Named-account auth for a small internal tool — no user database, no
// third-party auth service. Accounts live in one env var as name:password
// pairs; a signed, expiring cookie proves which name entered the correct
// password. Falls back to the original single shared password (as an
// account named "Team") if AUTH_USERS isn't set, so an existing deployment
// keeps working until someone opts into named accounts.
//
// Uses the Web Crypto API (available in both the Edge runtime, where
// proxy.ts runs, and Node.js 19+, where Server Actions run) rather than
// Node's `crypto` module, so the same code works in both places.

export const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function parseUsers(): Record<string, string> {
  const raw = process.env.AUTH_USERS;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
    } catch {
      // Malformed AUTH_USERS — fall through to the legacy single-password path
      // below rather than locking everyone out over a JSON typo.
    }
  }
  if (process.env.AUTH_PASSWORD) return { Team: process.env.AUTH_PASSWORD };
  return {};
}

export function isAuthConfigured() {
  return Object.keys(parseUsers()).length > 0 && !!process.env.AUTH_SECRET;
}

function bufToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return bufToHex(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

// Checks a password against every configured account and returns the name it
// matched — the login form only ever asks for a password, since that alone
// already identifies which person it is.
export function findUserByPassword(password: string): string | null {
  const users = parseUsers();
  for (const [name, pw] of Object.entries(users)) {
    if (typeof pw === "string" && timingSafeEqual(password, pw)) return name;
  }
  return null;
}

export async function createSessionToken(name: string): Promise<string> {
  const secret = process.env.AUTH_SECRET!;
  const expiry = Date.now() + SESSION_MAX_AGE_MS;
  const encodedName = encodeURIComponent(name);
  const payload = `${expiry}.${encodedName}`;
  const sig = await hmac(secret, payload);
  return `${payload}.${sig}`;
}

// Returns the signed-in user's name, or null if the token is missing,
// malformed, expired, or fails signature verification.
export async function verifySessionToken(token: string | undefined | null): Promise<string | null> {
  if (!token || !isAuthConfigured()) return null;
  const firstDot = token.indexOf(".");
  const lastDot = token.lastIndexOf(".");
  if (firstDot === -1 || lastDot === -1 || firstDot === lastDot) return null;
  const expiryStr = token.slice(0, firstDot);
  const encodedName = token.slice(firstDot + 1, lastDot);
  const sig = token.slice(lastDot + 1);
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return null;
  const payload = `${expiryStr}.${encodedName}`;
  const expectedSig = await hmac(process.env.AUTH_SECRET!, payload);
  if (!timingSafeEqual(sig, expectedSig)) return null;
  try {
    return decodeURIComponent(encodedName) || null;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_MAX_AGE_SECONDS = Math.floor(SESSION_MAX_AGE_MS / 1000);
