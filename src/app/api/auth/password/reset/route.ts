import { NextResponse } from "next/server";
import { backendMode } from "@/lib/server/store";
import { resolveCloudAuthOnly, setSessionCookies } from "@/lib/server/cloud-auth";
import { jsonError, str } from "@/lib/server/route";

/* ------------------------------------------------------------------ *
 * POST /api/auth/password/reset — { newPassword }
 *
 * লগইন ছাড়া পাসওয়ার্ড রিসেট — /auth/reset পেজ থেকে, ইমেইলের
 * recovery link ঘুরে আসা ফ্রেশ সেশন কুকির (gk_at/gk_rt) উপর চলে।
 * withSession ব্যবহার করি না — ওটা business-membership চায়, কিন্তু
 * memberless ইউজারও পাসওয়ার্ড রিসেট করতে পারবে।
 * ------------------------------------------------------------------ */
export async function POST(req: Request) {
  try {
    if (backendMode() !== "cloud") return jsonError("resetLocalUnsupported");

    const body = (await req.json()) as Record<string, unknown>;
    const newPassword = str(body.newPassword);
    if (newPassword.length < 6) return jsonError("shortPassword");

    const auth = await resolveCloudAuthOnly(req);
    if (!auth) return jsonError("resetLinkExpired", 401);

    const { error } = await auth.client.auth.updateUser({ password: newPassword });
    if (error) {
      const msg = error.message ?? "";
      if (/same password|different from/i.test(msg)) return jsonError("samePassword");
      return jsonError("serverError", 500);
    }
    const res = NextResponse.json({ ok: true });
    if (auth.rotated) setSessionCookies(res, auth.rotated);
    return res;
  } catch {
    return jsonError("serverError", 500);
  }
}
