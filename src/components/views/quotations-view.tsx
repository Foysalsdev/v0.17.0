"use client";

import * as React from "react";
import { toast } from "sonner";
import { useApp, useT } from "@/store";
import { ViewHeader, EmptyState } from "@/components/shared/ui-bits";
import { useFormUi } from "@/components/app/form-store";
import { QuotationSheet } from "@/components/app/quotation-sheet";
import { Button } from "@/components/ui/button";
import { ClipboardList, Route, Eye, Check, X, FileDown } from "lucide-react";
import { fmtDate, fmtMoney, fmtNum } from "@/lib/format";
import { daysUntil } from "@/lib/types";
import type { Quotation } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";

/**
 * QuotationsView — pre-trip price offers (Phase 11).
 * Each card: QT code + customer + summary + rate + validity, then
 * SEE (paper) → TAP (make trip / decide) → DONE.
 */

const STATUS_STYLE: Record<Quotation["status"], { label: TranslationKey; cls: string; dot: string }> = {
  draft: { label: "quoteSent", cls: "bg-info/10 text-info border-info/25", dot: "bg-info" },
  sent: { label: "quoteSent", cls: "bg-info/10 text-info border-info/25", dot: "bg-info" },
  accepted: { label: "quoteAccepted", cls: "bg-success/12 text-success border-success/25", dot: "bg-success" },
  rejected: { label: "quoteRejected", cls: "bg-danger/10 text-danger border-danger/25", dot: "bg-danger" },
  expired: { label: "quoteExpired", cls: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground/50" },
};

export function QuotationsView() {
  const { t, lang } = useT();
  const data = useApp((s) => s.data);
  const openForm = useFormUi((s) => s.open);
  const [paper, setPaper] = React.useState<Quotation | null>(null);

  const quotes = data.quotations;

  return (
    <div className="space-y-4">
      <ViewHeader titleKey="navQuotations" onAdd={() => openForm("quotation")} addLabel={t("addQuotation")} />

      {quotes.length === 0 ? (
        <EmptyState icon={ClipboardList} titleKey="quotationsEmpty" subtitleKey="quotationsEmptyDesc" />
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <QuotationCard key={q.id} quote={q} lang={lang} onPaper={() => setPaper(q)} />
          ))}
        </div>
      )}

      {paper && <QuotationSheet quote={paper} onClose={() => setPaper(null)} />}
    </div>
  );
}

function QuotationCard({ quote, lang, onPaper }: { quote: Quotation; lang: string; onPaper: () => void }) {
  const { t } = useT();
  const data = useApp((s) => s.data);
  const navigate = useApp((s) => s.navigate);
  const openForm = useFormUi((s) => s.open);
  const setQuotationStatus = useApp((s) => s.setQuotationStatus);
  const busy = useApp((s) => s.busy);

  const customer = data.customers.find((c) => c.id === quote.customerId);
  const vehicle = data.vehicles.find((v) => v.id === quote.vehicleId);
  const st = STATUS_STYLE[quote.status];
  const daysLeft = quote.validUntil ? daysUntil(quote.validUntil) : null;
  const open = quote.status === "sent";

  const makeTrip = () => {
    if (vehicle && vehicle.status === "maintenance") {
      toast.error(t("vehicleInMaintenance"));
      return;
    }
    openForm("trip", {
      customerId: quote.customerId,
      vehicleId: quote.vehicleId,
      convertQuoteId: quote.id,
      fare: quote.rate,
      notes: quote.terms,
    });
  };

  const decide = async (status: "accepted" | "rejected") => {
    const err = await setQuotationStatus(quote.id, status);
    if (err) toast.error(t(err as TranslationKey));
    else toast.success(t(status === "accepted" ? "quoteAcceptedToast" : "quoteRejectedToast"));
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
      {/* head: code + customer + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-bold tabular">{quote.code}</span>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold", st.cls)}>
              <span className={cn("size-1.5 rounded-full", st.dot)} />
              {t(st.label)}
            </span>
          </div>
          <div className="mt-1.5 text-[15px] font-bold text-foreground leading-tight truncate">{customer?.name ?? "—"}</div>
          {customer?.phone && <div className="text-xs text-muted-foreground tabular">{customer.phone}</div>}
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-extrabold tabular text-foreground leading-none">{fmtMoney(quote.rate, lang as "bn" | "en")}</div>
          {daysLeft != null && open && (
            <div className={cn("text-[11px] mt-1 font-medium tabular", daysLeft < 0 ? "text-danger" : daysLeft <= 3 ? "text-warning-foreground" : "text-muted-foreground")}>
              {daysLeft < 0 ? t("quoteExpired") : t("quoteDaysLeft", { n: fmtNum(daysLeft, lang as "bn" | "en") })}
            </div>
          )}
        </div>
      </div>

      {/* summary + vehicle */}
      {(quote.summary || vehicle) && (
        <div className="rounded-xl bg-muted/60 px-3.5 py-2.5 space-y-1">
          {quote.summary && <p className="text-[13px] text-foreground/90 leading-snug">{quote.summary}</p>}
          {vehicle && (
            <p className="text-[11px] text-muted-foreground tabular">
              {vehicle.name} · {vehicle.regNumber}
            </p>
          )}
          {quote.validUntil && (
            <p className="text-[11px] text-muted-foreground">
              {t("quoteValidity")}: {fmtDate(quote.validUntil, lang as "bn" | "en", true)}
            </p>
          )}
        </div>
      )}

      {/* actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="h-9 rounded-xl gap-1.5 flex-1" onClick={onPaper}>
          <Eye className="size-4" /> {t("viewQuote")}
        </Button>
        {open && (
          <>
            <Button size="sm" className="h-9 rounded-xl gap-1.5 flex-1" onClick={makeTrip}>
              <Route className="size-4" /> {t("makeTrip")}
            </Button>
            <Button
              variant="outline" size="sm" disabled={busy}
              aria-label={t("quoteRejectBtn")}
              title={t("quoteRejectBtn")}
              className="h-9 rounded-xl w-9 p-0 text-danger border-danger/30 hover:bg-danger/10 hover:text-danger"
              onClick={() => void decide("rejected")}
            >
              <X className="size-4" />
            </Button>
            <Button
              variant="outline" size="sm" disabled={busy}
              aria-label={t("quoteAccepted")}
              title={t("quoteAccepted")}
              className="h-9 rounded-xl w-9 p-0 text-success border-success/30 hover:bg-success/10 hover:text-success"
              onClick={() => void decide("accepted")}
            >
              <Check className="size-4" />
            </Button>
          </>
        )}
        {quote.status === "accepted" && (
          <Button variant="outline" size="sm" className="h-9 rounded-xl gap-1.5 flex-1" onClick={() => navigate("trips")}>
            <FileDown className="size-4" /> {t("navTrips")}
          </Button>
        )}
      </div>
    </div>
  );
}
