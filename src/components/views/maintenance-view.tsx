"use client";

import * as React from "react";
import { useApp, useT } from "@/store";
import { useMaintItemLabel, useMaintStatus } from "@/lib/insights";
import { ViewHeader, EmptyState, StatusBadge } from "@/components/shared/ui-bits";
import { useFormUi } from "@/components/app/form-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Wrench, CalendarDays } from "lucide-react";
import { fmtMoney, fmtNum, fmtDate } from "@/lib/format";

export function MaintenanceView() {
  const { t, lang } = useT();
  const data = useApp((s) => s.data);
  const openForm = useFormUi((s) => s.open);
  const itemLabel = useMaintItemLabel();
  const maintStatusMap = useMaintStatus();

  return (
    <div className="space-y-4">
      <ViewHeader titleKey="navMaintenance" onAdd={() => openForm("service")} addLabel={t("addService")} />

      <Tabs defaultValue="schedule">
        <TabsList className="w-full h-10 rounded-xl p-1">
          <TabsTrigger value="schedule" className="flex-1 text-xs sm:text-sm rounded-lg">{t("serviceSchedule")}</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 text-xs sm:text-sm rounded-lg">{t("serviceHistory")}</TabsTrigger>
        </TabsList>

        {/* Schedule — the reminder engine demo (Section 18) */}
        <TabsContent value="schedule" className="space-y-3 mt-3">
          {data.maintenanceSchedule.length === 0 ? (
            <EmptyState icon={Wrench} titleKey="serviceSchedule" />
          ) : (
            data.vehicles.map((v) => {
              const items = data.maintenanceSchedule.filter((m) => m.vehicleId === v.id);
              if (items.length === 0) return null;
              return (
                <div key={v.id} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-sm font-semibold">{v.name}</span>
                    <span className="text-[11px] text-muted-foreground tabular">
                      · {t("vehicleKm")} {fmtNum(v.currentKm, lang)}
                    </span>
                  </div>
                  {items.map((m) => {
                    const ms = maintStatusMap[m.status];
                    const nextDueKm = m.lastServiceKm + m.intervalKm;
                    const remaining = nextDueKm - v.currentKm;
                    // progress: how far through the interval (0..1)
                    const used = Math.min(1, Math.max(0, (v.currentKm - m.lastServiceKm) / m.intervalKm));
                    const progressTone =
                      m.status === "good" ? "bg-success" : m.status === "soon" ? "bg-warning" : "bg-danger";
                    return (
                      <div key={m.id} className="rounded-xl border border-border/70 bg-card px-4 py-3 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-semibold">{itemLabel[m.item]}</span>
                          <StatusBadge label={ms.label} tone={ms.tone} />
                        </div>
                        <div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full ${progressTone}`} style={{ width: `${Math.round(used * 100)}%` }} />
                          </div>
                          <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground tabular">
                            <span>{t("lastServiceAt")} {fmtDate(m.lastServiceDate, lang)} · {fmtNum(m.lastServiceKm, lang)} km</span>
                            <span className={m.status === "overdue" ? "text-danger font-medium" : m.status === "soon" ? "text-warning-foreground font-medium" : ""}>
                              {remaining >= 0
                                ? `${t("serviceDueSoon")} ${fmtNum(remaining, lang)} ${t("kmLeft")}`
                                : `${fmtNum(-remaining, lang)} ${t("kmOver")}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-2 mt-3">
          {data.maintenanceLogs.length === 0 ? (
            <EmptyState icon={CalendarDays} titleKey="serviceHistory" />
          ) : (
            data.maintenanceLogs
              .slice()
              .sort((a, b) => +new Date(b.date) - +new Date(a.date))
              .map((log) => {
                const v = data.vehicles.find((x) => x.id === log.vehicleId);
                return (
                  <div key={log.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Wrench className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold">{v?.name} — {itemLabel[log.item]}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {fmtDate(log.date, lang)} · {log.workshop} · {fmtNum(log.km, lang)} km
                      </div>
                    </div>
                    <span className="text-sm font-bold tabular shrink-0">{fmtMoney(log.cost, lang)}</span>
                  </div>
                );
              })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
