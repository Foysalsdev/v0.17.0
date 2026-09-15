"use client";

import { useApp, useT } from "@/store";
import { useMileageWarnings } from "@/lib/insights";
import { ViewHeader, EmptyState } from "@/components/shared/ui-bits";
import { useFormUi } from "@/components/app/form-store";
import { Card, CardContent } from "@/components/ui/card";
import { Fuel, Droplets, TriangleAlert, Gauge } from "lucide-react";
import { fmtMoney, fmtNum, fmtDate } from "@/lib/format";

export function FuelView() {
  const { t, lang } = useT();
  const data = useApp((s) => s.data);
  const openForm = useFormUi((s) => s.open);
  const warnings = useMileageWarnings();

  const monthFuel = data.expenses
    .filter((e) => e.category === "fuel" && new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      <ViewHeader titleKey="navFuel" onAdd={() => openForm("fuel")} addLabel={t("addFuel")} />

      {/* Mileage warning (Section 16) */}
      {warnings.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-info/30 bg-info/5 px-4 py-3">
          <TriangleAlert className="size-4.5 shrink-0 mt-0.5 text-muted-foreground" />
          <div className="space-y-1">
            {warnings.map((w) => <p key={w} className="text-[13px] leading-relaxed text-foreground/90">{w}</p>)}
          </div>
        </div>
      )}

      {/* Per-vehicle efficiency */}
      <div className="grid gap-3 sm:grid-cols-2">
        {data.vehicles.map((v) => {
          const costPerKm = v.mileage > 0 ? (data.fuelEntries.find((f) => f.vehicleId === v.id)?.pricePerLitre ?? 0) / v.mileage : 0;
          return (
            <Card key={v.id} className="border-border/70 shadow-xs">
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{v.name}</span>
                  <span className="text-[11px] text-muted-foreground tabular">{v.regNumber}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Tile icon={Gauge} label={t("kmPerLitre")} value={fmtNum(v.mileage, lang, 1)} />
                  <Tile icon={Droplets} label={t("costPerKm")} value={fmtMoney(costPerKm, lang)} />
                  <Tile icon={Fuel} label={t("monthFuelCost")} value={fmtMoney(monthFuel / data.vehicles.length, lang, { compact: true })} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Entries */}
      <div>
        <h2 className="text-sm font-semibold text-foreground px-1 pb-2">{t("fuelEntries")}</h2>
        {data.fuelEntries.length === 0 ? (
          <EmptyState icon={Fuel} titleKey="fuelEmpty" />
        ) : (
          <div className="space-y-2">
            {data.fuelEntries.map((f) => {
              const v = data.vehicles.find((x) => x.id === f.vehicleId);
              return (
                <div key={f.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Fuel className="size-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">
                      {v?.name} · <span className="tabular">{fmtNum(f.litres, lang, 1)} {t("litre")}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {fmtDate(f.date, lang)} · {f.station} · {t("vehicleKm")} {fmtNum(f.odometerKm, lang)}
                    </div>
                  </div>
                  <span className="text-sm font-bold tabular shrink-0">{fmtMoney(f.totalCost, lang)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/50 py-2 px-1">
      <Icon className="size-4 text-primary" />
      <span className="text-sm font-bold tabular">{value}</span>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}
