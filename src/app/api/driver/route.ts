import { db } from "@/lib/server/store";
import { withSession, snapshotResponse, jsonError, str, int, date } from "@/lib/server/route";

/** POST /api/driver — { name, phone?, licenseNo?, licenseExpiry?, salary? } */
export async function POST(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);
    const name = str(body.name);
    if (!name) return jsonError("fillAll");

    const licenseExpiryRaw = body.licenseExpiry;
    const licenseExpiry = licenseExpiryRaw ? date(licenseExpiryRaw) : null;

    const driver = await db.driver.create({
      data: {
        businessId: user.businessId,
        name,
        phone: str(body.phone),
        licenseNo: str(body.licenseNo),
        licenseExpiry: licenseExpiry && !Number.isNaN(licenseExpiry.getTime()) ? licenseExpiry : null,
        joiningDate: new Date(),
        salary: int(body.salary, 0),
        active: true,
      },
    });
    return snapshotResponse(user, { driverId: driver.id });
  });
}

/**
 * PUT /api/driver — edit an existing driver (owner round 3).
 * { id, name, phone?, licenseNo?, licenseExpiry?, salary?, active? }
 */
export async function PUT(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);
    const id = str(body.id);
    const name = str(body.name);
    if (!id || !name) return jsonError("fillAll");

    const existing = await db.driver.findFirst({ where: { id, businessId: user.businessId } });
    if (!existing) return jsonError("invalidDriver", 404);

    const licenseExpiryRaw = body.licenseExpiry;
    const licenseExpiry = licenseExpiryRaw ? date(licenseExpiryRaw) : null;
    const activeRaw = body.active;

    await db.driver.update({
      where: { id },
      data: {
        name,
        phone: str(body.phone),
        licenseNo: str(body.licenseNo),
        licenseExpiry: licenseExpiry && !Number.isNaN(licenseExpiry.getTime()) ? licenseExpiry : null,
        salary: int(body.salary, existing.salary),
        active: typeof activeRaw === "boolean" ? activeRaw : existing.active,
      },
    });
    return snapshotResponse(user);
  });
}
