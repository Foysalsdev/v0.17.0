import { db } from "@/lib/server/store";
import { withSession, snapshotResponse, jsonError, str, int } from "@/lib/server/route";
import { FUEL_TYPES, type FuelType } from "@/lib/types";

/**
 * POST /api/vehicle — { name, regNumber, brand?, model?, year?, fuelTypes,
 *                       transmission?, engineCc?, seats?, color?, currentKm?, purchasePrice? }
 * fuelTypes = multi-select list (ডুয়াল-ফুয়েল: পেট্রোল+CNG সাধারণ)।
 * DB-তে comma-joined string হিসেবে থাকে — পুরনো single-value row-ও ঠিক পড়া যায়।
 */

/** body → validated ordered unique fuel list (min 1)। পুরনো fuelType string-ও গ্রহণ করে। */
function parseFuelTypes(body: Record<string, unknown>): FuelType[] {
  const raw = Array.isArray(body.fuelTypes)
    ? body.fuelTypes.map((x) => String(x))
    : typeof body.fuelType === "string" ? body.fuelType.split(",") : [];
  const list: FuelType[] = [];
  for (const v of raw) {
    const s = v.trim() as FuelType;
    if (FUEL_TYPES.includes(s) && !list.includes(s)) list.push(s);
  }
  return list.length ? list : ["diesel"];
}

export async function POST(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);
    const name = str(body.name);
    const regNumber = str(body.regNumber);
    const fuelType = parseFuelTypes(body).join(",");
    if (!name || !regNumber) return jsonError("fillAll");

    // vehicle limit guard (free plan = 2 গাড়ি as a soft nudge, keep simple)
    const count = await db.vehicle.count({ where: { businessId: user.businessId } });
    if (user.role === "owner" && count >= 50) return jsonError("vehicleLimitReached");

    const vehicle = await db.vehicle.create({
      data: {
        businessId: user.businessId,
        name,
        regNumber,
        brand: str(body.brand, "Toyota"),
        model: str(body.model),
        year: int(body.year, new Date().getFullYear() - 5),
        fuelType,
        transmission: str(body.transmission, "manual"),
        engineCc: int(body.engineCc, 0),
        seats: int(body.seats, 4),
        color: str(body.color),
        currentKm: int(body.currentKm, 0),
        purchasePrice: int(body.purchasePrice, 0),
        currentValue: int(body.purchasePrice, 0),
        status: "available",
      },
    });
    return snapshotResponse(user, { vehicleId: vehicle.id });
  });
}

/**
 * PUT /api/vehicle — edit an existing vehicle (owner round 3).
 * { id, name, regNumber, brand?, model?, year?, fuelTypes, transmission?,
 *   engineCc?, seats?, color?, currentKm?, purchasePrice? }
 * Status is intentionally NOT editable here — it changes through trips / service.
 */
export async function PUT(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);
    const id = str(body.id);
    const name = str(body.name);
    const regNumber = str(body.regNumber);
    const fuelType = parseFuelTypes(body).join(",");
    if (!id || !name || !regNumber) return jsonError("fillAll");

    const existing = await db.vehicle.findFirst({ where: { id, businessId: user.businessId } });
    if (!existing) return jsonError("invalidVehicle", 404);

    await db.vehicle.update({
      where: { id },
      data: {
        name,
        regNumber,
        brand: str(body.brand, "Toyota"),
        model: str(body.model),
        year: int(body.year, existing.year),
        fuelType,
        transmission: str(body.transmission, existing.transmission),
        engineCc: int(body.engineCc, existing.engineCc),
        seats: int(body.seats, existing.seats),
        color: str(body.color),
        currentKm: int(body.currentKm, existing.currentKm),
        purchasePrice: int(body.purchasePrice, existing.purchasePrice),
        currentValue: int(body.purchasePrice, existing.currentValue),
      },
    });
    return snapshotResponse(user);
  });
}
