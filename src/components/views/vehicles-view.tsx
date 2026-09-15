"use client";

import * as React from "react";
import { toast } from "sonner";
import { useApp, useT } from "@/store";
import { useVehicleStatus, useDocTypeLabel, useMaintItemLabel, useMaintStatus } from "@/lib/insights";
import { daysUntil } from "@/lib/types";
import type { FuelType } from "@/lib/types";
import { ViewHeader, EmptyState, StatusBadge, InfoRow } from "@/components/shared/ui-bits";
import { useFormUi } from "@/components/app/form-store";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Car, Fuel, Wrench, FileText, TrendingUp, Gauge, TriangleAlert, Plus, Pencil } from "lucide-react";
import { fmtMoney, fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

export function VehiclesView() {
  const { t, lang } = useT();
  const data = useApp((s) => s.data);
  const statusMap = useVehicleStatus();
  const openForm = useFormUi((s) => s.open);
  const [openId, setOpenId] = React.useState<string | null>(null);

  const fuelLabel = (ft: FuelType) => ft === "diesel" ? t("diesel") : ft === "petrol" ? t("petrol") : t("cng");

  return (
    <div className="space-y-4">
      <ViewHeader
        titleKey="navVehicles"
        onAdd={() => openForm("vehicle")}
        addLabel={t("addVehicle")}
      />

      {data.vehicles.length === 0 ? (
        <EmptyState icon={Car} titleKey="vehiclesEmpty" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.vehicles.map((v) => {
            const st = statusMap[v.status];
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setOpenId(v.id)}
                className="text-left active:scale-[0.99] transition-transform"
              >
                <Card className="border-border/70 shadow-xs overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    {/* Banner */}
                    <div className="relative flex items-center justify-between bg-gradient-to-br from-primary/12 via-primary/5 to-transparent px-4 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex size-11 items-center justify-center rounded-xl bg-card shadow-sm text-primary">
                          <Car className="size-6" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-base font-bold text-foreground truncate">{v.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-muted-foreground tabular truncate">{v.regNumber}</span>
                            {v.fuelTypes.map((f) => (
                              <span key={f} className={cn(
                                "shrink-0 rounded-full px-1.5 py-px text-[10px] font-bold",
                                f === "diesel" && "bg-warning/15 text-warning-foreground",
                                f === "petrol" && "bg-success/15 text-success",
                                f === "cng" && "bg-info/15 text-info"
                              )}>
                                {fuelLabel(f)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <StatusBadge label={st.label} tone={st.tone} dot />
                    </div>
                    {/* Stats */}
                    <div className="grid grid-cols-3 divide-x divide-border/60 border-t border-border/60">
                      <MiniStat label={t("vehicleKm")} value={`${fmtNum(v.currentKm, lang)}`} />
                      <MiniStat label={t("kmPerLitre")} value={`${fmtNum(v.mileage, lang, 1)}`} />
                      <MiniStat
                        label={t("vehicleProfit")}
                        value={fmtMoney(v.monthlyRevenue - v.monthlyCost, lang, { compact: true })}
                        tone={v.monthlyRevenue - v.monthlyCost >= 0 ? "text-success" : "text-danger"}
                      />
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {openId && <VehicleDetailSheet vehicleId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2.5">
      <span className={cn("text-sm font-bold tabular", tone ?? "text-foreground")}>{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

/* ---------------- Vehicle detail sheet ---------------- */
function VehicleDetailSheet({ vehicleId, onClose }: { vehicleId: string; onClose: () => void }) {
  const { t, lang } = useT();
  const data = useApp((s) => s.data);
  const openForm = useFormUi((s) => s.open);
  const statusMap = useVehicleStatus();
  const docLabel = useDocTypeLabel();
  const itemLabel = useMaintItemLabel();
  const maintStatusMap = useMaintStatus();

  const v = data.vehicles.find((x) => x.id === vehicleId);
  if (!v) return null;
  const st = statusMap[v.status];
  const docs = data.documents.filter((d) => d.vehicleId === v.id);
  const sched = data.maintenanceSchedule.filter((m) => m.vehicleId === v.id);
  const profit = v.monthlyRevenue - v.monthlyCost;
  const mileageDropped = v.mileagePrev > 0 && v.mileage < v.mileagePrev * 0.9;

  const fuelLabel = v.fuelTypes.map((f) => f === "diesel" ? t("diesel") : f === "petrol" ? t("petrol") : t("cng")).join(" + ");

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="bottom" className="inset-x-0 mx-auto w-full max-w-lg rounded-t-2xl p-0 border-t max-h-[92dvh] flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-1 shrink-0">
          <SheetTitle className="flex items-center gap-3 text-lg">
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Car className="size-5.5" />
            </span>
            <span>
              {v.brand} {v.model}
              <span className="block text-xs font-normal text-muted-foreground tabular">{v.regNumber}</span>
            </span>
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2 pt-1">
            <StatusBadge label={st.label} tone={st.tone} dot />
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto nice-scrollbar px-5 pb-5 pt-2 space-y-5 flex-1">
          {/* Month money */}
          <div className="grid grid-cols-3 gap-2">
            <SummaryTile label={t("vehicleIncome")} value={fmtMoney(v.monthlyRevenue, lang, { compact: true })} tone="text-success" icon={TrendingUp} />
            <SummaryTile label={t("monthExpense")} value={fmtMoney(v.monthlyCost, lang, { compact: true })} tone="text-danger" icon={TrendingUp} />
            <SummaryTile label={t("vehicleProfit")} value={fmtMoney(profit, lang, { compact: true })} tone={profit >= 0 ? "text-success" : "text-danger"} icon={TrendingUp} />
          </div>

          {/* Mileage */}
          <div className={cn("rounded-xl border px-4 py-3 flex items-center justify-between", mileageDropped ? "border-info/30 bg-info/5" : "border-border bg-muted/40")}>
            <div className="flex items-center gap-2.5">
              <Gauge className="size-4.5 text-muted-foreground" />
              <span className="text-sm font-medium">{t("kmPerLitre")}</span>
            </div>
            <span className="text-base font-bold tabular">{fmtNum(v.mileage, lang, 1)}</span>
          </div>
          {mileageDropped && (
            <div className="flex items-start gap-2.5 rounded-xl bg-info/10 border border-info/25 px-4 py-2.5 -mt-2.5">
              <TriangleAlert className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
              <p className="text-[12px] leading-relaxed text-foreground/90">{t("fuelEffDropped")}</p>
            </div>
          )}

          {/* Specs */}
          <div className="rounded-xl border border-border/70 overflow-hidden">
            <div className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground">{v.brand} {v.model} · {v.year}</div>
            <div className="px-4">
              <InfoRow label={t("vehicleKm")} value={`${fmtNum(v.currentKm, lang)} ${t("km")}`} />
              <InfoRow label={t("fuelType")} value={`${fuelLabel} · ${fmtNum(v.engineCc, lang)}cc`} />
              <InfoRow label={t("seats")} value={fmtNum(v.seats, lang)} />
              <InfoRow label={t("color")} value={v.color} />
              <InfoRow label={t("transmission")} value={v.transmission === "manual" ? t("manual") : t("automatic")} />
              <InfoRow label={t("vehicleProfit") + " (" + t("thisMonth") + ")"} value={fmtMoney(profit, lang)} valueClass={profit >= 0 ? "text-success" : "text-danger"} />
            </div>
          </div>

          {/* Documents */}
          <div>
            <h3 className="text-sm font-semibold mb-2">{t("vehicleDocs")}</h3>
            <div className="flex flex-wrap gap-2">
              {docs.map((d) => {
                const days = daysUntil(d.expiryDate);
                const tone = days < 0 ? "danger" : days <= 7 ? "danger" : days <= 15 ? "warning" : days <= 30 ? "info" : "success";
                return (
                  <StatusBadge
                    key={d.id}
                    label={`${docLabel[d.docType]} · ${days < 0 ? t("expired") : `${fmtNum(days, lang)} ${t("daysLeftShort")}`}`}
                    tone={tone}
                  />
                );
              })}
            </div>
          </div>

          {/* Maintenance */}
          <div>
            <h3 className="text-sm font-semibold mb-2">{t("vehicleService")}</h3>
            <div className="rounded-xl border border-border/70 divide-y divide-border/60 overflow-hidden">
              {sched.map((m) => {
                const ms = maintStatusMap[m.status];
                const remaining = m.lastServiceKm + m.intervalKm - v.currentKm;
                return (
                  <div key={m.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <span className="text-[13px] font-medium">{itemLabel[m.item]}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground tabular">
                        {remaining >= 0 ? `${fmtNum(remaining, lang)} ${t("kmLeft")}` : `${fmtNum(-remaining, lang)} ${t("kmOver")}`}
                      </span>
                      <StatusBadge label={ms.label} tone={ms.tone} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick actions for this vehicle */}
          <div className="grid grid-cols-4 gap-2 pb-1">
            <Button variant="outline" className="h-11 rounded-xl text-xs gap-1.5" onClick={() => { onClose(); openForm("vehicle", { vehicleId: v.id }); }}>
              <Pencil className="size-4" /> {t("edit")}
            </Button>
            <Button variant="outline" className="h-11 rounded-xl text-xs gap-1.5" onClick={() => { onClose(); openForm("fuel", { vehicleId: v.id }); }}>
              <Fuel className="size-4" /> {t("addFuel")}
            </Button>
            <Button variant="outline" className="h-11 rounded-xl text-xs gap-1.5" onClick={() => { onClose(); openForm("service", { vehicleId: v.id }); }}>
              <Wrench className="size-4" /> {t("addService")}
            </Button>
            <Button variant="outline" className="h-11 rounded-xl text-xs gap-1.5" onClick={() => { onClose(); openForm("document", { vehicleId: v.id }); }}>
              <FileText className="size-4" /> {t("navDocuments")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SummaryTile({ label, value, tone, icon: Icon }: { label: string; value: string; tone: string; icon: typeof TrendingUp }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card px-2 py-2.5 flex flex-col items-center gap-0.5">
      <Icon className={cn("size-4", tone)} />
      <span className={cn("text-sm font-bold tabular", tone)}>{value}</span>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}
