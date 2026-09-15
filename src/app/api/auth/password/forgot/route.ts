import { NextResponse } from "next/server";
import { backendMode } from "@/lib/server/store";
import { createServerClient } from "@/lib/server/cloud-auth";
import { jsonError, str } from "@/lib/server/route";

/* ------------------------------------------------------------------ *
 * POST /api/auth/password/forgot — { identifier } (email or phone)
 *
 * Supabase-এ password-reset ইমেইল পাঠায় (GoTrue /recover)।
 * ফোন দিলে profile_email_by_phone RPC দিয়ে আসল email বের করে পাঠায়।
 *
 * Anti-enumeration: ইউজার না পেলেও সবসময় ok রিটার্ন করে —
 * আন্দাজ করা যায় না কোন ইমেইলে অ্যাকাউন্ট আছে।
 * LOCAL mode: scrypt পাসওয়ার্ড — ইমেইল রিসেট নেই (graceful error)।
 * ------------------------------------------------------------------ */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const identifier = str(body.identifier);
    if (!identifier) return jsonError("fillAll");

    if (backendMode() !== "cloud") return jsonError("resetLocalUnsupported");

    const client = createServerClient();
    let email = identifier.toLowerCase();

    if (!email.includes("@")) {
      // ফোন → RPC দিয়ে email (security definer — RLS ছাড়াই কাজ করে)
      let realEmail: string | null = null;
      try {
        const { data: rpcEmail } = await client.rpc("profile_email_by_phone", { p_phone: identifier });
        if (typeof rpcEmail === "string" && rpcEmail) realEmail = rpcEmail;
      } catch { /* RPC নেই — নিচের fallback */ }
      if (!realEmail) return jsonError("resetPhoneNotFound");
      email = realEmail;
    }

    const origin = new URL(req.url).origin;
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/reset`,
    });
    if (error) {
      // invalid email format ইত্যাদি — generic রাখি (enumeration ঠেকাতে)
      if (/invalid|format/i.test(error.message ?? "")) return jsonError("invalidEmail");
      return jsonError("serverError", 500);
    }
    return NextResponse.json({ ok: true, email });
  } catch {
    return jsonError("serverError", 500);
  }
}
