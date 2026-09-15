import { db } from "@/lib/server/store";
import { withSession, snapshotResponse, jsonError, str } from "@/lib/server/route";

/** POST /api/customer — { name, phone?, company?, address? } */
export async function POST(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);
    const name = str(body.name);
    if (!name) return jsonError("fillAll");

    const created = await db.customer.create({
      data: {
        businessId: user.businessId,
        name,
        phone: str(body.phone),
        company: str(body.company) || null,
        address: str(body.address) || null,
      },
    });
    return snapshotResponse(user, { createdCustomerId: created.id });
  });
}

/** PUT /api/customer — { id, name, phone?, company?, address? } — edit (owner round 2) */
export async function PUT(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);
    const id = str(body.id);
    const name = str(body.name);
    if (!id || !name) return jsonError("fillAll");

    const existing = await db.customer.findFirst({
      where: { id, businessId: user.businessId },
    });
    if (!existing) return jsonError("invalidCustomer", 404);

    await db.customer.update({
      where: { id },
      data: {
        name,
        phone: str(body.phone),
        company: str(body.company) || null,
        address: str(body.address) || null,
      },
    });
    return snapshotResponse(user);
  });
}
