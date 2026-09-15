import { db, deletePendingTripReminders } from "@/lib/server/store";
import { withSession, snapshotResponse, jsonError, str, int, date } from "@/lib/server/route";

const TRIP_EXPENSE_CATEGORIES = ["fuel", "toll", "parking", "driver_allowance", "other"] as const;

/**
 * POST /api/trip/complete — end a running trip.
 * Body: { tripId, endKm, expenses?: [{ category, amount }] }
 * (drivers must pass endKm; owner/manager quick-complete may omit it → the
 * vehicle's current KM is used). Sets end KM, frees the vehicle, records
 * per-trip expense lines (owner/manager only), and the snapshot recomputes
 * profit = fare − Σ trip expenses.
 * v0.10 — the trip's pending auto reminder is removed (it already served).
 */
export async function POST(req: Request) {
  return withSession(req, async (user, body) => {
    const trip = await db.trip.findFirst({
      where: { id: str(body.tripId), businessId: user.businessId },
    });
    if (!trip) return jsonError("invalidTrip", 404);

    if (user.role === "driver" && trip.driverId !== user.driverId) return jsonError("forbidden", 403);
    if (trip.status !== "running") return jsonError("invalidTripState");

    const vehicle = await db.vehicle.findUnique({ where: { id: trip.vehicleId } });
    const startKm = trip.startKm ?? vehicle?.currentKm ?? 0;
    let endKm = int(body.endKm, 0);
    if (endKm <= 0) endKm = vehicle?.currentKm ?? startKm;
    if (endKm < startKm) return jsonError("invalidEndKm");

    await db.trip.update({ where: { id: trip.id }, data: { status: "completed", endKm } });
    // the trip is over — its pending reminder has served its purpose
    try { await deletePendingTripReminders(user.businessId, trip.id); } catch { /* best-effort */ }
    if (vehicle) {
      await db.vehicle.update({
        where: { id: vehicle.id },
        data: {
          currentKm: Math.max(vehicle.currentKm, endKm),
          status: vehicle.status === "on_trip" ? "available" : vehicle.status,
        },
      });
    }

    // optional expense lines (fuel / toll / parking / driver allowance / other)
    if (user.role !== "driver" && Array.isArray(body.expenses)) {
      const lines = (body.expenses as { category?: unknown; amount?: unknown }[])
        .map((e) => ({
          category: str(e.category),
          amount: int(e.amount, 0),
        }))
        .filter(
          (e): e is { category: (typeof TRIP_EXPENSE_CATEGORIES)[number]; amount: number } =>
            (TRIP_EXPENSE_CATEGORIES as readonly string[]).includes(e.category) && e.amount > 0
        );
      if (lines.length > 0) {
        await db.tripExpense.createMany({
          data: lines.map((e) => ({
            businessId: user.businessId,
            tripId: trip.id,
            category: e.category,
            amount: e.amount,
          })),
        });
      }
    }

    return snapshotResponse(user);
  });
}
