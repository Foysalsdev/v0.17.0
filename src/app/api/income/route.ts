import { db } from "@/lib/server/store";
import { withSession, snapshotResponse, jsonError, str, int, date } from "@/lib/server/route";

/** POST /api/income — { date, category, customerId?, vehicleId?, amount, method } */
export async function POST(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);
    const amount = int(body.amount);
    if (amount <= 0) return jsonError("fillAll");

    const customerId = str(body.customerId);
    const vehicleId = str(body.vehicleId);
    if (customerId) {
      const c = await db.customer.findFirst({ where: { id: customerId, businessId: user.businessId } });
      if (!c) return jsonError("invalidCustomer");
    }
    if (vehicleId) {
      const v = await db.vehicle.findFirst({ where: { id: vehicleId, businessId: user.businessId } });
      if (!v) return jsonError("invalidVehicle");
    }

    await db.incomeEntry.create({
      data: {
        businessId: user.businessId,
        date: date(body.date),
        category: str(body.category, "rental"),
        customerId: customerId || null,
        vehicleId: vehicleId || null,
        amount,
        method: str(body.method, "cash"),
      },
    });
    return snapshotResponse(user);
  });
}
