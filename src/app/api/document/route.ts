import { db } from "@/lib/server/store";
import { withSession, snapshotResponse, jsonError, str, date } from "@/lib/server/route";

/** POST /api/document — { vehicleId, docType, docNumber?, expiryDate } */
export async function POST(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);
    const vehicleId = str(body.vehicleId);
    const docType = str(body.docType, "fitness");
    const expiryRaw = body.expiryDate;
    if (!vehicleId || !expiryRaw) return jsonError("fillAll");

    const vehicle = await db.vehicle.findFirst({ where: { id: vehicleId, businessId: user.businessId } });
    if (!vehicle) return jsonError("invalidVehicle");

    const expiryDate = date(expiryRaw);
    if (Number.isNaN(expiryDate.getTime())) return jsonError("fillAll");

    await db.vehicleDocument.create({
      data: {
        businessId: user.businessId,
        vehicleId,
        docType,
        docNumber: str(body.docNumber) || "—",
        // cloud issue_date has no DB default — always send one
        issueDate: body.issueDate ? date(body.issueDate) : new Date(),
        expiryDate,
      },
    });
    return snapshotResponse(user);
  });
}
