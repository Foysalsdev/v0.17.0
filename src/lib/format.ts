import type { Lang } from "./i18n";

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** Convert ASCII digits to Bengali digits. */
export function toBnDigits(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** Money: ৳1,85,000 — Bengali digits in Bangla mode (lakh grouping, like bKash). */
export function fmtMoney(n: number, lang: Lang, opts?: { compact?: boolean }): string {
  const locale = lang === "bn" ? "bn-BD" : "en-IN";
  if (opts?.compact && Math.abs(n) >= 100000) {
    const lakh = Math.round(n / 100) / 10; // e.g. 185000 → 1.85
    const str = lang === "bn" ? toBnDigits(lakh.toFixed(1)) : lakh.toFixed(1);
    return `৳${str} ${lang === "bn" ? "লাখ" : "L"}`;
  }
  const num = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(n));
  return `৳${num}`;
}

/** Plain number (KM, litres etc.) in the current language digits. */
export function fmtNum(n: number, lang: Lang, decimals = 0): string {
  const locale = lang === "bn" ? "bn-BD" : "en-IN";
  const s = new Intl.NumberFormat(locale, { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(n);
  return lang === "bn" ? s : s;
}

/** e.g. "১৩ সেপ্টেম্বর" / "13 Sep". */
export function fmtDate(iso: string, lang: Lang, withYear = false): string {
  const d = new Date(iso);
  const locale = lang === "bn" ? "bn-BD" : "en-GB";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  }).format(d);
}

/** e.g. "সকাল ৭:০০" / "7:00 AM". */
export function fmtTime(iso: string, lang: Lang): string {
  const d = new Date(iso);
  const locale = lang === "bn" ? "bn-BD" : "en-GB";
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", hour12: true }).format(d);
}

/** Friendly relative day label for trips. */
export function fmtDayLabel(iso: string, lang: Lang, t: (k: "today" | "tomorrow" | "yesterday") => string): string {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.floor(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000
  );
  if (diff === 0) return t("today");
  if (diff === 1) return t("tomorrow");
  if (diff === -1) return t("yesterday");
  return fmtDate(iso, lang);
}

export function sameDay(a: string, b: Date = new Date()): boolean {
  const d = new Date(a);
  return d.getFullYear() === b.getFullYear() && d.getMonth() === b.getMonth() && d.getDate() === b.getDate();
}

export function isUpcoming(iso: string): boolean {
  return new Date(iso).getTime() >= Date.now() - 2 * 3600 * 1000;
}
