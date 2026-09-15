import { db } from "@/lib/server/store";
import { withSession, snapshotResponse, jsonError, str, int, date } from "@/lib/server/route";

/**
 * POST /api/payment — collect money against a trip (or a customer's open balance).
 * { tripId?, customerId?, amount, method, date? }
 * Writes one IncomeEntry (category: rental) linked to trip + customer + vehicle,
 * so trip due, customer due and month income all update from the same row.
 */
export async function POST(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);
    const amount = int(body.amount);
    if (amount <= 0) return jsonError("fillAll");

    const tripId = str(body.tripId);
    const customerId = str(body.customerId);
    if (!tripId && !customerId) return jsonError("fillAll");

    let trip;
    if (tripId) {
      trip = await db.trip.findFirst({ where: { id: tripId, businessId: user.businessId } });
      if (!trip || trip.status === "cancelled") return jsonError("invalidTrip");
    } else {
      trip = null;
    }

    // The trip's customer takes precedence; a trip payment always lands on the trip's customer.
    const custId = trip ? trip.customerId : customerId;
    if (custId) {
      const c = await db.customer.findFirst({ where: { id: custId, businessId: user.businessId } });
      if (!c) return jsonError("invalidCustomer");
    }

    await db.incomeEntry.create({
      data: {
        businessId: user.businessId,
        date: date(body.date),
        category: "rental",
        customerId: custId || null,
        vehicleId: trip?.vehicleId ?? null,
        tripId: trip?.id ?? null,
        amount,
        method: str(body.method, "cash"),
      },
    });
    return snapshotResponse(user, { paidFor: trip?.ref ?? null });
  });
}
