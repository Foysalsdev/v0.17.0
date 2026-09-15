import { db } from "@/lib/server/store";
import { withSession, snapshotResponse, jsonError, str, int, num, date } from "@/lib/server/route";

/**
 * POST /api/fuel — { vehicleId, date, odometerKm, litres, pricePerLitre, station? }
 * Creates the fuel entry, updates the vehicle's KM, and records the fuel expense.
 */
export async function POST(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);
    const vehicleId = str(body.vehicleId);
    const litres = num(body.litres);
    const pricePerLitre = num(body.pricePerLitre);
    if (!vehicleId || litres <= 0 || pricePerLitre <= 0) return jsonError("fillAll");

    const vehicle = await db.vehicle.findFirst({ where: { id: vehicleId, businessId: user.businessId } });
    if (!vehicle) return jsonError("invalidVehicle");

    const odometerKm = int(body.odometerKm, vehicle.currentKm);
    if (odometerKm < vehicle.currentKm) return jsonError("invalidOdometer");

    const when = date(body.date);
    const totalCost = Math.round(litres * pricePerLitre);

    await db.fuelEntry.create({
      data: {
        businessId: user.businessId,
        vehicleId,
        date: when,
        odometerKm,
        litres,
        pricePerLitre,
        station: str(body.station) || "—",
      },
    });
    await db.vehicle.update({ where: { id: vehicleId }, data: { currentKm: Math.max(vehicle.currentKm, odometerKm) } });
    await db.expenseEntry.create({
      data: {
        businessId: user.businessId,
        date: when,
        category: "fuel",
        vehicleId,
        amount: totalCost,
        paidTo: str(body.station) || undefined,
        method: "cash",
      },
    });
    return snapshotResponse(user);
  });
}
