"use client";

import * as React from "react";
import { useApp, useT } from "@/store";
import { ViewHeader, EmptyState, Money } from "@/components/shared/ui-bits";
import { useFormUi } from "@/components/app/form-store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Users, Phone, Briefcase, Search, Pencil, Loader2, Wallet } from "lucide-react";
import { fmtMoney, fmtDate } from "@/lib/format";
import { toast } from "sonner";
import type { Customer } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n";

export function CustomersView() {
  const { t, lang } = useT();
  const data = useApp((s) => s.data);
  const openForm = useFormUi((s) => s.open);
  const [query, setQuery] = React.useState("");
  const [editing, setEditing] = React.useState<Customer | null>(null);

  const customers = data.customers.filter(
    (c) =>
      !query.trim() ||
      c.name.includes(query.trim()) ||
      c.phone.includes(query.trim()) ||
      (c.company ?? "").includes(query.trim())
  );

  return (
    <div className="space-y-4">
      <ViewHeader titleKey="navCustomers" onAdd={() => openForm("customer")} addLabel={t("addCustomer")} />

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-11 rounded-xl pl-10 bg-card"
        />
      </div>

      {customers.length === 0 ? (
        <EmptyState icon={Users} titleKey="customersEmpty" />
      ) : (
        <div className="space-y-3">
          {customers.map((c) => {
            const history = data.incomes.filter((i) => i.customerId === c.id).slice(0, 3);
            return (
              <Card key={c.id} className="border-border/70 shadow-xs">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {c.name.slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {c.company ? `${c.company} · ` : ""}{t("customerSince")} {fmtDate(c.since, lang)}
                        </div>
                      </div>
                    </div>
                    {c.due > 0 && (
                      <span className="shrink-0 rounded-full bg-danger/10 border border-danger/25 px-2.5 h-7 flex items-center text-[11px] font-bold text-danger tabular">
                        {t("driverDue")} {fmtMoney(c.due, lang)}
                      </span>
                    )}
                    {c.due > 0 && (
                      <button
                        type="button"
                        aria-label={t("collectPayment")}
                        onClick={() => openForm("payment", { customerId: c.id })}
                        className="shrink-0 flex size-8 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 transition-colors"
                      >
                        <Wallet className="size-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={t("editCustomer")}
                      onClick={() => setEditing(c)}
                      className="shrink-0 flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 active:scale-95 transition-colors"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-1 tabular"><Phone className="size-3.5" />{c.phone}</span>
                    {c.company && <span className="flex items-center gap-1 truncate"><Briefcase className="size-3.5" />{c.company}</span>}
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3">
                    <Stat label={t("totalTrips")} value={`${c.totalTrips}`} />
                    <Stat label={t("totalPaid")} value={fmtMoney(c.totalPaid, lang, { compact: true })} />
                    <Stat label={t("moneyDue")} value={fmtMoney(c.due, lang)} tone={c.due > 0 ? "text-danger" : "text-muted-foreground"} />
                  </div>

                  {history.length > 0 && (
                    <div className="space-y-1.5">
                      {history.map((h) => (
                        <div key={h.id} className="flex items-center justify-between text-[12px] rounded-lg bg-muted/50 px-3 py-1.5">
                          <span className="text-muted-foreground">{fmtDate(h.date, lang)} · {t("tabIncome")}</span>
                          <Money amount={h.amount} tone="in" className="text-[12px]" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <EditCustomerSheet customer={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

/* Edit customer — name / phone / company (owner round 2) */
function EditCustomerSheet({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const { t } = useT();
  const updateCustomer = useApp((s) => s.updateCustomer);
  const busy = useApp((s) => s.busy);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [company, setCompany] = React.useState("");

  React.useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setCompany(customer.company ?? "");
    }
  }, [customer]);

  const submit = async () => {
    if (!customer || !name.trim()) return;
    const err = await updateCustomer({
      id: customer.id,
      name: name.trim(),
      phone: phone.trim(),
      company: company.trim() || undefined,
    });
    if (err) { toast.error(t(err as TranslationKey)); return; }
    toast.success(t("customerUpdated"), { description: name.trim() });
    onClose();
  };

  return (
    <Sheet open={!!customer} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="inset-x-0 mx-auto w-full max-w-lg rounded-t-2xl p-0 border-t">
        <SheetHeader className="px-5 pt-5 pb-1">
          <SheetTitle className="text-lg">{t("editCustomer")}</SheetTitle>
          {customer && <SheetDescription className="text-xs">{customer.name} · {t("totalTrips")} {customer.totalTrips}</SheetDescription>}
        </SheetHeader>
        <div className="px-5 pb-6 pt-2 space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("name")} <span className="text-danger">*</span></label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: কামাল হোসেন" className="h-11" autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("phone")}</label>
            <Input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXX-XXXXXX" className="h-11 tabular" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("company")}</label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t("optional")} className="h-11" />
          </div>
          <Button
            size="lg"
            className="w-full h-13 text-base font-bold gap-2 rounded-2xl"
            disabled={busy || !name.trim()}
            onClick={submit}
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <Pencil className="size-5" />}
            {t("save")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-sm font-bold tabular ${tone ?? "text-foreground"}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
