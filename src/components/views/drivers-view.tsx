"use client";

import { useApp, useT } from "@/store";
import { useMaintStatus } from "@/lib/insights";
import { daysUntil } from "@/lib/types";
import { ViewHeader, EmptyState, StatusBadge } from "@/components/shared/ui-bits";
import { useFormUi } from "@/components/app/form-store";
import { Card, CardContent } from "@/components/ui/card";
import { User, Phone, IdCard, TrendingUp, Briefcase, Pencil } from "lucide-react";
import { fmtMoney, fmtNum, fmtDate } from "@/lib/format";

export function DriversView() {
  const { t, lang } = useT();
  const data = useApp((s) => s.data);
  const openForm = useFormUi((s) => s.open);

  return (
    <div className="space-y-4">
      <ViewHeader
        titleKey="navDrivers"
        onAdd={() => openForm("driver")}
        addLabel={t("addDriver")}
      />

      {data.drivers.length === 0 ? (
        <EmptyState icon={User} titleKey="driversEmpty" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.drivers.map((d) => {
            const licDays = daysUntil(d.licenseExpiry);
            const licTone = licDays < 0 ? "danger" : licDays <= 30 ? "warning" : "neutral";
            return (
              <Card key={d.id} className="border-border/70 shadow-xs">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-info/10 text-base">
                        <User className="size-5.5 text-muted-foreground" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{d.name}</div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <span className={"h-1.5 w-1.5 rounded-full " + (d.active ? "bg-success" : "bg-muted-foreground/40")} />
                          {d.active ? t("driverActive") : "—"} · {fmtNum(d.tripsDone, lang)} {t("tripsDone")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge
                        label={`${t("licenseExpiry")} ${fmtDate(d.licenseExpiry, lang)}`}
                        tone={licTone}
                      />
                      <button
                        type="button"
                        aria-label={t("editDriver")}
                        onClick={() => openForm("driver", { driverId: d.id })}
                        className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 active:scale-95 transition-colors"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-1 tabular"><Phone className="size-3.5" />{d.phone}</span>
                    <span className="flex items-center gap-1 truncate"><IdCard className="size-3.5" />{d.licenseNo}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3">
                    <MiniCol label={t("salary")} value={fmtMoney(d.salary, lang)} />
                    <MiniCol label={t("driverAdvance")} value={fmtMoney(d.advance, lang)} />
                    <MiniCol
                      label={t("driverDue")}
                      value={fmtMoney(d.due, lang)}
                      tone={d.due > 0 ? "text-danger" : undefined}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MiniCol({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-sm font-bold tabular ${tone ?? "text-foreground"}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
