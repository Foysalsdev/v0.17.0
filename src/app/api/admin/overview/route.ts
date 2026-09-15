import { NextResponse } from "next/server";
import { adminKeyConfigured, hasAdminSession, adminOverview, AdminRpcError } from "@/lib/server/admin";

/* ------------------------------------------------------------------ *
 * GET /api/admin/overview — platform stats + tenant list (read-only).
 * Requires the signed admin cookie (account- বা key-login)। GK_ADMIN_KEY
 * সেট থাকতে হবে — অ্যাকাউন্ট-মোডেও এটাই HMAC signing secret।
 * ডেটা: service-role cloud → সেশন-RPC (আসল ক্লাউড) → local sandbox।
 * ------------------------------------------------------------------ */
export async function GET(req: Request) {
  try {
    if (!adminKeyConfigured()) {
      return NextResponse.json(
        { ok: false, error: "adminKeyNotSet", hint: "GK_ADMIN_KEY" },
        { status: 500 }
      );
    }
    if (!hasAdminSession(req)) {
      return NextResponse.json({ ok: false, error: "adminLoginRequired" }, { status: 401 });
    }

    const { overview, warning } = await adminOverview(req);
    return NextResponse.json({ ok: true, data: overview, warning: warning ?? null });
  } catch (e) {
    if (e instanceof AdminRpcError) {
      if (e.kind === "notAdmin") {
        return NextResponse.json({ ok: false, error: "adminNotPlatformOwner" }, { status: 403 });
      }
      if (e.kind === "keyNoCloud") {
        // ক্লাউড-মোড key-login — ডেমো নয়, স্পষ্ট নির্দেশনা
        return NextResponse.json(
          { ok: false, error: "adminKeyNoCloud", hint: "account / SUPABASE_SERVICE_ROLE" },
          { status: 409 }
        );
      }
      // missing — service key ও local DB দুটোই নেই: SQL চালান
      return NextResponse.json(
        { ok: false, error: "adminSetupMissing", hint: "v1.0 SQL · F" },
        { status: 409 }
      );
    }
    console.error("[admin:overview]", e);
    return NextResponse.json(
      { ok: false, error: "adminDataUnavailable", hint: "account-login / SUPABASE_SERVICE_ROLE" },
      { status: 500 }
    );
  }
}
