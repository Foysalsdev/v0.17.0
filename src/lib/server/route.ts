import { NextResponse } from "next/server";
import type { SessionUser } from "./auth";
import { getSessionUser } from "./auth";
import { buildSnapshot } from "./snapshot";
import { backendMode, runWithCloud } from "./store";
import { resolveCloudUser, setSessionCookies } from "./cloud-auth";

export function jsonError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

/** Wrap a mutation route: session check + json body + error handling + fresh snapshot. */
export async function withSession(
  req: Request,
  handler: (user: SessionUser, body: Record<string, unknown>) => Promise<NextResponse>
): Promise<NextResponse> {
  let body: Record<string, unknown> = {};
  try { body = (await req.json()) as Record<string, unknown>; } catch { /* empty body ok */ }

  /* CLOUD: Supabase-token session + RLS-scoped client for the whole handler. */
  if (backendMode() === "cloud") {
    const auth = await resolveCloudUser(req);
    if (!auth) return jsonError("notLoggedIn", 401);
    try {
      const res = await runWithCloud(auth.client, () => handler(auth.user, body));
      if (auth.rotated) setSessionCookies(res, auth.rotated);
      return res;
    } catch (e) {
      console.error("[api:cloud]", e);
      return jsonError("serverError", 500);
    }
  }

  /* LOCAL: scrypt session cookie (unchanged). */
  const user = await getSessionUser(req);
  if (!user) return jsonError("notLoggedIn", 401);
  try {
    return await handler(user, body);
  } catch (e) {
    console.error("[api]", e);
    return jsonError("serverError", 500);
  }
}

/** Success response: fresh snapshot (+ extra fields like the new trip reference). */
export async function snapshotResponse(user: SessionUser, extra?: Record<string, unknown>) {
  const data = await buildSnapshot(user);
  return NextResponse.json({
    ok: true,
    data,
    user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
    ...extra,
  });
}

/* ---------- input helpers ---------- */
export function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v.trim() : fallback;
}
export function int(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}
export function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : fallback;
}
export function date(v: unknown, fallback = new Date()): Date {
  if (v == null) return fallback;
  const d = new Date(v as string | number | Date);
  return Number.isNaN(d.getTime()) ? fallback : d;
}
/** Only owner/manager/staff/accountant may write business records (drivers: trip start/end only). */
export function assertCanWrite(user: SessionUser): NextResponse | null {
  if (user.role === "driver") return jsonError("forbidden", 403);
  return null;
}
