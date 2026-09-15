import { db } from "@/lib/server/store";
import { withSession, snapshotResponse, jsonError, int, str } from "@/lib/server/route";

/** POST /api/trip/start — driver starts their trip (status → running, start KM). */
export async function POST(req: Request) {
  return withSession(req, async (user, body) => {
    const trip = await db.trip.findFirst({
      where: { id: str(body.tripId), businessId: user.businessId },
    });
    if (!trip) return jsonError("invalidTrip", 404);

    // drivers may only start their own trips
    if (user.role === "driver" && trip.driverId !== user.driverId) return jsonError("forbidden", 403);
    if (trip.status !== "confirmed") return jsonError("invalidTripState");

    const vehicle = await db.vehicle.findUnique({ where: { id: trip.vehicleId } });
    const startKm = int(body.startKm, vehicle?.currentKm ?? 0);

    await db.trip.update({ where: { id: trip.id }, data: { status: "running", startKm } });
    if (vehicle) {
      await db.vehicle.update({
        where: { id: vehicle.id },
        data: { currentKm: Math.max(vehicle.currentKm, startKm), status: "on_trip" },
      });
    }
    return snapshotResponse(user);
  });
}
