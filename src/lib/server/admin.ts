import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { resolveCloudAuthOnly } from "./cloud-auth";

/* ------------------------------------------------------------------ *
 * ADMIN PANEL (v0.16 → v1.0) — platform-owner console at /admin.
 *
 * Auth model — দুই পথ, দুটোই REAL:
 *   1) ACCOUNT (v1.0, primary): মালিক নিজের অ্যাকাউন্ট (ফোন+পাসওয়ার্ড)
 *      দিয়ে লগইন → profiles.is_platform_admin চেক → সেশন-কুকি।
 *   2) KEY (v0.16, fallback): GK_ADMIN_KEY shared key.
 * দুই ক্ষেত্রেই সফল লগইন = signed httpOnly cookie (12h). No secret in the
 * client bundle, ever (§39).
 *
 * Data model — read-only cross-tenant overview, ৩টি উৎস (priority):
 *   1) service-role REST (SUPABASE_SERVICE_ROLE secret, যদি সেট থাকে)
 *   2) platform_admin_overview() RPC — লগইন-করা প্ল্যাটফর্ম-অ্যাডমিনের
 *      নিজের টোকেন দিয়ে (security-definer, ভেতরে ফ্ল্যাগ-চেক) — service
 *      key ছাড়াই আসল ক্লাউড ডেটা
 *   3) local sandbox fallback (Prisma)
 * Never writes tenant data; no user password is ever returned to the
 * browser by these helpers.
 * ------------------------------------------------------------------ */

/** Typed error thrown when the RPC path fails in a way the route must
 *  surface (not silently fall back to local data). */
export class AdminRpcError extends Error {
  constructor(public kind: "notAdmin" | "missing" | "keyNoCloud") {
    super(kind);
  }
}


export const ADMIN_COOKIE = "gk_admin";
const ADMIN_HOURS = 12;
const MIN_KEY_LEN = 8;

function adminKey(): string {
  return process.env.GK_ADMIN_KEY ?? "";
}

export function adminKeyConfigured(): boolean {
  return adminKey().length >= MIN_KEY_LEN;
}

/** Timing-safe shared-key check (hash first → equal buffer lengths). */
export function verifyAdminKey(input: string): boolean {
  const key = adminKey();
  if (!key) return false;
  const a = createHmac("sha256", "gk-admin-verify").update(input).digest();
  const b = createHmac("sha256", "gk-admin-verify").update(key).digest();
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ---------- signed session token (exp.hmac) ---------- */

function sign(exp: number): string {
  return createHmac("sha256", adminKey()).update(`gk-admin:${exp}`).digest("hex");
}

export function issueAdminToken(): { token: string; expiresAt: Date } {
  const expiresAt = new Date(Date.now() + ADMIN_HOURS * 3600 * 1000);
  return { token: `${expiresAt.getTime()}.${sign(expiresAt.getTime())}`, expiresAt };
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token || !adminKeyConfigured()) return false;
  const [expRaw, sig] = token.split(".");
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  try {
    const a = Buffer.from(sig ?? "", "hex");
    const b = Buffer.from(sign(exp), "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Read + verify the admin cookie from a request. */
export function hasAdminSession(req: Request): boolean {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${ADMIN_COOKIE}=([^;]+)`));
  return verifyAdminToken(match?.[1]);
}

export function setAdminCookie(res: NextResponse, token: string, expiresAt: Date): void {
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearAdminCookie(res: NextResponse): void {
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

/* ---------- brute-force guard (in-memory, per-IP) ---------- */

const attempts = new Map<string, { n: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function rateLimitAdmin(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { n: 0, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (entry.n >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function recordAdminFailure(ip: string): void {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) attempts.set(ip, { n: 1, resetAt: now + WINDOW_MS });
  else entry.n += 1;
}

export function clearAdminFailures(ip: string): void {
  attempts.delete(ip);
}

/* ---------- overview data (read-only) ---------- */

export interface AdminStats {
  businesses: number;
  users: number;
  vehicles: number;
  trips30d: number;
  newUsers7d: number;
}

export interface AdminBusinessRow {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  plan: string;
  members: number;
  vehicles: number;
  trips30d: number;
  createdAt: string;
}

export interface AdminMemberRow {
  name: string;
  phone: string;
  role: string;
  businessName: string;
  joinedAt: string;
}

export interface AdminOverview {
  source: "cloud" | "local";
  stats: AdminStats;
  businesses: AdminBusinessRow[];
  members: AdminMemberRow[];
}

function serviceRoleKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    ""
  );
}

let serviceClient: SupabaseClient | null = null;
function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = serviceRoleKey();
  if (!url || !key) return null;
  if (!serviceClient) {
    serviceClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return serviceClient;
}

const daysAgoIso = (days: number): string => new Date(Date.now() - days * 86400000).toISOString();
const asIso = (v: unknown): string => {
  const d = new Date(String(v ?? ""));
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
};

/** Cross-tenant overview via the service-role client. Throws on REST errors. */
async function cloudOverview(): Promise<AdminOverview> {
  const c = getServiceClient();
  if (!c) throw new Error("service key missing");

  const since30 = daysAgoIso(30);
  const since7 = daysAgoIso(7);

  const [bizRes, memRes, profRes, vehRes, tripRes, userCountRes] = await Promise.all([
    c.from("businesses").select("id,name,owner_user_id,phone,email,address,plan,created_at").order("created_at", { ascending: false }).limit(200),
    c.from("business_members").select("business_id,user_id,role,status,joined_at").order("joined_at", { ascending: false }).limit(1000),
    c.from("profiles").select("id,full_name,phone,created_at").order("created_at", { ascending: false }).limit(1000),
    c.from("vehicles").select("business_id").limit(20000),
    c.from("trips").select("business_id").gte("created_at", since30).limit(20000),
    c.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const errors = [bizRes.error, memRes.error, profRes.error, vehRes.error, tripRes.error, userCountRes.error].filter(Boolean);
  if (errors.length) throw errors[0];

  type Biz = { id: string; name: string; owner_user_id: string; phone: string | null; email: string | null; address: string | null; plan: string; created_at: string };
  type Mem = { business_id: string; user_id: string; role: string; status: string; joined_at: string };
  type Prof = { id: string; full_name: string; phone: string | null; created_at: string };

  const businesses = (bizRes.data ?? []) as Biz[];
  const membersAll = (memRes.data ?? []) as Mem[];
  const profiles = (profRes.data ?? []) as Prof[];

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const bizById = new Map(businesses.map((b) => [b.id, b]));

  const vehCount = new Map<string, number>();
  for (const v of ((vehRes.data ?? []) as { business_id: string }[])) vehCount.set(v.business_id, (vehCount.get(v.business_id) ?? 0) + 1);
  const tripCount = new Map<string, number>();
  for (const t of ((tripRes.data ?? []) as { business_id: string }[])) tripCount.set(t.business_id, (tripCount.get(t.business_id) ?? 0) + 1);

  const memCount = new Map<string, number>();
  for (const m of membersAll) memCount.set(m.business_id, (memCount.get(m.business_id) ?? 0) + 1);

  const rows: AdminBusinessRow[] = businesses.map((b) => ({
    id: b.id,
    name: b.name,
    ownerName: profileById.get(b.owner_user_id)?.full_name || "—",
    phone: b.phone ?? profileById.get(b.owner_user_id)?.phone ?? "—",
    email: b.email ?? "—",
    address: b.address ?? "—",
    plan: b.plan,
    members: memCount.get(b.id) ?? 0,
    vehicles: vehCount.get(b.id) ?? 0,
    trips30d: tripCount.get(b.id) ?? 0,
    createdAt: asIso(b.created_at),
  }));

  const recentMembers: AdminMemberRow[] = membersAll
    .filter((m) => m.status === "active")
    .slice(0, 30)
    .map((m) => ({
      name: profileById.get(m.user_id)?.full_name || "—",
      phone: profileById.get(m.user_id)?.phone ?? "—",
      role: m.role,
      businessName: bizById.get(m.business_id)?.name ?? "—",
      joinedAt: asIso(m.joined_at),
    }));

  const newUsers7d = profiles.filter((p) => asIso(p.created_at) >= since7).length;

  return {
    source: "cloud",
    stats: {
      businesses: businesses.length,
      users: userCountRes.count ?? profiles.length,
      vehicles: vehRes.data?.length ?? 0,
      trips30d: tripRes.data?.length ?? 0,
      newUsers7d,
    },
    businesses: rows,
    members: recentMembers,
  };
}

/** Sandbox/offline overview from the local SQLite store. Throws if DB unavailable. */
async function localOverview(): Promise<AdminOverview> {
  const since30 = new Date(Date.now() - 30 * 86400000);
  const since7 = new Date(Date.now() - 7 * 86400000);

  const businesses = await db.business.findMany({ orderBy: { createdAt: "desc" } });
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });
  const vehicles = await db.vehicle.findMany({ select: { businessId: true } });
  const trips = await db.trip.findMany({ where: { createdAt: { gte: since30 } }, select: { businessId: true } });

  const vehCount = new Map<string, number>();
  for (const v of vehicles) vehCount.set(v.businessId, (vehCount.get(v.businessId) ?? 0) + 1);
  const tripCnt = new Map<string, number>();
  for (const t of trips) tripCnt.set(t.businessId, (tripCnt.get(t.businessId) ?? 0) + 1);
  const memCount = new Map<string, number>();
  for (const u of users) memCount.set(u.businessId, (memCount.get(u.businessId) ?? 0) + 1);

  const bizById = new Map(businesses.map((b) => [b.id, b]));

  const rows: AdminBusinessRow[] = businesses.map((b) => {
    const owner = users.find((u) => u.businessId === b.id && u.role === "owner");
    return {
      id: b.id,
      name: b.name,
      ownerName: b.ownerName || owner?.name || "—",
      phone: b.phone || owner?.phone || "—",
      email: owner?.email ?? "—",
      address: b.address ?? "—",
      plan: b.plan,
      members: memCount.get(b.id) ?? 0,
      vehicles: vehCount.get(b.id) ?? 0,
      trips30d: tripCnt.get(b.id) ?? 0,
      createdAt: asIso(b.createdAt),
    };
  });

  const recentMembers: AdminMemberRow[] = users.slice(0, 30).map((u) => ({
    name: u.name,
    phone: u.phone,
    role: u.role,
    businessName: bizById.get(u.businessId)?.name ?? "—",
    joinedAt: asIso(u.createdAt),
  }));

  return {
    source: "local",
    stats: {
      businesses: businesses.length,
      users: users.length,
      vehicles: vehicles.length,
      trips30d: trips.length,
      newUsers7d: users.filter((u) => new Date(u.createdAt) >= since7).length,
    },
    businesses: rows,
    members: recentMembers,
  };
}

/* ---------- overview via platform_admin_overview() RPC (v1.0) ----------
 * লগইন-করা অ্যাকাউন্টের নিজের টোকেন দিয়ে ডাকা হয় — RPC-টি security-definer
 * এবং ভেতরে profiles.is_platform_admin যাচাই করে, তাই service key ছাড়াই
 * শুধু অ্যাডমিন-ফ্ল্যাগ-ওয়ালা অ্যাকাউন্টই cross-tenant ডেটা পায়। */

interface RpcBizRow {
  id: string; name: string; owner_name: string | null; phone: string | null;
  email: string | null; address: string | null; plan: string; created_at: string;
  members: number; vehicles: number; trips30d: number;
}
interface RpcMemberRow {
  name: string | null; phone: string | null; role: string;
  business_name: string; joined_at: string;
}
interface RpcOverviewJson {
  stats: { businesses: number; users: number; vehicles: number; trips30d: number; newUsers7d: number };
  businesses: RpcBizRow[];
  members: RpcMemberRow[];
}

async function rpcOverview(client: SupabaseClient): Promise<AdminOverview> {
  const { data, error } = await client.rpc("platform_admin_overview");
  if (error) {
    const code = String((error as { code?: string }).code ?? "");
    const msg = String(error.message ?? "");
    // 42501 = raise exception 'not_platform_admin' (SQL F-৩-এর চেক)
    if (code === "42501" || msg.includes("not_platform_admin")) {
      throw new AdminRpcError("notAdmin");
    }
    // PGRST202 / 404 = RPC-ই নেই (SQL এখনো চালানো হয়নি)
    if (code === "PGRST202" || msg.includes("Could not find the function") || msg.includes("schema cache")) {
      throw new AdminRpcError("missing");
    }
    throw error;
  }
  const json = (typeof data === "string" ? JSON.parse(data) : data) as RpcOverviewJson;
  return {
    source: "cloud",
    stats: {
      businesses: Number(json.stats?.businesses ?? 0),
      users: Number(json.stats?.users ?? 0),
      vehicles: Number(json.stats?.vehicles ?? 0),
      trips30d: Number(json.stats?.trips30d ?? 0),
      newUsers7d: Number(json.stats?.newUsers7d ?? 0),
    },
    businesses: (json.businesses ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      ownerName: b.owner_name || "—",
      phone: b.phone || "—",
      email: b.email || "—",
      address: b.address || "—",
      plan: b.plan || "free",
      members: Number(b.members ?? 0),
      vehicles: Number(b.vehicles ?? 0),
      trips30d: Number(b.trips30d ?? 0),
      createdAt: asIso(b.created_at),
    })),
    members: (json.members ?? []).map((m) => ({
      name: m.name || "—",
      phone: m.phone || "—",
      role: m.role,
      businessName: m.business_name || "—",
      joinedAt: asIso(m.joined_at),
    })),
  };
}

export interface AdminOverviewResult {
  overview: AdminOverview;
  /** ডেটা আসলে কোথা থেকে/কী কনফিগ বাকি — অ্যাডমিন UI-তে ওয়ার্নিং হিসেবে দেখায়। */
  warning?: "adminWarnLocal" | "adminSetupMissing";
}

/** Best available overview: service-role cloud → session RPC → local.
 *  RPC "notAdmin" সোজা throw হয় (route 403 দেখায়); "missing" হলে লোকালে
 *  পড়ে সেটআপ-ওয়ার্নিং সহ ফেরে।
 *  ক্লাউড-মোডে key-login (সেশন-কুকি নেই) কখনোই লোকাল ডেমো দেখায় না —
 *  স্পষ্ট নির্দেশনা ফেরে (adminKeyNoCloud) যেন ডেমো/আসল কনফিউশন না হয়। */
export async function adminOverview(req?: Request): Promise<AdminOverviewResult> {
  if (getServiceClient()) return { overview: await cloudOverview() };

  let rpcMissing = false;
  if (req) {
    let session: Awaited<ReturnType<typeof resolveCloudAuthOnly>> = null;
    try {
      session = await resolveCloudAuthOnly(req);
    } catch {
      session = null;
    }
    if (session) {
      try {
        // notAdmin → এখান থেকেই throw (route 403 করবে)
        return { overview: await rpcOverview(session.client) };
      } catch (e) {
        if (e instanceof AdminRpcError && e.kind === "notAdmin") throw e;
        rpcMissing = true; // RPC নেই / অন্য RPC-error → লোকাল + সেটআপ-ওয়ার্নিং
      }
    } else if (process.env.GK_BACKEND === "supabase") {
      // ক্লাউড-মোড + key-login + service-role নেই → ডেমো ডেটা নয়,
      // স্পষ্ট বার্তা: অ্যাকাউন্ট দিয়ে লগইন করুন
      throw new AdminRpcError("keyNoCloud");
    }
  }

  try {
    return { overview: await localOverview(), warning: rpcMissing ? "adminSetupMissing" : "adminWarnLocal" };
  } catch {
    // local Prisma-ও নেই (যেমন worker-এ) → আসল কারণটা বলুন
    if (rpcMissing) throw new AdminRpcError("missing");
    throw new Error("no admin data source");
  }
}
