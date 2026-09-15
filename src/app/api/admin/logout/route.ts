import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/server/admin";

/** POST /api/admin/logout — clear the admin session cookie. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearAdminCookie(res);
  return res;
}
