"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, TriangleAlert, Fuel, BellRing } from "lucide-react";
import { useApp, useT } from "@/store";
import { useFormUi } from "./form-store";
import { fmtMoney, fmtTime } from "@/lib/format";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChipGroup, MultiChipGroup, SmartSearchPicker, vehicleItems, customerPickerItems, driverItems, tripPickerItems } from "./pickers";
import type {
  IncomeCategory, ExpenseCategory, PaymentMethod, DocType, MaintItem, RentalType, FuelType,
} from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ---------- typed label maps (keep TS literal types narrow) ---------- */
const RENTAL_LABELS: Record<RentalType, TranslationKey> = {
  daily: "rentalDaily", per_trip: "rentalPerTrip", per_km: "rentalPerKm", per_hour: "rentalPerHour",
  airport: "rentalAirport", corporate: "rentalCorporate", tour: "rentalTour", wedding: "rentalWedding",
  monthly: "rentalMonthly", other: "icOther",
};
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
const MAINT_ITEM_LABELS: Record<MaintItem, TranslationKey> = {
  engine_oil: "engineOil", oil_filter: "oilFilter", air_filter: "airFilter", brake_pad: "brakePad",
  ac_service: "acService", tyre_rotation: "tyreRotation", wheel_alignment: "wheelAlignment", other: "otherItem",
};
const DOC_TYPE_LABELS: Record<DocType, TranslationKey> = {
  registration: "docRegistration", tax_token: "docTaxToken", fitness: "docFitness",
  insurance: "docInsurance", permit: "docPermit", other: "docOther",
};
const FUEL_LABELS: Record<FuelType, TranslationKey> = {
  diesel: "diesel", petrol: "petrol", cng: "cng",
};
const FUEL_DOT: Record<FuelType, string> = {
  diesel: "bg-warning", petrol: "bg-success", cng: "bg-info",
};

/* ---------- helpers ---------- */
function nowLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset(), 0, 0);
  return d.toISOString().slice(0, 16);
}
function plusHoursLocal(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hours, 0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function todayLocal(): string {
  return new Date().toISOString().slice(0, 10);
}
function isoFromLocal(local: string): string {
  return new Date(local).toISOString();
}
function plusDaysDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function isoFromDateInput(local: string): string {
  return new Date(`${local}T00:00:00`).toISOString();
}
function num(v: string): number {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-danger">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

const Required = { required: true } as const;

/* ================================================================== */
/* Forms Host — renders the sheet for the currently open form          */
/* ================================================================== */
export function FormsHost() {
  const form = useFormUi((s) => s.openForm);
  return (
    <>
      {form === "trip" && <TripForm />}
      {form === "income" && <IncomeForm />}
      {form === "expense" && <ExpenseForm />}
      {form === "fuel" && <FuelForm />}
      {form === "service" && <ServiceForm />}
      {form === "customer" && <CustomerForm />}
      {form === "document" && <DocumentForm />}
      {form === "vehicle" && <VehicleForm />}
      {form === "driver" && <DriverForm />}
      {form === "payment" && <PaymentForm />}
      {form === "quotation" && <QuotationForm />}
      {form === "reminder" && <ReminderForm />}
    </>
  );
}

function FormShell({ title, desc, children, onSubmit, submitLabel, busy }: {
  title: string; desc?: string; children: React.ReactNode;
  onSubmit: () => void; submitLabel: string; busy?: boolean;
}) {
  const close = useFormUi((s) => s.close);
  return (
    <Sheet open onOpenChange={(v) => { if (!v) close(); }}>
      <SheetContent side="bottom" className="inset-x-0 mx-auto w-full max-w-lg rounded-t-2xl p-0 border-t max-h-[92dvh] flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-2 shrink-0">
          <SheetTitle className="text-base">{title}</SheetTitle>
          {desc && <SheetDescription className="text-xs">{desc}</SheetDescription>}
        </SheetHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); if (!busy) onSubmit(); }}
          className="flex flex-col gap-3.5 overflow-y-auto nice-scrollbar px-5 pb-5 pt-1 flex-1"
        >
          {children}
          <Button type="submit" size="lg" className="w-full h-11 text-sm font-semibold mt-1 gap-2" disabled={busy}>
            {busy && <Loader2 className="size-4.5 animate-spin" />}
            {busy ? "…" : submitLabel}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* ================================================================== */
/* Add Trip — inline new customer + double-booking guard + auto ref    */
/* ================================================================== */
const NEW_CUSTOMER = "__new";

function TripForm() {
  const { t, lang } = useT();
  const close = useFormUi((s) => s.close);
  const { data, addTrip, setQuotationStatus } = useApp();
  const busy = useApp((s) => s.busy);
  const [error, setError] = React.useState<string | null>(null);

  /* presets — also the quotation → trip conversion entry */
  const presetCustomer = useFormUi((s) => s.presetCustomerId);
  const presetVehicle = useFormUi((s) => s.presetVehicleId);
  const presetFare = useFormUi((s) => s.presetFare);
  const presetNotes = useFormUi((s) => s.presetNotes);
  const convertQuoteId = useFormUi((s) => s.convertQuoteId);

  const [customerId, setCustomerId] = React.useState(
    presetCustomer ?? (data.customers.length > 0 ? data.customers[0].id : NEW_CUSTOMER)
  );
  const [newName, setNewName] = React.useState("");
  const [newPhone, setNewPhone] = React.useState("");
  const [vehicleId, setVehicleId] = React.useState(
    presetVehicle ?? data.vehicles.find((v) => v.status === "available")?.id ?? data.vehicles[0]?.id ?? ""
  );
  const [driverId, setDriverId] = React.useState(data.drivers.find((d) => d.active)?.id ?? "none");
  const [fromLoc, setFromLoc] = React.useState("");
  const [toLoc, setToLoc] = React.useState("");
  const [startAt, setStartAt] = React.useState(plusHoursLocal(1));
  const [endAt, setEndAt] = React.useState(plusHoursLocal(9));
  const [rentalType, setRentalType] = React.useState<RentalType>("per_trip");
  const [fare, setFare] = React.useState(presetFare ? String(presetFare) : "");
  const [advance, setAdvance] = React.useState("0");
  const [notes, setNotes] = React.useState(presetNotes ?? "");

  const due = Math.max(0, num(fare) - num(advance));

  const rentalTypes: RentalType[] = ["daily", "per_trip", "per_km", "per_hour", "airport", "corporate", "tour", "wedding", "monthly"];

  const submit = async () => {
    setError(null);
    if (!vehicleId || !fromLoc.trim() || !toLoc.trim() || num(fare) <= 0) { setError(t("fillAll")); return; }
    if (customerId === NEW_CUSTOMER && !newName.trim()) { setError(t("fillAll")); return; }
    const result = await addTrip({
      customerId: customerId === NEW_CUSTOMER ? undefined : customerId,
      newCustomer: customerId === NEW_CUSTOMER ? { name: newName.trim(), phone: newPhone.trim() } : undefined,
      vehicleId,
      driverId: driverId === "none" ? undefined : driverId,
      from: fromLoc.trim(), to: toLoc.trim(),
      startAt: isoFromLocal(startAt), endAt: isoFromLocal(endAt),
      rentalType, fare: num(fare), advance: num(advance),
      notes: notes.trim() || undefined,
    });
    if (result.error) { setError(t(result.error as TranslationKey)); return; }
    // quotation → trip conversion: the quote becomes “accepted” once its trip exists
    if (convertQuoteId) {
      await setQuotationStatus(convertQuoteId, "accepted");
      toast.success(t("quoteConvertedToast"), { description: `${t("tripRefLabel")} ${result.ref}${result.autoReminder ? ` · ${t("autoReminderToast")}` : ""}` });
    } else {
      toast.success(t("tripAdded"), {
        description: `${result.ref ? `${t("tripRefLabel")} ${result.ref} · ` : ""}${fromLoc.trim()} → ${toLoc.trim()} · ${fmtMoney(num(fare), lang)}${result.autoReminder ? ` · ${t("autoReminderToast")}` : ""}`,
      });
    }
    close();
  };

  /* type-to-search pickers — sorted “best first”, 6 suggestions max */
  const customerList = customerPickerItems(data.customers);
  const vehicleList = vehicleItems(data.vehicles, t);
  const driverList = driverItems(data.drivers.filter((d) => d.active));

  return (
    <FormShell title={t("addTrip")} desc={t("savedServerNote")} onSubmit={submit} submitLabel={t("save")} busy={busy}>
      {error && (
        <Alert variant="destructive" className="items-start">
          <TriangleAlert className="size-4 mt-0.5" />
          <AlertDescription className="text-xs leading-relaxed">{error}</AlertDescription>
        </Alert>
      )}

      {/* Customer — type-to-search + inline new customer (scales 4 → 400+) */}
      <SmartSearchPicker
        label={`${t("customer")} *`}
        icon="user"
        items={customerList}
        value={customerId}
        onChange={(id) => setCustomerId(id)}
        displayAs={customerId === NEW_CUSTOMER ? (newName.trim() || t("newCustomer")) : undefined}
        extraNew={{
          label: t("newCustomer"),
          onNew: (q) => { setCustomerId(NEW_CUSTOMER); setNewName(q); setNewPhone(""); },
        }}
      />

      {/* Inline new customer fields (SEE → TAP → DONE — no separate screen) */}
      {customerId === NEW_CUSTOMER && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-primary/25 bg-primary/5 p-3">
          <Field label={t("name")} {...Required}>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="যেমন: কামাল হোসেন" className="h-11 bg-card" autoFocus />
          </Field>
          <Field label={t("phone")}>
            <Input type="tel" inputMode="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="01XXX-XXXXXX" className="h-11 bg-card tabular" />
          </Field>
        </div>
      )}

      {/* Vehicle — type-to-search (name or reg number), available first */}
      <SmartSearchPicker
        label={`${t("vehicle")} *`}
        icon="car"
        items={vehicleList}
        value={vehicleId}
        onChange={setVehicleId}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("from")} {...Required}>
          <Input value={fromLoc} onChange={(e) => setFromLoc(e.target.value)} placeholder="যেমন: ঢাকা" className="h-11" />
        </Field>
        <Field label={t("to")} {...Required}>
          <Input value={toLoc} onChange={(e) => setToLoc(e.target.value)} placeholder="যেমন: কক্সবাজার" className="h-11" />
        </Field>
      </div>
      {/* Start/end stacked full-width — the native datetime control needs
          room; two narrow columns truncate the displayed value. */}
      <div className="grid grid-cols-1 gap-3">
        <Field label={`${t("tripStart")} (${t("date")} / ${t("time")})`} {...Required}>
          <Input type="datetime-local" aria-label={t("tripStart")} value={startAt} onChange={(e) => setStartAt(e.target.value)} className="h-11" />
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] leading-snug text-muted-foreground">
            <BellRing className="size-3.5 shrink-0" />
            {t("autoReminderNote")}
          </p>
        </Field>
        <Field label={`${t("tripEnd")} (${t("date")} / ${t("time")})`} {...Required}>
          <Input type="datetime-local" aria-label={t("tripEnd")} value={endAt} onChange={(e) => setEndAt(e.target.value)} className="h-11" />
        </Field>
      </div>

      {/* Rental type — chips, no dropdown */}
      <Field label={t("tripRoute")}>
        <ChipGroup<RentalType>
          value={rentalType}
          onChange={setRentalType}
          options={rentalTypes.map((rt) => ({ value: rt, label: t(RENTAL_LABELS[rt]) }))}
        />
      </Field>

      <SmartSearchPicker
        label={t("driver")}
        icon="user"
        items={driverList}
        value={driverId}
        onChange={setDriverId}
        allowNone
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label={`${t("tripFare")} (৳)`} {...Required}>
          <Input type="number" inputMode="decimal" value={fare} onChange={(e) => setFare(e.target.value)} placeholder="25000" className="h-11 tabular" min="0" />
        </Field>
        <Field label={`${t("tripAdvance")} (৳)`}>
          <Input type="number" inputMode="decimal" value={advance} onChange={(e) => setAdvance(e.target.value)} placeholder="0" className="h-11 tabular" min="0" />
        </Field>
      </div>

      {/* notes — shown when a quotation is being converted (its terms land here) */}
      {(convertQuoteId || notes) && (
        <Field label={t("notes")} hint={convertQuoteId ? t("quoteTermsLabel") : undefined}>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="h-11" />
        </Field>
      )}

      <div className="rounded-xl bg-muted px-4 py-3 flex items-center justify-between">
        <span className="text-[13px] text-muted-foreground">{t("tripDue")}</span>
        <span className="text-[15px] font-bold tabular">{fmtMoney(due, lang)}</span>
      </div>
    </FormShell>
  );
}

/* ================================================================== */
/* Add Income — category chips + method chips                          */
/* ================================================================== */
function IncomeForm() {
  const { t, lang } = useT();
  const close = useFormUi((s) => s.close);
  const { data, addIncome } = useApp();
  const busy = useApp((s) => s.busy);
  const presetCustomer = useFormUi((s) => s.presetCustomerId);

  const cats: IncomeCategory[] = ["rental", "extra_km", "extra_hour", "driver_charge", "delivery", "corporate", "other"];
  const methods: PaymentMethod[] = ["cash", "bkash", "bank", "nagad", "card"];

  const [category, setCategory] = React.useState<IncomeCategory>("rental");
  const [amount, setAmount] = React.useState("");
  const [customerId, setCustomerId] = React.useState(presetCustomer ?? data.customers[0]?.id ?? "none");
  const [vehicleId, setVehicleId] = React.useState("none");
  const [method, setMethod] = React.useState<PaymentMethod>("cash");
  const [date, setDate] = React.useState(todayLocal());

  const submit = async () => {
    if (num(amount) <= 0) return;
    const err = await addIncome({
      date: isoFromLocal(date + "T12:00"), category,
      customerId: customerId === "none" ? undefined : customerId,
      vehicleId: vehicleId === "none" ? undefined : vehicleId,
      amount: num(amount), method,
    });
    if (err) { toast.error(t(err as TranslationKey)); return; }
    toast.success(t("incomeAdded"), { description: fmtMoney(num(amount), lang) });
    close();
  };

  return (
    <FormShell title={t("addIncome")} onSubmit={submit} submitLabel={t("save")} busy={busy}>
      <Field label={t("income")} {...Required}>
        <ChipGroup<IncomeCategory>
          value={category}
          onChange={setCategory}
          options={cats.map((c) => ({ value: c, label: t(INCOME_LABELS[c]) }))}
        />
      </Field>
      <Field label={`${t("amount")} (৳)`} {...Required}>
        <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5000" className="h-11 tabular text-[15px] font-semibold" min="0" autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <SmartSearchPicker
          label={t("customer")}
          icon="user"
          items={customerPickerItems(data.customers)}
          value={customerId}
          onChange={setCustomerId}
          allowNone
        />
        <SmartSearchPicker
          label={t("vehicle")}
          icon="car"
          items={vehicleItems(data.vehicles, t)}
          value={vehicleId}
          onChange={setVehicleId}
          allowNone
        />
      </div>
      <Field label={t("paymentMethod")}>
        <ChipGroup<PaymentMethod>
          value={method}
          onChange={setMethod}
          options={methods.map((m) => ({ value: m, label: t(METHOD_LABELS[m]) }))}
        />
      </Field>
      <Field label={t("date")}>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
      </Field>
    </FormShell>
  );
}

/* ================================================================== */
/* Collect Payment — against a trip or a customer's open balance       */
/* ================================================================== */
function PaymentForm() {
  const { t, lang } = useT();
  const close = useFormUi((s) => s.close);
  const { data, addPayment } = useApp();
  const busy = useApp((s) => s.busy);
  const presetTripId = useFormUi((s) => s.presetTripId);
  const presetCustomerId = useFormUi((s) => s.presetCustomerId);

  const trip = presetTripId ? data.trips.find((x) => x.id === presetTripId) : undefined;
  const customer = trip
    ? data.customers.find((c) => c.id === trip.customerId)
    : presetCustomerId
      ? data.customers.find((c) => c.id === presetCustomerId)
      : undefined;
  const due = trip ? trip.due : customer?.due ?? 0;

  const methods: PaymentMethod[] = ["cash", "bkash", "nagad", "bank", "card"];

  const [amount, setAmount] = React.useState(due > 0 ? String(due) : "");
  const [method, setMethod] = React.useState<PaymentMethod>("cash");
  const [date, setDate] = React.useState(todayLocal());

  const remaining = Math.max(0, due - num(amount));

  const submit = async () => {
    if (num(amount) <= 0) return;
    const err = await addPayment({
      tripId: trip?.id,
      customerId: customer?.id,
      amount: num(amount),
      method,
      date: isoFromLocal(date + "T12:00"),
    });
    if (err) { toast.error(t(err as TranslationKey)); return; }
    toast.success(t("paymentAdded"), {
      description: `${trip ? `${trip.ref} · ` : customer ? `${customer.name} · ` : ""}${fmtMoney(num(amount), lang)} · ${t(METHOD_LABELS[method])}`,
    });
    close();
  };

  return (
    <FormShell
      title={t("collectPayment")}
      desc={trip ? `${trip.ref} · ${trip.from} → ${trip.to}` : customer?.name}
      onSubmit={submit}
      submitLabel={t("save")}
      busy={busy}
    >
      {/* Context — what this payment settles */}
      {trip ? (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">{t("tripFare")}</span>
            <span className="font-bold tabular">{fmtMoney(trip.fare, lang)}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">{t("tripAdvance")}</span>
            <span className="font-bold tabular">{fmtMoney(trip.advance, lang)}</span>
          </div>
          <div className="flex items-center justify-between text-[13px] border-t border-border/60 pt-1.5">
            <span className="text-muted-foreground">{t("tripDue")}</span>
            <span className="font-bold tabular text-danger">{fmtMoney(trip.due, lang)}</span>
          </div>
        </div>
      ) : customer && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold truncate">{customer.name}</div>
            <div className="text-[11px] text-muted-foreground tabular">{customer.phone}</div>
          </div>
          <span className="font-bold tabular text-danger">{fmtMoney(customer.due, lang)}</span>
        </div>
      )}

      <Field label={`${t("amount")} (৳)`} {...Required}>
        <Input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="5000"
          className="h-11 text-[15px] font-bold tabular rounded-2xl"
          min="0"
          autoFocus
        />
      </Field>
      {due > 0 && (
        <div className="flex flex-wrap gap-2">
          {[due, Math.round(due / 2)].map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setAmount(String(v))}
              className="rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1.5 text-[12px] font-semibold text-primary active:scale-95 transition-transform"
            >
              {fmtMoney(v, lang)}{i === 1 ? " (৫০%)" : ""}
            </button>
          ))}
        </div>
      )}

      <Field label={t("paymentMethod")}>
        <ChipGroup<PaymentMethod>
          value={method}
          onChange={setMethod}
          options={methods.map((m) => ({ value: m, label: t(METHOD_LABELS[m]) }))}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("date")}>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
        </Field>
        <div className="rounded-xl bg-muted px-4 flex flex-col justify-center">
          <span className="text-[11px] text-muted-foreground">{t("remainingAfter")}</span>
          <span className={cn("text-[15px] font-bold tabular", remaining > 0 ? "text-danger" : "text-success")}>
            {fmtMoney(remaining, lang)}
          </span>
        </div>
      </div>
    </FormShell>
  );
}

/* ================================================================== */
/* Add Expense — category chips (scrollable) + method chips            */
/* ================================================================== */
function ExpenseForm() {
  const { t, lang } = useT();
  const close = useFormUi((s) => s.close);
  const { data, addExpense } = useApp();
  const busy = useApp((s) => s.busy);
  const presetVehicle = useFormUi((s) => s.presetVehicleId);

  const cats: ExpenseCategory[] = [
    "fuel", "maintenance", "parts", "driver_salary", "driver_allowance", "toll", "parking",
    "tax", "insurance", "registration", "workshop", "loan", "cleaning", "misc",
  ];
  const methods: PaymentMethod[] = ["cash", "bkash", "bank", "nagad", "card"];

  const [category, setCategory] = React.useState<ExpenseCategory>("fuel");
  const [amount, setAmount] = React.useState("");
  const [vehicleId, setVehicleId] = React.useState(presetVehicle ?? "none");
  const [paidTo, setPaidTo] = React.useState("");
  const [method, setMethod] = React.useState<PaymentMethod>("cash");
  const [date, setDate] = React.useState(todayLocal());

  const submit = async () => {
    if (num(amount) <= 0) return;
    const err = await addExpense({
      date: isoFromLocal(date + "T12:00"), category,
      vehicleId: vehicleId === "none" ? undefined : vehicleId,
      amount: num(amount), paidTo: paidTo.trim() || undefined, method,
    });
    if (err) { toast.error(t(err as TranslationKey)); return; }
    toast.success(t("expenseAdded"), { description: fmtMoney(num(amount), lang) });
    close();
  };

  return (
    <FormShell title={t("addExpense")} onSubmit={submit} submitLabel={t("save")} busy={busy}>
      <Field label={t("expense")} {...Required}>
        <ChipGroup<ExpenseCategory>
          value={category}
          onChange={setCategory}
          options={cats.map((c) => ({ value: c, label: t(EXPENSE_LABELS[c]) }))}
          maxH
        />
      </Field>
      <Field label={`${t("amount")} (৳)`} {...Required}>
        <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" className="h-11 tabular text-[15px] font-semibold" min="0" autoFocus />
      </Field>
      <SmartSearchPicker
        label={t("vehicle")}
        icon="car"
        items={vehicleItems(data.vehicles, t)}
        value={vehicleId}
        onChange={setVehicleId}
        allowNone
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("paidTo")}>
          <Input value={paidTo} onChange={(e) => setPaidTo(e.target.value)} placeholder={t("optional")} className="h-11" />
        </Field>
        <Field label={t("date")}>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
        </Field>
      </div>
      <Field label={t("paymentMethod")}>
        <ChipGroup<PaymentMethod>
          value={method}
          onChange={setMethod}
          options={methods.map((m) => ({ value: m, label: t(METHOD_LABELS[m]) }))}
        />
      </Field>
    </FormShell>
  );
}

/* ================================================================== */
/* Add Fuel — fuel type front and center                               */
/* ================================================================== */
function FuelForm() {
  const { t, lang } = useT();
  const close = useFormUi((s) => s.close);
  const { data, addFuel } = useApp();
  const busy = useApp((s) => s.busy);
  const presetVehicle = useFormUi((s) => s.presetVehicleId);

  const [vehicleId, setVehicleId] = React.useState(presetVehicle ?? data.vehicles[0]?.id ?? "");
  const [km, setKm] = React.useState("");
  const [litres, setLitres] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [station, setStation] = React.useState("");
  const [date, setDate] = React.useState(todayLocal());

  const vehicle = data.vehicles.find((v) => v.id === vehicleId);
  const total = num(litres) * num(price);
  const fuelType = vehicle?.fuelTypes[0] ?? "diesel";
  const fuelPriceHint = fuelType === "diesel" ? "ডিজেল ~৳৯৩" : fuelType === "petrol" ? "পেট্রোল ~৳১২২" : "সিএনজি ~৳৪৩";

  const submit = async () => {
    if (!vehicleId || num(litres) <= 0 || num(price) <= 0) return;
    const err = await addFuel({
      vehicleId, date: isoFromLocal(date + "T12:00"),
      odometerKm: num(km) || vehicle?.currentKm || 0,
      litres: num(litres), pricePerLitre: num(price),
      station: station.trim() || "—",
    });
    if (err) { toast.error(t(err as TranslationKey)); return; }
    toast.success(t("fuelAdded"), { description: `${num(litres)} ${t("litre")} · ${fmtMoney(total, lang)}` });
    close();
  };

  return (
    <FormShell title={t("addFuel")} onSubmit={submit} submitLabel={t("save")} busy={busy}>
      <SmartSearchPicker
        label={`${t("vehicle")} *`}
        icon="car"
        items={vehicleItems(data.vehicles, t)}
        value={vehicleId}
        onChange={setVehicleId}
      />

      {/* Fuel type — big, unmissable (সব সিলেক্টেড জ্বালানি দেখায়) */}
      {vehicle && (
        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/50 px-4 py-3">
          <Fuel className="size-5 shrink-0 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">{t("fuelType")}</span>
          <span className="flex flex-wrap gap-1.5">
            {vehicle.fuelTypes.map((f) => (
              <span
                key={f}
                className={cn(
                  "rounded-full px-3 py-1 text-[13px] font-bold",
                  f === "diesel" && "bg-warning/15 text-warning-foreground",
                  f === "petrol" && "bg-success/15 text-success",
                  f === "cng" && "bg-info/15 text-info"
                )}
              >
                {t(FUEL_LABELS[f])}
              </span>
            ))}
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground">{fuelPriceHint}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Field label={`গাড়ির ${t("km")}`} {...Required}>
          <Input type="number" inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)} placeholder={vehicle ? vehicle.currentKm.toLocaleString("en-IN") : ""} className="h-11 tabular" min="0" />
        </Field>
        <Field label={t("litre")} {...Required}>
          <Input type="number" inputMode="decimal" step="0.1" value={litres} onChange={(e) => setLitres(e.target.value)} placeholder="40" className="h-11 tabular" min="0" />
        </Field>
        <Field label={t("perLitre")} {...Required} hint={fuelPriceHint}>
          <Input type="number" inputMode="decimal" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={fuelType === "diesel" ? "93" : fuelType === "petrol" ? "122" : "43"} className="h-11 tabular" min="0" />
        </Field>
      </div>
      <Field label={t("station")}>
        <Input value={station} onChange={(e) => setStation(e.target.value)} placeholder={t("optional")} className="h-11" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("date")}>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
        </Field>
        <div className="rounded-xl bg-muted px-4 flex flex-col justify-center">
          <span className="text-[11px] text-muted-foreground">{t("total")}</span>
          <span className="text-[15px] font-bold tabular">{fmtMoney(total, lang)}</span>
        </div>
      </div>
    </FormShell>
  );
}

/* ================================================================== */
/* Add Service — logs history, resets the next-service schedule        */
/* ================================================================== */
function ServiceForm() {
  const { t, lang } = useT();
  const close = useFormUi((s) => s.close);
  const { data, addService } = useApp();
  const busy = useApp((s) => s.busy);
  const presetVehicle = useFormUi((s) => s.presetVehicleId);

  const items: MaintItem[] = ["engine_oil", "oil_filter", "air_filter", "brake_pad", "ac_service", "tyre_rotation", "wheel_alignment", "other"];

  const [vehicleId, setVehicleId] = React.useState(presetVehicle ?? data.vehicles[0]?.id ?? "");
  const [item, setItem] = React.useState<MaintItem>("engine_oil");
  const [km, setKm] = React.useState("");
  const [cost, setCost] = React.useState("");
  const [workshop, setWorkshop] = React.useState("");
  const [date, setDate] = React.useState(todayLocal());

  const vehicle = data.vehicles.find((v) => v.id === vehicleId);
  const itemLabel = (i: MaintItem): string => t(MAINT_ITEM_LABELS[i]);

  const submit = async () => {
    if (!vehicleId || num(cost) <= 0) return;
    const err = await addService({
      vehicleId, item,
      date: isoFromLocal(date + "T12:00"),
      km: num(km) || vehicle?.currentKm || 0,
      cost: num(cost),
      workshop: workshop.trim() || undefined,
    });
    if (err) { toast.error(t(err as TranslationKey)); return; }
    toast.success(t("serviceAdded"), { description: `${itemLabel(item)} · ${fmtMoney(num(cost), lang)}` });
    close();
  };

  return (
    <FormShell title={t("addService")} desc={t("serviceSchedule")} onSubmit={submit} submitLabel={t("save")} busy={busy}>
      <SmartSearchPicker
        label={`${t("vehicle")} *`}
        icon="car"
        items={vehicleItems(data.vehicles, t)}
        value={vehicleId}
        onChange={setVehicleId}
      />
      <Field label={t("navMaintenance")} {...Required}>
        <ChipGroup<MaintItem>
          value={item}
          onChange={setItem}
          options={items.map((i) => ({ value: i, label: itemLabel(i) }))}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`গাড়ির ${t("km")}`} hint={vehicle ? `${t("vehicleKm")}: ${vehicle.currentKm.toLocaleString("en-IN")}` : undefined}>
          <Input type="number" inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)} placeholder={vehicle ? String(vehicle.currentKm) : "0"} className="h-11 tabular" min="0" />
        </Field>
        <Field label={`${t("amount")} (৳)`} {...Required}>
          <Input type="number" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="3500" className="h-11 tabular text-[15px] font-semibold" min="0" autoFocus />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("workshop")}>
          <Input value={workshop} onChange={(e) => setWorkshop(e.target.value)} placeholder={t("optional")} className="h-11" />
        </Field>
        <Field label={t("date")}>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
        </Field>
      </div>
    </FormShell>
  );
}

/* ================================================================== */
/* Add Customer (quick-add, Section 14)                                */
/* ================================================================== */
function CustomerForm() {
  const { t } = useT();
  const close = useFormUi((s) => s.close);
  const { addCustomer } = useApp();
  const busy = useApp((s) => s.busy);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [company, setCompany] = React.useState("");

  const submit = async () => {
    if (!name.trim()) return;
    const err = await addCustomer({ name: name.trim(), phone: phone.trim(), company: company.trim() || undefined });
    if (err) { toast.error(t(err as TranslationKey)); return; }
    toast.success(t("customerAdded"), { description: name.trim() });
    close();
  };

  return (
    <FormShell title={t("addCustomer")} onSubmit={submit} submitLabel={t("save")} busy={busy}>
      <Field label={t("name")} {...Required}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: কামাল হোসেন" className="h-11" autoFocus />
      </Field>
      <Field label={t("phone")} {...Required}>
        <Input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXX-XXXXXX" className="h-11 tabular" />
      </Field>
      <Field label={t("company")}>
        <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t("optional")} className="h-11" />
      </Field>
    </FormShell>
  );
}

/* ================================================================== */
/* Add Document — doc type chips                                       */
/* ================================================================== */
function DocumentForm() {
  const { t } = useT();
  const close = useFormUi((s) => s.close);
  const { data, addDocument } = useApp();
  const busy = useApp((s) => s.busy);
  const presetVehicle = useFormUi((s) => s.presetVehicleId);

  const types: DocType[] = ["registration", "tax_token", "fitness", "insurance", "permit", "other"];
  const typeLabel = (d: DocType): string => t(DOC_TYPE_LABELS[d]);

  const [vehicleId, setVehicleId] = React.useState(presetVehicle ?? data.vehicles[0]?.id ?? "");
  const [docType, setDocType] = React.useState<DocType>("fitness");
  const [docNumber, setDocNumber] = React.useState("");
  const [expiry, setExpiry] = React.useState("");

  const submit = async () => {
    if (!vehicleId || !expiry) return;
    const err = await addDocument({ vehicleId, docType, docNumber: docNumber.trim() || "—", expiryDate: isoFromLocal(expiry + "T12:00") });
    if (err) { toast.error(t(err as TranslationKey)); return; }
    toast.success(t("navDocuments"), { description: `${typeLabel(docType)} · ${t("expiresOn")}` });
    close();
  };

  return (
    <FormShell title={t("navDocuments")} onSubmit={submit} submitLabel={t("save")} busy={busy}>
      <SmartSearchPicker
        label={`${t("vehicle")} *`}
        icon="car"
        items={vehicleItems(data.vehicles, t)}
        value={vehicleId}
        onChange={setVehicleId}
      />
      <Field label={t("status")} {...Required}>
        <ChipGroup<DocType>
          value={docType}
          onChange={setDocType}
          options={types.map((d) => ({ value: d, label: typeLabel(d) }))}
        />
      </Field>
      <Field label="নম্বর">
        <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder={t("optional")} className="h-11" />
      </Field>
      <Field label={t("expiresOn")} {...Required}>
        <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="h-11" />
      </Field>
    </FormShell>
  );
}

/* ================================================================== */
/* Add Reminder — নিজের রিমাইন্ডার, সময় সহ (v0.9)                      */
/* ================================================================== */
function ReminderForm() {
  const { t, lang } = useT();
  const close = useFormUi((s) => s.close);
  const { data, addReminder } = useApp();
  const busy = useApp((s) => s.busy);
  const presetTrip = useFormUi((s) => s.presetTripId);

  /* trip-linked: prefill the title + default 1 hour before the trip starts */
  const presetTripObj = presetTrip ? data.trips.find((tr) => tr.id === presetTrip) : undefined;
  const oneHourBefore = (iso: string): string => {
    const d = new Date(new Date(iso).getTime() - 60 * 60000);
    d.setSeconds(0, 0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const [title, setTitle] = React.useState(
    presetTripObj ? `${presetTripObj.ref} — ${t("tripStart")}` : ""
  );
  const [dueAt, setDueAt] = React.useState(
    presetTripObj ? oneHourBefore(presetTripObj.startAt) : plusHoursLocal(1)
  );
  const [notes, setNotes] = React.useState("");
  const [tripId, setTripId] = React.useState(presetTrip ?? "none");

  const submit = async () => {
    if (!title.trim() || !dueAt) return;
    const err = await addReminder({
      title: title.trim(),
      notes: notes.trim() || undefined,
      dueAt: isoFromLocal(dueAt),
      tripId: tripId !== "none" ? tripId : undefined,
    });
    if (err) { toast.error(t(err as TranslationKey)); return; }
    const linked = tripId !== "none" ? data.trips.find((tr) => tr.id === tripId) : undefined;
    toast.success(t("reminderSaved"), {
      description: `${fmtTime(dueAt, lang)}${linked ? ` · ${linked.ref}` : ""}`,
    });
    close();
  };

  return (
    <FormShell
      title={t("addReminder")}
      desc={t("reminderFormDesc")}
      onSubmit={submit}
      submitLabel={t("save")}
      busy={busy}
    >
      <Field label={t("reminderTitle")} {...Required}>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("reminderTitleHint")}
          className="h-11"
          autoFocus
        />
      </Field>
      <Field label={`${t("reminderTime")} (${t("date")} / ${t("time")})`} {...Required} hint={t("reminderTimeHint")}>
        <Input
          type="datetime-local"
          aria-label={t("reminderTime")}
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="h-11"
        />
      </Field>
      <Field label={t("linkTrip")}>
        <SmartSearchPicker
          label={`${t("linkTrip")} — ${t("optional")}`}
          icon="car"
          items={tripPickerItems(data.trips)}
          value={tripId}
          onChange={setTripId}
          allowNone
        />
      </Field>
      <Field label="নোট">
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("optional")} className="h-11" />
      </Field>
    </FormShell>
  );
}

/* ================================================================== */
/* Add Vehicle — fuel type multi-select (পেট্রোল+CNG ডুয়াল-ফুয়েল সাধারণ) */
/* ================================================================== */
function VehicleForm() {
  const { t } = useT();
  const close = useFormUi((s) => s.close);
  const { data, addVehicle, updateVehicle } = useApp();
  const busy = useApp((s) => s.busy);
  const presetVehicleId = useFormUi((s) => s.presetVehicleId);
  const editing = presetVehicleId ? data.vehicles.find((v) => v.id === presetVehicleId) : undefined;

  const [name, setName] = React.useState(editing?.name ?? "");
  const [regNumber, setRegNumber] = React.useState(editing?.regNumber ?? "");
  const [brand, setBrand] = React.useState(editing?.brand || "Toyota");
  const [model, setModel] = React.useState(editing?.model ?? "");
  const [year, setYear] = React.useState(String(editing?.year ?? new Date().getFullYear() - 8));
  const [fuelTypes, setFuelTypes] = React.useState<FuelType[]>(editing?.fuelTypes ?? ["diesel"]);
  const [transmission, setTransmission] = React.useState<"manual" | "automatic">(editing?.transmission ?? "manual");
  const [seats, setSeats] = React.useState(editing?.seats ? String(editing.seats) : "");
  const [currentKm, setCurrentKm] = React.useState(editing?.currentKm ? String(editing.currentKm) : "");
  const [purchasePrice, setPurchasePrice] = React.useState(editing?.purchasePrice ? String(editing.purchasePrice) : "");

  /** একটা চিপ টগল — শেষ একটা সিলেক্ট কখনো খালি করা যায় না (required ফিল্ড)। */
  const toggleFuel = (f: FuelType) => {
    setFuelTypes((prev) => {
      if (prev.includes(f)) return prev.length > 1 ? prev.filter((x) => x !== f) : prev;
      return [...prev, f];
    });
  };

  const payload = {
    name: name.trim(), regNumber: regNumber.trim(),
    brand: brand.trim() || "Toyota", model: model.trim(),
    year: num(year) || 2015, fuelTypes, transmission,
    engineCc: 0, seats: num(seats) || 4, color: "",
    currentKm: num(currentKm), purchasePrice: num(purchasePrice),
  };

  const submit = async () => {
    if (!name.trim() || !regNumber.trim() || fuelTypes.length === 0) return;
    const err = editing
      ? await updateVehicle({ id: editing.id, ...payload })
      : await addVehicle(payload);
    if (err) { toast.error(t(err as TranslationKey)); return; }
    toast.success(editing ? t("vehicleUpdated") : t("vehicleAdded"), {
      description: `${name.trim()} · ${fuelTypes.map((f) => t(FUEL_LABELS[f])).join(" + ")}`,
    });
    close();
  };

  return (
    <FormShell title={editing ? t("editVehicle") : t("addVehicle")} onSubmit={submit} submitLabel={t("save")} busy={busy}>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`${t("name")} (ডাকনাম)`} {...Required}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: Hiace" className="h-11" autoFocus />
        </Field>
        <Field label={t("regNumber")} {...Required}>
          <Input value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="ঢাকা মেট্রো-GA 11-2345" className="h-11" />
        </Field>
      </div>

      {/* Fuel type — multi-select (পেট্রোল + CNG একসাথে সম্ভব) */}
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-3.5 space-y-2">
        <div className="flex items-center gap-2">
          <Fuel className="size-4.5 text-muted-foreground" />
          <span className="text-xs font-bold text-foreground">{t("fuelType")}</span>
          <span className="text-danger text-sm">*</span>
          <span className="ml-auto text-[11px] text-muted-foreground">{t("multiSelectHint")}</span>
        </div>
        <MultiChipGroup<FuelType>
          values={fuelTypes}
          onToggle={toggleFuel}
          columns={3}
          options={[
            { value: "diesel", label: t("diesel"), dot: FUEL_DOT.diesel },
            { value: "petrol", label: t("petrol"), dot: FUEL_DOT.petrol },
            { value: "cng", label: t("cng"), dot: FUEL_DOT.cng },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("brand")}>
          <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Toyota" className="h-11" />
        </Field>
        <Field label={t("model")}>
          <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Hiace Super GL" className="h-11" />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label={t("modelYear")}>
          <Input type="number" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2015" className="h-11 tabular" />
        </Field>
        <Field label={t("seats")}>
          <Input type="number" inputMode="numeric" value={seats} onChange={(e) => setSeats(e.target.value)} placeholder="28" className="h-11 tabular" />
        </Field>
        <Field label={`গাড়ির ${t("km")}`}>
          <Input type="number" inputMode="numeric" value={currentKm} onChange={(e) => setCurrentKm(e.target.value)} placeholder="89600" className="h-11 tabular" />
        </Field>
      </div>

      <Field label={t("transmission")}>
        <ChipGroup<"manual" | "automatic">
          value={transmission}
          onChange={setTransmission}
          columns={2}
          options={[
            { value: "manual", label: t("manual") },
            { value: "automatic", label: t("automatic") },
          ]}
        />
      </Field>
      <Field label={`${t("purchasePrice")} (৳)`}>
        <Input type="number" inputMode="decimal" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="1850000" className="h-11 tabular" min="0" />
      </Field>
    </FormShell>
  );
}

/* ================================================================== */
/* Add Driver                                                          */
/* ================================================================== */
function DriverForm() {
  const { t } = useT();
  const close = useFormUi((s) => s.close);
  const { data, addDriver, updateDriver } = useApp();
  const busy = useApp((s) => s.busy);
  const presetDriverId = useFormUi((s) => s.presetDriverId);
  const editing = presetDriverId ? data.drivers.find((d) => d.id === presetDriverId) : undefined;

  const [name, setName] = React.useState(editing?.name ?? "");
  const [phone, setPhone] = React.useState(editing?.phone ?? "");
  const [licenseNo, setLicenseNo] = React.useState(editing?.licenseNo ?? "");
  const [licenseExpiry, setLicenseExpiry] = React.useState(editing ? editing.licenseExpiry.slice(0, 10) : "");
  const [salary, setSalary] = React.useState(editing?.salary ? String(editing.salary) : "");
  const [active, setActive] = React.useState(editing?.active ?? true);

  const submit = async () => {
    if (!name.trim()) return;
    const err = editing
      ? await updateDriver({
          id: editing.id,
          name: name.trim(), phone: phone.trim(),
          licenseNo: licenseNo.trim(),
          licenseExpiry: licenseExpiry ? isoFromLocal(licenseExpiry + "T12:00") : undefined,
          salary: num(salary), active,
        })
      : await addDriver({
          name: name.trim(), phone: phone.trim(),
          licenseNo: licenseNo.trim(),
          licenseExpiry: licenseExpiry ? isoFromLocal(licenseExpiry + "T12:00") : undefined,
          salary: num(salary),
        });
    if (err) { toast.error(t(err as TranslationKey)); return; }
    toast.success(editing ? t("driverUpdated") : t("driverAdded"), { description: name.trim() });
    close();
  };

  return (
    <FormShell title={editing ? t("editDriver") : t("addDriver")} onSubmit={submit} submitLabel={t("save")} busy={busy}>
      <Field label={t("name")} {...Required}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: জসিম উদ্দিন" className="h-11" autoFocus />
      </Field>
      <Field label={t("phone")} {...Required}>
        <Input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXX-XXXXXX" className="h-11 tabular" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("licenseNo")}>
          <Input value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} placeholder="DL-04-2015-8821" className="h-11" />
        </Field>
        <Field label={t("licenseExpiry")}>
          <Input type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} className="h-11" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`${t("salary")} (৳)`}>
          <Input type="number" inputMode="decimal" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="18000" className="h-11 tabular" min="0" />
        </Field>
        {editing && (
          <Field label={t("status")}>
            <ChipGroup
              value={active ? "yes" : "no"}
              onChange={(v) => setActive(v === "yes")}
              columns={2}
              options={[
                { value: "yes", label: t("driverActive") },
                { value: "no", label: t("driverInactive") },
              ]}
            />
          </Field>
        )}
      </div>
    </FormShell>
  );
}

/* ================================================================== */
/* Add Quotation — a price offer that becomes a trip in one tap        */
/* ================================================================== */
function QuotationForm() {
  const { t, lang } = useT();
  const close = useFormUi((s) => s.close);
  const { data, addQuotation } = useApp();
  const busy = useApp((s) => s.busy);
  const [error, setError] = React.useState<string | null>(null);

  const [customerId, setCustomerId] = React.useState(
    data.customers.length > 0 ? data.customers[0].id : NEW_CUSTOMER
  );
  const [newName, setNewName] = React.useState("");
  const [newPhone, setNewPhone] = React.useState("");
  const [vehicleId, setVehicleId] = React.useState(data.vehicles[0]?.id ?? "");
  const [summary, setSummary] = React.useState("");
  const [rate, setRate] = React.useState("");
  const [validUntil, setValidUntil] = React.useState(plusDaysDate(7));
  const [terms, setTerms] = React.useState("");

  const submit = async () => {
    setError(null);
    if (num(rate) <= 0) { setError(t("fillAll")); return; }
    if (customerId === NEW_CUSTOMER && !newName.trim()) { setError(t("fillAll")); return; }
    const result = await addQuotation({
      customerId: customerId === NEW_CUSTOMER ? undefined : customerId,
      newCustomer: customerId === NEW_CUSTOMER ? { name: newName.trim(), phone: newPhone.trim() } : undefined,
      vehicleId: vehicleId || undefined,
      summary: summary.trim(),
      rate: num(rate),
      terms: terms.trim() || undefined,
      validUntil: validUntil ? isoFromDateInput(validUntil) : undefined,
    });
    if (result.error) { setError(t(result.error as TranslationKey)); return; }
    toast.success(t("quotationAdded"), {
      description: t("quoteAddedDesc", { code: result.code ?? "—", rate: fmtMoney(num(rate), lang) }),
    });
    close();
  };

  const customerList = customerPickerItems(data.customers);
  const vehicleList = vehicleItems(data.vehicles, t);

  return (
    <FormShell title={t("addQuotation")} desc={t("quotationDesc")} onSubmit={submit} submitLabel={t("save")} busy={busy}>
      {error && (
        <Alert variant="destructive" className="items-start">
          <TriangleAlert className="size-4 mt-0.5" />
          <AlertDescription className="text-xs leading-relaxed">{error}</AlertDescription>
        </Alert>
      )}

      {/* Customer — type-to-search + inline new customer */}
      <SmartSearchPicker
        label={`${t("customer")} *`}
        icon="user"
        items={customerList}
        value={customerId}
        onChange={(id) => setCustomerId(id)}
        displayAs={customerId === NEW_CUSTOMER ? (newName.trim() || t("newCustomer")) : undefined}
        extraNew={{
          label: t("newCustomer"),
          onNew: (q) => { setCustomerId(NEW_CUSTOMER); setNewName(q); setNewPhone(""); },
        }}
      />

      {customerId === NEW_CUSTOMER && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-primary/25 bg-primary/5 p-3">
          <Field label={t("name")} {...Required}>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="যেমন: কামাল হোসেন" className="h-11 bg-card" autoFocus />
          </Field>
          <Field label={t("phone")}>
            <Input type="tel" inputMode="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="01XXX-XXXXXX" className="h-11 bg-card tabular" />
          </Field>
        </div>
      )}

      {/* Vehicle — optional (a quote may not pin a vehicle yet) */}
      <SmartSearchPicker
        label={t("vehicle")}
        icon="car"
        items={vehicleList}
        value={vehicleId}
        onChange={setVehicleId}
        allowNone
      />

      {/* The quoted work — free text, shown on the paper as-is */}
      <Field label={t("quoteSummary")}>
        <Input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder={t("quoteSummaryPlaceholder")}
          className="h-11"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={`${t("quoteRate")} (৳)`} {...Required}>
          <Input type="number" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="25000" className="h-11 tabular" min="0" />
        </Field>
        <Field label={t("quoteValidUntil")}>
          <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="h-11 tabular" />
        </Field>
      </div>

      <Field label={t("quoteTerms")}>
        <Input
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          placeholder={t("quoteTermsPlaceholder")}
          className="h-11"
        />
      </Field>
    </FormShell>
  );
}
