"use client";

import * as React from "react";
import { motion, MotionConfig } from "framer-motion";
import { useApp } from "@/store";
import { TopBar } from "./top-bar";
import { SidebarNav } from "./sidebar-nav";
import { BottomNav } from "./bottom-nav";
import { SearchDialog } from "./search-dialog";
import { QuickActionsSheet } from "./quick-actions";
import { FormsHost } from "./forms";
import { PwaRuntime } from "./pwa-runtime";
import { ReminderAlarms } from "./reminder-alarms";
import { useReminders } from "@/lib/insights";

import { DashboardView } from "@/components/views/dashboard-view";
import { TripsView } from "@/components/views/trips-view";
import { QuotationsView } from "@/components/views/quotations-view";
import { VehiclesView } from "@/components/views/vehicles-view";
import { CustomersView } from "@/components/views/customers-view";
import { DriversView } from "@/components/views/drivers-view";
import { FuelView } from "@/components/views/fuel-view";
import { MaintenanceView } from "@/components/views/maintenance-view";
import { FinanceView } from "@/components/views/finance-view";
import { DocumentsView } from "@/components/views/documents-view";
import { RemindersView } from "@/components/views/reminders-view";
import { ReportsView } from "@/components/views/reports-view";
import { GuideView } from "@/components/views/guide-view";
import { SettingsView } from "@/components/views/settings-view";
import { DriverModeView } from "@/components/views/driver-mode-view";
import { MoreView } from "@/components/views/more-view";

export function AppShell() {
  const view = useApp((s) => s.view);
  const reminders = useReminders();
  const pending = reminders.filter((r) => r.tone === "danger" || r.tone === "warning").length;

  // Scroll to top when switching views (app-like feel)
  React.useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  return (
    <div id="app-root" className="relative min-h-dvh bg-background">
      {/* v0.13 aurora backdrop — soft brand mesh behind everything */}
      <div aria-hidden className="pointer-events-none fixed inset-0 aurora-page" />

      <SidebarNav />
      <div className="lg:pl-64 flex flex-col min-h-dvh">
        <TopBar pendingReminders={pending} />
        <PwaRuntime />
        <main id="main" className="relative flex-1 mx-auto w-full max-w-5xl px-4 py-4 pb-32 lg:pb-10 lg:px-8">
          <MotionConfig reducedMotion="user">
            {/* View transition: gentle rise+fade (skipped for reduced-motion users) */}
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {view === "dashboard" && <DashboardView />}
              {view === "trips" && <TripsView />}
              {view === "quotations" && <QuotationsView />}
              {view === "vehicles" && <VehiclesView />}
              {view === "customers" && <CustomersView />}
              {view === "drivers" && <DriversView />}
              {view === "fuel" && <FuelView />}
              {view === "maintenance" && <MaintenanceView />}
              {view === "finance" && <FinanceView />}
              {view === "documents" && <DocumentsView />}
              {view === "reminders" && <RemindersView />}
              {view === "reports" && <ReportsView />}
              {view === "guide" && <GuideView />}
              {view === "settings" && <SettingsView />}
              {view === "driver-mode" && <DriverModeView />}
              {view === "more" && <MoreView />}
            </motion.div>
          </MotionConfig>
        </main>
      </div>
      <BottomNav />
      <QuickActionsSheet />
      <FormsHost />
      <SearchDialog />
      <ReminderAlarms />
    </div>
  );
}
