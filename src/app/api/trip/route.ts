import { db, issueRef, dbErrorCode, deletePendingTripReminders } from "@/lib/server/store";
import { withSession, snapshotResponse, jsonError, str, int, date } from "@/lib/server/route";

/**
 * POST /api/trip — create a trip.
 * Body: { customerId } OR { newCustomer: { name, phone } } + { vehicleId, driverId?,
 *         from, to, startAt, endAt, rentalType, fare, advance }
 * Server-side double-booking guard (§12) + auto reference TR-000N.
 * v0.10 — time সহ trip বানালেই AUTO REMINDER: শুরুর ১ ঘণ্টা আগে (owner:
 * "trip create korle sekhane time set soho korle seta reminder dibe").
 */
export async function POST(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);

    const vehicleId = str(body.vehicleId);
    const from = str(body.from);
    const to = str(body.to);
    const fare = int(body.fare);
    const advance = int(body.advance);
    const startAt = date(body.startAt);
    const endAt = date(body.endAt);
    const customerId = str(body.customerId);
    const newCustomer = body.newCustomer as { name?: string; phone?: string } | undefined;
    const newCustomerName = str(newCustomer?.name);

    if (!vehicleId || (!customerId && !newCustomerName) || !from || !to || fare <= 0) {
      return jsonError("fillAll");
    }
    if (endAt <= startAt) return jsonError("invalidTripTime");

    // vehicle must belong to this business
    const vehicle = await db.vehicle.findFirst({ where: { id: vehicleId, businessId: user.businessId } });
    if (!vehicle) return jsonError("invalidVehicle");
    if (vehicle.status === "maintenance") return jsonError("vehicleInMaintenance");
    if (vehicle.status === "sold" || vehicle.status === "inactive") return jsonError("vehicleUnavailable");

    // double-booking (Section 12): same vehicle, overlapping confirmed/running trip
    const overlapping = await db.trip.findFirst({
      where: {
        businessId: user.businessId,
        vehicleId,
        status: { in: ["confirmed", "running"] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });
    if (overlapping) return jsonError("bookingConflict");

    // resolve customer (existing, or create inline — the owner's request)
    let cId = customerId;
    let createdCustomerId: string | null = null;
    if (!cId) {
      const created = await db.customer.create({
        data: {
          businessId: user.businessId,
          name: newCustomerName,
          phone: str(newCustomer?.phone),
        },
      });
      cId = created.id;
      createdCustomerId = created.id;
    } else {
      const exists = await db.customer.findFirst({ where: { id: cId, businessId: user.businessId } });
      if (!exists) return jsonError("invalidCustomer");
    }

    // reference: per-business sequence (TR-0001…) — local counter or cloud max+1
    const ref = await issueRef(user.businessId, "trip");

    let trip;
    try {
      trip = await db.trip.create({
        data: {
          businessId: user.businessId,
          ref,
          customerId: cId,
          vehicleId,
          driverId: str(body.driverId) || null,
          from, to, startAt, endAt,
          rentalType: str(body.rentalType, "per_trip"),
          fare,
          advance,
          notes: str(body.notes) || null,
          status: "confirmed",
        },
      });
    } catch (e) {
      // cloud: the DB-level no-double-booking exclusion constraint fired (23P01)
      if (dbErrorCode(e) === "23P01") return jsonError("bookingConflict");
      throw e;
    }

    // vehicle goes on-trip once the booking starts within the hour; otherwise stays available
    const startsSoon = startAt.getTime() - Date.now() < 3600000;
    if (vehicle.status === "available" && startsSoon) {
      await db.vehicle.update({ where: { id: vehicleId }, data: { status: "on_trip" } });
    }

    // v0.10 — auto trip reminder: শুরুর ১ ঘণ্টা আগে (ভবিষ্যৎ trip হলেই)।
    // Reminder তৈরি ব্যর্থ হলে trip বানানো ব্যর্থ হবে না — best-effort।
    let autoReminder = false;
    if (startAt.getTime() > Date.now()) {
      try {
        await db.reminder.create({
          data: {
            businessId: user.businessId,
            title: "ট্রিপ শুরু",
            notes: `${from} → ${to}`,
            tripId: trip.id,
            dueAt: new Date(Math.max(startAt.getTime() - 3600000, Date.now())),
            done: false,
          },
        });
        autoReminder = true;
      } catch { /* reminder is best-effort */ }
    }

    return snapshotResponse(user, { ref, tripId: trip.id, createdCustomerId, autoReminder });
  });
}
