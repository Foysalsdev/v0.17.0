"use client";

import { useT } from "@/store";
import { useFormUi, type FormKind } from "./form-store";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Route, Banknote, Receipt, Fuel, Wrench, UserPlus, FileText, Plus, CarFront, UserRound, ClipboardList, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";

interface QuickAction {
  form: Exclude<FormKind, null>;
  icon: typeof Route;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  tone: string;
}

const ACTIONS: QuickAction[] = [
  { form: "trip", icon: Route, labelKey: "addTrip", descKey: "navTrips", tone: "" },
  { form: "quotation", icon: ClipboardList, labelKey: "addQuotation", descKey: "navQuotations", tone: "" },
  { form: "income", icon: Banknote, labelKey: "addIncome", descKey: "tabIncome", tone: "" },
  { form: "expense", icon: Receipt, labelKey: "addExpense", descKey: "tabExpense", tone: "" },
  { form: "fuel", icon: Fuel, labelKey: "addFuel", descKey: "navFuel", tone: "" },
  { form: "service", icon: Wrench, labelKey: "addService", descKey: "navMaintenance", tone: "" },
  { form: "customer", icon: UserPlus, labelKey: "addCustomer", descKey: "navCustomers", tone: "" },
  { form: "vehicle", icon: CarFront, labelKey: "addVehicle", descKey: "navVehicles", tone: "" },
  { form: "driver", icon: UserRound, labelKey: "addDriver", descKey: "navDrivers", tone: "" },
  { form: "document", icon: FileText, labelKey: "navDocuments", descKey: "vehicleDocs", tone: "" },
  { form: "reminder", icon: BellRing, labelKey: "addReminder", descKey: "navReminders", tone: "" },
];

/** Big quick-action buttons (Section 53) — opens from the FAB and the dashboard. */
export function QuickActionsSheet() {
  const { t } = useT();
  const { quickOpen, open } = useFormUi();

  return (
    <Sheet open={quickOpen} onOpenChange={(v) => { if (!v) useFormUi.getState().close(); }}>
      <SheetContent side="bottom" className="inset-x-0 mx-auto w-full max-w-lg rounded-t-2xl p-0 border-t">
        <SheetHeader className="px-5 pt-5 pb-1">
          <SheetTitle className="text-lg">{t("quickActions")}</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-3 p-5 pt-3 pb-safe">
          {ACTIONS.map((a) => (
            <button
              key={a.form}
              type="button"
              onClick={() => open(a.form)}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3.5 text-left card-lift hover:shadow-lift active:scale-[0.97] min-h-[60px]"
            >
              <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground", a.tone)}>
                <a.icon className="size-5" strokeWidth={2.2} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-foreground leading-tight">{t(a.labelKey)}</span>
                <span className="block text-[11px] text-muted-foreground">{t(a.descKey)}</span>
              </span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Inline quick-action row for the dashboard + desktop. */
export function QuickActionsRow({ onAction }: { onAction: (f: FormKind) => void }) {
  const { t } = useT();
  const top5 = ACTIONS.slice(0, 5); // + ট্রিপ, + কোটেশন, + আয়, + খরচ, + তেল
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {top5.map((a) => (
        <button
          key={a.form}
          type="button"
          onClick={() => onAction(a.form)}
          className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/60 bg-card p-2.5 sm:p-3 card-lift hover:shadow-lift active:scale-[0.95]"
        >
          <span className={cn("flex size-10 sm:size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground", a.tone)}>
            <a.icon className="size-5" strokeWidth={2.2} />
          </span>
          <span className="text-[11px] sm:text-xs font-medium text-foreground text-center leading-tight">{t(a.labelKey)}</span>
        </button>
      ))}
    </div>
  );
}

export { ACTIONS as QUICK_ACTIONS };
