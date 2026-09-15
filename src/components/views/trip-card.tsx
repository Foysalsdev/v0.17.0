"use client";

import * as React from "react";
import { useApp, useT } from "@/store";
import type { Trip } from "@/lib/types";
import { fmtDayLabel, fmtMoney, fmtTime, fmtNum } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/shared/ui-bits";
import { InvoiceSheet } from "@/components/app/invoice-sheet";
import { useFormUi } from "@/components/app/form-store";
import { Route, Phone, MapPin, CheckCircle2, User, Car, Loader2, ChevronDown, ChevronUp, Ban, Wallet, Play, FileText, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { TranslationKey } from "@/lib/i18n";

/* per-trip expense lines (owner round 2) — simple money truth per trip */
const EXPENSE_LINES: { key: "fuel" | "toll" | "parking" | "driver_allowance" | "other"; labelKey: TranslationKey }[] = [
  { key: "fuel", labelKey: "ecFuel" },
  { key: "toll", labelKey: "ecToll" },
  { key: "parking", labelKey: "ecParking" },
  { key: "driver_allowance", labelKey: "ecDriverAllowance" },
  { key: "other", labelKey: "ecMisc" },
];

/** Trip card — shared by Dashboard and Trips view. Reference (TR-000N) always visible. */
export function TripCard({ trip, compact = false }: { trip: Trip; compact?: boolean }) {
  const { t, lang } = useT();
  const { data, completeTrip, cancelTrip, startTrip } = useApp();
  const busy = useApp((s) => s.busy);
  const openForm = useFormUi((s) => s.open);
  const [askEndKm, setAskEndKm] = React.useState(false);
  const [endKm, setEndKm] = React.useState("");
  const [showExpenses, setShowExpenses] = React.useState(false);
  const [showInvoice, setShowInvoice] = React.useState(false);
  const [exp, setExp] = React.useState<Record<string, string>>({});

  const customer = data.customers.find((c) => c.id === trip.customerId);
  const vehicle = data.vehicles.find((v) => v.id === trip.vehicleId);
  const driver = data.drivers.find((d) => d.id === trip.driverId);

  const statusTone =
    trip.status === "running" ? "warning" :
    trip.status === "confirmed" ? "info" :
    trip.status === "completed" ? "success" :
    trip.status === "cancelled" ? "danger" : "neutral";
  const statusLabel =
    trip.status === "running" ? t("tripStatusRunning") :
    trip.status === "confirmed" ? t("tripStatusConfirmed") :
    trip.status === "completed" ? t("tripStatusCompleted") :
    trip.status === "cancelled" ? t("tripStatusCancelled") : t("tripStatusDraft");

  const expenseTotal = EXPENSE_LINES.reduce((s, l) => s + (Number(exp[l.key]) || 0), 0);

  const handleComplete = async () => {
    const expenses = EXPENSE_LINES
      .map((l) => ({ category: l.key, amount: Number(exp[l.key]) || 0 }))
      .filter((e) => e.amount > 0);
    const err = await completeTrip(trip.id, Number(endKm), expenses.length > 0 ? expenses : undefined);
    if (err) { toast.error(t(err as never)); return; }
    setAskEndKm(false);
    toast.success(t("tripCompleted"), {
      description: `${trip.ref} · ${trip.from} → ${trip.to}${expenseTotal > 0 ? ` · ${t("expensesTotal")} ${fmtMoney(expenseTotal, lang)}` : ""}`,
    });
  };

  const handleCancel = async () => {
    const err = await cancelTrip(trip.id);
    if (err) { toast.error(t(err as never)); return; }
    toast.success(t("tripCancelled"), { description: `${trip.ref} · ${trip.from} → ${trip.to}` });
  };

  const handleStart = async () => {
    const err = await startTrip(trip.id, vehicle?.currentKm ?? 0);
    if (err) { toast.error(t(err as never)); return; }
    toast.success(t("dmStartTrip"), { description: `${trip.ref} · ${trip.from} → ${trip.to}` });
  };

  return (
    <Card className={cn("border-border/70 shadow-xs overflow-hidden", compact && "shadow-none border-border/50", trip.status === "cancelled" && "opacity-60")}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-2 px-4 pt-3.5">
          <div className="flex items-center gap-2 min-w-0">
            {trip.status === "running" && (
              <span className="relative flex size-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-warning" />
              </span>
            )}
            <span className="text-[13px] font-semibold text-foreground truncate">
              {vehicle?.name} · {customer?.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground tabular">
              {trip.ref}
            </span>
            <StatusBadge label={statusLabel} tone={statusTone} />
          </div>
        </div>

        {/* Route */}
        <div className="flex items-center gap-2 px-4 py-2.5">
          <Route className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground truncate flex-1">
            {trip.from} <span className="text-muted-foreground font-normal">→</span> {trip.to}
          </span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pb-2.5 text-[12px] text-muted-foreground">
          {driver && <span className="flex items-center gap-1"><Car className="size-3.5" />{driver.name}</span>}
          <span className="flex items-center gap-1 tabular">
            <MapPin className="size-3.5" />
            {fmtDayLabel(trip.startAt, lang, (k) => t(k))} · {fmtTime(trip.startAt, lang)}
          </span>
          {trip.endKm != null && trip.startKm != null && (
            <span className="flex items-center gap-1 tabular">
              <CheckCircle2 className="size-3.5 text-muted-foreground" />
              {fmtNum(trip.endKm - trip.startKm, lang)} {t("km")}
            </span>
          )}
        </div>

        {/* Money + action */}
        <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-muted/40 px-4 py-2.5">
          <div className="flex items-center gap-3 text-[12px] tabular">
            <span className="flex flex-col">
              <span className="text-[10px] text-muted-foreground leading-none mb-0.5">{t("tripFare")}</span>
              <span className="font-bold text-foreground">{fmtMoney(trip.fare, lang)}</span>
            </span>
            {trip.due > 0 && trip.status !== "cancelled" && (
              <span className="flex flex-col">
                <span className="text-[10px] text-muted-foreground leading-none mb-0.5">{t("tripDue")}</span>
                <span className="font-bold text-danger">{fmtMoney(trip.due, lang)}</span>
              </span>
            )}
            {trip.status === "completed" && trip.profit != null && (
              <span className="flex flex-col">
                <span className="text-[10px] text-muted-foreground leading-none mb-0.5">{t("tripProfit")}</span>
                <span className={cn("font-bold", trip.profit >= 0 ? "text-success" : "text-danger")}>{fmtMoney(trip.profit, lang)}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Set a time-reminder for this trip (v0.9) */}
            {(trip.status === "confirmed" || trip.status === "running") && (
              <button
                type="button"
                aria-label={t("setTripReminder")}
                title={t("setTripReminder")}
                onClick={() => openForm("reminder", { tripId: trip.id })}
                className="flex size-8 items-center justify-center rounded-full border border-warning/40 text-warning hover:bg-warning/10 active:scale-95 transition-transform"
              >
                <BellRing className="size-4" strokeWidth={2.2} />
              </button>
            )}
            {trip.status === "confirmed" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  className="h-8 rounded-full text-xs border-primary/40 text-primary hover:bg-primary/10 hover:text-primary gap-1"
                  onClick={handleStart}
                >
                  <Play className="size-3.5" />
                  {t("tripStart")}
                </Button>
                <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    className="h-8 rounded-full text-xs border-danger/30 text-danger/90 hover:bg-danger/10 hover:text-danger gap-1"
                  >
                    <Ban className="size-3.5" />
                    {t("cancelTrip")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-sm rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("cancelTrip")}?</AlertDialogTitle>
                    <AlertDialogDescription className="text-[13px] leading-relaxed">
                      {t("cancelTripConfirm")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="rounded-xl bg-muted/60 px-4 py-2.5 text-sm">
                    <span className="font-semibold">{trip.ref}</span>
                    <span className="text-muted-foreground"> · {trip.from} → {trip.to} · {fmtMoney(trip.fare, lang)}</span>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl h-11">{t("no")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="rounded-xl h-11 bg-danger text-white hover:bg-danger/90"
                    >
                      {t("cancelTrip")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              </>
            )}
            {trip.status === "running" && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-full text-xs border-success/40 text-success hover:bg-success/10 hover:text-success gap-1"
                onClick={() => {
                  setEndKm(String((vehicle?.currentKm ?? 0)));
                  setShowExpenses(false);
                  setExp({});
                  setAskEndKm(true);
                }}
              >
                <CheckCircle2 className="size-3.5" />
                {t("dmCompleteTrip")}
              </Button>
            )}
            {trip.status === "completed" && (
              <>
                {trip.due > 0 && (
                  <Button
                    size="sm"
                    disabled={busy}
                    className="h-8 rounded-full text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    onClick={() => openForm("payment", { tripId: trip.id })}
                  >
                    <Wallet className="size-3.5" />
                    {t("collectPayment")}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full text-xs gap-1"
                  onClick={() => setShowInvoice(true)}
                >
                  <FileText className="size-3.5" />
                  {t("invoiceTitle")}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>

      {/* Complete trip — end KM + optional expense lines ( SEE → TAP → DONE ) */}
      {askEndKm && (
        <Sheet open onOpenChange={(v) => { if (!v) setAskEndKm(false); }}>
          <SheetContent side="bottom" className="inset-x-0 mx-auto w-full max-w-lg rounded-t-2xl p-0 border-t max-h-[90dvh] overflow-y-auto nice-scrollbar">
            <SheetHeader className="px-5 pt-5 pb-1">
              <SheetTitle className="text-lg">{t("dmCompleteTrip")}</SheetTitle>
              <SheetDescription className="text-xs">{trip.ref} · {trip.from} → {trip.to}</SheetDescription>
            </SheetHeader>
            <div className="px-5 pb-6 pt-2 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">{t("dmStartKm")}</span>
                <span className="font-bold tabular">{fmtNum(trip.startKm ?? 0, lang)} {t("km")}</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("dmEndKm")} <span className="text-danger">*</span></label>
                <Input
                  type="number"
                  inputMode="numeric"
                  aria-label={t("dmEndKm")}
                  value={endKm}
                  onChange={(e) => setEndKm(e.target.value)}
                  placeholder={String((vehicle?.currentKm ?? 0))}
                  className="h-13 text-lg font-bold tabular rounded-2xl"
                  autoFocus
                />
              </div>

              {/* Expense lines — ট্রিপের আসল খরচ, তাই আসল লাভ */}
              <button
                type="button"
                onClick={() => setShowExpenses((s) => !s)}
                className="flex w-full items-center justify-between rounded-xl border border-dashed border-input bg-card px-4 py-3 text-left active:scale-[0.99] transition-transform"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Wallet className="size-4 text-muted-foreground" />
                  {t("addExpenses")}
                </span>
                {expenseTotal > 0 && <span className="text-sm font-bold tabular text-foreground">{fmtMoney(expenseTotal, lang)}</span>}
                {showExpenses ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
              </button>
              {showExpenses && (
                <div className="space-y-2.5 rounded-xl bg-muted/40 p-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    {EXPENSE_LINES.map((l) => (
                      <div key={l.key} className="space-y-1">
                        <label className="text-[12px] font-medium text-muted-foreground">{t(l.labelKey)} (৳)</label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          value={exp[l.key] ?? ""}
                          onChange={(e) => setExp((s) => ({ ...s, [l.key]: e.target.value }))}
                          placeholder="0"
                          className="h-10 tabular bg-card"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-card px-3.5 py-2.5 text-sm">
                    <span className="text-muted-foreground">{t("expensesTotal")}</span>
                    <span className="font-bold tabular">{fmtMoney(expenseTotal, lang)}</span>
                  </div>
                  {expenseTotal > 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-success/10 px-3.5 py-2.5 text-sm">
                      <span className="text-muted-foreground">{t("profitPreview")}</span>
                      <span className={cn("font-bold tabular", trip.fare - expenseTotal >= 0 ? "text-success" : "text-danger")}>
                        {fmtMoney(trip.fare - expenseTotal, lang)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <Button
                size="lg"
                className="w-full h-13 text-base font-bold gap-2 rounded-2xl"
                disabled={busy || !endKm || Number(endKm) <= (trip.startKm ?? 0)}
                onClick={handleComplete}
              >
                {busy ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />}
                {t("dmCompleteTrip")}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
      {/* Invoice — printable paper (Phase 11) */}
      {showInvoice && <InvoiceSheet trip={trip} onClose={() => setShowInvoice(false)} />}
    </Card>
  );
}
