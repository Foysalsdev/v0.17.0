import { db, issueRef } from "@/lib/server/store";
import { withSession, snapshotResponse, jsonError, str, int, date } from "@/lib/server/route";

/**
 * POST /api/quotation — create a price quote (Phase 11).
 * Body: { customerId } OR { newCustomer: { name, phone } } + { vehicleId?,
 *         summary, rate, terms?, validUntil? }
 * Auto reference QT-000N per business; status starts as "sent".
 */
export async function POST(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);

    const rate = int(body.rate);
    if (rate <= 0) return jsonError("fillAll");

    const customerId = str(body.customerId);
    const newCustomer = body.newCustomer as { name?: string; phone?: string } | undefined;
    const newCustomerName = str(newCustomer?.name);
    if (!customerId && !newCustomerName) return jsonError("fillAll");

    // resolve customer (existing, or create inline — same as the trip form)
    let cId = customerId;
    let createdCustomerId: string | null = null;
    if (!cId) {
      const created = await db.customer.create({
        data: { businessId: user.businessId, name: newCustomerName, phone: str(newCustomer?.phone) },
      });
      cId = created.id;
      createdCustomerId = created.id;
    } else {
      const exists = await db.customer.findFirst({ where: { id: cId, businessId: user.businessId } });
      if (!exists) return jsonError("invalidCustomer");
    }

    // optional vehicle must belong to this business
    const vehicleId = str(body.vehicleId);
    if (vehicleId) {
      const v = await db.vehicle.findFirst({ where: { id: vehicleId, businessId: user.businessId } });
      if (!v) return jsonError("invalidVehicle");
    }

    const validUntilRaw = body.validUntil;
    const validUntil = validUntilRaw ? date(validUntilRaw) : null;

    const code = await issueRef(user.businessId, "quote");
    await db.quotation.create({
      data: {
        businessId: user.businessId,
        quoteCode: code,
        customerId: cId,
        vehicleId: vehicleId || null,
        summary: str(body.summary),
        rate,
        terms: str(body.terms) || null,
        status: "sent",
        validUntil: validUntil && !Number.isNaN(validUntil.getTime()) ? validUntil : null,
      },
    });

    return snapshotResponse(user, { code, createdCustomerId });
  });
}

/**
 * PUT /api/quotation — mark a quote accepted / rejected.
 * Body: { id, status: "accepted" | "rejected" }
 * (Accepting is done alongside creating the trip from the quote card.)
 */
export async function PUT(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);
    const id = str(body.id);
    const status = str(body.status);
    if (!id || !["accepted", "rejected"].includes(status)) return jsonError("fillAll");

    const existing = await db.quotation.findFirst({ where: { id, businessId: user.businessId } });
    if (!existing) return jsonError("invalidQuote", 404);
    if (existing.status !== "sent" && existing.status !== "draft") {
      return jsonError("invalidQuoteState");
    }

    await db.quotation.update({ where: { id }, data: { status } });
    return snapshotResponse(user);
  });
}
