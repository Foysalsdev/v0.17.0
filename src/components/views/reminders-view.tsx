"use client";

import * as React from "react";
import { useApp, useT } from "@/store";
import { useReminders, GROUP_TITLES } from "@/lib/insights";
import { ViewHeader, EmptyState } from "@/components/shared/ui-bits";
import { useFormUi } from "@/components/app/form-store";
import { FileText, Wrench, Wallet, Route, BellRing, CircleCheck, Plus, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReminderGroup } from "@/lib/insights";

const GROUP_ICONS: Record<ReminderGroup, typeof FileText> = {
  own: BellRing,
  documents: FileText,
  maintenance: Wrench,
  payments: Wallet,
  trips: Route,
};

export function RemindersView() {
  const { t } = useT();
  const reminders = useReminders();
  const { setReminderDone, deleteReminder } = useApp();
  const busy = useApp((s) => s.busy);
  const openForm = useFormUi((s) => s.open);

  const groups: ReminderGroup[] = ["own", "documents", "maintenance", "payments", "trips"];

  return (
    <div className="space-y-4">
      <ViewHeader titleKey="navReminders" onAdd={() => openForm("reminder")} addLabel={t("addReminder")} />

      {reminders.length === 0 ? (
        <EmptyState icon={CircleCheck} titleKey="allClear" subtitleKey="remindersEmpty" />
      ) : (
        groups.map((g) => {
          const items = reminders.filter((r) => r.group === g);
          if (items.length === 0) return null;
          const Icon = GROUP_ICONS[g];
          return (
            <section key={g} className="space-y-2">
              <h2 className="flex items-center gap-2 px-1 text-sm font-semibold text-foreground">
                <Icon className={cn("size-4", g === "own" ? "text-warning" : "text-primary")} />
                {t(GROUP_TITLES[g])}
                {g === "own" && (
                  <button
                    type="button"
                    onClick={() => openForm("reminder")}
                    aria-label={t("addReminder")}
                    className="ml-auto flex size-7 items-center justify-center rounded-full border border-warning/50 text-warning active:scale-95 transition-transform"
                  >
                    <Plus className="size-4" strokeWidth={2.5} />
                  </button>
                )}
              </h2>
              <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card overflow-hidden">
                {items.map((r) => (
                  <div key={r.id} className="flex items-start gap-3 px-4 py-3">
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        r.tone === "danger" ? "bg-danger" : r.tone === "warning" ? "bg-warning" : "bg-info"
                      )}
                    />
                    <p className={cn(
                      "text-[13px] leading-relaxed text-foreground/90 flex-1",
                      r.reminderId && r.tone === "danger" && "font-medium"
                    )}>{r.message}</p>
                    {/* ✓ complete · ✕ delete — only user-set reminders (v0.9) */}
                    {r.reminderId && (
                      <span className="flex items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => { void setReminderDone(r.reminderId!, true); }}
                          aria-label={t("markDone")}
                          className="flex size-8 items-center justify-center rounded-full bg-success/15 text-success active:scale-90 transition-transform disabled:opacity-50"
                        >
                          <Check className="size-4.5" strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => { void deleteReminder(r.reminderId!); }}
                          aria-label={t("delete")}
                          className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-danger active:scale-90 transition-transform disabled:opacity-50"
                        >
                          <Trash2 className="size-4" strokeWidth={2.2} />
                        </button>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}

      <p className="flex items-center gap-2 text-[11px] text-muted-foreground px-1 pt-2">
        <BellRing className="size-3.5" />
        {t("comingSoon")}: SMS · Push · WhatsApp
      </p>
    </div>
  );
}
