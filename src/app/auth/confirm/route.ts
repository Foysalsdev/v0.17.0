import { NextResponse } from "next/server";
import { createServerClient, setSessionCookies } from "@/lib/server/cloud-auth";
import { backendMode } from "@/lib/server/store";

/* ------------------------------------------------------------------ *
 * GET /auth/confirm?token_hash=…&type=recovery|signup&redirect_to=…
 *
 * Supabase-এর নতুন ইমেইল টেমপ্লেট (reset/confirm) এখানে আসে।
 *  - type=recovery → সেশন বসিয়ে /auth/reset-এ পাঠাই (নতুন পাসওয়ার্ড)।
 *  - type=signup (ইমেইল কনফার্মেশন) → সেশন বসিয়ে হোমে।
 * verifyOtp({ token_hash }) → ভ্যালিড হলে সেশন টোকেন দেয় →
 * gk_at/gk_rt httpOnly cookie-তে বসে — app-এর সব ফ্লো তারপর কাজ করে।
 * ------------------------------------------------------------------ */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const fail = (code: string) => NextResponse.redirect(new URL(`/?authError=${code}`, origin));

  if (backendMode() !== "cloud") return fail("resetLocalUnsupported");

  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  if (!tokenHash || !type) return fail("resetLinkExpired");

  const client = createServerClient();
  const allowed = ["recovery", "signup", "email_change", "invite"];
  if (!allowed.includes(type)) return fail("resetLinkExpired");

  const { data, error } = await client.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "recovery" | "signup" | "email_change" | "invite",
  });
  if (error || !data.session || !data.user) return fail("resetLinkExpired");

  const target = type === "recovery" ? "/auth/reset" : "/";
  const res = NextResponse.redirect(new URL(target, origin));
  const session = data.session;
  setSessionCookies(res, {
    at: session.access_token,
    rt: session.refresh_token,
    expiresAt: new Date((session.expires_at ?? 0) * 1000),
  });
  return res;
}
