/**
 * Dual-mode data layer — the ONE `db` every route uses (local OR cloud).
 *
 * LOCAL  → Prisma (SQLite): exact pass-through of the call shapes the routes
 *           already use (findFirst/findMany/findUnique/create/createMany/
 *           update/count) — zero behavior change for the running app.
 * CLOUD  → Supabase Postgres through RLS-scoped queries that carry the
 *           signed-in user's token (AsyncLocalStorage request context).
 *           Column names snake_case, enum differences and date columns are
 *           mapped here so the rest of the app never knows the backend.
 *
 * Mode switch: GK_BACKEND=supabase in .env.local (+ Supabase env configured).
 * Default: local — the sandbox/offline app keeps working unchanged.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import * as prismaLib from "@/lib/db";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const prisma = prismaLib.db;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const CLOUD_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_KEY);

export type BackendMode = "local" | "cloud";

/** Deploy-time flag (evaluated once per process; changing it = rebuild). */
export function backendMode(): BackendMode {
  return process.env.GK_BACKEND === "supabase" && CLOUD_CONFIGURED ? "cloud" : "local";
}

/* ------------------------------------------------------------------ *
 * Request context (cloud only): the per-request Supabase client with
 * the user's session set — every query then runs under RLS as that user.
 * ------------------------------------------------------------------ */
const als = new AsyncLocalStorage<{ client: SupabaseClient }>();

export async function runWithCloud<T>(client: SupabaseClient, fn: () => Promise<T>): Promise<T> {
  return als.run({ client }, fn);
}

function cloudClient(): SupabaseClient {
  const ctx = als.getStore();
  if (!ctx) throw new Error("[store] cloud query outside a request context");
  return ctx.client;
}

/** The request-scoped Supabase client (for raw cloud calls inside withSession handlers). */
export function getCloudClient(): SupabaseClient {
  return cloudClient();
}

/** Postgres error code from a PostgREST error (e.g. 23P01 exclusion violation). */
export function dbErrorCode(e: unknown): string | null {
  if (e && typeof e === "object" && "code" in e) {
    const c = (e as { code?: unknown }).code;
    if (typeof c === "string") return c;
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Row shapes (backend-agnostic — what routes & snapshot consume)
 * ------------------------------------------------------------------ */
export interface BusinessRow {
  id: string; name: string; ownerName: string; phone: string; address: string;
  plan: string; tripSeq: number; quoteSeq: number; createdAt: Date;
}
export interface UserRow {
  id: string; businessId: string; name: string; phone: string; email?: string | null; role: string;
  passwordHash: string; active: boolean; createdAt: Date;
}
export interface VehicleRow {
  id: string; businessId: string; name: string; regNumber: string; brand: string;
  model: string; year: number; fuelType: string; transmission: string; engineCc: number;
  seats: number; color: string; currentKm: number; status: string;
  purchasePrice: number; currentValue: number; createdAt: Date;
}
export interface VehicleDocumentRow {
  id: string; businessId: string; vehicleId: string; docType: string; docNumber: string;
  issueDate: Date; expiryDate: Date; notes: string | null;
  /** cloud-এ কিছু পুরনো রো-তে issue_date ফাঁকা — তখন created_at fallback। */
  createdAt?: Date;
}
export interface CustomerRow {
  id: string; businessId: string; name: string; phone: string;
  company: string | null; address: string | null; createdAt: Date;
}
export interface DriverRow {
  id: string; businessId: string; name: string; phone: string; licenseNo: string;
  licenseExpiry: Date | null; joiningDate: Date; salary: number; advance: number;
  active: boolean; createdAt: Date;
}
export interface TripRow {
  id: string; businessId: string; ref: string; customerId: string; vehicleId: string;
  driverId: string | null; from: string; to: string; startAt: Date; endAt: Date;
  rentalType: string; fare: number; advance: number; status: string;
  startKm: number | null; endKm: number | null; notes: string | null; createdAt: Date;
}
export interface TripExpenseRow {
  id: string; businessId: string; tripId: string; category: string;
  amount: number; notes: string | null;
}
export interface FuelEntryRow {
  id: string; businessId: string; vehicleId: string; date: Date; odometerKm: number;
  litres: number; pricePerLitre: number; station: string; driverId: string | null;
}
export interface MaintenanceScheduleItemRow {
  id: string; businessId: string; vehicleId: string; item: string;
  lastServiceKm: number; lastServiceDate: Date; intervalKm: number;
}
export interface MaintenanceLogRow {
  id: string; businessId: string; vehicleId: string; item: string; date: Date;
  km: number; cost: number; workshop: string; notes: string | null;
}
export interface IncomeEntryRow {
  id: string; businessId: string; date: Date; category: string; customerId: string | null;
  vehicleId: string | null; tripId: string | null; amount: number; method: string;
}
export interface ExpenseEntryRow {
  id: string; businessId: string; date: Date; category: string; vehicleId: string | null;
  amount: number; paidTo: string | null; method: string;
}
export interface QuotationRow {
  id: string; businessId: string; quoteCode: string; customerId: string;
  vehicleId: string | null; summary: string; rate: number; terms: string | null;
  status: string; validUntil: Date | null; createdAt: Date;
}
export interface ReminderRow {
  id: string; businessId: string; title: string; notes: string | null;
  tripId: string | null; dueAt: Date; done: boolean; createdAt: Date;
}

/* ------------------------------------------------------------------ *
 * Query shapes (the subset of Prisma syntax the routes actually use)
 * ------------------------------------------------------------------ */
type Cond = { in: unknown[] } | { lt: unknown } | { gt: unknown } | { not: unknown };
export type Where = Record<string, unknown | Cond>;
export type Order = Record<string, "asc" | "desc">;

export interface TableHandle<R> {
  findFirst(args: { where?: Where }): Promise<R | null>;
  findMany(args: { where?: Where; orderBy?: Order }): Promise<R[]>;
  findUnique(args: { where: { id?: string; phone?: string; email?: string } }): Promise<R | null>;
  create(args: { data: Record<string, unknown> }): Promise<R>;
  createMany(args: { data: Record<string, unknown>[] }): Promise<void>;
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<R>;
  count(args: { where?: Where }): Promise<number>;
}

export interface Db {
  business: TableHandle<BusinessRow>;
  user: TableHandle<UserRow>;
  vehicle: TableHandle<VehicleRow>;
  vehicleDocument: TableHandle<VehicleDocumentRow>;
  customer: TableHandle<CustomerRow>;
  driver: TableHandle<DriverRow>;
  trip: TableHandle<TripRow>;
  tripExpense: TableHandle<TripExpenseRow>;
  fuelEntry: TableHandle<FuelEntryRow>;
  maintenanceScheduleItem: TableHandle<MaintenanceScheduleItemRow>;
  maintenanceLog: TableHandle<MaintenanceLogRow>;
  incomeEntry: TableHandle<IncomeEntryRow>;
  expenseEntry: TableHandle<ExpenseEntryRow>;
  quotation: TableHandle<QuotationRow>;
  reminder: TableHandle<ReminderRow>;
}

/* ------------------------------------------------------------------ *
 * LOCAL engine — a typed pass-through to Prisma delegates.
 * Delegate LAZY getter — PrismaClient প্রথম কলে তৈরি হয় (cloud মোডে
 * কখনো নয়): module-load-এ কোনো prisma access হয় না।
 * ------------------------------------------------------------------ */
function localTable<R>(getDelegate: () => {
  findFirst(args: unknown): Promise<R | null>;
  findMany(args: unknown): Promise<R[]>;
  findUnique(args: unknown): Promise<R | null>;
  create(args: unknown): Promise<R>;
  createMany(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<R>;
  count(args: unknown): Promise<number>;
}): TableHandle<R> {
  const run = <T>(fn: (d: ReturnType<typeof getDelegate>) => Promise<T>) => fn(getDelegate());
  return {
    findFirst: (args) => run((d) => d.findFirst(args)),
    findMany: (args) => run((d) => d.findMany(args)),
    findUnique: (args) => run((d) => d.findUnique(args)),
    create: (args) => run((d) => d.create(args)),
    createMany: (args) => run((d) => d.createMany(args) as unknown as Promise<void>),
    update: (args) => run((d) => d.update(args)),
    count: (args) => run((d) => d.count(args)),
  };
}

const localDb: Db = {
  business: localTable<BusinessRow>(() => prisma.business as never),
  user: localTable<UserRow>(() => prisma.user as never),
  vehicle: localTable<VehicleRow>(() => prisma.vehicle as never),
  vehicleDocument: localTable<VehicleDocumentRow>(() => prisma.vehicleDocument as never),
  customer: localTable<CustomerRow>(() => prisma.customer as never),
  driver: localTable<DriverRow>(() => prisma.driver as never),
  trip: localTable<TripRow>(() => prisma.trip as never),
  tripExpense: localTable<TripExpenseRow>(() => prisma.tripExpense as never),
  fuelEntry: localTable<FuelEntryRow>(() => prisma.fuelEntry as never),
  maintenanceScheduleItem: localTable<MaintenanceScheduleItemRow>(() => prisma.maintenanceScheduleItem as never),
  maintenanceLog: localTable<MaintenanceLogRow>(() => prisma.maintenanceLog as never),
  incomeEntry: localTable<IncomeEntryRow>(() => prisma.incomeEntry as never),
  expenseEntry: localTable<ExpenseEntryRow>(() => prisma.expenseEntry as never),
  quotation: localTable<QuotationRow>(() => prisma.quotation as never),
  reminder: localTable<ReminderRow>(() => prisma.reminder as never),
};

/* ------------------------------------------------------------------ *
 * CLOUD engine — column mapping + PostgREST builders
 * ------------------------------------------------------------------ */
interface CloudSpec {
  table: string;
  /** camelCase → cloud column (complete list = the row shape returned). */
  cols: Record<string, string>;
  /** camelCase fields that are Date locally (converted both ways). */
  dates?: string[];
  /** camelCase fields coerced to Number on read (numeric columns). */
  numeric?: string[];
  /** local enum value → cloud enum value, per field. */
  enumWrite?: Record<string, Record<string, string>>;
  /** cloud enum value → local enum value, per field. */
  enumRead?: Record<string, Record<string, string>>;
  /** extra cloud columns computed at insert time (e.g. fuel total_cost). */
  extraWrite?: (data: Record<string, unknown>) => Record<string, unknown>;
}

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`).replace(/^-/, "");

function toDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return v;
  const s = String(v);
  return new Date(s.length === 10 ? `${s}T00:00:00.000Z` : s);
}

/** doc_type: local "permit" ↔ cloud "route_permit" (enum sets differ slightly). */
const DOC_TYPE: Record<string, string> = { permit: "route_permit", route_permit: "permit" };
/** expense/trip-expense categories: local "other"→cloud "misc", "loan"→"loan_emi". */
const EXPENSE_CAT: Record<string, string> = { other: "misc", misc: "other", loan: "loan_emi", loan_emi: "loan" };

function cloudQuery(spec: CloudSpec) {
  return cloudClient().from(spec.table);
}

function wVal(spec: CloudSpec, key: string, v: unknown): unknown {
  if (v instanceof Date) return v.toISOString();
  const map = spec.enumWrite?.[key];
  if (map && typeof v === "string") return map[v] ?? v;
  return v;
}

function applyWhere(builder: any, spec: CloudSpec, where?: Where) {
  let b = builder;
  if (!where) return b;
  for (const [key, cond] of Object.entries(where)) {
    const col = spec.cols[key] ?? snake(key);
    const isObj = cond !== null && typeof cond === "object" && !Array.isArray(cond);
    if (isObj) {
      const c = cond as Record<string, unknown>;
      if (Array.isArray(c.in)) b = b.in(col, c.in.map((v) => wVal(spec, key, v)));
      else if ("lt" in c) b = b.lt(col, wVal(spec, key, c.lt));
      else if ("gt" in c) b = b.gt(col, wVal(spec, key, c.gt));
      else if ("not" in c) b = b.neq(col, wVal(spec, key, c.not));
    } else if (cond === null) b = b.is(col, null);
    else b = b.eq(col, wVal(spec, key, cond));
  }
  return b;
}

function applyOrder(builder: any, spec: CloudSpec, orderBy?: Order) {
  let b = builder;
  if (!orderBy) return b;
  for (const [key, dir] of Object.entries(orderBy)) {
    b = b.order(spec.cols[key] ?? snake(key), { ascending: dir === "asc" });
  }
  return b;
}

function mapWrite(spec: CloudSpec, data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    const col = spec.cols[k] ?? snake(k);
    out[col] = v instanceof Date ? v.toISOString() : wVal(spec, k, v);
  }
  if (spec.extraWrite) Object.assign(out, spec.extraWrite(data));
  return out;
}

function mapRead(spec: CloudSpec, row: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!row) return null;
  const out: Record<string, unknown> = {};
  for (const [camel, col] of Object.entries(spec.cols)) {
    if (!(col in row)) continue;
    let v = row[col];
    if (spec.dates?.includes(camel)) v = toDate(v);
    else if (spec.numeric?.includes(camel) && typeof v === "string") v = Number(v);
    else if (spec.enumRead?.[camel] && typeof v === "string") v = spec.enumRead[camel][v] ?? v;
    out[camel] = v ?? null;
  }
  return out;
}

function cloudError(e: { message?: string; code?: string; details?: string; hint?: string }): Error {
  const err = new Error(`[cloud ${e.code ?? ""}] ${e.message ?? "query failed"}`) as Error & { code?: string };
  err.code = e.code ?? undefined;
  return err;
}

function cloudTable<R>(spec: CloudSpec): TableHandle<R> {
  return {
    async findFirst({ where }) {
      const { data, error } = await applyWhere(cloudQuery(spec).select("*"), spec, where).limit(1);
      if (error) throw cloudError(error);
      return mapRead(spec, data?.[0] ?? null) as R | null;
    },
    async findMany({ where, orderBy }) {
      let b = applyWhere(cloudQuery(spec).select("*"), spec, where);
      b = applyOrder(b, spec, orderBy);
      const { data, error } = await b;
      if (error) throw cloudError(error);
      return (data ?? []).map((r: Record<string, unknown>) => mapRead(spec, r)) as R[];
    },
    async findUnique({ where }) {
      if (!where.id) return null;
      const { data, error } = await cloudQuery(spec).select("*").eq("id", where.id).maybeSingle();
      if (error) throw cloudError(error);
      return mapRead(spec, data ?? null) as R | null;
    },
    async create({ data }) {
      const { data: rows, error } = await cloudQuery(spec).insert(mapWrite(spec, data)).select("*").single();
      if (error) throw cloudError(error);
      return mapRead(spec, rows) as R;
    },
    async createMany({ data }) {
      const { error } = await cloudQuery(spec).insert(data.map((r) => mapWrite(spec, r)));
      if (error) throw cloudError(error);
    },
    async update({ where, data }) {
      const { data: rows, error } = await cloudQuery(spec).update(mapWrite(spec, data)).eq("id", where.id).select("*");
      if (error) throw cloudError(error);
      const row = (rows ?? [])[0];
      if (!row) throw new Error(`[cloud] update matched nothing (id=${where.id})`);
      return mapRead(spec, row) as R;
    },
    async count({ where }) {
      const b = applyWhere(cloudQuery(spec).select("id", { count: "exact", head: true }), spec, where);
      const { count, error } = await b;
      if (error) throw cloudError(error);
      return count ?? 0;
    },
  };
}

/* ---- per-table cloud specs (mirrors supabase/migrations/0001_schema.sql) ---- */
const SPEC_BUSINESS_TABLE = "businesses";
const businessSpec: CloudSpec = {
  table: SPEC_BUSINESS_TABLE,
  cols: { id: "id", name: "name", ownerName: "owner_name", phone: "phone", address: "address", plan: "plan", tripSeq: "trip_seq", quoteSeq: "quote_seq", createdAt: "created_at" },
  dates: ["createdAt"],
};
const vehicleSpec: CloudSpec = {
  table: "vehicles",
  cols: {
    id: "id", businessId: "business_id", name: "name", regNumber: "reg_number", brand: "brand",
    model: "model", year: "model_year", fuelType: "fuel_type", transmission: "transmission",
    engineCc: "engine_cc", seats: "seats", color: "color", currentKm: "current_km", status: "status",
    purchasePrice: "purchase_price", currentValue: "current_value", createdAt: "created_at",
  },
  dates: ["createdAt"],
  numeric: ["year", "engineCc", "seats", "currentKm", "purchasePrice", "currentValue"],
};
const documentSpec: CloudSpec = {
  table: "vehicle_documents",
  cols: {
    id: "id", businessId: "business_id", vehicleId: "vehicle_id", docType: "doc_type",
    docNumber: "doc_number", issueDate: "issue_date", expiryDate: "expiry_date", notes: "notes",
  },
  dates: ["issueDate", "expiryDate"],
  enumWrite: { docType: DOC_TYPE },
  enumRead: { docType: DOC_TYPE },
};
const customerSpec: CloudSpec = {
  table: "customers",
  cols: { id: "id", businessId: "business_id", name: "name", phone: "phone", company: "company", address: "address", createdAt: "created_at" },
  dates: ["createdAt"],
};
const driverSpec: CloudSpec = {
  table: "drivers",
  cols: {
    id: "id", businessId: "business_id", name: "name", phone: "phone", licenseNo: "license_no",
    licenseExpiry: "license_expiry", joiningDate: "joining_date", salary: "salary", advance: "advance",
    active: "is_active", createdAt: "created_at",
  },
  dates: ["licenseExpiry", "joiningDate", "createdAt"],
  numeric: ["salary", "advance"],
};
const tripSpec: CloudSpec = {
  table: "trips",
  cols: {
    id: "id", businessId: "business_id", ref: "trip_code", customerId: "customer_id", vehicleId: "vehicle_id",
    driverId: "driver_id", from: "pickup", to: "destination", startAt: "start_at", endAt: "end_at",
    rentalType: "rental_type", fare: "total_amount", advance: "advance_amount", status: "status",
    startKm: "start_km", endKm: "end_km", notes: "notes", createdAt: "created_at",
  },
  dates: ["startAt", "endAt", "createdAt"],
  numeric: ["fare", "advance", "startKm", "endKm"],
  // keep the cloud column honest at insert time: initial due = fare − advance
  extraWrite: (d) => ({ due_amount: Math.max(0, Number(d.fare ?? 0) - Number(d.advance ?? 0)) }),
};
const tripExpenseSpec: CloudSpec = {
  table: "trip_expenses",
  cols: { id: "id", businessId: "business_id", tripId: "trip_id", category: "category", amount: "amount", notes: "notes" },
  numeric: ["amount"],
  enumWrite: { category: EXPENSE_CAT },
  enumRead: { category: EXPENSE_CAT },
};
const fuelSpec: CloudSpec = {
  table: "fuel_entries",
  cols: {
    id: "id", businessId: "business_id", vehicleId: "vehicle_id", date: "entry_date", odometerKm: "odometer_km",
    litres: "litres", pricePerLitre: "price_per_litre", station: "station", driverId: "driver_id",
  },
  dates: ["date"],
  numeric: ["odometerKm", "litres", "pricePerLitre"],
  extraWrite: (d) => ({ total_cost: Math.round(Number(d.litres ?? 0) * Number(d.pricePerLitre ?? 0)) }),
};
const maintScheduleSpec: CloudSpec = {
  table: "maintenance_schedule",
  cols: {
    id: "id", businessId: "business_id", vehicleId: "vehicle_id", item: "item",
    lastServiceKm: "last_service_km", lastServiceDate: "last_service_date", intervalKm: "interval_km",
  },
  dates: ["lastServiceDate"],
  numeric: ["lastServiceKm", "intervalKm"],
};
const maintLogSpec: CloudSpec = {
  table: "maintenance_logs",
  cols: {
    id: "id", businessId: "business_id", vehicleId: "vehicle_id", item: "item", date: "service_date",
    km: "service_km", cost: "total_cost", workshop: "workshop", notes: "notes",
  },
  dates: ["date"],
  numeric: ["km", "cost"],
};
const incomeSpec: CloudSpec = {
  table: "incomes",
  cols: {
    id: "id", businessId: "business_id", date: "income_date", category: "category", customerId: "customer_id",
    vehicleId: "vehicle_id", tripId: "trip_id", amount: "amount", method: "payment_method",
  },
  dates: ["date"],
  numeric: ["amount"],
};
const expenseSpec: CloudSpec = {
  table: "expenses",
  cols: {
    id: "id", businessId: "business_id", date: "expense_date", category: "category", vehicleId: "vehicle_id",
    amount: "amount", paidTo: "vendor", method: "payment_method",
  },
  dates: ["date"],
  numeric: ["amount"],
  enumWrite: { category: EXPENSE_CAT },
  enumRead: { category: EXPENSE_CAT },
};
const quotationSpec: CloudSpec = {
  table: "quotations",
  cols: {
    id: "id", businessId: "business_id", quoteCode: "quote_code", customerId: "customer_id",
    vehicleId: "vehicle_id", summary: "trip_summary", rate: "rate", terms: "terms",
    status: "status", validUntil: "valid_until", createdAt: "created_at",
  },
  dates: ["validUntil", "createdAt"],
  numeric: ["rate"],
};
/* Cloud reminders — v0.9 patch SQL adds due_at/trip_id/done columns + write
 * policies (chat-delivered). Legacy NOT NULL columns are satisfied via extraWrite. */
const reminderSpec: CloudSpec = {
  table: "reminders",
  cols: {
    id: "id", businessId: "business_id", title: "title", notes: "message",
    tripId: "trip_id", dueAt: "due_at", done: "done", createdAt: "created_at",
  },
  dates: ["dueAt", "createdAt"],
  extraWrite: (d) => {
    const due = d.dueAt instanceof Date ? d.dueAt : new Date(String(d.dueAt ?? ""));
    const dateOnly = (Number.isNaN(due.getTime()) ? new Date() : due).toISOString().slice(0, 10);
    return { r_type: "other", severity: "info", status: d.done ? "done" : "pending", due_date: dateOnly };
  },
};

/** Cloud businesses: ownerName lives in profiles (joined here once). */
const cloudBusiness: TableHandle<BusinessRow> = {
  async findFirst({ where }) {
    return cloudBusiness.findUnique({ where: { id: String(where?.id ?? "") } });
  },
  async findUnique({ where }) {
    const c = cloudClient();
    const { data, error } = await c.from("businesses").select("*").eq("id", where.id).maybeSingle();
    if (error) throw cloudError(error);
    if (!data) return null;
    let ownerName = "";
    try {
      const { data: member } = await c.from("business_members")
        .select("user_id").eq("business_id", where.id).eq("role", "owner").limit(1);
      if (member?.[0]?.user_id) {
        const { data: profile } = await c.from("profiles").select("full_name").eq("id", member[0].user_id).maybeSingle();
        ownerName = profile?.full_name ?? "";
      }
    } catch { /* owner name is cosmetic — never fail the snapshot for it */ }
    return {
      id: data.id, name: data.name, ownerName,
      phone: data.phone ?? "", address: data.address ?? "", plan: data.plan,
      tripSeq: 0, quoteSeq: 0, createdAt: toDate(data.created_at) ?? new Date(),
    };
  },
  async findMany() { throw new Error("[cloud] business.findMany not used"); },
  async create() { throw new Error("[cloud] business.create not used (signup flow, later)"); },
  async createMany() { throw new Error("[cloud] business.createMany not used"); },
  async update({ where, data }) {
    const mapped = mapWrite(businessSpec, data);
    delete mapped.owner_name; // not a cloud column
    delete mapped.trip_seq;
    delete mapped.quote_seq;
    const c = cloudClient();
    const { data: row, error } = await c.from("businesses").update(mapped).eq("id", where.id).select("*").single();
    if (error) throw cloudError(error);
    return (await cloudBusiness.findUnique({ where: { id: row.id } }))!;
  },
  async count() { return 0; },
};

/** Cloud "users" (team list) = business_members ⨝ profiles. */
const cloudUser: TableHandle<UserRow> = {
  async findMany({ where }) {
    const c = cloudClient();
    const bizId = String((where as { businessId?: unknown } | undefined)?.businessId ?? "");
    const { data: members, error } = await c.from("business_members")
      .select("user_id, role, status, joined_at")
      .eq("business_id", bizId);
    if (error) throw cloudError(error);
    if (!members?.length) return [];
    const ids = members.map((m: { user_id: string }) => m.user_id);
    const { data: profiles } = await c.from("profiles").select("id, full_name, phone").in("id", ids);
    const byId = new Map((profiles ?? []).map((p: { id: string; full_name?: string; phone?: string }) => [p.id, p]));
    return members.map((m: { user_id: string; role: string; status: string; joined_at: string }) => {
      const p = byId.get(m.user_id);
      return {
        id: m.user_id, businessId: bizId, name: p?.full_name ?? "", phone: p?.phone ?? "",
        role: m.role, passwordHash: "", active: m.status === "active", createdAt: toDate(m.joined_at) ?? new Date(),
      };
    });
  },
  async findFirst() { return null; },
  async findUnique() { return null; },
  async create() { throw new Error("[cloud] user.create not used (Supabase Auth owns users)"); },
  async createMany() { throw new Error("[cloud] user.createMany not used"); },
  async update() { throw new Error("[cloud] user.update not used"); },
  async count() { return 0; },
};

const cloudDb: Db = {
  business: cloudBusiness,
  user: cloudUser,
  vehicle: cloudTable<VehicleRow>(vehicleSpec),
  vehicleDocument: cloudTable<VehicleDocumentRow>(documentSpec),
  customer: cloudTable<CustomerRow>(customerSpec),
  driver: cloudTable<DriverRow>(driverSpec),
  trip: cloudTable<TripRow>(tripSpec),
  tripExpense: cloudTable<TripExpenseRow>(tripExpenseSpec),
  fuelEntry: cloudTable<FuelEntryRow>(fuelSpec),
  maintenanceScheduleItem: cloudTable<MaintenanceScheduleItemRow>(maintScheduleSpec),
  maintenanceLog: cloudTable<MaintenanceLogRow>(maintLogSpec),
  incomeEntry: cloudTable<IncomeEntryRow>(incomeSpec),
  expenseEntry: cloudTable<ExpenseEntryRow>(expenseSpec),
  quotation: cloudTable<QuotationRow>(quotationSpec),
  reminder: cloudTable<ReminderRow>(reminderSpec),
};

/** The one `db` import for every route + snapshot (import from HERE, not @/lib/db). */
export const db: Db = backendMode() === "cloud" ? cloudDb : localDb;

/* ------------------------------------------------------------------ *
 * Reference issuer — TR-000N / QT-000N per business.
 * Local: counter column on the business row. Cloud: max existing code + 1
 * (refs are never reused, codes are zero-padded ⇒ lexicographic max works).
 * ------------------------------------------------------------------ */
export async function issueRef(businessId: string, kind: "trip" | "quote"): Promise<string> {
  const prefix = kind === "trip" ? "TR" : "QT";
  if (backendMode() === "local") {
    const data = kind === "trip"
      ? { tripSeq: { increment: 1 } }
      : { quoteSeq: { increment: 1 } };
    const biz = await prisma.business.update({ where: { id: businessId }, data });
    const n = kind === "trip" ? biz.tripSeq : biz.quoteSeq;
    return `${prefix}-${String(n).padStart(4, "0")}`;
  }
  const table = kind === "trip" ? "trips" : "quotations";
  const col = kind === "trip" ? "trip_code" : "quote_code";
  const { data, error } = await cloudClient().from(table)
    .select(col).eq("business_id", businessId).order(col, { ascending: false }).limit(1);
  if (error) throw cloudError(error);
  const last = (data?.[0] as Record<string, string> | undefined)?.[col];
  const n = last ? parseInt(last.split("-").pop() ?? "0", 10) : 0;
  return `${prefix}-${String((Number.isFinite(n) ? n : 0) + 1).padStart(4, "0")}`;
}

/* ------------------------------------------------------------------ *
 * Auto trip reminders (v0.10) — trip বানালেই শুরুর ১ ঘণ্টা আগে reminder.
 * Cancel/complete হলে ট্রিপের বাকি (not-done) reminder গুলো মুছে যায়।
 * ------------------------------------------------------------------ */
export async function deletePendingTripReminders(businessId: string, tripId: string): Promise<void> {
  if (backendMode() === "cloud") {
    const { error } = await cloudClient().from("reminders")
      .delete().eq("business_id", businessId).eq("trip_id", tripId).eq("done", false);
    if (error) throw cloudError(error);
    return;
  }
  await prisma.reminder.deleteMany({ where: { businessId, tripId, done: false } });
}
