import { NextResponse } from "next/server";
import { SESSION_COOKIE, destroySession } from "@/lib/server/auth";
import { backendMode } from "@/lib/server/store";
import { cloudLogout, clearSessionCookies } from "@/lib/server/cloud-auth";

export async function POST(req: Request) {
  if (backendMode() === "cloud") {
    await cloudLogout(req); // revokes the refresh token server-side (best-effort)
    const res = NextResponse.json({ ok: true });
    clearSessionCookies(res);
    return res;
  }

  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (match?.[1]) {
    try { await destroySession(match[1]); } catch { /* session already gone */ }
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
