"use client";

import { useApp, useT } from "@/store";
import { daysUntil } from "@/lib/types";
import type { VehicleStatus, MaintStatus, DocType, MaintItem } from "@/lib/types";
import { fmtMoney, fmtDate, fmtTime, toBnDigits } from "@/lib/format";
import type { BadgeTone } from "@/components/shared/ui-bits";
import type { TranslationKey } from "@/lib/i18n";

/* ---------------- label maps ---------------- */
export function useVehicleStatus(): Record<VehicleStatus, { label: string; tone: BadgeTone }> {
  const { t } = useT();
  return {
    available: { label: t("vAvailable"), tone: "success" },
    on_trip: { label: t("vOnTrip"), tone: "warning" },
    maintenance: { label: t("vMaintenance"), tone: "danger" },
    inactive: { label: t("vInactive"), tone: "neutral" },
    for_sale: { label: t("vForSale"), tone: "info" },
    sold: { label: t("vSold"), tone: "neutral" },
  };
}

export function useMaintStatus(): Record<MaintStatus, { label: string; tone: BadgeTone }> {
  const { t } = useT();
  return {
    good: { label: t("statusGood"), tone: "success" },
    soon: { label: t("statusSoon"), tone: "warning" },
    due: { label: t("statusDue"), tone: "danger" },
    overdue: { label: t("statusOverdue"), tone: "danger" },
  };
}

export function useDocTypeLabel(): Record<DocType, string> {
  const { t } = useT();
  return {
    registration: t("docRegistration"),
    tax_token: t("docTaxToken"),
    fitness: t("docFitness"),
    insurance: t("docInsurance"),
    permit: t("docPermit"),
    other: t("docOther"),
  };
}

export function useMaintItemLabel(): Record<MaintItem, string> {
  const { t } = useT();
  return {
    engine_oil: t("engineOil"),
    oil_filter: t("oilFilter"),
    air_filter: t("airFilter"),
    brake_pad: t("brakePad"),
    ac_service: t("acService"),
    tyre_rotation: t("tyreRotation"),
    wheel_alignment: t("wheelAlignment"),
    other: t("otherItem"),
  };
}

/* ---------------- reminders ---------------- */
export type ReminderGroup = "own" | "documents" | "maintenance" | "payments" | "trips";

export interface ReminderEntry {
  id: string;
  group: ReminderGroup;
  message: string;
  tone: BadgeTone;
  sortKey: number;
  /** v0.9 — user-set reminders carry their exact date+time + row id (✓/✕ actions). */
  reminderId?: string;
  dueAt?: string;
  done?: boolean;
}  

/** Central Reminder Center (Section 31) — derived live + user-set (v0.9, time সহ). */
export function useReminders(): ReminderEntry[] {
  const { data, t, lang } = useApp();
  const docLabel = useDocTypeLabel();
  const itemLabel = useMaintItemLabel();
  const maintStatusMap = useMaintStatus();
  const out: ReminderEntry[] = [];

  // User-set reminders (v0.9): title + notes + EXACT time, optional trip link
  for (const r of data.reminders) {
    if (r.done) continue;
    const trip = r.tripId ? data.trips.find((tr) => tr.id === r.tripId) : undefined;
    const mins = Math.round((+new Date(r.dueAt) - Date.now()) / 60000);
    const when = mins < 0
      ? t("reminderOverdue")
      : mins < 60
        ? `${toBnDigits(mins)} ${t("minutesLeft")}`
        : `${fmtDate(r.dueAt, lang)} · ${fmtTime(r.dueAt, lang)}`;
    const message = `${r.title}${trip ? ` · ${trip.ref}` : ""} — ${when}${r.notes ? ` · ${r.notes}` : ""}`;
    out.push({
      id: `own-${r.id}`,
      group: "own",
      message,
      tone: mins < 0 ? "danger" : mins < 120 ? "warning" : "info",
      sortKey: mins, // soonest first, overdue on top
      reminderId: r.id,
      dueAt: r.dueAt,
    });
  }

  // Vehicle documents
  for (const doc of data.documents) {
    const days = daysUntil(doc.expiryDate);
    if (days > 30) continue;
    const v = data.vehicles.find((x) => x.id === doc.vehicleId);
    const label = docLabel[doc.docType];
    const message =
      days < 0
        ? `${v?.name} — ${label} ${t("expired")} (${fmtDateShort(doc.expiryDate)})`
        : `${v?.name} — ${label} ${days < 7 ? "" : t("expiresOn") + " "}${fmtDateShort(doc.expiryDate)} · ${days} ${t("daysLeftShort")}`;
    out.push({
      id: `doc-${doc.id}`,
      group: "documents",
      message,
      tone: days < 0 ? "danger" : days <= 7 ? "danger" : days <= 15 ? "warning" : "info",
      sortKey: days < 0 ? -1000 + days : days,
    });
  }

  // Maintenance (KM based)
  for (const ms of data.maintenanceSchedule) {
    if (ms.status === "good") continue;
    const v = data.vehicles.find((x) => x.id === ms.vehicleId);
    const nextDueKm = ms.lastServiceKm + ms.intervalKm;
    const remaining = nextDueKm - (v?.currentKm ?? 0);
    const kmText =
      remaining >= 0
        ? `${t("serviceDueSoon")} ${Math.abs(remaining).toLocaleString(lang === "bn" ? "bn-BD" : "en-IN")} ${t("kmLeft")}`
        : `${maintStatusMap[ms.status].label} · ${Math.abs(remaining).toLocaleString(lang === "bn" ? "bn-BD" : "en-IN")} ${t("kmOver")}`;
    out.push({
      id: `ms-${ms.id}`,
      group: "maintenance",
      message: `${v?.name} — ${itemLabel[ms.item]} ${kmText}`,
      tone: ms.status === "soon" ? "warning" : "danger",
      sortKey: ms.status === "overdue" ? -2000 + remaining / 1000 : -remaining / 1000,
    });
  }

  // Payments: customer dues
  for (const c of data.customers) {
    if (c.due <= 0) continue;
    out.push({
      id: `due-${c.id}`,
      group: "payments",
      message: `${c.name} — ${t("moneyDue")} ${fmtMoney(c.due, lang)}`,
      tone: c.due > 15000 ? "warning" : "info",
      sortKey: c.due / 100,
    });
  }

  // Driver license expiry
  for (const d of data.drivers) {
    const days = daysUntil(d.licenseExpiry);
    if (days > 30 || days < 0) continue;
    out.push({
      id: `lic-${d.id}`,
      group: "payments",
      message: `${d.name} — ${t("licenseExpiry")} ${toBn(days, lang)} ${t("daysLeftShort")}`,
      tone: days <= 20 ? "warning" : "info",
      sortKey: days,
    });
  }

  // Trips: today + tomorrow (v0.9 — with time, not just today's)
  const todayStr = new Date().toDateString();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toDateString();
  for (const tr of data.trips) {
    if (tr.status === "cancelled" || tr.status === "completed") continue;
    const d = new Date(tr.startAt);
    const dayStr = d.toDateString();
    if (dayStr !== todayStr && dayStr !== tomorrowStr) continue;
    const v = data.vehicles.find((x) => x.id === tr.vehicleId);
    const label = dayStr === todayStr ? t("today") : t("tomorrow");
    out.push({
      id: `trip-${tr.id}`,
      group: "trips",
      message: `${label} ${fmtTime(tr.startAt, lang)} — ${v?.name} · ${tr.from} → ${tr.to}`,
      tone: tr.status === "running" ? "warning" : dayStr === todayStr ? "warning" : "info",
      sortKey: dayStr === todayStr ? 400 : 450 + (+d - Date.now()) / 60000,
    });
  }

  return out.sort((a, b) => a.sortKey - b.sortKey);
}

function toBn(n: number, lang: "bn" | "en"): string {
  return lang === "bn" ? toBnDigits(n) : String(n);
}

function fmtDateShort(iso: string): string {
  const d = new Date(iso);
  const locale = "bn-BD";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d);
}

/* ---------------- dashboard stats ---------------- */
export interface DashboardStats {
  total: number;
  available: number;
  onTrip: number;
  inMaintenance: number;
  monthIncome: number;
  monthExpense: number;
  net: number;
  totalDue: number;
  todayIncome: number;
  todayTrips: ReturnType<typeof useApp.getState>["data"]["trips"];
  upcomingTrips: ReturnType<typeof useApp.getState>["data"]["trips"];
}

export function useDashboardStats(): DashboardStats {
  const { data } = useApp();
  const vehicles = data.vehicles;
  const todayStr = new Date().toDateString();
  const todayTrips = data.trips.filter(
    (t) => new Date(t.startAt).toDateString() === todayStr && (t.status === "confirmed" || t.status === "running")
  );
  const upcoming = data.trips
    .filter((t) => new Date(t.startAt) > new Date() && t.status === "confirmed")
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))
    .slice(0, 5);
  return {
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === "available").length,
    onTrip: vehicles.filter((v) => v.status === "on_trip").length,
    inMaintenance: vehicles.filter((v) => v.status === "maintenance").length,
    monthIncome: data.monthStats.income,
    monthExpense: data.monthStats.expense,
    net: data.monthStats.income - data.monthStats.expense,
    totalDue: data.customers.reduce((s, c) => s + c.due, 0),
    todayIncome: data.todayIncome,
    todayTrips,
    upcomingTrips: upcoming,
  };
}

/** Vehicles whose latest mileage dropped ≥10% vs. previous average (Section 16). */
export function useMileageWarnings(): string[] {
  const { data, t } = useApp();
  return data.vehicles
    .filter((v) => v.mileagePrev > 0 && v.mileage < v.mileagePrev * 0.9)
    .map((v) => `${v.name}: ${t("fuelEffDropped")}`);
}

export const GROUP_TITLES: Record<ReminderGroup, TranslationKey> = {
  own: "groupOwn",
  documents: "groupDocuments",
  maintenance: "groupMaintenance",
  payments: "groupPayments",
  trips: "groupTrips",
};
