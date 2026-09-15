/**
 * CSV export — Excel / Google Sheets friendly (Phase 12).
 *
 * Rules:
 *  - UTF-8 BOM + CRLF so Bangla headers render correctly in Windows Excel.
 *  - Amounts are plain ASCII digits with no symbol — accountants sum/pivot them.
 *  - Dates are `YYYY-MM-DD HH:MM` (sortable, locale-neutral).
 *  - One file per export; built fully client-side from the current snapshot.
 */
import type { TranslationKey } from "./i18n";
import type {
  AppData, IncomeCategory, ExpenseCategory, PaymentMethod, RentalType, TripStatus,
} from "./types";

export interface CsvFile {
  filename: string;
  content: string;
}

type T = (key: TranslationKey) => string;

/* ---------- shared label maps (same i18n keys as the forms) ---------- */
const INCOME_LABELS: Record<IncomeCategory, TranslationKey> = {
  rental: "icRental", extra_km: "icExtraKm", extra_hour: "icExtraHour", driver_charge: "icDriverCharge",
  delivery: "icDelivery", corporate: "icCorporate", other: "icOther",
};
const EXPENSE_LABELS: Record<ExpenseCategory, TranslationKey> = {
  fuel: "ecFuel", maintenance: "ecMaintenance", parts: "ecParts", driver_salary: "ecDriverSalary",
  driver_allowance: "ecDriverAllowance", toll: "ecToll", parking: "ecParking", tax: "ecTax",
  insurance: "ecInsurance", registration: "ecRegistration", workshop: "ecWorkshop", loan: "ecLoan",
  cleaning: "ecCleaning", misc: "ecMisc",
};
const METHOD_LABELS: Record<PaymentMethod, TranslationKey> = {
  cash: "cash", bkash: "bkash", bank: "bank", nagad: "nagad", card: "card", other: "icOther",
};
const RENTAL_LABELS: Record<RentalType, TranslationKey> = {
  daily: "rentalDaily", per_trip: "rentalPerTrip", per_km: "rentalPerKm", per_hour: "rentalPerHour",
  airport: "rentalAirport", corporate: "rentalCorporate", tour: "rentalTour", wedding: "rentalWedding",
  monthly: "rentalMonthly", other: "icOther",
};
const TRIP_STATUS_LABELS: Record<TripStatus, TranslationKey> = {
  draft: "tripStatusDraft", confirmed: "tripStatusConfirmed", running: "tripStatusRunning",
  completed: "tripStatusCompleted", cancelled: "tripStatusCancelled",
};

/* ---------- CSV primitives ---------- */

/** Quote a cell when it contains a separator, quote or newline; double the quotes. */
function esc(v: string | number): string {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))];
  return lines.join("\r\n");
}

/** `2026-09-13 14:30` from an ISO string (local time, Excel-friendly). */
function isoToCell(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function stamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Trigger a browser download of a CSV file (with BOM). */
export function downloadCsv(file: CsvFile): void {
  const blob = new Blob([`\ufeff${file.content}`], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = file.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

/* ---------- builders ---------- */

/** All trips — the accountant's trip register. */
export function buildTripsCsv(data: AppData, t: T): CsvFile {
  const rows = data.trips
    .slice()
    .sort((a, b) => b.startAt.localeCompare(a.startAt))
    .map((tr) => {
      const c = data.customers.find((x) => x.id === tr.customerId);
      const v = data.vehicles.find((x) => x.id === tr.vehicleId);
      const d = data.drivers.find((x) => x.id === tr.driverId);
      const paid = tr.advance + data.incomes.filter((i) => i.tripId === tr.id).reduce((s, i) => s + i.amount, 0);
      const km = tr.endKm != null && tr.startKm != null ? tr.endKm - tr.startKm : "";
      return [
        tr.ref, isoToCell(tr.startAt), c?.name ?? "", c?.phone ?? "", v?.name ?? "", d?.name ?? "",
        `${tr.from} → ${tr.to}`, t(RENTAL_LABELS[tr.rentalType]), km,
        tr.fare, paid, tr.due, tr.expenseTotal ?? 0, tr.profit ?? "",
        t(TRIP_STATUS_LABELS[tr.status]),
      ];
    });
  return {
    filename: `garirkhata-trips-${stamp()}.csv`,
    content: toCsv(
      [
        t("csvRef"), t("csvDate"), t("csvCustomer"), t("csvPhone"), t("csvVehicle"), t("csvDriver"),
        t("csvRoute"), t("csvRentalType"), t("csvKm"), `${t("csvFare")} (৳)`, `${t("csvPaid")} (৳)`,
        `${t("csvDue")} (৳)`, `${t("csvTripExpense")} (৳)`, `${t("csvProfit")} (৳)`, t("csvStatus"),
      ],
      rows
    ),
  };
}

/** Combined income + expense cash book (chronological). */
export function buildLedgerCsv(data: AppData, t: T): CsvFile {
  type Row = { date: string; cells: (string | number)[] };
  const rows: Row[] = [];
  for (const i of data.incomes) {
    const c = data.customers.find((x) => x.id === i.customerId);
    const v = data.vehicles.find((x) => x.id === i.vehicleId);
    const tr = data.trips.find((x) => x.id === i.tripId);
    rows.push({
      date: i.date,
      cells: [
        isoToCell(i.date), t("tabIncome"), t(INCOME_LABELS[i.category]), v?.name ?? "", c?.name ?? "",
        tr?.ref ?? "", t(METHOD_LABELS[i.method]), i.amount,
      ],
    });
  }
  for (const e of data.expenses) {
    const v = data.vehicles.find((x) => x.id === e.vehicleId);
    rows.push({
      date: e.date,
      cells: [
        isoToCell(e.date), t("tabExpense"), t(EXPENSE_LABELS[e.category]), v?.name ?? "", e.paidTo ?? "",
        "", t(METHOD_LABELS[e.method]), e.amount,
      ],
    });
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return {
    filename: `garirkhata-ledger-${stamp()}.csv`,
    content: toCsv(
      [
        t("csvDate"), t("csvType"), t("csvCategory"), t("csvVehicle"), t("csvCustomerOrPaidTo"),
        t("csvRef"), t("csvMethod"), `${t("csvAmount")} (৳)`,
      ],
      rows.map((r) => r.cells)
    ),
  };
}

/** Customer balances — who owes what (তালিকা of dues). */
export function buildCustomersCsv(data: AppData, t: T): CsvFile {
  const rows = data.customers
    .slice()
    .sort((a, b) => b.due - a.due || a.name.localeCompare(b.name))
    .map((c) => [
      c.name, c.phone, c.company ?? "", c.address ?? "", c.totalTrips, c.totalPaid, c.due,
      isoToCell(c.since),
    ]);
  return {
    filename: `garirkhata-customers-${stamp()}.csv`,
    content: toCsv(
      [
        t("csvName"), t("csvPhone"), t("csvCompany"), t("csvAddress"), t("totalTrips"),
        `${t("csvTotalPaid")} (৳)`, `${t("csvDue")} (৳)`, t("csvCustomerSince"),
      ],
      rows
    ),
  };
}

/** Per-vehicle month performance. */
export function buildVehiclesCsv(data: AppData, t: T): CsvFile {
  const rows = data.vehicles
    .slice()
    .sort((a, b) => b.monthlyRevenue - b.monthlyCost - (a.monthlyRevenue - a.monthlyCost))
    .map((v) => [
      v.name, v.regNumber, v.fuelTypes.map((f) => t(f)).join("+"), v.currentKm, v.mileage || "",
      v.monthlyRevenue, v.monthlyCost, v.monthlyRevenue - v.monthlyCost,
    ]);
  return {
    filename: `garirkhata-vehicles-${stamp()}.csv`,
    content: toCsv(
      [
        t("csvVehicle"), t("csvRegNumber"), t("csvFuel"), t("csvCurrentKm"), `${t("csvMileage")} (km/L)`,
        `${t("monthIncome")} (৳)`, `${t("monthExpense")} (৳)`, `${t("netProfit")} (৳)`,
      ],
      rows
    ),
  };
}

export type CsvKind = "trips" | "ledger" | "customers" | "vehicles";

export function buildCsv(kind: CsvKind, data: AppData, t: T): CsvFile {
  switch (kind) {
    case "trips": return buildTripsCsv(data, t);
    case "ledger": return buildLedgerCsv(data, t);
    case "customers": return buildCustomersCsv(data, t);
    case "vehicles": return buildVehiclesCsv(data, t);
  }
}
