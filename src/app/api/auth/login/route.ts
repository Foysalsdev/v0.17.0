import { NextResponse } from "next/server";
import { db, backendMode, runWithCloud } from "@/lib/server/store";
import { verifyPassword, createSession, SESSION_COOKIE } from "@/lib/server/auth";
import { cloudLogin, setSessionCookies } from "@/lib/server/cloud-auth";
import { buildSnapshot } from "@/lib/server/snapshot";

/** Bengali digits → Latin, strip separators — the owner may type either. */
function normalizePhone(raw: string): string {
  const bn = "০১২৩৪৫৬৭৮৯";
  return raw.replace(/[০-৯]/g, (d) => String(bn.indexOf(d))).replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { identifier?: string; phone?: string; password?: string };
    // নতুন ক্লায়েন্ট "identifier" পাঠায় (phone বা email); পুরনো phone-only টোলও চলে।
    const rawIdentifier = (body.identifier ?? body.phone ?? "").trim();
    const isEmail = rawIdentifier.includes("@");
    const phone = normalizePhone(rawIdentifier);
    const email = isEmail ? rawIdentifier.toLowerCase() : "";
    const password = body.password ?? "";
    if ((!phone && !email) || !password) {
      return NextResponse.json({ ok: false, error: "fillAll" }, { status: 400 });
    }

    /* CLOUD: Supabase Auth (identifier = ফোন বা email)। */
    if (backendMode() === "cloud") {
      const result = await cloudLogin(isEmail ? email : phone, password);
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
      }
      const { client, user } = result;
      const data = await runWithCloud(client, () => buildSnapshot(user));
      const { data: { session } } = await client.auth.getSession();
      const res = NextResponse.json({
        ok: true,
        user: { id: user.id, name: user.name, phone: user.phone, role: user.role, driverId: user.driverId },
        data,
      });
      if (session) {
        setSessionCookies(res, {
          at: session.access_token,
          rt: session.refresh_token,
          expiresAt: new Date((session.expires_at ?? 0) * 1000),
        });
      }
      return res;
    }

    /* LOCAL: scrypt + session table (identifier = ফোন বা email)। */
    const user = email
      ? await db.user.findUnique({ where: { email } })
      : await db.user.findUnique({ where: { phone } });
    if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ ok: false, error: "loginFailed" }, { status: 401 });
    }

    const { token, expiresAt } = await createSession(user.id);

    // resolve driver profile
    let driverId: string | null = null;
    if (user.role === "driver") {
      const driver = await db.driver.findFirst({ where: { businessId: user.businessId, phone: user.phone } });
      driverId = driver?.id ?? null;
    }
    const sessionUser = {
      id: user.id, name: user.name, phone: user.phone,
      role: user.role, businessId: user.businessId, driverId,
    };
    const data = await buildSnapshot(sessionUser);

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role, driverId },
      data,
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (e) {
    console.error("[login]", e);
    return NextResponse.json({ ok: false, error: "serverError" }, { status: 500 });
  }
}
