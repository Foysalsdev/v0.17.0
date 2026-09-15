import { db, backendMode, getCloudClient } from "@/lib/server/store";
import { withSession, snapshotResponse, jsonError, str } from "@/lib/server/route";

/* ------------------------------------------------------------------ *
 * PUT /api/business — edit the logged-in user's business profile
 * (settings → ব্যবসার প্রোফাইল): name, phone, address, ownerName.
 *
 * Roles: owner/manager (driver নয়)। ownerName শুধু owner নিজে
 * বদলাতে পারেন (cloud-এ ওটা তাঁর নিজের profile.full_name)।
 * LOCAL : business row update (ownerName-সহ)।
 * CLOUD : businesses update (name/phone/address — RLS owner|manager)
 *         + owner-এর নিজের profiles.full_name (RLS: id = auth.uid())।
 * ------------------------------------------------------------------ */
export async function PUT(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);

    const name = str(body.name);
    const phone = str(body.phone);
    const address = str(body.address);
    const ownerName = str(body.ownerName);
    if (!name || !ownerName) return jsonError("fillAll");

    const data: Record<string, string> = { name, phone, address };

    /* ---------- CLOUD ---------- */
    if (backendMode() === "cloud") {
      // ownerName → নিজের profile (RLS: শুধু নিজের রো)। manager পারবে না।
      if (ownerName && user.role === "owner") {
        const c = getCloudClient();
        const { error: profileErr } = await c.from("profiles")
          .update({ full_name: ownerName })
          .eq("id", user.id);
        if (profileErr) {
          return jsonError(/row-level security/i.test(profileErr.message ?? "") ? "policyPatchNeeded" : "serverError", 500);
        }
      }
      await db.business.update({ where: { id: user.businessId }, data });
      return snapshotResponse(user);
    }

    /* ---------- LOCAL ---------- */
    await db.business.update({
      where: { id: user.businessId },
      data: { ...data, ownerName },
    });
    return snapshotResponse(user);
  });
}
