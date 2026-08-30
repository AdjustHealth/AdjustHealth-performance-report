// Single shared-password auth for a one-clinician internal tool — no user
// accounts, no third-party auth service. A signed, expiring cookie proves the
// visitor once entered the correct password; nothing more.
//
// Uses the Web Crypto API (available in both the Edge runtime, where
// proxy.ts runs, and Node.js 19+, where Server Actions run) rather than
// Node's `crypto` module, so the same code works in both places.

export const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function isAuthConfigured() {
  return !!process.env.AUTH_PASSWORD && !!process.env.AUTH_SECRET;
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

export async function createSessionToken(): Promise<string> {
  const secret = process.env.AUTH_SECRET!;
  const expiry = Date.now() + SESSION_MAX_AGE_MS;
  const sig = await hmac(secret, String(expiry));
  return `${expiry}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || !isAuthConfigured()) return false;
  const [expiryStr, sig] = token.split(".");
  if (!expiryStr || !sig) return false;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  const expectedSig = await hmac(process.env.AUTH_SECRET!, expiryStr);
  return timingSafeEqual(sig, expectedSig);
}

export const SESSION_COOKIE_MAX_AGE_SECONDS = Math.floor(SESSION_MAX_AGE_MS / 1000);
