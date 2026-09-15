"use client";

import { cn } from "@/lib/utils";

/**
 * Brand mark — the owner's new logo (v0.10, upload/Gari-Khata_Logo.png →
 * public/logo-mark.png, icon-only crop). The full logo with text is
 * public/logo.png. Used in chrome, letterheads + PWA icons.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <img src="/logo-mark.png" alt="" aria-hidden="true" draggable="false"
      className={cn("shrink-0 select-none object-contain", className)} />
  );
}

export function AppLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-white border border-border/50 shadow-sm">
        <BrandMark className="size-6.5" />
      </span>
      {!compact && <span className="text-base font-bold leading-tight text-foreground">গাড়িখাতা</span>}
    </span>
  );
}
