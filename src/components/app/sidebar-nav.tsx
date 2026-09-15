"use client";

import { useApp, useT } from "@/store";
import { MODULES } from "@/lib/nav";
import { BrandMark } from "./brand";
import { LogOut, RefreshCcw } from "lucide-react";
import { MIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

/** Premium dark-green desktop sidebar (lg+). Mobile uses BottomNav instead. */
export function SidebarNav() {
  const { t } = useT();
  const view = useApp((s) => s.view);
  const navigate = useApp((s) => s.navigate);
  const logout = useApp((s) => s.logout);
  const refresh = useApp((s) => s.refresh);
  const data = useApp((s) => s.data);
  const session = useApp((s) => s.session);
  const { theme, setTheme } = useTheme();

  const groups: { labelKey?: TranslationKey; ids: string[] }[] = [
    { ids: ["dashboard"] },
    { labelKey: "navGroupOps", ids: ["trips", "quotations", "vehicles", "customers", "drivers"] },
    { labelKey: "navGroupMoney", ids: ["finance", "fuel", "maintenance"] },
    { labelKey: "navGroupInfo", ids: ["documents", "reminders", "reports", "guide"] },
    { ids: ["settings"] },
  ];

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 shrink-0">
        <span className="flex size-10 items-center justify-center rounded-xl bg-white ring-1 ring-black/5 shadow-soft">
          <BrandMark className="size-7" />
        </span>
        <div className="min-w-0">
          <div className="text-base font-bold leading-tight text-sidebar-accent-foreground">গাড়িখাতা</div>
          <div className="text-[11px] text-sidebar-foreground/60 truncate">{data.business.name}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto nice-scrollbar px-3 py-2 space-y-1">
        {groups.map((g, gi) => (
          <div key={gi} className={cn("space-y-0.5", gi > 0 && "pt-2.5 mt-1.5 border-t border-sidebar-border/60")}>
            {g.labelKey && (
              <div className="px-3 pt-2 pb-1 text-[11px] font-bold text-sidebar-foreground/45 select-none">
                {t(g.labelKey)}
              </div>
            )}
            {g.ids.map((id) => {
              const m = MODULES.find((mod) => mod.id === id)!;
              const active = view === m.id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigate(m.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex w-full items-center gap-3 rounded-xl px-3 h-11 text-sm transition-all active:scale-[0.98]",
                    active
                      ? "bg-gradient-to-br from-[oklch(0.66_0.125_164)] to-[oklch(0.54_0.11_174)] font-semibold text-[oklch(0.15_0.03_165)] shadow-glow-emerald"
                      : "font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <MIcon name={m.icon} size={18} filled={active} className="shrink-0" />
                  <span className="truncate">{t(m.labelKey)}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer: user + actions */}
      <div className="shrink-0 border-t border-sidebar-border/60 p-3 space-y-1">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-emerald-gradient text-xs font-bold text-[oklch(0.15_0.03_165)] shadow-glow-emerald">
            {(session?.name ?? data.business.ownerName).slice(0, 2)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{session?.name ?? data.business.ownerName}</div>
            <div className="text-[11px] text-sidebar-foreground/60">{t("roleOwner")} · {t("planFree")}</div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg h-9 text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground active:scale-95 transition-all"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button
            type="button"
            onClick={() => refresh()}
            title={t("retry")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg h-9 text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground active:scale-95 transition-all"
          >
            <RefreshCcw className="size-4" />
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg h-9 text-xs font-medium text-sidebar-foreground/70 hover:bg-danger/20 hover:text-red-200 active:scale-95 transition-all"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
