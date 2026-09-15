import { db } from "@/lib/server/store";
import { withSession, snapshotResponse, jsonError, str, int, date } from "@/lib/server/route";

/**
 * POST /api/service — { vehicleId, item, date, km, cost, workshop?, notes? }
 * One tap, three records (the owner's mental model):
 *   1. MaintenanceLog (ইতিহাস)
 *   2. MaintenanceScheduleItem upsert (পরের সার্ভিস resets)
 *   3. ExpenseEntry (খরচ)
 */
export async function POST(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);
    const vehicleId = str(body.vehicleId);
    const item = str(body.item);
    const cost = int(body.cost);
    if (!vehicleId || !item || cost <= 0) return jsonError("fillAll");

    const vehicle = await db.vehicle.findFirst({ where: { id: vehicleId, businessId: user.businessId } });
    if (!vehicle) return jsonError("invalidVehicle");

    const when = date(body.date);
    const km = int(body.km, vehicle.currentKm);
    const workshop = str(body.workshop);

    await db.maintenanceLog.create({
      data: {
        businessId: user.businessId, vehicleId, item, date: when, km, cost,
        workshop: workshop || "—", notes: str(body.notes) || null,
      },
    });

    // upsert the schedule item: default interval 5000 km (engine oil default)
    const existing = await db.maintenanceScheduleItem.findFirst({
      where: { businessId: user.businessId, vehicleId, item },
    });
    if (existing) {
      await db.maintenanceScheduleItem.update({
        where: { id: existing.id },
        data: { lastServiceKm: km, lastServiceDate: when },
      });
    } else {
      await db.maintenanceScheduleItem.create({
        data: {
          businessId: user.businessId, vehicleId, item,
          lastServiceKm: km, lastServiceDate: when,
          intervalKm: item === "engine_oil" || item === "oil_filter" ? 5000 : item === "ac_service" ? 15000 : 8000,
        },
      });
    }

    await db.vehicle.update({ where: { id: vehicleId }, data: { currentKm: Math.max(vehicle.currentKm, km) } });
    await db.expenseEntry.create({
      data: {
        businessId: user.businessId, date: when, category: "maintenance",
        vehicleId, amount: cost, paidTo: workshop || undefined, method: "cash",
      },
    });
    return snapshotResponse(user);
  });
}
