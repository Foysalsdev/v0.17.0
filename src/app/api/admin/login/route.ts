import { NextResponse } from "next/server";
import { str } from "@/lib/server/route";
import { cloudSignInOnly, setSessionCookies } from "@/lib/server/cloud-auth";
import {
  adminKeyConfigured,
  verifyAdminKey,
  issueAdminToken,
  setAdminCookie,
  rateLimitAdmin,
  recordAdminFailure,
  clearAdminFailures,
} from "@/lib/server/admin";

/* ------------------------------------------------------------------ *
 * POST /api/admin/login — /admin আনলক। দুই মোড:
 *
 *  1) { mode: "account", phone, password }  ← REAL (v1.0)
 *     নিজের Supabase অ্যাকাউন্ট দিয়ে লগইন; অ্যাকাউন্টে
 *     profiles.is_platform_admin = true থাকতে হবে (SQL-এর F সেকশন)।
 *     সফল হলে: অ্যাডমিন-কুকি + অ্যাপ-সেশন-কুকি (gk_at/gk_rt) — দুটোই
 *     httpOnly; overview সেশন-টোকেন দিয়ে platform_admin_overview()
 *     RPC ডাকে → আসল ক্লাউড ডেটা, service key ছাড়াই।
 *
 *  2) { key } (বা { mode: "key", key }) ← fallback (v0.16)
 *     GK_ADMIN_KEY shared key — সার্ভার env / Cloudflare secret।
 *
 * দুই মোডেই 5 ভুল চেষ্টা / 10 মিনিট / IP → 429।
 * ------------------------------------------------------------------ */

interface ProfileFlagRow { is_platform_admin: boolean | null }

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();

    const limit = rateLimitAdmin(ip);
    if (!limit.allowed) {
      return NextResponse.json(
        { ok: false, error: "tooManyAttempts", retryAfterSec: limit.retryAfterSec },
        { status: 429 }
      );
    }

    let body: Record<string, unknown> = {};
    try { body = (await req.json()) as Record<string, unknown>; } catch { /* empty */ }
    const mode = str(body.mode) || (str(body.phone) ? "account" : "key");

    /* ---------- mode 1: account (phone/email + password) ---------- */
    if (mode === "account") {
      const phone = str(body.phone).trim();
      const password = str(body.password);
      if (!phone || !password) {
        return NextResponse.json({ ok: false, error: "fillAll" }, { status: 400 });
      }

      const signIn = await cloudSignInOnly(phone, password);
      if (!signIn.ok) {
        recordAdminFailure(ip);
        // loginFailed (401) — রাউট-লেভেল ম্যাপিং না করে সোজা পাঠাই
        return NextResponse.json(
          { ok: false, error: signIn.error === "loginFailed" ? "adminLoginFailed" : signIn.error },
          { status: signIn.status }
        );
      }

      // প্ল্যাটফর্ম-অ্যাডমিন কিনা — নিজের প্রোফাইল রো (RLS self-read)।
      const { data: prof, error: profErr } = await signIn.client
        .from("profiles")
        .select("is_platform_admin")
        .eq("id", signIn.uid)
        .maybeSingle<ProfileFlagRow>();

      if (profErr) {
        // কলামই নেই = SQL এখনো চালানো হয়নি
        recordAdminFailure(ip);
        const code = String((profErr as { code?: string }).code ?? "");
        const missing =
          code === "PGRST204" || code === "42703" ||
          String(profErr.message ?? "").includes("does not exist") ||
          String(profErr.message ?? "").includes("Could not find column");
        return NextResponse.json(
          missing
            ? { ok: false, error: "adminSetupMissing", hint: "v1.0 SQL · F" }
            : { ok: false, error: "serverError" },
          { status: missing ? 409 : 500 }
        );
      }
      if (prof?.is_platform_admin !== true) {
        recordAdminFailure(ip);
        return NextResponse.json({ ok: false, error: "adminNotPlatformOwner" }, { status: 403 });
      }

      clearAdminFailures(ip);
      const { token, expiresAt } = issueAdminToken();
      const res = NextResponse.json({ ok: true, mode: "account" });
      setAdminCookie(res, token, expiresAt);
      setSessionCookies(res, signIn.session);
      return res;
    }

    /* ---------- mode 2: shared key ---------- */
    if (!adminKeyConfigured()) {
      return NextResponse.json(
        { ok: false, error: "adminKeyNotSet", hint: "GK_ADMIN_KEY" },
        { status: 500 }
      );
    }

    const key = str(body.key);
    if (!key) return NextResponse.json({ ok: false, error: "fillAll" }, { status: 400 });

    if (!verifyAdminKey(key)) {
      recordAdminFailure(ip);
      return NextResponse.json({ ok: false, error: "adminWrongKey" }, { status: 401 });
    }

    clearAdminFailures(ip);
    const { token, expiresAt } = issueAdminToken();
    const res = NextResponse.json({ ok: true, mode: "key" });
    setAdminCookie(res, token, expiresAt);
    return res;
  } catch (e) {
    console.error("[admin:login]", e);
    return NextResponse.json({ ok: false, error: "serverError" }, { status: 500 });
  }
}
