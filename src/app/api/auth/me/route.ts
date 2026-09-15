import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { buildSnapshot } from "@/lib/server/snapshot";
import { backendMode, runWithCloud } from "@/lib/server/store";
import { resolveCloudUser, setSessionCookies } from "@/lib/server/cloud-auth";

/** Session check used on app boot (page refresh keeps you logged in). */
export async function GET(req: Request) {
  if (backendMode() === "cloud") {
    const auth = await resolveCloudUser(req);
    if (!auth) return NextResponse.json({ ok: false }, { status: 401 });
    try {
      const data = await runWithCloud(auth.client, () => buildSnapshot(auth.user));
      const res = NextResponse.json({
        ok: true,
        user: { id: auth.user.id, name: auth.user.name, phone: auth.user.phone, role: auth.user.role, driverId: auth.user.driverId },
        data,
      });
      if (auth.rotated) setSessionCookies(res, auth.rotated);
      return res;
    } catch (e) {
      console.error("[me:cloud]", e);
      return NextResponse.json({ ok: false, error: "serverError" }, { status: 500 });
    }
  }

  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const data = await buildSnapshot(user);
  return NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, phone: user.phone, role: user.role, driverId: user.driverId },
    data,
  });
}
