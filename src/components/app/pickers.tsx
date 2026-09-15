"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Search, Check, UserPlus, CarFront, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/store";
import type { TranslationKey } from "@/lib/i18n";

/* ==================================================================
 * ChipGroup — the anti-dropdown. Big tappable chips in a grid.
 * Used for FIXED small option sets: fuel type, rental type, categories,
 * payment method… (these never grow — chips stay the best UI here).
 * ================================================================== */
export function ChipGroup<T extends string>({
  value, onChange, options, columns = 3, maxH,
}: {
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string; dot?: string }[];
  columns?: 2 | 3 | 4;
  maxH?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      className={cn("grid gap-2", {
        "grid-cols-2": columns === 2,
        "grid-cols-3": columns === 3,
        "grid-cols-4": columns === 4,
        "max-h-44 overflow-y-auto nice-scrollbar": maxH,
      })}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex h-10 items-center justify-center gap-1.5 rounded-xl border text-[13px] font-medium leading-tight px-1 transition-colors",
              selected
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card border-input text-foreground hover:bg-muted active:scale-[0.97] transition-transform"
            )}
          >
            {o.dot && <span className={cn("size-2 rounded-full shrink-0", selected ? "bg-primary-foreground/80" : o.dot)} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ==================================================================
 * MultiChipGroup — ChipGroup-এর multi-select ভাই। একাধিক ভ্যালু একসাথে
 * সিলেক্ট রাখা যায় (যেমন: পেট্রোল + CNG ডুয়াল-ফুয়েল গাড়ি)।
 * প্রথম সিলেক্টটাই "primary" — hint/milestone হিসেবে ব্যবহৃত হয়।
 * ================================================================== */
export function MultiChipGroup<T extends string>({
  values, onToggle, options, columns = 3,
}: {
  values: T[];
  onToggle: (v: T) => void;
  options: { value: T; label: string; dot?: string }[];
  columns?: 2 | 3 | 4;
}) {
  return (
    <div
      role="group"
      className={cn("grid gap-2", {
        "grid-cols-2": columns === 2,
        "grid-cols-3": columns === 3,
        "grid-cols-4": columns === 4,
      })}
    >
      {options.map((o) => {
        const selected = values.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            role="checkbox"
            aria-checked={selected}
            onClick={() => onToggle(o.value)}
            className={cn(
              "flex h-10 items-center justify-center gap-1.5 rounded-xl border text-[13px] font-medium leading-tight px-1 transition-colors",
              selected
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card border-input text-foreground hover:bg-muted active:scale-[0.97] transition-transform"
            )}
          >
            {selected ? (
              <Check className="size-3.5 shrink-0" aria-hidden />
            ) : (
              o.dot && <span className={cn("size-2 rounded-full shrink-0", o.dot)} aria-hidden />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ==================================================================
 * SmartSearchPicker — the scale-proof entity picker (owner round 2).
 *
 * Customers / vehicles / drivers GROW (4 → 400+). A chip row cannot
 * scale, so entity selection is now a type-to-search field:
 *   SEE (one field with the current selection) → TAP (sheet opens,
 *   keyboard ready) → TYPE (instant filter) → DONE (tap a row).
 *
 * Owner's spec: "ড্রপ ডাউনে লিখার অপশন ও থাকবে — কমন কিছু লিখলে
 * সাজেশনে দেখাবে ৬টা" → always ≤ 6 suggestions, typing narrows,
 * Bengali digits tolerated, and "+ নতুন" creates inline.
 * ================================================================== */

export interface PickerItem {
  id: string;        // "" / "none" allowed for "no selection"
  title: string;
  sub?: string;
  tone?: "success" | "warning" | "danger" | "neutral" | "info";
  keywords?: string; // extra searchable text (phone, reg number, company…)
}

const TONE_DOT: Record<string, string> = {
  success: "bg-success", warning: "bg-warning", danger: "bg-danger",
  neutral: "bg-muted-foreground/40", info: "bg-info",
};

/* Bengali digits ০-৯ → ASCII, lowercase, single-spaced. */
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
    .replace(/\s+/g, " ")
    .trim();
}

function haystack(i: PickerItem): string {
  return norm(`${i.title} ${i.sub ?? ""} ${i.keywords ?? ""}`);
}

const SUGGESTIONS = 6; // owner round 2: show exactly 6

export function SmartSearchPicker({
  label, items, value, onChange, allowNone, noneLabelKey = "noneOption",
  extraNew, icon = "user", searchPlaceholder, displayAs,
}: {
  label: string;
  items: PickerItem[];               // pre-sorted by caller (best first)
  value: string;
  onChange: (id: string) => void;
  allowNone?: boolean;
  noneLabelKey?: TranslationKey;
  /** inline-create entry — onNew receives the typed query to prefill */
  extraNew?: { label: string; onNew: (query: string) => void } | null;
  icon?: "user" | "car";
  searchPlaceholder?: string;
  /** override the trigger's title (e.g. the new-customer name being typed) */
  displayAs?: string;
}) {
  const { t } = useT();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected =
    items.find((i) => i.id === value) ??
    (allowNone && value === "none" ? { id: "none", title: t(noneLabelKey) } : undefined);

  const q = norm(query);
  const matched = q ? items.filter((i) => haystack(i).includes(q)) : items;
  const shown = matched.slice(0, SUGGESTIONS);
  const more = matched.length - shown.length;
  const showNone = allowNone && (!q || norm(t(noneLabelKey)).includes(q));

  const RowIcon = icon === "car" ? CarFront : UserRound;

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  const handleNew = () => {
    extraNew?.onNew(query.trim());
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>

      {/* SEE: one field with the current selection, search affordance */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full h-11 items-center justify-between gap-2 rounded-xl border bg-card px-3.5 text-left active:scale-[0.99] transition-transform"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {selected?.tone && <span className={cn("size-2.5 shrink-0 rounded-full", TONE_DOT[selected.tone])} />}
          <span className="min-w-0">
            <span className={cn("block truncate text-[13px] font-medium", !selected && !displayAs && "text-muted-foreground")}>
              {displayAs ?? selected?.title ?? label}
            </span>
            {selected?.sub && !displayAs && <span className="block truncate text-[11px] text-muted-foreground tabular">{selected.sub}</span>}
          </span>
        </span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Search className="size-4" />
        </span>
      </button>

      {/* TAP → sheet with keyboard ready → TYPE → DONE */}
      <Sheet open={open} onOpenChange={(v) => { if (!v) setOpen(false); }}>
        <SheetContent side="bottom" className="inset-x-0 mx-auto w-full max-w-lg rounded-t-2xl p-0 border-t max-h-[80dvh] flex flex-col">
          <SheetHeader className="px-5 pt-5 pb-2 shrink-0">
            <SheetTitle className="text-base">{label}</SheetTitle>
          </SheetHeader>
          <div className="px-5 pb-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder ?? t("typeToSearch")}
                className="h-10 pl-10 rounded-xl text-[15px]"
                autoFocus
                inputMode="text"
              />
            </div>
          </div>
          <div className="overflow-y-auto nice-scrollbar px-3 pb-safe flex-1">
            {/* inline create — always discoverable, prefills the typed name */}
            {extraNew && (
              <button
                type="button"
                onClick={handleNew}
                className="flex w-full items-center gap-3 rounded-xl border border-dashed border-primary/50 bg-primary/5 px-3.5 py-3.5 mb-2 text-left active:scale-[0.99] transition-transform"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <UserPlus className="size-5" />
                </span>
                <span className="text-[13px] font-semibold text-primary">
                  {extraNew.label}
                  {query.trim() && <span className="font-normal text-foreground">: “{query.trim()}”</span>}
                </span>
              </button>
            )}

            {showNone && (
              <button
                type="button"
                onClick={() => pick("none")}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-left hover:bg-muted active:scale-[0.99] transition-transform"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <span className="text-lg font-bold">—</span>
                </span>
                <span className="text-[13px] font-medium text-muted-foreground">{t(noneLabelKey)}</span>
                {value === "none" && <Check className="ml-auto size-5 shrink-0 text-primary" />}
              </button>
            )}

            {shown.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => pick(i.id)}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-left hover:bg-muted active:scale-[0.99] transition-transform"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <RowIcon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{i.title}</span>
                  {i.sub && <span className="block truncate text-[12px] text-muted-foreground tabular">{i.sub}</span>}
                </span>
                {i.tone && <span className={cn("size-2.5 shrink-0 rounded-full", TONE_DOT[i.tone])} />}
                {i.id === value && <Check className="size-5 shrink-0 text-primary" />}
              </button>
            ))}

            {/* “keep typing” hint when more than 6 match */}
            {more > 0 && (
              <p className="px-3.5 py-2.5 text-[12px] text-muted-foreground">
                {t("moreN").replace("{n}", String(more))}
              </p>
            )}

            {shown.length === 0 && !extraNew && !showNone && (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("noMatchFound")}</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ==================================================================
 * Item helpers — sort “best first” so the top-6 suggestions are the
 * most useful ones even before the owner types anything.
 * ================================================================== */

/* Customers: most-trips first (frequent bookers surface on top) */
export function customerPickerItems(
  customers: { id: string; name: string; phone: string; company?: string; totalTrips: number }[]
): PickerItem[] {
  return [...customers]
    .sort((a, b) => b.totalTrips - a.totalTrips)
    .map((c) => ({
      id: c.id,
      title: c.name,
      sub: c.phone,
      keywords: `${c.phone} ${c.company ?? ""}`,
    }));
}

/* Vehicles: available first (what you can book now), then reg number in search */
export function vehicleItems(
  vehicles: { id: string; name: string; regNumber: string; currentKm: number; status: string }[],
  t: (k: TranslationKey) => string
): PickerItem[] {
  const rank = (s: string) =>
    s === "available" ? 0 : s === "on_trip" ? 1 : s === "maintenance" ? 2 : 3;
  return [...vehicles]
    .sort((a, b) => rank(a.status) - rank(b.status))
    .map((v) => ({
      id: v.id,
      title: v.name,
      sub: `${v.regNumber} · ${v.currentKm.toLocaleString("en-IN")} ${t("km")}`,
      keywords: v.regNumber,
      tone:
        v.status === "available" ? "success" :
        v.status === "on_trip" ? "warning" :
        v.status === "maintenance" ? "danger" : "neutral",
    }));
}

/* Drivers: active first, phone searchable */
export function driverItems(
  drivers: { id: string; name: string; phone: string; active: boolean }[]
): PickerItem[] {
  return [...drivers]
    .sort((a, b) => Number(b.active) - Number(a.active))
    .map((d) => ({ id: d.id, title: d.name, sub: d.phone, keywords: d.phone }));
}

/* Trips (reminder linking): upcoming first, then running, soonest start first */
export function tripPickerItems(
  trips: { id: string; ref: string; from: string; to: string; startAt: string; status: string }[]
): PickerItem[] {
  const now = Date.now();
  const rank = (s: string, at: number) =>
    s === "running" ? 0 : at >= now ? 1 : 2; // running > upcoming > past
  return [...trips]
    .filter((tr) => tr.status !== "cancelled" && tr.status !== "completed")
    .sort((a, b) =>
      rank(a.status, +new Date(a.startAt)) - rank(b.status, +new Date(b.startAt)) ||
      +new Date(a.startAt) - +new Date(b.startAt)
    )
    .map((tr) => ({
      id: tr.id,
      title: tr.ref,
      sub: `${tr.from} → ${tr.to}`,
      keywords: `${tr.from} ${tr.to}`,
      tone: tr.status === "running" ? "warning" : "success",
    }));
}

/* Icon helper kept for future use */
export const PickerIcons = { CarFront, User: UserRound, UserPlus };
