/**
 * DOMAIN TYPES — shared app-wide (client + server).
 * Mirrors the Prisma schema / supabase/migrations/0001_schema.sql.
 * Dates are ISO strings; money is whole Taka (Int).
 */

export type VehicleStatus =
  | "available"
  | "on_trip"
  | "maintenance"
  | "inactive"
  | "for_sale"
  | "sold";

export type TripStatus = "draft" | "confirmed" | "running" | "completed" | "cancelled";
export type RentalType =
  | "daily" | "per_trip" | "per_km" | "per_hour" | "airport" | "corporate" | "tour" | "wedding" | "monthly" | "other";
export type DocType = "registration" | "tax_token" | "fitness" | "insurance" | "permit" | "other";
export type MaintItem =
  | "engine_oil" | "oil_filter" | "air_filter" | "brake_pad" | "ac_service" | "tyre_rotation" | "wheel_alignment" | "other";
export type MaintStatus = "good" | "soon" | "due" | "overdue";
export type IncomeCategory =
  | "rental" | "extra_km" | "extra_hour" | "driver_charge" | "delivery" | "corporate" | "other";
export type ExpenseCategory =
  | "fuel" | "maintenance" | "parts" | "driver_salary" | "driver_allowance" | "toll" | "parking"
  | "tax" | "insurance" | "registration" | "workshop" | "loan" | "cleaning" | "misc";
export type PaymentMethod = "cash" | "bank" | "bkash" | "nagad" | "card" | "other";

/** ডুয়াল-ফুয়েল গাড়ি সাধারণ (পেট্রোল + CNG) — তাই fuel type একটি list। */
export type FuelType = "diesel" | "petrol" | "cng";
export const FUEL_TYPES: FuelType[] = ["diesel", "petrol", "cng"];

/** DB string ("petrol,cng" বা পুরনো single "cng") → validated FuelType[] (fallback: diesel)। */
export function parseFuelTypes(raw: string | null | undefined): FuelType[] {
  const list = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is FuelType => FUEL_TYPES.includes(s as FuelType));
  return list.length ? list : ["diesel"];
}

export interface Vehicle {
  id: string;
  name: string;
  regNumber: string;
  brand: string;
  model: string;
  year: number;
  /** সব নির্বাচিত জ্বালানি — DB-তে comma-joined string ("petrol,cng") হিসেবে থাকে। */
  fuelTypes: FuelType[];
  transmission: "manual" | "automatic";
  engineCc: number;
  seats: number;
  color: string;
  currentKm: number;
  status: VehicleStatus;
  purchasePrice: number;
  currentValue: number;
  monthlyRevenue: number;
  monthlyCost: number;
  mileage: number; // km per litre (latest)
  mileagePrev: number; // average before latest fill
}

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  docType: DocType;
  docNumber: string;
  issueDate: string;
  expiryDate: string; // ISO
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  company?: string;
  address?: string;
  totalTrips: number;
  totalPaid: number;
  due: number;
  since: string; // ISO date
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNo: string;
  licenseExpiry: string; // ISO
  joiningDate: string;
  salary: number;
  advance: number;
  due: number;
  tripsDone: number;
  active: boolean;
}

export interface Trip {
  id: string;
  ref: string; // trip reference, e.g. TR-0007
  customerId: string;
  vehicleId: string;
  driverId: string;
  from: string;
  to: string;
  startAt: string; // ISO
  endAt: string; // ISO
  rentalType: RentalType;
  fare: number;
  advance: number;
  due: number;
  status: TripStatus;
  startKm?: number;
  endKm?: number;
  profit?: number;
  expenseTotal?: number;
  notes?: string;
}

export interface TripExpense {
  id: string;
  tripId: string;
  category: ExpenseCategory;
  amount: number;
  notes?: string;
}

export interface FuelEntry {
  id: string;
  vehicleId: string;
  date: string; // ISO
  odometerKm: number;
  litres: number;
  pricePerLitre: number;
  totalCost: number;
  station: string;
  driverId?: string;
}

export interface MaintenanceScheduleItem {
  id: string;
  vehicleId: string;
  item: MaintItem;
  lastServiceKm: number;
  lastServiceDate: string; // ISO
  intervalKm: number;
  status: MaintStatus; // derived from lastServiceKm + intervalKm
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  item: MaintItem;
  date: string; // ISO
  km: number;
  cost: number;
  workshop: string;
  notes?: string;
}

export interface IncomeEntry {
  id: string;
  date: string; // ISO
  category: IncomeCategory;
  customerId?: string;
  vehicleId?: string;
  tripId?: string;
  amount: number;
  method: PaymentMethod;
}

export interface ExpenseEntry {
  id: string;
  date: string; // ISO
  category: ExpenseCategory;
  vehicleId?: string;
  amount: number;
  paidTo?: string;
  method: PaymentMethod;
}

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export interface Quotation {
  id: string;
  code: string; // quotation reference, e.g. QT-0001
  customerId: string;
  vehicleId?: string;
  summary: string; // quoted work, e.g. "ঢাকা → কক্সবাজার, ৩ দিন"
  rate: number;
  terms?: string;
  status: QuoteStatus;
  validUntil?: string; // ISO
  createdAt: string; // ISO
}

export interface Reminder {
  id: string;
  title: string; // e.g. "TR-0005 ধারণ করা ট্রিপের জন্য"
  notes?: string;
  tripId?: string; // optional linked trip
  dueAt: string; // ISO — date + time (v0.9: time সহ রিমাইন্ডার)
  done: boolean;
}

export interface BusinessProfile {
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  plan: string;
  vehicleLimit: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string; // owner | manager | staff | driver | accountant
  phone?: string;
  active?: boolean;
}

export interface AppData {
  business: BusinessProfile;
  vehicles: Vehicle[];
  documents: VehicleDocument[];
  customers: Customer[];
  drivers: Driver[];
  trips: Trip[];
  quotations: Quotation[];
  reminders: Reminder[];
  tripExpenses: TripExpense[];
  fuelEntries: FuelEntry[];
  maintenanceSchedule: MaintenanceScheduleItem[];
  maintenanceLogs: MaintenanceLog[];
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  monthStats: { income: number; expense: number };
  todayIncome: number;
  incomeHistory: { month: string; income: number; expense: number }[];
  team?: TeamMember[];
}

/* ---------- helpers ---------- */
const now = () => new Date();

/** Whole days from now until an ISO date (negative = already past). */
export function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - now().getTime();
  return Math.ceil(diff / 86400000);
}
