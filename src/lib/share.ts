/**
 * WhatsApp sharing (Phase 14, lite — no API, just wa.me deep links).
 *
 * Opens WhatsApp with a pre-written Bangla summary; when the customer's phone
 * is known, the chat is pre-addressed (BD numbers: 01XXXXXXXXX → 8801XXXXXXXXX).
 * Everything is built client-side — no credentials, no server round-trip.
 */
import type { Trip, Customer, BusinessProfile, Quotation } from "./types";

export interface InvoiceShareInput {
  trip: Trip;
  customer?: Customer;
  business: BusinessProfile;
  paymentsTotal: number;
  vehicleName?: string;
}

/** Normalize a BD phone number for wa.me: 01711… / 8801711… / +8801711… → 8801711… */
export function waPhone(phone?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length < 10) return null;
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `88${digits}`;
  if (digits.startsWith("1")) return `880${digits}`;
  return null;
}

/** The Bangla (or English) message body for an invoice share. */
export function buildInvoiceMessage(input: InvoiceShareInput, lang: "bn" | "en"): string {
  const { trip, customer, business, paymentsTotal, vehicleName } = input;
  const due = Math.max(0, trip.due);
  const money = (n: number) => `৳${new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-IN").format(n)}`;

  if (lang === "en") {
    return [
      `*${business.name}* — Invoice`,
      `Invoice no: ${trip.ref}`,
      `Customer: ${customer?.name ?? "—"}`,
      `Trip: ${trip.from} → ${trip.to}`,
      vehicleName ? `Vehicle: ${vehicleName}` : "",
      `Fare: ${money(trip.fare)}`,
      `Advance + payments: ${money(trip.advance + paymentsTotal)}`,
      `Due: ${money(due)}`,
      due <= 0 ? "✅ Fully paid — thank you!" : "Please clear the due at your convenience.",
      "",
      "— sent from GarirKhata",
    ].filter(Boolean).join("\n");
  }

  return [
    `*${business.name}* — ভাড়া ইনভয়েস`,
    `ইনভয়েস নম্বর: ${trip.ref}`,
    `কাস্টমার: ${customer?.name ?? "—"}`,
    `ট্রিপ: ${trip.from} → ${trip.to}`,
    vehicleName ? `গাড়ি: ${vehicleName}` : "",
    `মোট ভাড়া: ${money(trip.fare)}`,
    `জমা: ${money(trip.advance + paymentsTotal)}`,
    `বাকি: ${money(due)}`,
    due <= 0 ? "✅ পুরো টাকা পরিশোধিত — ধন্যবাদ!" : "সুবিধামতো সময়ে বাকি টাকা পরিশোধ করার অনুরোধ রইলো।",
    "",
    "— গাড়িখাতা অ্যাপ থেকে পাঠানো",
  ].filter(Boolean).join("\n");
}

/** Open WhatsApp (app or web) with the message, pre-addressed when possible. */
export function openWhatsApp(message: string, phone?: string): void {
  const number = waPhone(phone);
  const url = number
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");
}

/** The Bangla (or English) message body for a quotation share. */
export interface QuoteShareInput {
  quote: Quotation;
  customer?: Customer;
  business: BusinessProfile;
  vehicleName?: string;
}

export function buildQuoteMessage(input: QuoteShareInput, lang: "bn" | "en"): string {
  const { quote, customer, business, vehicleName } = input;
  const money = (n: number) => `৳${new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-IN").format(n)}`;

  if (lang === "en") {
    return [
      `*${business.name}* — Rental Quotation`,
      `Quote no: ${quote.code}`,
      `Customer: ${customer?.name ?? "—"}`,
      quote.summary ? `Work: ${quote.summary}` : "",
      vehicleName ? `Vehicle: ${vehicleName}` : "",
      `Rate: ${money(quote.rate)}`,
      quote.validUntil ? `Valid until: ${quote.validUntil.slice(0, 10)}` : "",
      quote.terms ? `Terms: ${quote.terms}` : "",
      "Confirm to book — thank you!",
      "",
      "— sent from GarirKhata",
    ].filter(Boolean).join("\n");
  }

  return [
    `*${business.name}* — ভাড়া কোটেশন`,
    `কোটেশন নম্বর: ${quote.code}`,
    `কাস্টমার: ${customer?.name ?? "—"}`,
    quote.summary ? `কাজ: ${quote.summary}` : "",
    vehicleName ? `গাড়ি: ${vehicleName}` : "",
    `ভাড়া: ${money(quote.rate)}`,
    quote.validUntil ? `বৈধ থাকবে: ${quote.validUntil.slice(0, 10)} পর্যন্ত` : "",
    quote.terms ? `শর্ত: ${quote.terms}` : "",
    "সম্মত হলে জানাবেন — ধন্যবাদ!",
    "",
    "— গাড়িখাতা অ্যাপ থেকে পাঠানো",
  ].filter(Boolean).join("\n");
}
