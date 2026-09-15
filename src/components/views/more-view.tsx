"use client";

import { useApp, useT } from "@/store";
import { MODULES } from "@/lib/nav";
import { MIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils";

/** "আরও" — full module grid (mobile). */
export function MoreView() {
  const { t } = useT();
  const navigate = useApp((s) => s.navigate);
  const view = useApp((s) => s.view);

  const modules = MODULES.filter((m) => m.id !== "dashboard");

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-foreground">{t("navMore")}</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {modules.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => navigate(m.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-2.5 rounded-2xl border bg-card p-4 min-h-[88px] active:scale-[0.97] transition-transform hover:shadow-md",
              view === m.id ? "border-primary/40" : "border-border/70"
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground/75">
              <MIcon name={m.icon} size={20} filled={view === m.id} />
            </span>
            <span className="text-xs font-semibold text-foreground text-center leading-tight">{t(m.labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
