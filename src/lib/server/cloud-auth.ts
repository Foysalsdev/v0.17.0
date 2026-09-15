/**
 * Supabase Auth — the CLOUD-mode login/session layer.
 *
 * - Phone-style synthetic emails: 01711223344 → 01711223344@<GK_EMAIL_DOMAIN>.
 *   Domain is env-configurable: new Supabase projects validate signup emails
 *   against DNS (NXDOMAIN domains like the unregistered garirkhata.app are
 *   rejected with "email_address_invalid"), so until the owner registers the
 *   real domain, a resolvable domain (default: supabase.io, as used in
 *   Supabase's own docs examples) is used. No confirmation emails are sent —
 *   the project has "Confirm email sign-ups" disabled.
 * - Session = Supabase access + refresh tokens in httpOnly cookies (gk_at/gk_rt).
 * - Each request builds a fresh server client and setSession() — supabase-js
 *   auto-refreshes when the access token expired; the rotated tokens are
 *   written back onto the response by the route wrapper.
 * - No service/secret key anywhere: every query runs under RLS with the
 *   signed-in user's own token (master prompt §39).
 */
import type { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SessionUser } from "./auth";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const AT_COOKIE = "gk_at";
export const RT_COOKIE = "gk_rt";
/** Synthetic-email domain. MUST be DNS-resolvable (new Supabase validates it).
 *  LEGACY domain: 0003-এর seed ও পুরনো team-account-এর ইমেইল @garirkhata.app
 *  ছিল — লগইনে ওটাও চেষ্টা করা হয় (login-এ domain validation নেই)। */
const EMAIL_DOMAIN = process.env.GK_EMAIL_DOMAIN ?? "supabase.io";
const LEGACY_EMAIL_DOMAIN = process.env.GK_LEGACY_EMAIL_DOMAIN ?? "garirkhata.app";
const SESSION_DAYS = 30;

export function sbEmail(phone: string): string {
  return `${phone.replace(/\D/g, "")}@${EMAIL_DOMAIN}`;
}

export function createServerClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/** business membership + profile + driver link for an auth uid (RLS-scoped). */
async function loadSessionUser(client: SupabaseClient, uid: string): Promise<SessionUser | null> {
  const { data: members, error } = await client.from("business_members")
    .select("business_id, role")
    .eq("user_id", uid)
    .eq("status", "active")
    .limit(1);
  if (error || !members?.length) return null;
  const { business_id: businessId, role } = members[0] as { business_id: string; role: string };

  const { data: profile } = await client.from("profiles").select("full_name, phone").eq("id", uid).maybeSingle();

  let driverId: string | null = null;
  if (role === "driver") {
    const { data: driver } = await client.from("drivers").select("id")
      .eq("user_id", uid).eq("business_id", businessId).limit(1);
    driverId = (driver?.[0] as { id?: string } | undefined)?.id ?? null;
  }

  return {
    id: uid,
    name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    role,
    businessId,
    driverId,
  };
}

export interface CloudAuth {
  client: SupabaseClient;
  user: SessionUser;
  rotated: { at: string; rt: string; expiresAt: Date } | null;
}

/** Resolve the request's cloud session (cookies → user + scoped client). */
export async function resolveCloudUser(req: Request): Promise<CloudAuth | null> {
  const basic = await resolveCloudAuthOnly(req);
  if (!basic) return null;
  const user = await loadSessionUser(basic.client, basic.uid);
  if (!user) return null;
  return { client: basic.client, user, rotated: basic.rotated };
}

/** Session WITHOUT the business-membership requirement — password reset
 *  flow-এর জন্য (memberless ইউজারও নিজের পাসওয়ার্ড বদলাতে পারে)। */
export async function resolveCloudAuthOnly(
  req: Request
): Promise<{ client: SupabaseClient; uid: string; email: string; rotated: { at: string; rt: string; expiresAt: Date } | null } | null> {
  const cookies = parseCookies(req.headers.get("cookie") ?? "");
  const at = cookies[AT_COOKIE];
  const rt = cookies[RT_COOKIE];
  if (!at || !rt) return null;

  const client = createServerClient();
  const { data, error } = await client.auth.setSession({ access_token: at, refresh_token: rt });
  if (error || !data.session || !data.user) return null;

  const session = data.session;
  const rotated = session.access_token !== at || session.refresh_token !== rt
    ? { at: session.access_token, rt: session.refresh_token, expiresAt: new Date((session.expires_at ?? 0) * 1000) }
    : null;
  return { client, uid: data.user.id, email: data.user.email ?? "", rotated };
}

export interface SignInSession {
  at: string;
  rt: string;
  expiresAt: Date;
}

/** Auth-only sign-in — NO business-membership requirement.
 *  Admin panel (v1.0)-এর জন্য: পাসওয়ার্ড মিললেই সেশন; প্ল্যাটফর্ম-অ্যাডমিন
 *  কিনা তা অ্যাডমিন-লগইন রাউট আলাদাভাবে যাচাই করে।
 *
 * Identifier rules (cloudLogin-এর সাথে এক):
 *  - "x@y.z" → real email account → direct password grant.
 *  - phone → synthetic `phone@domain` (legacy/team accounts).
 *    যদি সেই ফোনে email-অ্যাকাউন্ট থাকে (signup-এ email দেওয়া), synthetic
 *    ট্রাই ব্যর্থ হলে profiles.phone দেখে আসল email খুঁজে ট্রাই করে।
 */
export async function cloudSignInOnly(
  identifier: string,
  password: string
): Promise<
  | { ok: false; error: string; status: number }
  | { ok: true; client: SupabaseClient; uid: string; email: string; session: SignInSession }
> {
  const client = createServerClient();
  const isEmail = identifier.includes("@");

  const attempt = async (email: string) => {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    return error ? null : data;
  };

  let authData = null as Awaited<ReturnType<typeof attempt>>;
  let email = "";

  if (isEmail) {
    email = identifier.toLowerCase();
    authData = await attempt(email);
  } else {
    email = sbEmail(identifier);
    authData = await attempt(email);
    if (!authData) {
      // legacy synthetic domain (0003 seed + পুরনো account) — login-এ চলে।
      email = `${identifier}@${LEGACY_EMAIL_DOMAIN}`;
      authData = await attempt(email);
    }
    if (!authData) {
      // phone-অ্যাকাউন্ট নয় → হয়তো signup-এ email দিয়েছিল — আসল email বের করি।
      // v0.12 RLS হার্ডেনিং-এর পরে profiles anon-read বন্ধ, তাই পথ-১: ছোট RPC
      // (profile_email_by_phone)। পথ-২ (fallback): SQL এখনো চালানো হয়নি এমন
      // পুরনো DB-তে profiles তখনও public-read — সেক্ষেত্রে টেবিল থেকেই পাওয়া যায়।
      const probe = createServerClient();
      let realEmail: string | null = null;
      try {
        const { data: rpcEmail } = await probe.rpc("profile_email_by_phone", { p_phone: identifier });
        if (typeof rpcEmail === "string" && rpcEmail) realEmail = rpcEmail;
      } catch {
        /* RPC নেই (SQL এখনো চালানো হয়নি) → fallback-এ যাই */
      }
      if (!realEmail) {
        const { data: prof } = await probe.from("profiles").select("email").eq("phone", identifier).limit(1);
        realEmail = (prof?.[0] as { email?: string } | undefined)?.email ?? null;
      }
      if (realEmail) {
        email = realEmail;
        authData = await attempt(realEmail);
      }
    }
  }

  if (!authData?.user || !authData?.session) {
    return { ok: false, error: "loginFailed", status: 401 };
  }
  const s = authData.session;
  return {
    ok: true,
    client,
    uid: authData.user.id,
    email: authData.user.email ?? email,
    session: {
      at: s.access_token,
      rt: s.refresh_token,
      expiresAt: new Date((s.expires_at ?? 0) * 1000),
    },
  };
}

/** Login with phone-or-email + password via Supabase Auth (app users -
 *  auth + active business-membership both required).
 */
export async function cloudLogin(
  identifier: string,
  password: string
): Promise<{ ok: false; error: string; status: number } | { ok: true; client: SupabaseClient; user: SessionUser }> {
  const signIn = await cloudSignInOnly(identifier, password);
  if (!signIn.ok) return signIn;
  const user = await loadSessionUser(signIn.client, signIn.uid);
  if (!user) return { ok: false, error: "accountNoBusiness", status: 403 };
  return { ok: true, client: signIn.client, user };
}

export async function cloudLogout(req: Request): Promise<void> {
  const cookies = parseCookies(req.headers.get("cookie") ?? "");
  const at = cookies[AT_COOKIE];
  const rt = cookies[RT_COOKIE];
  if (!at || !rt) return;
  try {
    const client = createServerClient();
    await client.auth.setSession({ access_token: at, refresh_token: rt });
    await client.auth.signOut({ scope: "local" });
  } catch {
    /* token already dead — clearing the cookies is enough */
  }
}

/* ---------- response cookie helpers ---------- */

export function setSessionCookies(res: NextResponse, session: { at: string; rt: string; expiresAt: Date }) {
  const base = { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" } as const;
  res.cookies.set(AT_COOKIE, session.at, { ...base, expires: session.expiresAt });
  res.cookies.set(RT_COOKIE, session.rt, { ...base, expires: new Date(Date.now() + SESSION_DAYS * 86400000) });
}

export function clearSessionCookies(res: NextResponse) {
  const base = { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 } as const;
  res.cookies.set(AT_COOKIE, "", base);
  res.cookies.set(RT_COOKIE, "", base);
}
