import { NextResponse } from "next/server";
import { db, backendMode, getCloudClient } from "@/lib/server/store";
import { verifyPassword, hashPassword } from "@/lib/server/auth";
import { withSession, jsonError } from "@/lib/server/route";

/* ------------------------------------------------------------------ *
 * POST /api/auth/password — the logged-in user changes their OWN
 * password (old password proof required).
 * LOCAL : scrypt verify + rehash.
 * CLOUD : Supabase Auth updateUser({ password }) with the user's
 *         own session (no admin key anywhere).
 * ------------------------------------------------------------------ */
export async function POST(req: Request) {
  return withSession(req, async (user, body) => {
    const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const next = typeof body.newPassword === "string" ? body.newPassword : "";
    if (!current || !next) return jsonError("fillAll");
    if (next.length < 6) return jsonError("shortPassword");

    /* ---------- CLOUD ---------- */
    if (backendMode() === "cloud") {
      const c = getCloudClient();
      const { error } = await c.auth.updateUser({ password: next });
      if (error) {
        const msg = error.message ?? "";
        if (/same password|different from/i.test(msg)) return jsonError("samePassword", 400);
        return jsonError("serverError", 500);
      }
      return NextResponse.json({ ok: true });
    }

    /* ---------- LOCAL ---------- */
    const row = await db.user.findUnique({ where: { id: user.id } });
    if (!row || !row.passwordHash || !verifyPassword(current, row.passwordHash)) {
      return jsonError("wrongPassword", 400);
    }
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(next) },
    });
    return NextResponse.json({ ok: true });
  });
}
