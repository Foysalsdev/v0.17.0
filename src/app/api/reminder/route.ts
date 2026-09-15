import { db, backendMode, getCloudClient } from "@/lib/server/store";
import { db as prismaDb } from "@/lib/db";
import { withSession, snapshotResponse, jsonError, str, date } from "@/lib/server/route";

/**
 * POST /api/reminder — { title, notes?, dueAt (ISO date+TIME), tripId? }
 * The owner/manager sets a reminder WITH a time (v0.9 — "Time soho Lagbe").
 */
export async function POST(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);

    const title = str(body.title);
    if (!title) return jsonError("fillAll");

    const dueAt = date(body.dueAt);
    if (Number.isNaN(dueAt.getTime())) return jsonError("fillAll");

    const tripId = str(body.tripId) || null;
    if (tripId) {
      const trip = await db.trip.findFirst({ where: { id: tripId, businessId: user.businessId } });
      if (!trip) return jsonError("invalidTrip");
    }

    await db.reminder.create({
      data: {
        businessId: user.businessId,
        title,
        notes: str(body.notes) || null,
        tripId,
        dueAt,
        done: false,
      },
    });
    return snapshotResponse(user);
  });
}

/** PUT /api/reminder — { id, done } completes / re-opens a reminder. */
export async function PUT(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);
    const id = str(body.id);
    if (!id) return jsonError("fillAll");
    const existing = await db.reminder.findFirst({ where: { id, businessId: user.businessId } });
    if (!existing) return jsonError("notFound", 404);
    await db.reminder.update({
      where: { id },
      data: { done: body.done === false ? false : true },
    });
    return snapshotResponse(user);
  });
}

/** DELETE /api/reminder — { id } truly removes a reminder (both modes). */
export async function DELETE(req: Request) {
  return withSession(req, async (user, body) => {
    if (user.role === "driver") return jsonError("forbidden", 403);
    const id = str(body.id);
    if (!id) return jsonError("fillAll");

    /* ---------- CLOUD ---------- */
    if (backendMode() === "cloud") {
      const c = getCloudClient();
      const { error } = await c.from("reminders")
        .delete().eq("business_id", user.businessId).eq("id", id);
      if (error) throw new Error(error.message);
      return snapshotResponse(user);
    }

    /* ---------- LOCAL ---------- */
    const existing = await db.reminder.findFirst({ where: { id, businessId: user.businessId } });
    if (!existing) return jsonError("notFound", 404);
    await prismaDb.reminder.delete({ where: { id } });
    return snapshotResponse(user);
  });
}
