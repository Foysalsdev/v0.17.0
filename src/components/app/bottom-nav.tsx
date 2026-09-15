"use client";

import { useApp, useT } from "@/store";
import { BOTTOM_NAV } from "@/lib/nav";
import { Plus, LayoutGrid } from "lucide-react";
import { MIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils";
import { useFormUi } from "./form-store";

/** Mobile floating glass bottom navigation: হোম · ট্রিপ · [+ FAB] · গাড়ি · আরও */
export function BottomNav() {
  const { t } = useT();
  const view = useApp((s) => s.view);
  const navigate = useApp((s) => s.navigate);
  const openQuick = useFormUi((s) => s.openQuick);

  const left = [BOTTOM_NAV[0], BOTTOM_NAV[1]]; // হোম, ট্রিপ
  const right = [BOTTOM_NAV[2], null]; // গাড়ি + আরও

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden px-3 pb-safe"
    >
      <div className="mx-auto mb-2 grid max-w-lg grid-cols-5 items-end rounded-[26px] glass border border-border/60 shadow-lift">
        {left.map((m) => (
          <NavButton key={m.id} icon={<MIcon name={m.icon} size={20} filled={view === m.id} />} label={t(m.labelKey)} active={view === m.id} onClick={() => navigate(m.id)} />
        ))}

        {/* Center quick-action FAB (Section 53) — docks on the nav bar's top
            edge: half above, half below, never covering a nav item. The
            wrapper matches the row height so the geometry is stable. */}
        <div className="relative flex h-16 justify-center">
          <button
            type="button"
            aria-label={t("quickActions")}
            onClick={openQuick}
            className="absolute left-1/2 top-0 z-10 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl ring-4 ring-background bg-emerald-gradient text-primary-foreground shadow-glow-emerald active:scale-90 transition-transform"
          >
            <Plus className="size-7" strokeWidth={2.5} />
          </button>
        </div>

        {right.map((m, i) =>
          m ? (
            <NavButton key={m.id} icon={<MIcon name={m.icon} size={20} filled={view === m.id} />} label={t(m.labelKey)} active={view === m.id} onClick={() => navigate(m.id)} />
          ) : (
            <NavButton
              key="more"
              icon={<LayoutGrid className="size-5" strokeWidth={view === "more" ? 2.4 : 2} />}
              label={t("navMore")}
              active={view === "more"}
              onClick={() => navigate("more")}
            />
          )
        )}
      </div>
    </nav>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 h-16 w-full min-w-0 pt-1.5 transition-all active:scale-95",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-xl transition-all",
          active && "bg-primary/12 shadow-[inset_0_0_0_1px_oklch(0.52_0.115_163/0.15)]"
        )}
      >
        {icon}
      </span>
      <span className={cn("text-[11px] font-medium leading-none truncate", active && "font-semibold")}>{label}</span>
    </button>
  );
}
