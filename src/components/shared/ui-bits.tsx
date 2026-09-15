"use client";

import { cn } from "@/lib/utils";
import { useT } from "@/store";
import { fmtMoney } from "@/lib/format";
import type { TranslationKey } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ---------------- StatCard — dashboard numbers ---------------- */
export function StatCard({
  labelKey,
  value,
  icon: Icon,
  tone = "default",
  hint,
  onClick,
}: {
  labelKey: TranslationKey;
  value: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  hint?: string;
  onClick?: () => void;
}) {
  const { t } = useT();
  /* v0.14: value text keeps its semantic tone (data), but icons are
     always static single-color — neutral chip, no tinted washes. */
  const tones = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning-foreground",
    danger: "text-danger",
    info: "text-info",
  };
  return (
    <Card
      className={cn(
        "border-border/60 shadow-soft",
        onClick && "cursor-pointer card-lift hover:shadow-lift hover:border-border active:scale-[0.98]"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3.5 sm:p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground shrink-0">
              <Icon className="size-4.5" strokeWidth={2.2} />
            </span>
          )}
          <span className="text-xs sm:text-[13px] font-medium text-muted-foreground leading-tight">{t(labelKey)}</span>
        </div>
        <div className={cn("text-xl sm:text-2xl font-bold tabular leading-tight", tones[tone])}>{value}</div>
        {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

/* ---------------- SectionHeader ---------------- */
export function SectionHeader({
  titleKey,
  actionLabel,
  onAction,
  icon: Icon,
}: {
  titleKey: TranslationKey;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}) {
  const { t } = useT();
  return (
    <div className="flex items-center justify-between px-1 pb-2.5">
      <h2 className="text-sm sm:text-[15px] font-bold text-foreground flex items-center gap-2">
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        {t(titleKey)}
      </h2>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary active:scale-[0.96]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ---------------- ViewHeader (mobile page title) ---------------- */
export function ViewHeader({ titleKey, onAdd, addLabel }: { titleKey: TranslationKey; onAdd?: () => void; addLabel?: string }) {
  const { t } = useT();
  return (
    <div className="flex items-center justify-between gap-2 pb-4">
      <div className="flex items-center gap-3 min-w-0">
        <span aria-hidden className="h-7 w-1.5 shrink-0 rounded-full bg-foreground/15 dark:bg-foreground/20" />
        <h1 className="text-xl font-bold text-foreground leading-tight truncate">{t(titleKey)}</h1>
      </div>
      {onAdd && (
        <Button size="sm" className="h-8.5 gap-1.5 rounded-full px-3.5" onClick={onAdd}>
          <Plus className="size-4" />
          <span className="text-xs font-semibold">{addLabel ?? t("add")}</span>
        </Button>
      )}
    </div>
  );
}

/* ---------------- StatusBadge ---------------- */
export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const badgeClasses: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success/12 text-success border-success/20",
  warning: "bg-warning/20 text-warning-foreground border-warning/40",
  danger: "bg-danger/10 text-danger border-danger/25",
  info: "bg-info/10 text-info border-info/20",
};

export function StatusBadge({ label, tone, dot }: { label: string; tone: BadgeTone; dot?: boolean }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium gap-1.5 border", badgeClasses[tone])}>
      {dot && <span className={cn("size-1.5 rounded-full", tone === "neutral" ? "bg-muted-foreground" : "bg-current")} />}
      {label}
    </Badge>
  );
}

/* ---------------- EmptyState ---------------- */
export function EmptyState({ icon: Icon, titleKey, subtitleKey }: { icon?: LucideIcon; titleKey: TranslationKey; subtitleKey?: TranslationKey }) {
  const { t } = useT();
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-border/80 bg-muted/30 py-12 px-6 text-center">
      {Icon && (
        <span className="flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/60 text-muted-foreground">
          <Icon className="size-6.5" strokeWidth={2} />
        </span>
      )}
      <p className="text-sm font-semibold text-foreground">{t(titleKey)}</p>
      {subtitleKey && <p className="text-xs text-muted-foreground">{t(subtitleKey)}</p>}
    </div>
  );
}

/* ---------------- InfoRow (detail rows) ---------------- */
export function InfoRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium tabular", valueClass)}>{value}</span>
    </div>
  );
}

/* ---------------- Money display ---------------- */
export function Money({ amount, tone, className }: { amount: number; tone?: "in" | "out" | "flat"; className?: string }) {
  const { lang } = useT();
  const text = fmtMoney(amount, lang);
  return (
    <span
      className={cn(
        "tabular font-semibold",
        tone === "in" && "text-success",
        tone === "out" && "text-danger",
        tone === "flat" && "text-foreground",
        className
      )}
    >
      {text}
    </span>
  );
}
