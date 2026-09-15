"use client";

import * as React from "react";
import { useApp, useT } from "@/store";
import { ViewHeader, EmptyState, StatCard } from "@/components/shared/ui-bits";
import { useFormUi } from "@/components/app/form-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Banknote, Receipt, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { fmtMoney, fmtDate } from "@/lib/format";
import type { IncomeCategory, ExpenseCategory, IncomeEntry, ExpenseEntry } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const INCOME_LABELS: Record<IncomeCategory, TranslationKey> = {
  rental: "icRental", extra_km: "icExtraKm", extra_hour: "icExtraHour", driver_charge: "icDriverCharge",
  delivery: "icDelivery", corporate: "icCorporate", other: "icOther",
};
const EXPENSE_LABELS: Record<ExpenseCategory, TranslationKey> = {
  fuel: "ecFuel", maintenance: "ecMaintenance", parts: "ecParts", driver_salary: "ecDriverSalary",
  driver_allowance: "ecDriverAllowance", toll: "ecToll", parking: "ecParking", tax: "ecTax",
  insurance: "ecInsurance", registration: "ecRegistration", workshop: "ecWorkshop", loan: "ecLoan",
  cleaning: "ecCleaning", misc: "ecMisc",
};
const METHOD_LABELS: Record<string, TranslationKey> = {
  cash: "cash", bkash: "bkash", bank: "bank", nagad: "nagad", card: "card", other: "icOther",
};

export function FinanceView() {
  const { t, lang } = useT();
  const data = useApp((s) => s.data);
  const openForm = useFormUi((s) => s.open);

  const incomeLabel = (c: IncomeCategory): string => t(INCOME_LABELS[c]);
  const expenseLabel = (c: ExpenseCategory): string => t(EXPENSE_LABELS[c]);
  const methodLabel = (m: string): string => (METHOD_LABELS[m] ? t(METHOD_LABELS[m]) : "—");

  return (
    <div className="space-y-4">
      <ViewHeader titleKey="navFinance" />

      {/* Month summary */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard labelKey="monthIncome" value={fmtMoney(data.monthStats.income, lang)} tone="success" icon={TrendingUp} />
        <StatCard labelKey="monthExpense" value={fmtMoney(data.monthStats.expense, lang)} tone="danger" icon={TrendingDown} />
        <StatCard
          labelKey="netProfit"
          value={fmtMoney(data.monthStats.income - data.monthStats.expense, lang)}
          tone={data.monthStats.income - data.monthStats.expense >= 0 ? "success" : "danger"}
          icon={Wallet}
        />
      </div>

      <Tabs defaultValue="income">
        <div className="flex items-center justify-between gap-3">
          <TabsList className="h-10 rounded-xl p-1">
            <TabsTrigger value="income" className="text-xs sm:text-sm rounded-lg px-4">{t("tabIncome")}</TabsTrigger>
            <TabsTrigger value="expense" className="text-xs sm:text-sm rounded-lg px-4">{t("tabExpense")}</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openForm("income")}
              className="flex items-center gap-1.5 rounded-full bg-success/10 border border-success/25 text-success h-9 px-3.5 text-xs font-semibold active:scale-95 transition-transform"
            >
              <Banknote className="size-4" /> {t("addIncome")}
            </button>
            <button
              type="button"
              onClick={() => openForm("expense")}
              className="flex items-center gap-1.5 rounded-full bg-danger/10 border border-danger/25 text-danger h-9 px-3.5 text-xs font-semibold active:scale-95 transition-transform"
            >
              <Receipt className="size-4" /> {t("addExpense")}
            </button>
          </div>
        </div>

        <TabsContent value="income" className="mt-3">
          {data.incomes.length === 0 ? (
            <EmptyState icon={Banknote} titleKey="incomeEmpty" />
          ) : (
            <div className="space-y-2">
              {data.incomes.map((e) => (
                <EntryRow key={e.id} entry={e} kind="income" label={incomeLabel(e.category)} methodLabel={methodLabel(e.method)} lang={lang} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expense" className="mt-3">
          {data.expenses.length === 0 ? (
            <EmptyState icon={Receipt} titleKey="expenseEmpty" />
          ) : (
            <div className="space-y-2">
              {data.expenses.map((e) => (
                <EntryRow key={e.id} entry={e} kind="expense" label={expenseLabel(e.category)} methodLabel={methodLabel(e.method)} lang={lang} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EntryRow({ entry, kind, label, methodLabel, lang }: {
  entry: IncomeEntry | ExpenseEntry;
  kind: "income" | "expense";
  label: string;
  methodLabel: string;
  lang: "bn" | "en";
}) {
  const { data } = useApp();
  const { t } = useT();
  const customer = "customerId" in entry ? data.customers.find((c) => c.id === entry.customerId) : undefined;
  const vehicle = entry.vehicleId ? data.vehicles.find((v) => v.id === entry.vehicleId) : undefined;
  const isIn = kind === "income";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3">
      <span className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg",
        isIn ? "bg-success/12 text-success" : "bg-danger/10 text-danger"
      )}>
        {isIn ? <Banknote className="size-4.5" /> : <Receipt className="size-4.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold truncate">{label}{customer ? ` · ${customer.name}` : vehicle ? ` · ${vehicle.name}` : ""}</div>
        <div className="text-[11px] text-muted-foreground truncate">
          {fmtDate(entry.date, lang)} · {methodLabel || "—"}{("paidTo" in entry && entry.paidTo) ? ` · ${entry.paidTo}` : ""}
        </div>
      </div>
      <span className={cn("text-sm font-bold tabular shrink-0", isIn ? "text-success" : "text-danger")}>
        {isIn ? "+" : "−"}{fmtMoney(entry.amount, lang)}
      </span>
    </div>
  );
}
