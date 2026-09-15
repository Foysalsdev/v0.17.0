"use client";

import * as React from "react";
import { useApp, useT } from "@/store";
import { TripCard } from "./trip-card";
import { ViewHeader, EmptyState } from "@/components/shared/ui-bits";
import { useFormUi } from "@/components/app/form-store";
import { Route, Plus, CalendarDays, List, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtNum } from "@/lib/format";

type Filter = "all" | "today" | "upcoming" | "running" | "completed";
type Mode = "list" | "calendar";

const DAY_KEYS = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"] as const;

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TripsView() {
  const { t, lang } = useT();
  const data = useApp((s) => s.data);
  const openForm = useFormUi((s) => s.open);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [mode, setMode] = React.useState<Mode>("list");
  const [cursor, setCursor] = React.useState(() => new Date()); // any date inside the shown month
  const [selectedDay, setSelectedDay] = React.useState<string | null>(dayKey(new Date()));

  const today = new Date().toDateString();
  const trips = data.trips
    .filter((tr) => {
      const isToday = new Date(tr.startAt).toDateString() === today;
      switch (filter) {
        case "today": return isToday && tr.status !== "cancelled";
        case "upcoming": return new Date(tr.startAt) > new Date() && tr.status === "confirmed";
        case "running": return tr.status === "running";
        case "completed": return tr.status === "completed";
        default: return true;
      }
    })
    .sort((a, b) => {
      const rank = (s: string) => (s === "running" ? 0 : s === "confirmed" ? 1 : 2);
      const d = rank(a.status) - rank(b.status);
      return d !== 0 ? d : +new Date(a.startAt) - +new Date(b.startAt);
    });

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("all") },
    { id: "today", label: t("filterToday") },
    { id: "upcoming", label: t("filterUpcoming") },
    { id: "running", label: t("filterRunning") },
    { id: "completed", label: t("filterCompleted") },
  ];

  /* ---------- calendar model ---------- */
  const monthLabel = new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en", {
    month: "long", year: "numeric",
  }).format(cursor);

  // trips grouped by start-day (cancelled excluded from the dots/count)
  const byDay = React.useMemo(() => {
    const map = new Map<string, { count: number; running: number; confirmed: number }>();
    for (const tr of data.trips) {
      if (tr.status === "cancelled" || tr.status === "draft") continue;
      const k = dayKey(new Date(tr.startAt));
      const cur = map.get(k) ?? { count: 0, running: 0, confirmed: 0 };
      cur.count += 1;
      if (tr.status === "running") cur.running += 1;
      if (tr.status === "confirmed") cur.confirmed += 1;
      map.set(k, cur);
    }
    return map;
  }, [data.trips]);

  // 6×7 grid, week starts Saturday (BD wall-calendar style)
  const cells: (Date | null)[] = React.useMemo(() => {
    const y = cursor.getFullYear(), m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const offset = (first.getDay() + 1) % 7; // Sat → 0
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const out: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(y, m, d));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [cursor]);

  const selectedTrips = selectedDay
    ? data.trips
        .filter((tr) => dayKey(new Date(tr.startAt)) === selectedDay)
        .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))
    : [];

  const todayKeyStr = dayKey(new Date());

  return (
    <div className="space-y-4">
      <ViewHeader titleKey="navTrips" onAdd={() => openForm("trip")} addLabel={t("addTrip")} />

      {/* List ↔ Calendar toggle + (list only) filter chips */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-full border border-border bg-card p-0.5">
          <button
            type="button"
            onClick={() => setMode("list")}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-colors",
              mode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            <List className="size-3.5" />
            {t("listView")}
          </button>
          <button
            type="button"
            onClick={() => setMode("calendar")}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-colors",
              mode === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            <CalendarDays className="size-3.5" />
            {t("calendar")}
          </button>
        </div>
      </div>

      {mode === "list" ? (
        <>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-0.5">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 h-8 text-xs font-medium transition-colors",
                  filter === f.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {trips.length === 0 ? (
            <EmptyState icon={Route} titleKey="tripsEmpty" />
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Month header */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
            <button
              type="button"
              aria-label="previous month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted active:scale-95 transition-colors"
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="text-sm font-bold">{monthLabel}</span>
            <button
              type="button"
              aria-label="next month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted active:scale-95 transition-colors"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          {/* Weekday header — Saturday first */}
          <div className="grid grid-cols-7 text-center">
            {DAY_KEYS.map((d) => (
              <span key={d} className="text-[11px] font-medium text-muted-foreground py-1">
                {weekdayShort(d, lang)}
              </span>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <span key={`e${i}`} className="aspect-square" />;
              const k = dayKey(d);
              const info = byDay.get(k);
              const isToday = k === todayKeyStr;
              const isSel = k === selectedDay;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelectedDay(k)}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border text-sm transition-colors",
                    isSel ? "border-primary bg-primary/10" : "border-transparent",
                    !isSel && info && "bg-card border-border/60",
                    isToday && "ring-1 ring-primary/60"
                  )}
                >
                  <span className={cn("tabular leading-none", isToday && "font-bold text-primary")}>
                    {fmtNum(d.getDate(), lang)}
                  </span>
                  {info && (
                    <span className="flex items-center gap-0.5 leading-none">
                      {info.running > 0 && <span className="size-1.5 rounded-full bg-warning" />}
                      {info.confirmed > 0 && <span className="size-1.5 rounded-full bg-info" />}
                      {info.running === 0 && info.confirmed === 0 && <span className="size-1.5 rounded-full bg-success" />}
                      {info.count > 1 && <span className="text-[9px] font-bold text-muted-foreground tabular leading-none">{fmtNum(info.count, lang)}</span>}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected day's trips */}
          <div>
            {selectedTrips.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t("noTripsThatDay")}</p>
            ) : (
              <div className="space-y-3">
                {selectedTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const WEEKDAYS_BN: Record<(typeof DAY_KEYS)[number], string> = {
  sat: "শনি", sun: "রবি", mon: "সোম", tue: "মঙ্গল", wed: "বুধ", thu: "বৃহঃ", fri: "শুক্র",
};
const WEEKDAYS_EN: Record<(typeof DAY_KEYS)[number], string> = {
  sat: "Sat", sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri",
};
function weekdayShort(d: (typeof DAY_KEYS)[number], lang: string): string {
  return (lang === "bn" ? WEEKDAYS_BN : WEEKDAYS_EN)[d];
}
