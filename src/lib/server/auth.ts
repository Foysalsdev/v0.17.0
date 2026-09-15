import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "gk_session";
const SESSION_DAYS = 30;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = scryptSync(password, salt, 64);
  const target = Buffer.from(hash, "hex");
  return test.length === target.length && timingSafeEqual(test, target);
}

export interface SessionUser {
  id: string;
  name: string;
  phone: string;
  role: string;
  businessId: string;
  driverId: string | null; // linked driver profile (if role = driver)
}

/** Validate the session cookie from a request → session user or null. */
export async function getSessionUser(req: Request): Promise<SessionUser | null> {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  const token = match?.[1];
  if (!token) return null;

  const session = await db.session.findUnique({ where: { token }, include: { user: true } });
  if (!session || session.expiresAt < new Date() || !session.user.active) return null;

  // resolve the driver profile for driver-role users
  let driverId: string | null = null;
  if (session.user.role === "driver") {
    const driver = await db.driver.findFirst({
      where: { businessId: session.user.businessId, phone: session.user.phone },
      select: { id: true },
    });
    driverId = driver?.id ?? null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    phone: session.user.phone,
    role: session.user.role,
    businessId: session.user.businessId,
    driverId,
  };
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.session.create({ data: { token, userId, expiresAt } });
  return { token, expiresAt };
}

export async function destroySession(token: string): Promise<void> {
  await db.session.deleteMany({ where: { token } });
}
