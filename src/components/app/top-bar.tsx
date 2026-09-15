"use client";

import * as React from "react";
import { useApp, useT } from "@/store";
import { useSearchUi } from "./form-store";
import { LanguageToggle, LanguageToggleIcon } from "./language-toggle";
import { BrandMark } from "./brand";
import { Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

/** Sticky glass top bar: brand (mobile) · search · reminders · language · avatar. */
export function TopBar({ pendingReminders }: { pendingReminders: number }) {
  const { t } = useT();
  const data = useApp((s) => s.data);
  const navigate = useApp((s) => s.navigate);
  const setSearchOpen = useSearchUi((s) => s.setOpen);

  return (
    <header className="sticky top-0 z-30 pt-safe">
      <div className="relative border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4">
          {/* Brand (mobile) */}
          <button
            type="button"
            className="flex items-center gap-2.5 lg:hidden min-w-0"
            onClick={() => navigate("dashboard")}
            aria-label="গাড়িখাতা"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-white ring-1 ring-border/60 shadow-soft">
              <BrandMark className="size-6" />
            </span>
            <span className="min-w-0">
              <span className="text-[15px] font-bold truncate">{data.business.name}</span>
            </span>
          </button>

          {/* Desktop title slot */}
          <div className="hidden lg:flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
            <span aria-hidden className="size-1.5 rounded-full bg-primary/70" />
            <span className="truncate">{data.business.name}</span>
            <span aria-hidden className="text-border">·</span>
            <span className="truncate text-muted-foreground/80">{data.business.address}</span>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label={t("search")}
            className="flex size-9.5 items-center justify-center rounded-full text-muted-foreground bg-muted/60 hover:bg-muted hover:text-foreground active:scale-95 transition-all"
          >
            <Search className="size-5" strokeWidth={2.2} />
          </button>

          {/* Reminders */}
          <button
            type="button"
            onClick={() => navigate("reminders")}
            aria-label={t("navReminders")}
            className="relative flex size-9.5 items-center justify-center rounded-full text-muted-foreground bg-muted/60 hover:bg-muted hover:text-foreground active:scale-95 transition-all"
          >
            <Bell className="size-5" strokeWidth={2.2} />
            {pendingReminders > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex min-w-4.5 h-4.5 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white tabular ring-2 ring-background">
                {pendingReminders > 9 ? "9+" : pendingReminders}
              </span>
            )}
          </button>

          <div className="hidden sm:block">
            <LanguageToggle />
          </div>
          <div className="sm:hidden">
            <LanguageToggleIcon />
          </div>
        </div>

        {/* Gradient hairline — signature v0.13 detail */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
        />
      </div>
    </header>
  );
}
