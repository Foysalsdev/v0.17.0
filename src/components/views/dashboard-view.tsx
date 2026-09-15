"use client";

import * as React from "react";
import { useApp, useT } from "@/store";
import { useDashboardStats, useReminders, useMileageWarnings } from "@/lib/insights";
import { QuickActionsRow } from "@/components/app/quick-actions";
import { InstallButton } from "@/components/app/pwa-runtime";
import { useInstallPrompt } from "@/lib/install-prompt";
import { useFormUi, type FormKind } from "@/components/app/form-store";
import { TripCard } from "./trip-card";
import { StatCard, SectionHeader, StatusBadge, Money } from "@/components/shared/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { fmtMoney, fmtNum } from "@/lib/format";
import { Car, BellRing, ChevronRight, TriangleAlert, TrendingUp, TrendingDown, Wallet, Download, X } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export function DashboardView() {
  const { t, lang } = useT();
  const navigate = useApp((s) => s.navigate);
  const data = useApp((s) => s.data);
  const openForm = useFormUi((s) => s.open);
  const stats = useDashboardStats();
  const reminders = useReminders();
  const mileageWarnings = useMileageWarnings();
  const install = useInstallPrompt();
  const showInstallBanner = !install.standalone && !install.dismissed && (install.canInstall || install.isIOS);

  const attention = reminders.filter((r) => r.tone === "danger" || r.tone === "warning").slice(0, 5);

  const dateLabel = new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const chartData = data.incomeHistory.map((m) => ({
    month: m.month,
    income: m.income / 1000,
    expense: m.expense / 1000,
  }));

  return (
    <div className="space-y-6">
      {/* v0.13 hero — deep-emerald greeting panel */}
      <div className="relative overflow-hidden rounded-2xl hero-emerald p-5 sm:p-6 shadow-lift">
        <div aria-hidden className="absolute inset-0 dots-grid opacity-70" />
        <div aria-hidden className="absolute -right-12 -top-16 size-48 rounded-full bg-[oklch(0.72_0.13_163/0.30)] blur-2xl" />
        <Car aria-hidden className="absolute -right-3 -bottom-4 size-24 rotate-[-8deg] text-white/10" strokeWidth={1.4} />
        <div className="relative flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs sm:text-[13px] font-medium text-white/70">{dateLabel}</p>
            <h1 className="mt-1 text-xl sm:text-2xl font-bold leading-tight truncate">
              {t("welcome")}, {data.business.ownerName.replace("মোঃ ", "")}
            </h1>
          </div>
        </div>
      </div>

      {/* Install banner — our own Bangla prompt (Chrome/Edge) or iOS guide */}
      {showInstallBanner && (
        <div className="relative flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-soft">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Download className="size-5" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-foreground leading-tight">{t("installBannerTitle")}</div>
            <div className="text-[11.5px] text-muted-foreground leading-snug mt-0.5">{t("installBannerDesc")}</div>
          </div>
          <InstallButton className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition" />
          <button
            type="button"
            onClick={install.dismiss}
            aria-label={t("installLater")}
            title={t("installLater")}
            className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full text-muted-foreground/70 hover:bg-muted"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Quick actions (Section 53) */}
      <section aria-label={t("quickActions")}>
        <SectionHeader titleKey="quickActions" />
        <QuickActionsRow onAction={(f: FormKind) => openForm(f)} />
      </section>

      {/* Fleet status */}
      <section>
        <SectionHeader titleKey="totalVehicles" actionLabel={t("viewAll")} onAction={() => navigate("vehicles")} />
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <FleetPill label={t("totalVehicles")} value={stats.total} tone="neutral" onClick={() => navigate("vehicles")} />
          <FleetPill label={t("availableNow")} value={stats.available} tone="success" onClick={() => navigate("vehicles")} />
          <FleetPill label={t("onTripNow")} value={stats.onTrip} tone="warning" onClick={() => navigate("trips")} />
          <FleetPill label={t("inMaintenance")} value={stats.inMaintenance} tone="danger" onClick={() => navigate("maintenance")} />
        </div>
      </section>

      {/* Money */}
      <section>
        <SectionHeader titleKey="thisMonth" actionLabel={t("viewAll")} onAction={() => navigate("finance")} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <StatCard labelKey="todayIncome" value={fmtMoney(stats.todayIncome, lang)} tone="success" icon={TrendingUp} />
          <StatCard labelKey="monthIncome" value={fmtMoney(stats.monthIncome, lang)} icon={Wallet} />
          <StatCard labelKey="monthExpense" value={fmtMoney(stats.monthExpense, lang)} tone="danger" icon={TrendingDown} />
          <StatCard labelKey="netProfit" value={fmtMoney(stats.net, lang)} tone={stats.net >= 0 ? "success" : "danger"} icon={TrendingUp} />
        </div>
        {stats.totalDue > 0 && (
          <button
            type="button"
            onClick={() => navigate("customers")}
            className="mt-2.5 flex w-full items-center justify-between rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 active:scale-[0.99] transition-transform"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-warning-foreground">
              <Wallet className="size-4" />
              {t("moneyDue")}
            </span>
            <span className="flex items-center gap-1 text-base font-bold text-warning-foreground tabular">
              {fmtMoney(stats.totalDue, lang)}
              <ChevronRight className="size-4" />
            </span>
          </button>
        )}
      </section>

      {/* Today's trips */}
      <section>
        <SectionHeader titleKey="todayTrips" actionLabel={t("viewAll")} onAction={() => navigate("trips")} />
        {stats.todayTrips.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            {t("noTripsToday")}
          </p>
        ) : (
          <div className="space-y-3">
            {stats.todayTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
          </div>
        )}
      </section>

      {/* Upcoming trips */}
      <section>
        <SectionHeader titleKey="upcomingTrips" actionLabel={t("viewAll")} onAction={() => navigate("trips")} />
        {stats.upcomingTrips.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            {t("noUpcoming")}
          </p>
        ) : (
          <div className="space-y-3">
            {stats.upcomingTrips.slice(0, 3).map((trip) => <TripCard key={trip.id} trip={trip} compact />)}
          </div>
        )}
      </section>

      {/* Reminders (Section 8: useful info, not decorative analytics) */}
      {attention.length > 0 && (
        <section>
          <SectionHeader titleKey="needAttention" actionLabel={t("viewAll")} onAction={() => navigate("reminders")} icon={BellRing} />
          <Card className="border-border/60 shadow-soft">
            <CardContent className="p-0 divide-y divide-border/60">
              {attention.map((r) => (
                <div key={r.id} className="flex items-start gap-3 px-4 py-3">
                  <span
                    className={
                      "mt-1 size-2 shrink-0 rounded-full " +
                      (r.tone === "danger" ? "bg-danger" : r.tone === "warning" ? "bg-warning" : "bg-info")
                    }
                  />
                  <p className="text-[13px] leading-relaxed text-foreground/90 flex-1">{r.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Mileage warning (Section 16) */}
      {mileageWarnings.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-info/30 bg-info/5 px-4 py-3">
          <TriangleAlert className="size-4.5 shrink-0 mt-0.5 text-muted-foreground" />
          <div className="space-y-1">
            {mileageWarnings.map((w) => (
              <p key={w} className="text-[13px] leading-relaxed text-foreground/90">{w}</p>
            ))}
          </div>
        </div>
      )}

      {/* Income trend — the ONE simple chart */}
      <section>
        <SectionHeader titleKey="incomeTrend" actionLabel={t("viewAll")} onAction={() => navigate("reports")} />
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-4 pt-2">
            <div className="h-36 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={3}>
                  <defs>
                    <linearGradient id="gkIncomeBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.62 0.13 165)" />
                      <stop offset="100%" stopColor="oklch(0.52 0.115 163 / 0.45)" />
                    </linearGradient>
                    <linearGradient id="gkExpenseBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.09 95)" />
                      <stop offset="100%" stopColor="oklch(0.75 0.09 95 / 0.4)" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} dy={4} />
                  <YAxis hide domain={[0, "dataMax + 40"]} />
                  <Tooltip
                    cursor={{ fill: "oklch(0.55 0.115 163 / 0.08)" }}
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="rounded-xl border border-border/70 bg-popover px-3.5 py-2.5 text-xs shadow-lift">
                          <div className="font-semibold mb-1">{label}</div>
                          <div className="text-success">{t("income")}: {fmtMoney(Number(payload[0]?.value ?? 0) * 1000, lang)}</div>
                          <div className="text-danger">{t("expense")}: {fmtMoney(Number(payload[1]?.value ?? 0) * 1000, lang)}</div>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="income" fill="url(#gkIncomeBar)" radius={[6, 6, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="expense" fill="url(#gkExpenseBar)" radius={[6, 6, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-gradient" />{t("income")}</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-chart-5" />{t("expense")}</span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function FleetPill({ label, value, tone, onClick }: { label: string; value: number; tone: "neutral" | "success" | "warning" | "danger"; onClick: () => void }) {
  const { lang } = useT();
  /* v0.14: icon chip is static neutral; the VALUE keeps its semantic tone. */
  const valueTones = {
    neutral: "text-foreground",
    success: "text-success",
    warning: "text-warning-foreground",
    danger: "text-danger",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/60 bg-card px-1 py-3 card-lift hover:shadow-lift hover:border-border active:scale-[0.96]"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Car className="size-4.5" strokeWidth={2.2} />
      </span>
      <span className={"text-lg font-bold leading-none tabular " + valueTones[tone]}>{fmtNum(value, lang)}</span>
      <span className="text-[10px] text-muted-foreground leading-tight text-center">{label}</span>
    </button>
  );
}
