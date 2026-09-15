import { db } from "@/lib/server/store";
import { parseFuelTypes } from "@/lib/types";
import type {
  AppData, Driver, FuelEntry, IncomeEntry, ExpenseEntry, MaintenanceScheduleItem,
  MaintStatus, Quotation, Reminder, Trip, Vehicle, VehicleDocument, Customer,
} from "@/lib/types";
import type { SessionUser } from "./auth";

/**
 * Snapshot builder — loads a business's data and computes every derived number
 * (stats, dues, mileage, maintenance status, aggregates) server-side so the
 * client views stay pure "render the data" components.
 *
 * Backend-agnostic: `db` resolves to Prisma (local) or Supabase/RLS (cloud) —
 * in cloud mode this whole function runs inside the user's request context.
 */

const BN_MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

const iso = (d: Date) => d.toISOString();
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const startOfMonth = (d: Date) => { const x = new Date(d); x.setDate(1); x.setHours(0, 0, 0, 0); return x; };

/** Good / Soon / Due / Overdue from current KM vs the next-service KM. */
function maintStatus(lastServiceKm: number, intervalKm: number, currentKm: number): MaintStatus {
  const remaining = lastServiceKm + intervalKm - currentKm;
  if (remaining > intervalKm * 0.15) return "good";
  if (remaining >= 0) return "soon"; // within the last 15% of the interval
  if (remaining >= -500) return "due"; // just passed
  return "overdue";
}

export async function buildSnapshot(user: SessionUser): Promise<AppData> {
  const bizId = user.businessId;
  const isDriver = user.role === "driver";

  const [business, vehiclesRaw, documentsRaw, customersRaw, driversRaw, tripsRaw, quotationsRaw, remindersRaw, tripExpensesRaw, fuelRaw, maintItemsRaw, maintLogsRaw, incomesRaw, expensesRaw, usersRaw] =
    await Promise.all([
      db.business.findUnique({ where: { id: bizId } }),
      db.vehicle.findMany({ where: { businessId: bizId }, orderBy: { createdAt: "asc" } }),
      db.vehicleDocument.findMany({ where: { businessId: bizId }, orderBy: { expiryDate: "asc" } }),
      db.customer.findMany({ where: { businessId: bizId }, orderBy: { createdAt: "desc" } }),
      db.driver.findMany({ where: { businessId: bizId }, orderBy: { createdAt: "asc" } }),
      db.trip.findMany({ where: { businessId: bizId }, orderBy: { startAt: "desc" } }),
      db.quotation.findMany({ where: { businessId: bizId }, orderBy: { createdAt: "desc" } }),
      db.reminder.findMany({ where: { businessId: bizId }, orderBy: { dueAt: "asc" } }),
      db.tripExpense.findMany({ where: { businessId: bizId } }),
      db.fuelEntry.findMany({ where: { businessId: bizId }, orderBy: { date: "desc" } }),
      db.maintenanceScheduleItem.findMany({ where: { businessId: bizId } }),
      db.maintenanceLog.findMany({ where: { businessId: bizId }, orderBy: { date: "desc" } }),
      db.incomeEntry.findMany({ where: { businessId: bizId }, orderBy: { date: "desc" } }),
      db.expenseEntry.findMany({ where: { businessId: bizId }, orderBy: { date: "desc" } }),
      db.user.findMany({ where: { businessId: bizId }, orderBy: { createdAt: "asc" } }),
    ]);

  if (!business) throw new Error("business not found");

  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);

  /* ---- month stats + today income + 6-month history ---- */
  const monthIncome = incomesRaw.filter((i) => i.date >= monthStart).reduce((s, i) => s + i.amount, 0);
  const monthExpense = expensesRaw.filter((e) => e.date >= monthStart).reduce((s, e) => s + e.amount, 0);
  const todayIncome = incomesRaw.filter((i) => i.date >= todayStart).reduce((s, i) => s + i.amount, 0);

  const incomeHistory: { month: string; income: number; expense: number }[] = [];
  for (let m = 5; m >= 0; m--) {
    const start = startOfMonth(new Date(now.getFullYear(), now.getMonth() - m, 1));
    const end = m === 0 ? new Date(8640000000000000) : startOfMonth(new Date(now.getFullYear(), now.getMonth() - m + 1, 1));
    const inc = incomesRaw.filter((i) => i.date >= start && i.date < end).reduce((s, i) => s + i.amount, 0);
    const exp = expensesRaw.filter((e) => e.date >= start && e.date < end).reduce((s, e) => s + e.amount, 0);
    incomeHistory.push({ month: BN_MONTHS[start.getMonth()], income: inc, expense: exp });
  }

  /* ---- vehicles: mileage from fuel entries + month money ---- */
  const vehicles: Vehicle[] = vehiclesRaw.map((v) => {
    const fills = fuelRaw.filter((f) => f.vehicleId === v.id).sort((a, b) => b.odometerKm - a.odometerKm);
    let mileage = 0;
    let mileagePrev = 0;
    if (fills.length >= 2 && fills[0].odometerKm > fills[1].odometerKm && fills[0].litres > 0) {
      mileage = Math.round(((fills[0].odometerKm - fills[1].odometerKm) / fills[0].litres) * 10) / 10;
    }
    if (fills.length >= 3 && fills[1].odometerKm > fills[2].odometerKm && fills[1].litres > 0) {
      mileagePrev = Math.round(((fills[1].odometerKm - fills[2].odometerKm) / fills[1].litres) * 10) / 10;
    }
    const monthlyRevenue = incomesRaw.filter((i) => i.vehicleId === v.id && i.date >= monthStart).reduce((s, i) => s + i.amount, 0);
    const monthlyCost = expensesRaw.filter((e) => e.vehicleId === v.id && e.date >= monthStart).reduce((s, e) => s + e.amount, 0);
    return {
      id: v.id, name: v.name, regNumber: v.regNumber, brand: v.brand, model: v.model, year: v.year,
      fuelTypes: parseFuelTypes(v.fuelType),
      transmission: v.transmission as Vehicle["transmission"],
      engineCc: v.engineCc, seats: v.seats, color: v.color, currentKm: v.currentKm,
      status: v.status as Vehicle["status"], purchasePrice: v.purchasePrice, currentValue: v.currentValue,
      monthlyRevenue, monthlyCost, mileage, mileagePrev,
    };
  });

  /* ---- trips: due / expenseTotal / profit ---- */
  const trips: Trip[] = tripsRaw.map((t) => {
    const paidOnTrip = incomesRaw.filter((i) => i.tripId === t.id).reduce((s, i) => s + i.amount, 0);
    const expenseTotal = tripExpensesRaw.filter((te) => te.tripId === t.id).reduce((s, te) => s + te.amount, 0);
    const due = Math.max(0, t.fare - t.advance - paidOnTrip);
    return {
      id: t.id, ref: t.ref, customerId: t.customerId, vehicleId: t.vehicleId, driverId: t.driverId ?? "",
      from: t.from, to: t.to, startAt: iso(t.startAt), endAt: iso(t.endAt),
      rentalType: t.rentalType as Trip["rentalType"], fare: t.fare, advance: t.advance, due,
      status: t.status as Trip["status"], startKm: t.startKm ?? undefined, endKm: t.endKm ?? undefined,
      expenseTotal, profit: t.status === "completed" ? t.fare - expenseTotal : undefined,
      notes: t.notes ?? undefined,
    };
  });

  /* ---- quotations (owner-side only; sent + past validity reads as expired) ---- */
  const quotations: Quotation[] = isDriver ? [] : quotationsRaw.map((q) => {
    let status = q.status as Quotation["status"];
    if (status === "sent" && q.validUntil && q.validUntil < todayStart) status = "expired";
    return {
      id: q.id, code: q.quoteCode, customerId: q.customerId, vehicleId: q.vehicleId ?? undefined,
      summary: q.summary, rate: q.rate, terms: q.terms ?? undefined,
      status, validUntil: q.validUntil ? iso(q.validUntil) : undefined, createdAt: iso(q.createdAt),
    };
  });

  /* ---- customers: aggregates ---- */
  const customers: Customer[] = customersRaw.map((c) => {
    const cTrips = trips.filter((t) => t.customerId === c.id && t.status !== "cancelled");
    const totalTrips = cTrips.length;
    const advances = cTrips.reduce((s, t) => s + t.advance, 0);
    const incomes = incomesRaw.filter((i) => i.customerId === c.id).reduce((s, i) => s + i.amount, 0);
    const owed = cTrips.reduce((s, t) => s + Math.max(0, t.fare - t.advance), 0);
    // payments not tied to a specific trip offset the outstanding balance
    const unlinkedPayments = incomesRaw
      .filter((i) => i.customerId === c.id && !i.tripId)
      .reduce((s, i) => s + i.amount, 0);
    const due = Math.max(0, owed - unlinkedPayments);
    return {
      id: c.id, name: c.name, phone: c.phone, company: c.company ?? undefined, address: c.address ?? undefined,
      totalTrips, totalPaid: advances + incomes, due, since: iso(c.createdAt),
    };
  });

  /* ---- drivers: trips done ---- */
  const drivers: Driver[] = driversRaw.map((d) => {
    const tDone = tripsRaw.filter((t) => t.driverId === d.id && t.status === "completed").length;
    // cloud drivers rows (team-invite path) may have null joining/license dates
    const joined = d.joiningDate ?? d.createdAt ?? new Date();
    return {
      id: d.id, name: d.name, phone: d.phone, licenseNo: d.licenseNo,
      licenseExpiry: iso(d.licenseExpiry ?? joined), joiningDate: iso(joined),
      salary: d.salary, advance: d.advance, due: 0, tripsDone: tDone, active: d.active,
    };
  });

  /* ---- documents / fuel / maintenance ---- */
  const documents: VehicleDocument[] = documentsRaw.map((d) => ({
    id: d.id, vehicleId: d.vehicleId, docType: d.docType as VehicleDocument["docType"],
    docNumber: d.docNumber, issueDate: iso(d.issueDate ?? d.createdAt ?? new Date()),
    expiryDate: iso(d.expiryDate ?? new Date()), notes: d.notes ?? undefined,
  }));

  const fuelEntries: FuelEntry[] = fuelRaw.map((f) => ({
    id: f.id, vehicleId: f.vehicleId, date: iso(f.date), odometerKm: f.odometerKm,
    litres: f.litres, pricePerLitre: f.pricePerLitre, totalCost: Math.round(f.litres * f.pricePerLitre),
    station: f.station, driverId: f.driverId ?? undefined,
  }));

  const kmByVehicle = new Map(vehicles.map((v) => [v.id, v.currentKm]));
  const maintenanceSchedule: MaintenanceScheduleItem[] = maintItemsRaw.map((m) => ({
    id: m.id, vehicleId: m.vehicleId, item: m.item as MaintenanceScheduleItem["item"],
    lastServiceKm: m.lastServiceKm, lastServiceDate: iso(m.lastServiceDate), intervalKm: m.intervalKm,
    status: maintStatus(m.lastServiceKm, m.intervalKm, kmByVehicle.get(m.vehicleId) ?? m.lastServiceKm),
  }));

  const maintenanceLogs = maintLogsRaw.map((m) => ({
    id: m.id, vehicleId: m.vehicleId, item: m.item as MaintenanceScheduleItem["item"],
    date: iso(m.date), km: m.km, cost: m.cost, workshop: m.workshop, notes: m.notes ?? undefined,
  }));

  const base: AppData = {
    business: {
      name: business.name, ownerName: business.ownerName, phone: business.phone,
      address: business.address, plan: business.plan, vehicleLimit: 1,
    },
    vehicles, documents, customers, drivers, trips, quotations,
    reminders: remindersRaw.map((r) => ({
      id: r.id, title: r.title, notes: r.notes ?? undefined, tripId: r.tripId ?? undefined,
      dueAt: iso(r.dueAt), done: r.done,
    })),
    tripExpenses: tripExpensesRaw.map((te) => ({ id: te.id, tripId: te.tripId, category: te.category as "fuel", amount: te.amount, notes: te.notes ?? undefined })),
    fuelEntries, maintenanceSchedule, maintenanceLogs,
    incomes: [], expenses: [],
    monthStats: { income: monthIncome, expense: monthExpense },
    todayIncome, incomeHistory,
    team: usersRaw.map((u) => ({ id: u.id, name: u.name, role: u.role, phone: u.phone, active: u.active })),
  };

  /* ---- driver role: minimal, privacy-preserving snapshot ---- */
  if (isDriver) {
    const myDriver = driversRaw.find((d) => d.id === user.driverId);
    const myTripsRaw = tripsRaw.filter((t) => t.driverId === user.driverId);
    const myTripIds = new Set(myTripsRaw.map((t) => t.id));
    const myVehicleIds = new Set(myTripsRaw.map((t) => t.vehicleId));
    const myCustomerIds = new Set(myTripsRaw.map((t) => t.customerId));
    return {
      ...base,
      documents: [],
      maintenanceSchedule: [],
      maintenanceLogs: [],
      incomes: [],
      expenses: [],
      tripExpenses: [],
      quotations: [],
      reminders: [],
      monthStats: { income: 0, expense: 0 },
      todayIncome: 0,
      incomeHistory: [],
      team: [],
      vehicles: vehicles.filter((v) => myVehicleIds.has(v.id)),
      customers: customers.filter((c) => myCustomerIds.has(c.id)),
      drivers: myDriver ? drivers.filter((d) => d.id === myDriver.id) : [],
      trips: trips.filter((t) => myTripIds.has(t.id)),
    };
  }

  const incomes: IncomeEntry[] = incomesRaw.map((i) => ({
    id: i.id, date: iso(i.date), category: i.category as IncomeEntry["category"],
    customerId: i.customerId ?? undefined, vehicleId: i.vehicleId ?? undefined, tripId: i.tripId ?? undefined,
    amount: i.amount, method: i.method as IncomeEntry["method"],
  }));
  const expenses: ExpenseEntry[] = expensesRaw.map((e) => ({
    id: e.id, date: iso(e.date), category: e.category as ExpenseEntry["category"],
    vehicleId: e.vehicleId ?? undefined, amount: e.amount, paidTo: e.paidTo ?? undefined,
    method: e.method as ExpenseEntry["method"],
  }));

  return { ...base, incomes, expenses };
}
