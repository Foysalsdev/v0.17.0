import type { MaterialIconName } from "@/components/ui/material-icon";
import type { TranslationKey } from "./i18n";
import type { ViewId } from "@/store";

export interface ModuleDef {
  id: ViewId;
  /** Google Material Symbol name (v0.14 icon system — static single color). */
  icon: MaterialIconName;
  labelKey: TranslationKey;
  group: "main" | "work" | "money" | "records";
}

/** All owner modules, in business order (Section 7 of the master prompt). */
export const MODULES: ModuleDef[] = [
  { id: "dashboard", icon: "space_dashboard", labelKey: "navHome", group: "main" },
  { id: "trips", icon: "route", labelKey: "navTrips", group: "work" },
  { id: "quotations", icon: "request_quote", labelKey: "navQuotations", group: "work" },
  { id: "vehicles", icon: "directions_car", labelKey: "navVehicles", group: "work" },
  { id: "customers", icon: "group", labelKey: "navCustomers", group: "work" },
  { id: "drivers", icon: "person", labelKey: "navDrivers", group: "work" },
  { id: "finance", icon: "account_balance_wallet", labelKey: "navFinance", group: "money" },
  { id: "fuel", icon: "local_gas_station", labelKey: "navFuel", group: "money" },
  { id: "maintenance", icon: "build", labelKey: "navMaintenance", group: "money" },
  { id: "documents", icon: "description", labelKey: "navDocuments", group: "records" },
  { id: "reminders", icon: "notifications", labelKey: "navReminders", group: "records" },
  { id: "reports", icon: "monitoring", labelKey: "navReports", group: "records" },
  { id: "guide", icon: "menu_book", labelKey: "navGuide", group: "records" },
  { id: "settings", icon: "settings", labelKey: "navSettings", group: "records" },
];

/** Mobile bottom navigation (FAB sits between trips & vehicles). */
export const BOTTOM_NAV: ModuleDef[] = MODULES.filter((m) =>
  ["dashboard", "trips", "vehicles"].includes(m.id)
);

export const GROUP_LABELS: Record<ModuleDef["group"], TranslationKey | null> = {
  main: null,
  work: null,
  money: null,
  records: null,
};

export function getModule(id: ViewId): ModuleDef {
  return MODULES.find((m) => m.id === id) ?? MODULES[0];
}
