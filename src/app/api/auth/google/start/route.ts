import { NextResponse } from "next/server";
import { backendMode } from "@/lib/server/store";
import { OAUTH_COOKIE, authorizeUrl, googleConfigured, newCodeVerifier, siteOrigin } from "@/lib/server/google-oauth";

/**
 * GET /api/auth/google/start — Google OAuth শুরু (server-side PKCE)।
 * code_verifier httpOnly cookie-তে ১০ মিনিট থাকে, তারপর GoTrue /authorize-এ redirect।
 */
export async function GET(req: Request) {
  const origin = siteOrigin(req);

  if (backendMode() !== "cloud" || !googleConfigured()) {
    // Cloud না — login page-এ বন্ধ button-ই দেখানো হয়; এটা fallback।
    return NextResponse.redirect(new URL(`/?authError=googleNotConfigured`, origin));
  }

  const verifier = newCodeVerifier();
  const res = NextResponse.redirect(authorizeUrl(origin, verifier));
  res.cookies.set(OAUTH_COOKIE, JSON.stringify({ v: verifier }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 মিনিট — OAuth roundtrip-এর জন্য যথেষ্ট
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
