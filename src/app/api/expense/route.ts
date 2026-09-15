import { db } from "@/lib/server/store";
import { withSession, snapshotResponse, jsonError, str, int, date } from "@/lib/server/route";

/** POST /api/expense — { date, category, vehicleId?, amount, paidTo?, method } */
export async function POST(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);
    const amount = int(body.amount);
    if (amount <= 0) return jsonError("fillAll");

    const vehicleId = str(body.vehicleId);
    if (vehicleId) {
      const v = await db.vehicle.findFirst({ where: { id: vehicleId, businessId: user.businessId } });
      if (!v) return jsonError("invalidVehicle");
    }

    await db.expenseEntry.create({
      data: {
        businessId: user.businessId,
        date: date(body.date),
        category: str(body.category, "misc"),
        vehicleId: vehicleId || null,
        amount,
        paidTo: str(body.paidTo) || null,
        method: str(body.method, "cash"),
      },
    });
    return snapshotResponse(user);
  });
}
