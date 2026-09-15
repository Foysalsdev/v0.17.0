import { NextResponse } from "next/server";
import { createServerClient, setSessionCookies } from "@/lib/server/cloud-auth";
import { OAUTH_COOKIE, exchangeCode, googleConfigured } from "@/lib/server/google-oauth";

/**
 * GET /auth/callback — Google OAuth ফেরত আসার জায়গা (GoTrue redirect_to)।
 *
 * ১. ?code= আর gk_oauth cookie-র verifier দিয়ে PKCE exchange।
 * ২. প্রথমবার লগইন (কোনো business নেই) → নিজের নামে business + owner
 *    membership + profile বানায় (RLS: creator self-assigns owner — 0004 SQL)।
 * ৩. টোকেন gk_at/gk_rt httpOnly cookie-তে বসে → "/"-এ redirect → লগইন হয়ে যাওয়া।
 *
 * ব্যর্থ হলে /?authError=<code> → login page-এ বাংলা message দেখায়।
 */

function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const fail = (code: string) => {
    const res = NextResponse.redirect(new URL(`/?authError=${code}`, origin));
    res.cookies.set(OAUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  };

  const providerError = url.searchParams.get("error");
  if (providerError) return fail("googleFailed");

  const code = url.searchParams.get("code");
  const cookie = parseCookies(req.headers.get("cookie") ?? "")[OAUTH_COOKIE];
  let verifier = "";
  try {
    verifier = (JSON.parse(cookie ?? "{}") as { v?: string }).v ?? "";
  } catch { /* invalid cookie = no flow */ }

  if (!code || !verifier || !googleConfigured()) return fail("googleFailed");

  const exchanged = await exchangeCode(code, verifier);
  if (!exchanged) return fail("googleFailed");

  const client = createServerClient();
  const { data: sessionData, error: sessionErr } = await client.auth.setSession({
    access_token: exchanged.at,
    refresh_token: exchanged.rt,
  });
  if (sessionErr || !sessionData.session || !sessionData.user) return fail("googleFailed");

  const uid = sessionData.user.id;
  const email = sessionData.user.email ?? exchanged.email;
  const name = exchanged.name || email.split("@")[0] || "Owner";

  /* আগের অ্যাকাউন্ট? → membership আছে কিনা দেখি। */
  const { data: members } = await client.from("business_members")
    .select("business_id, role")
    .eq("user_id", uid)
    .eq("status", "active")
    .limit(1);

  if (!members?.length) {
    /* প্রথম Google লগইন — নিজের নামে business বানাই (পরে ঠিক করা যাবে)। */
    const { data: bizRow, error: bizErr } = await client.from("businesses").insert({
      name: name || "My Business",
      owner_user_id: uid,
      phone: "",
      plan: "free",
      settings: {},
    }).select("id").single();
    if (bizErr) return fail(bizErr.message.includes("row-level security") ? "policyPatchNeeded" : "googleFailed");
    const businessId = (bizRow as { id?: string } | null)?.id;
    if (!businessId) return fail("googleFailed");

    const { error: memberErr } = await client.from("business_members").insert({
      business_id: businessId,
      user_id: uid,
      role: "owner",
      status: "active",
      joined_at: new Date().toISOString(),
    });
    if (memberErr) {
      return fail(/row-level security/i.test(memberErr.message ?? "") ? "policyPatchNeeded" : "googleFailed");
    }

    await client.from("profiles").upsert({
      id: uid,
      full_name: name,
      phone: "",
      email,
      default_business_id: businessId,
    });
  }

  const res = NextResponse.redirect(new URL("/", origin));
  const session = sessionData.session;
  setSessionCookies(res, {
    at: session.access_token,
    rt: session.refresh_token,
    expiresAt: new Date((session.expires_at ?? 0) * 1000),
  });
  res.cookies.set(OAUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
