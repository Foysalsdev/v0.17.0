/**
 * Google OAuth (Supabase / GoTrue) — সম্পূর্ণ server-side PKCE flow।
 *
 * ক্লায়েন্টে supabase-js লাগে না — browser শুধু redirect করে:
 *   1. GET /api/auth/google/start → code_verifier বানিয়ে httpOnly cookie-তে
 *      রেখে GoTrue /authorize URL-এ 302 (PKCE S256 challenge সহ)।
 *   2. Google → GET /auth/callback?code=… → আমরা cookie-র verifier দিয়ে
 *      POST /auth/v1/token?grant_type=pkce — response-এ access+refresh token।
 *   3. টোকেন httpOnly session cookie (gk_at/gk_rt) হয়ে যায় → straight in।
 *
 * CSRF: verifier-cookie নিজেই binding — attacker-এর code দিয়ে victim-এর
 * verifier মিলবে না → exchange fail। Cookie না থাকলেই callback প্রত্যাখ্যাত।
 *
 * Owner-এর একবার সেটআপ লাগে (Supabase ড্যাশবোর্ড):
 *   - Authentication → Providers → Google (client ID + secret)
 *   - Authentication → URL Configuration → Redirect URLs: <origin>/auth/callback
 */
import * as crypto from "node:crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const OAUTH_COOKIE = "gk_oauth";

export function googleConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

/** আসল public origin — গেটওয়ে/প্রক্সির পেছনে ঠিক host ধরার জন্য। */
export function siteOrigin(req: Request): string {
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  if (envOrigin) return envOrigin.replace(/\/$/, "");
  const h = req.headers;
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim();
  if (!host) return "http://localhost:3000";
  const proto = (h.get("x-forwarded-proto") ?? "").split(",")[0].trim()
    || (host.startsWith("localhost") || host.startsWith("127.") || host.includes(":3000") ? "http" : "https");
  return `${proto}://${host}`;
}

/** PKCE code_verifier — 43-char base64url (RFC 7636 অনুযায়ী 43–128)। */
export function newCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/** S256 code_challenge = BASE64URL(SHA256(verifier))। */
export function s256(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

/** GoTrue authorize URL — supabase-js যেভাবে বানায় ঠিক সেভাবেই। */
export function authorizeUrl(origin: string, verifier: string): string {
  const params = new URLSearchParams({
    provider: "google",
    redirect_to: `${origin}/auth/callback`,
    code_challenge: s256(verifier),
    code_challenge_method: "s256",
  });
  return `${SUPABASE_URL}/auth/v1/authorize?${params.toString()}`;
}

/** PKCE exchange — GoTrue /auth/v1/token?grant_type=pkce। */
export async function exchangeCode(
  authCode: string,
  verifier: string
): Promise<{ at: string; rt: string; expiresAt: Date; uid: string; email: string; name: string } | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ auth_code: authCode, code_verifier: verifier }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
      user?: { id?: string; email?: string; user_metadata?: Record<string, unknown> };
    };
    if (!json.access_token || !json.refresh_token || !json.user?.id) return null;
    const meta = json.user.user_metadata ?? {};
    const name = String(meta.full_name ?? meta.name ?? json.user.email?.split("@")[0] ?? "");
    return {
      at: json.access_token,
      rt: json.refresh_token,
      expiresAt: new Date((json.expires_at ?? Math.floor(Date.now() / 1000) + 3600) * 1000),
      uid: json.user.id,
      email: json.user.email ?? "",
      name,
    };
  } catch {
    return null;
  }
}
