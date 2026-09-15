"use client";

import { useApp, useT } from "@/store";
import { useDocTypeLabel } from "@/lib/insights";
import { daysUntil } from "@/lib/types";
import { ViewHeader, EmptyState, StatusBadge } from "@/components/shared/ui-bits";
import { useFormUi } from "@/components/app/form-store";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Car, CircleCheck, CircleAlert } from "lucide-react";
import { fmtDate, fmtNum } from "@/lib/format";

export function DocumentsView() {
  const { t, lang } = useT();
  const data = useApp((s) => s.data);
  const openForm = useFormUi((s) => s.open);
  const docLabel = useDocTypeLabel();

  return (
    <div className="space-y-4">
      <ViewHeader titleKey="navDocuments" onAdd={() => openForm("document")} addLabel={t("add")} />

      {data.documents.length === 0 ? (
        <EmptyState icon={FileText} titleKey="docsEmpty" />
      ) : (
        data.vehicles.map((v) => {
          const docs = data.documents.filter((d) => d.vehicleId === v.id);
          if (docs.length === 0) return null;
          return (
            <Card key={v.id} className="border-border/70 shadow-xs overflow-hidden">
              <div className="flex items-center gap-2.5 bg-muted/50 border-b border-border/60 px-4 py-2.5">
                <Car className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{v.name}</span>
                <span className="text-[11px] text-muted-foreground tabular">{v.regNumber}</span>
              </div>
              <CardContent className="p-0 divide-y divide-border/60">
                {docs.map((d) => {
                  const days = daysUntil(d.expiryDate);
                  const tone = days < 0 ? "danger" : days <= 7 ? "danger" : days <= 15 ? "warning" : days <= 30 ? "info" : "success";
                  const label =
                    days < 0
                      ? `${t("expired")} ${fmtDate(d.expiryDate, lang)}`
                      : days <= 30
                        ? `${fmtNum(days, lang)} ${t("daysLeftShort")} · ${fmtDate(d.expiryDate, lang)}`
                        : t("valid");
                  const Icon = tone === "success" ? CircleCheck : CircleAlert;
                  return (
                    <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                      <FileText className="size-4.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold">{docLabel[d.docType]}</div>
                        <div className="text-[11px] text-muted-foreground tabular">
                          {d.docNumber} · {t("expiresOn")} {fmtDate(d.expiryDate, lang)}
                        </div>
                      </div>
                      <StatusBadge label={label} tone={tone} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
