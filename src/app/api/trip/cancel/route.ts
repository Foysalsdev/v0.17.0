import { db, deletePendingTripReminders } from "@/lib/server/store";
import { withSession, snapshotResponse, jsonError, str } from "@/lib/server/route";

/**
 * POST /api/trip/cancel — cancel a confirmed/draft trip (owner round 2).
 * Body: { tripId }. Running trips must be completed instead (their vehicle
 * is on the road). Cancelling frees the vehicle if it was marked on_trip
 * for this booking. Drivers are not allowed to cancel.
 * v0.10 — the trip's pending auto reminder is removed with it.
 */
export async function POST(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);

    const trip = await db.trip.findFirst({
      where: { id: str(body.tripId), businessId: user.businessId },
    });
    if (!trip) return jsonError("invalidTrip", 404);
    if (trip.status !== "confirmed" && trip.status !== "draft") return jsonError("invalidTripState");

    await db.trip.update({ where: { id: trip.id }, data: { status: "cancelled" } });

    // the trip's pending reminder goes with it (auto + bell-created, both trip-linked)
    try { await deletePendingTripReminders(user.businessId, trip.id); } catch { /* best-effort */ }

    // free the vehicle if this booking had put it on_trip
    if (trip.status === "confirmed") {
      const vehicle = await db.vehicle.findUnique({ where: { id: trip.vehicleId } });
      if (vehicle?.status === "on_trip") {
        const stillRunning = await db.trip.findFirst({
          where: {
            businessId: user.businessId,
            vehicleId: vehicle.id,
            status: "running",
            id: { not: trip.id },
          },
        });
        if (!stillRunning) {
          await db.vehicle.update({ where: { id: vehicle.id }, data: { status: "available" } });
        }
      }
    }

    return snapshotResponse(user, { ref: trip.ref });
  });
}
