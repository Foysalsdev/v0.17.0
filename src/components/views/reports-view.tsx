"use client";

import * as React from "react";
import { toast } from "sonner";
import { useApp, useT } from "@/store";
import { StatCard, SectionHeader, StatusBadge } from "@/components/shared/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Car, Users, User, TrendingUp, TrendingDown, Wallet, BarChart3, ChevronRight, Route, Download, FileSpreadsheet } from "lucide-react";
import { fmtMoney, fmtNum, fmtDate } from "@/lib/format";
import { buildCsv, downloadCsv, type CsvKind } from "@/lib/csv";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n";

/* fuel price per litre (৳) — used for the খরচ/কিমি estimate */
const FUEL_PRICE: Record<string, number> = { diesel: 93, petrol: 122, cng: 43 };

const EXPORTS: { kind: CsvKind; labelKey: TranslationKey; icon: typeof FileSpreadsheet }[] = [
  { kind: "trips", labelKey: "exportTrips", icon: Route },
  { kind: "ledger", labelKey: "exportLedger", icon: FileSpreadsheet },
  { kind: "customers", labelKey: "exportCustomers", icon: Users },
  { kind: "vehicles", labelKey: "exportVehicles", icon: Car },
];

export function ReportsView() {
  const { t, lang } = useT();
  const data = useApp((s) => s.data);
  const [drillVehicleId, setDrillVehicleId] = React.useState<string | null>(null);

  const exportCsv = (kind: CsvKind) => {
    const file = buildCsv(kind, data, (k) => t(k));
    downloadCsv(file);
    toast.success(t("exportedToast"), { description: file.filename });
  };

  const perVehicle = data.vehicles
    .map((v) => ({ v, profit: v.monthlyRevenue - v.monthlyCost }))
    .sort((a, b) => b.profit - a.profit);
  const best = perVehicle[0];
  const topCustomer = data.customers.slice().sort((a, b) => b.totalTrips - a.totalTrips)[0];
  const topDriver = data.drivers.slice().sort((a, b) => b.tripsDone - a.tripsDone)[0];
  const net = data.monthStats.income - data.monthStats.expense;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground pb-3">{t("navReports")}</h1>

        {/* Month summary */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatCard labelKey="monthIncome" value={fmtMoney(data.monthStats.income, lang)} tone="success" icon={TrendingUp} />
          <StatCard labelKey="monthExpense" value={fmtMoney(data.monthStats.expense, lang)} tone="danger" icon={TrendingDown} />
          <StatCard labelKey="netProfit" value={fmtMoney(net, lang)} tone={net >= 0 ? "success" : "danger"} icon={Wallet} />
        </div>
      </div>

      {/* Stars of the month */}
      <section>
        <SectionHeader titleKey="monthlySummary" icon={BarChart3} />
        <div className="grid gap-3 sm:grid-cols-3">
          <HighlightCard
            icon={Car}
            title={t("bestVehicle")}
            name={best?.v.name ?? "—"}
            value={fmtMoney(best?.profit ?? 0, lang)}
            tone="text-success"
          />
          <HighlightCard
            icon={Users}
            title={t("topCustomer")}
            name={topCustomer?.name ?? "—"}
            value={`${fmtNum(topCustomer?.totalTrips ?? 0, lang)} ${t("totalTrips")}`}
            tone="text-primary"
          />
          <HighlightCard
            icon={User}
            title={t("topDriver")}
            name={topDriver?.name ?? "—"}
            value={`${fmtNum(topDriver?.tripsDone ?? 0, lang)} ${t("tripsDone")}`}
            tone="text-info"
          />
        </div>
      </section>

      {/* Per-vehicle profit (Section 36) — tap for the month's trips */}
      <section>
        <SectionHeader titleKey="perVehicleProfit" />
        <Card className="border-border/70 shadow-xs">
          <CardContent className="p-0 divide-y divide-border/60">
            {perVehicle.map(({ v, profit }) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setDrillVehicleId(v.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <Car className="size-4.5 text-muted-foreground" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold truncate">{v.name}</div>
                    <div className="text-[11px] text-muted-foreground tabular">
                      {t("revenue")} {fmtMoney(v.monthlyRevenue, lang)} · {t("cost")} {fmtMoney(v.monthlyCost, lang)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={cn("text-sm font-bold tabular", profit >= 0 ? "text-success" : "text-danger")}>
                    {fmtMoney(profit, lang)}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
        <p className="text-[10px] text-muted-foreground px-1 mt-1.5">{t("reportTapHint")}</p>
        {/* Fuel cost per KM estimate (Section 36) — price follows the fuel type */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {data.vehicles.map((v) => (
            <div key={v.id} className="rounded-xl border border-border/70 bg-card px-2 py-2.5 text-center">
              <div className="text-[11px] font-medium text-foreground truncate">{v.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">খরচ/কিমি</div>
              <div className="text-sm font-bold tabular">
                {v.mileage > 0 ? fmtMoney((FUEL_PRICE[v.fuelTypes[0] ?? "diesel"]) / v.mileage, lang) : "—"}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Download / share (Phase 12) — CSV files open in Excel & Google Sheets */}
      <section>
        <SectionHeader titleKey="exportData" icon={Download} />
        <div className="grid grid-cols-2 gap-2.5">
          {EXPORTS.map(({ kind, labelKey, icon: Icon }) => (
            <button
              key={kind}
              type="button"
              onClick={() => exportCsv(kind)}
              className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card px-3.5 py-3 text-left active:scale-[0.98] transition-transform"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="size-4.5" />
              </span>
              <span className="text-[12.5px] font-semibold leading-tight min-w-0">{t(labelKey)}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground px-1 mt-1.5">{t("exportHint")}</p>
      </section>

      {drillVehicleId && (
        <VehicleMonthSheet vehicleId={drillVehicleId} onClose={() => setDrillVehicleId(null)} />
      )}
    </div>
  );
}

/* ---------------- Drill-down: one vehicle's month ---------------- */
function VehicleMonthSheet({ vehicleId, onClose }: { vehicleId: string; onClose: () => void }) {
  const { t, lang } = useT();
  const data = useApp((s) => s.data);
  const v = data.vehicles.find((x) => x.id === vehicleId) as Vehicle | undefined;
  if (!v) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthTrips = data.trips
    .filter((tr) => tr.vehicleId === v.id && new Date(tr.startAt) >= monthStart && tr.status !== "cancelled")
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  const monthIncomes = data.incomes.filter((i) => i.vehicleId === v.id && new Date(i.date) >= monthStart);
  const monthExpenses = data.expenses.filter((e) => e.vehicleId === v.id && new Date(e.date) >= monthStart);
  const profit = v.monthlyRevenue - v.monthlyCost;
  const bnMonth = monthStart.toLocaleString("bn-BD", { month: "long" });

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="bottom" className="inset-x-0 mx-auto w-full max-w-lg rounded-t-2xl p-0 border-t max-h-[90dvh] flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-1 shrink-0">
          <SheetTitle className="flex items-center gap-2.5 text-lg">
            <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Car className="size-5" />
            </span>
            {v.name}
          </SheetTitle>
          <SheetDescription className="text-xs tabular">
            {bnMonth} · {t("revenue")} {fmtMoney(v.monthlyRevenue, lang)} · {t("cost")} {fmtMoney(v.monthlyCost, lang)}
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto nice-scrollbar px-5 pb-5 pt-2 space-y-4 flex-1">
          <div className="grid grid-cols-3 gap-2">
            <MiniTile label={t("monthIncome")} value={fmtMoney(v.monthlyRevenue, lang, { compact: true })} tone="text-success" />
            <MiniTile label={t("monthExpense")} value={fmtMoney(v.monthlyCost, lang, { compact: true })} tone="text-danger" />
            <MiniTile label={t("vehicleProfit")} value={fmtMoney(profit, lang, { compact: true })} tone={profit >= 0 ? "text-success" : "text-danger"} />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Route className="size-4 text-muted-foreground" />
              {t("monthTrips")} ({fmtNum(monthTrips.length, lang)})
            </h3>
            {monthTrips.length === 0 ? (
              <p className="text-[12px] text-muted-foreground rounded-xl bg-muted/50 px-4 py-3">{t("noTripsToday")}</p>
            ) : (
              <div className="rounded-xl border border-border/70 divide-y divide-border/60 overflow-hidden">
                {monthTrips.map((tr) => (
                  <div key={tr.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold truncate">
                        {tr.ref} · {tr.from} <span className="text-muted-foreground">→</span> {tr.to}
                      </div>
                      <div className="text-[10px] text-muted-foreground tabular">
                        {fmtDate(tr.startAt, lang)}
                        {tr.status === "completed" && tr.profit != null && (
                          <span className={cn(" font-semibold", tr.profit >= 0 ? " text-success" : " text-danger")}>
                            {" "}| {t("tripProfit")} {fmtMoney(tr.profit, lang)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {tr.due > 0 && (
                        <span className="text-[10px] font-bold text-danger tabular">{t("tripDue")} {fmtMoney(tr.due, lang, { compact: true })}</span>
                      )}
                      <StatusBadge
                        label={
                          tr.status === "completed" ? t("tripStatusCompleted") :
                          tr.status === "running" ? t("tripStatusRunning") :
                          tr.status === "confirmed" ? t("tripStatusConfirmed") : t("tripStatusDraft")
                        }
                        tone={tr.status === "completed" ? "success" : tr.status === "running" ? "warning" : "info"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-success/5 border border-success/20 px-4 py-3">
              <div className="text-[10px] text-muted-foreground">{t("tabIncome")} ({fmtNum(monthIncomes.length, lang)})</div>
              <div className="text-sm font-bold tabular text-success">{fmtMoney(v.monthlyRevenue, lang)}</div>
            </div>
            <div className="rounded-xl bg-danger/5 border border-danger/20 px-4 py-3">
              <div className="text-[10px] text-muted-foreground">{t("tabExpense")} ({fmtNum(monthExpenses.length, lang)})</div>
              <div className="text-sm font-bold tabular text-danger">{fmtMoney(v.monthlyCost, lang)}</div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MiniTile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card px-2 py-2.5 flex flex-col items-center gap-0.5">
      <span className={cn("text-sm font-bold tabular", tone)}>{value}</span>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

function HighlightCard({ icon: Icon, title, name, value, tone }: {
  icon: typeof Car; title: string; name: string; value: string; tone: string;
}) {
  return (
    <Card className="border-border/70 shadow-xs">
      <CardContent className="p-4 flex items-center gap-3">
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted", tone)}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="text-[11px] text-muted-foreground">{title}</div>
          <div className="text-sm font-semibold truncate">{name}</div>
          <div className={cn("text-[13px] font-bold tabular", tone)}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
