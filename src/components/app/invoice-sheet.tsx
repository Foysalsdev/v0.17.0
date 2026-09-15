"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useApp, useT } from "@/store";
import type { Trip } from "@/lib/types";
import { fmtDate, fmtMoney, fmtNum, fmtTime, fmtDayLabel } from "@/lib/format";
import { amountInWords } from "@/lib/amount-words";
import { Button } from "@/components/ui/button";
import { Printer, X, Phone, MapPin, MessageCircle, CarFront } from "lucide-react";
import { BrandMark } from "@/components/app/brand";
import { cn } from "@/lib/utils";
import { buildInvoiceMessage, openWhatsApp } from "@/lib/share";

/**
 * InvoiceSheet — a premium paper-style rental invoice for ONE trip.
 * Rendered through a portal to document.body so the @media print rules can
 * hide the whole app (#app-root) and print just this paper.
 * Business money only (fare / advance / payments / due) — internal trip
 * costs are NEVER shown to the customer.
 * Fully paid → the same paper acts as the receipt (rubber-stamp পরিশোধিত).
 */
export function InvoiceSheet({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const { t, lang } = useT();
  const data = useApp((s) => s.data);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const customer = data.customers.find((c) => c.id === trip.customerId);
  const vehicle = data.vehicles.find((v) => v.id === trip.vehicleId);
  const driver = data.drivers.find((d) => d.id === trip.driverId);
  const payments = data.incomes.filter((i) => i.tripId === trip.id);
  const paid = payments.reduce((s, i) => s + i.amount, 0);
  const kmRun = trip.endKm != null && trip.startKm != null ? trip.endKm - trip.startKm : null;
  const issued = new Date();
  const methodLabel = (m: string) => t(
    m === "bkash" ? "bkash" : m === "nagad" ? "nagad" : m === "bank" ? "bank" : m === "card" ? "card" : "cash"
  );

  const shareWhatsApp = () =>
    openWhatsApp(
      buildInvoiceMessage(
        { trip, customer, business: data.business, paymentsTotal: paid, vehicleName: vehicle?.name },
        lang
      ),
      customer?.phone
    );

  const paper = (
    <div
      className="invoice-paper bg-white text-neutral-900 w-full max-w-[600px] mx-auto my-0 sm:my-6 rounded-none sm:rounded-xl sm:shadow-2xl sm:ring-1 sm:ring-black/5 overflow-hidden"
      style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" } as React.CSSProperties}
    >
      {/* ── Letterhead ─────────────────────────────────────────── */}
      <div className="relative bg-[#0b5d43] text-white px-6 sm:px-8 pt-6 pb-5">
        {/* subtle brand texture line */}
        <div className="absolute left-0 right-0 bottom-0 h-1 bg-gradient-to-r from-[#0b5d43] via-[#10b981] to-[#0b5d43]" />
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm"
              style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" } as React.CSSProperties}
            >
              <BrandMark className="size-9" />
            </span>
            <div className="min-w-0 pt-0.5">
              <div className="text-[19px] font-extrabold leading-tight tracking-tight">{data.business.name}</div>
              <div className="text-[11px] text-white/80 mt-1 leading-snug">
                <span className="inline-flex items-center gap-1">
                  <Phone className="size-3" /> {data.business.phone}
                </span>
                {data.business.address && <span className="block">{data.business.address}</span>}
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/85">{t("invoiceTitle")}</div>
            <div className="mt-1.5 text-[13px] font-bold tabular bg-white/12 rounded-md px-2.5 py-1 ring-1 ring-white/25 inline-block">
              {trip.ref}
            </div>
            <div className="mt-1.5 text-[10px] text-white/70 tabular">{fmtDate(issued.toISOString(), lang, true)}</div>
          </div>
        </div>
      </div>

      {/* ── Bill to + trip info ────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 border-b border-neutral-200">
        <div className="px-6 sm:px-8 py-4 sm:border-r border-neutral-200">
          <SectionLabel>{t("billTo")}</SectionLabel>
          <div className="text-[16px] font-bold leading-tight mt-1.5">{customer?.name ?? "—"}</div>
          {customer?.phone && <div className="text-[12px] text-neutral-600 tabular mt-0.5">{customer.phone}</div>}
          {customer?.company && <div className="text-[11px] text-neutral-500 mt-0.5">{customer.company}</div>}
        </div>
        <div className="px-6 sm:px-8 py-4 bg-neutral-50/70">
          <SectionLabel>{t("driver")}</SectionLabel>
          <div className="text-[16px] font-bold leading-tight mt-1.5">{driver?.name ?? "—"}</div>
          {vehicle && (
            <div className="text-[11px] text-neutral-600 tabular mt-0.5 flex items-center gap-1.5">
              <CarFront className="size-3.5 text-neutral-400 shrink-0" />
              <span className="min-w-0">{vehicle.name} · {vehicle.regNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Trip route ─────────────────────────────────────────── */}
      <div className="px-6 sm:px-8 py-4 border-b border-neutral-200">
        <SectionLabel>{t("tripInfo")}</SectionLabel>
        <div className="mt-1.5 flex items-center gap-2 text-[15px] font-semibold">
          <MapPin className="size-4 shrink-0 text-[#0b5d43]" />
          <span className="min-w-0">{trip.from}</span>
          <span className="text-[#0b5d43] font-bold shrink-0">→</span>
          <span className="min-w-0">{trip.to}</span>
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-2 text-[11px] tabular">
          <MetaItem label={t("tripStart")} value={`${fmtDayLabel(trip.startAt, lang, (k) => t(k))} ${fmtTime(trip.startAt, lang)}`} />
          <MetaItem label={t("tripEnd")} value={`${fmtDayLabel(trip.endAt, lang, (k) => t(k))} ${fmtTime(trip.endAt, lang)}`} />
          <MetaItem label={t("kmRun")} value={kmRun != null ? `${fmtNum(kmRun, lang)} ${t("km")}` : "—"} />
        </div>
      </div>

      {/* ── Money summary ──────────────────────────────────────── */}
      <div className="px-6 sm:px-8 py-5">
        <SectionLabel>{t("invoiceSummary")}</SectionLabel>
        <table className="w-full mt-2 text-[13px]">
          <tbody>
            <tr className="border-b border-neutral-200/80">
              <td className="py-2.5 text-neutral-600">{t("tripFare")}</td>
              <td className="py-2.5 text-right font-semibold tabular">{fmtMoney(trip.fare, lang)}</td>
            </tr>
            <tr className="border-b border-neutral-200/80">
              <td className="py-2.5 text-neutral-600">{t("tripAdvance")}</td>
              <td className="py-2.5 text-right font-semibold tabular text-neutral-500">−{fmtMoney(trip.advance, lang)}</td>
            </tr>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-neutral-200/80">
                <td className="py-2.5 text-neutral-600">
                  {t("invoicePaid")} · <span className="text-neutral-500">{fmtDate(p.date, lang)} · {methodLabel(p.method)}</span>
                </td>
                <td className="py-2.5 text-right font-semibold tabular text-neutral-500">−{fmtMoney(p.amount, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="mt-4">
          <div
            className={cn(
              "flex items-center justify-between rounded-xl px-5 py-4",
              trip.due > 0 ? "bg-[#0b5d43]" : "bg-neutral-800"
            )}
          >
            <span className="text-[13px] font-semibold text-white/90">
              {trip.due > 0 ? t("moneyDue") : t("invoiceTotalPaid")}
            </span>
            <span className="text-[26px] font-extrabold tabular text-white leading-none">
              {fmtMoney(trip.due > 0 ? trip.due : trip.fare, lang)}
            </span>
          </div>
        </div>

        {/* Amount in words */}
        <div className="mt-3.5 rounded-lg bg-neutral-50 border border-dashed border-neutral-300 px-4 py-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{t("amountInWords")}: </span>
          <span className="text-[13px] font-medium text-neutral-800">{amountInWords(Math.max(0, trip.fare), lang)}</span>
        </div>
      </div>

      {/* ── Signatures (+ paid stamp over the authorized signature) ── */}
      <div className="relative px-6 sm:px-8 pb-2 pt-2 grid grid-cols-2 gap-8">
        {trip.due <= 0 && (
          <div className="absolute right-3 sm:right-8 top-0 rotate-[-7deg] select-none z-10" aria-hidden="true">
            <div className="rounded-lg border-[2.5px] border-[#15803d] px-3.5 py-1.5 text-center text-[#15803d] bg-white/95">
              <div className="text-[13px] font-extrabold uppercase tracking-[0.2em] leading-none">✓ {t("invoiceFullyPaid")}</div>
              <div className="text-[8px] font-semibold tracking-wide mt-0.5 tabular">{fmtDate(issued.toISOString(), lang, true)}</div>
            </div>
          </div>
        )}
        <SignLine label={t("receiverSign")} />
        <SignLine label={t("authorizedSign")} />
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="px-6 sm:px-8 py-4 border-t-2 border-neutral-800/80 bg-neutral-50/60 text-center">
        <div className="text-[11px] font-semibold text-neutral-700">{t("invoiceThanks")}</div>
        <div className="text-[9px] text-neutral-400 mt-1">
          {data.business.name}
          {data.business.phone ? ` · ${data.business.phone}` : ""} · {t("invoiceGenerated")}
        </div>
      </div>
    </div>
  );

  const overlay = (
    <div className="invoice-overlay fixed inset-0 z-[100] overflow-y-auto bg-black/60 p-3 sm:p-6 flex items-start sm:items-center justify-center">
      <div className="relative w-full max-w-[600px]">
        {/* Action bar — never printed */}
        <div className="no-print flex items-center justify-between gap-2 mb-2.5 mx-1">
          <span className="rounded-full bg-black/70 text-white text-[11px] font-medium px-3 py-1.5 truncate">
            {t("invoiceTitle")} · {trip.ref}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => window.print()}
              className="h-9 rounded-full gap-1.5 bg-white text-neutral-900 hover:bg-neutral-100"
            >
              <Printer className="size-4" />
              {t("printSave")}
            </Button>
            <Button
              size="sm"
              onClick={shareWhatsApp}
              aria-label={t("sendWhatsApp")}
              className="h-9 rounded-full gap-1.5 bg-[#25D366] text-white hover:bg-[#1fbd5a]"
            >
              <MessageCircle className="size-4" />
              {t("sendWhatsApp")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              aria-label={t("close")}
              className="h-9 w-9 rounded-full p-0 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
        {paper}
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(overlay, document.body);
}

/** Tiny uppercase section label — the "small caps" that make papers look pro. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0b5d43]/80 border-l-2 border-[#0b5d43] pl-2">
      {children}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-neutral-50 px-2.5 py-2 min-w-0">
      <div className="text-[9px] font-semibold uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="font-semibold text-neutral-800 mt-0.5 leading-snug break-words">{value}</div>
    </div>
  );
}

function SignLine({ label }: { label: string }) {
  return (
    <div className="pt-8">
      <div className="border-t border-dotted border-neutral-400" />
      <div className="text-[10px] text-neutral-500 text-center mt-1.5">{label}</div>
    </div>
  );
}
