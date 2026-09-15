import { db, backendMode, getCloudClient } from "@/lib/server/store";
import { db as prismaDb } from "@/lib/db";
import { createServerClient, sbEmail } from "@/lib/server/cloud-auth";
import { hashPassword } from "@/lib/server/auth";
import { withSession, snapshotResponse, jsonError, str } from "@/lib/server/route";

/** Bengali digits → Latin. */
function normalizePhone(raw: string): string {
  const bn = "০১২৩৪৫৬৭৮৯";
  return raw.replace(/[০-৯]/g, (d) => String(bn.indexOf(d))).replace(/\D/g, "");
}

const validPhone = (p: string) => /^01\d{9}$/.test(p);
const STAFF_ROLES = new Set(["manager", "accountant", "driver"]);

/* ------------------------------------------------------------------ *
 * POST /api/team — the owner creates a login account for a staff
 * member (manager / accountant / driver). Driver-role accounts also
 * get a driver profile so driver-mode works on first login.
 * ------------------------------------------------------------------ */
export async function POST(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role !== "owner") return jsonError("forbidden", 403);

    const name = str(body.name);
    const phone = normalizePhone(str(body.phone));
    const role = str(body.role);
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || !phone || !role || !password) return jsonError("fillAll");
    if (!validPhone(phone)) return jsonError("invalidPhone");
    if (password.length < 6) return jsonError("shortPassword");
    if (!STAFF_ROLES.has(role)) return jsonError("invalidRole");

    /* ---------- CLOUD ---------- */
    if (backendMode() === "cloud") {
      const c = getCloudClient(); // owner's RLS client
      const fresh = createServerClient(); // anon client → creates the staff auth user

      const { data: authData, error: authError } = await fresh.auth.signUp({
        email: sbEmail(phone),
        password,
        options: { data: { full_name: name, phone } },
      });
      const uid = authData?.user?.id ?? null;

      if (authError || !uid) {
        const msg = authError?.message ?? "";
        if (/already registered|already been registered/i.test(msg)) {
          // existing GarirKhata user → hire into THIS business (profile already exists)
          const { data: prof } = await c.from("profiles")
            .select("id, full_name").eq("phone", phone).limit(1);
          const existingId = (prof?.[0] as { id?: string } | undefined)?.id;
          if (!existingId) return jsonError("phoneTaken", 409);
          const { error: rejoinErr } = await c.from("business_members").insert({
            business_id: user.businessId,
            user_id: existingId,
            role,
            status: "active",
            joined_at: new Date().toISOString(),
          });
          if (rejoinErr) throw new Error(rejoinErr.message);
          await ensureCloudDriver(c, user.businessId, existingId, name, phone, role);
          return snapshotResponse(user);
        }
        return jsonError("signupFailed", 400);
      }
      if (!authData.session) return jsonError("confirmEmailOn", 400);

      // membership — owner's client (members_insert: owner ✅)
      const { error: memberErr } = await c.from("business_members").insert({
        business_id: user.businessId,
        user_id: uid,
        role,
        status: "active",
        joined_at: new Date().toISOString(),
      });
      if (memberErr) {
        if (/row-level security/i.test(memberErr.message ?? "")) return jsonError("policyPatchNeeded", 400);
        throw new Error(memberErr.message);
      }

      // profile — upsert with the NEW user's own session (fresh holds it after
      // signUp): profiles insert/update policy is `id = auth.uid()`, so the
      // owner's client can't write it. Upsert fills phone even when the
      // auth-users trigger already created a bare profile row.
      const { error: profileErr } = await fresh.from("profiles").upsert({
        id: uid,
        full_name: name,
        phone,
        email: sbEmail(phone),
        default_business_id: user.businessId,
      }, { onConflict: "id" });
      if (profileErr && !/duplicate key/i.test(profileErr.message ?? "")) {
        throw new Error(profileErr.message);
      }

      await ensureCloudDriver(c, user.businessId, uid, name, phone, role);
      return snapshotResponse(user);
    }

    /* ---------- LOCAL ---------- */
    const existing = await db.user.findUnique({ where: { phone } });
    if (existing) return jsonError("phoneTaken", 409);

    await db.user.create({
      data: {
        businessId: user.businessId,
        name,
        phone,
        role,
        passwordHash: hashPassword(password),
      },
    });

    if (role === "driver") {
      const driver = await db.driver.findFirst({
        where: { businessId: user.businessId, phone },
      });
      if (!driver) {
        await db.driver.create({
          data: { businessId: user.businessId, name, phone, active: true },
        });
      }
    }
    return snapshotResponse(user);
  });
}

/** Cloud: driver-role accounts get a linked drivers row (user_id) for driver mode. */
async function ensureCloudDriver(
  c: ReturnType<typeof createServerClient>,
  businessId: string,
  uid: string,
  name: string,
  phone: string,
  role: string
) {
  if (role !== "driver") return;
  const { data: existing } = await c.from("drivers").select("id")
    .eq("business_id", businessId).eq("user_id", uid).limit(1);
  if (existing?.length) return;
  const { data: byPhone } = await c.from("drivers").select("id")
    .eq("business_id", businessId).eq("phone", phone).limit(1);
  const matchId = (byPhone?.[0] as { id?: string } | undefined)?.id;
  if (matchId) {
    await c.from("drivers").update({ user_id: uid }).eq("id", matchId);
    return;
  }
  const { error } = await c.from("drivers").insert({
    business_id: businessId,
    user_id: uid,
    name,
    phone,
    joining_date: new Date().toISOString().slice(0, 10),
    is_active: true,
  });
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------ *
 * PUT /api/team — the owner edits a member (name / role / active).
 * { id, name?, role?, active? } — self edits are rejected (own role
 * and status are managed by the account itself, not here).
 * ------------------------------------------------------------------ */
export async function PUT(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role !== "owner") return jsonError("forbidden", 403);
    const id = str(body.id);
    if (!id) return jsonError("fillAll");
    if (id === user.id) return jsonError("cannotEditSelf", 400);

    const name = str(body.name);
    const role = str(body.role);
    const active = body.active;
    if (!name && !role && typeof active !== "boolean") return jsonError("fillAll");
    if (role && !STAFF_ROLES.has(role)) return jsonError("invalidRole");

    /* ---------- CLOUD ---------- */
    if (backendMode() === "cloud") {
      const c = getCloudClient();
      const member: Record<string, unknown> = {};
      if (role) member.role = role;
      if (typeof active === "boolean") member.status = active ? "active" : "inactive";
      if (Object.keys(member).length) {
        const { error } = await c.from("business_members")
          .update(member).eq("business_id", user.businessId).eq("user_id", id);
        if (error) throw new Error(error.message);
      }
      if (name) {
        const { error } = await c.from("profiles").update({ full_name: name }).eq("id", id);
        if (error) throw new Error(error.message);
      }
      return snapshotResponse(user);
    }

    /* ---------- LOCAL ---------- */
    const target = await db.user.findFirst({ where: { id, businessId: user.businessId } });
    if (!target) return jsonError("notFound", 404);

    await db.user.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(role ? { role } : {}),
        ...(typeof active === "boolean" ? { active } : {}),
      },
    });
    return snapshotResponse(user);
  });
}

/* ------------------------------------------------------------------ *
 * DELETE /api/team — the owner removes a member's login (their
 * membership dies; the auth user/profile stay for a future re-add).
 * { id }
 * ------------------------------------------------------------------ */
export async function DELETE(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role !== "owner") return jsonError("forbidden", 403);
    const id = str(body.id);
    if (!id) return jsonError("fillAll");
    if (id === user.id) return jsonError("cannotEditSelf", 400);

    /* ---------- CLOUD ---------- */
    if (backendMode() === "cloud") {
      const c = getCloudClient();
      const { error } = await c.from("business_members")
        .delete().eq("business_id", user.businessId).eq("user_id", id);
      if (error) throw new Error(error.message);
      return snapshotResponse(user);
    }

    /* ---------- LOCAL ---------- */
    const target = await db.user.findFirst({ where: { id, businessId: user.businessId } });
    if (!target) return jsonError("notFound", 404);

    await prismaDb.session.deleteMany({ where: { userId: id } });
    await prismaDb.user.delete({ where: { id } });
    return snapshotResponse(user);
  });
}
