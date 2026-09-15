/**
 * Amount in words — Bangla (কথায়) + English, BD convention (lakh/crore).
 * Used on invoices: "কথায়: পনেরো হাজার পাঁচশো টাকা মাত্র"
 * / "In words: Fifteen thousand five hundred taka only".
 */

// ── Bangla ─────────────────────────────────────────────────────────────────
const BN0_19 = [
  "শূন্য", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়",
  "দশ", "এগারো", "বারো", "তেরো", "চৌদ্দ", "পনেরো", "ষোলো", "সতেরো", "আঠারো", "উনিশ",
];
const BN_TENS: Record<number, string> = {
  20: "বিশ", 30: "ত্রিশ", 40: "চল্লিশ", 50: "পঞ্চাশ",
  60: "ষাট", 70: "সত্তর", 80: "আশি", 90: "নব্বই",
};
const BN_HUNDREDS: Record<number, string> = {
  100: "একশো", 200: "দুইশো", 300: "তিনশো", 400: "চারশো", 500: "পাঁচশো",
  600: "ছয়শো", 700: "সাতশো", 800: "আটশো", 900: "নয়শো",
};
/** Bangla 0–99 — the 1–99 compound forms are irregular, so they are listed. */
const BN_UNITS: Record<number, string> = {
  1: "এক", 2: "দুই", 3: "তিন", 4: "চার", 5: "পাঁচ", 6: "ছয়", 7: "সাত", 8: "আট", 9: "নয়",
  10: "দশ", 11: "এগারো", 12: "বারো", 13: "তেরো", 14: "চৌদ্দ", 15: "পনেরো",
  16: "ষোলো", 17: "সতেরো", 18: "আঠারো", 19: "উনিশ",
  21: "একুশ", 22: "বাইশ", 23: "তেইশ", 24: "চব্বিশ", 25: "পঁচিশ", 26: "ছাব্বিশ",
  27: "সাতাশ", 28: "আটাশ", 29: "উনত্রিশ",
  31: "একত্রিশ", 32: "বত্রিশ", 33: "তেত্রিশ", 34: "চৌত্রিশ", 35: "পঁয়ত্রিশ",
  36: "ছত্রিশ", 37: "সাঁইত্রিশ", 38: "আটত্রিশ", 39: "উনচল্লিশ",
  41: "একচল্লিশ", 42: "বিয়াল্লিশ", 43: "তেতাল্লিশ", 44: "চুয়াল্লিশ", 45: "পঁয়তাল্লিশ",
  46: "ছেচল্লিশ", 47: "সাতচল্লিশ", 48: "আটচল্লিশ", 49: "উনপঞ্চাশ",
  51: "একান্ন", 52: "বায়ান্ন", 53: "তিপ্পান্ন", 54: "চুয়ান্ন", 55: "পঞ্চান্ন",
  56: "ছাপ্পান্ন", 57: "সাতান্ন", 58: "আটান্ন", 59: "উনষাট",
  61: "একষট্টি", 62: "বাষট্টি", 63: "তেষট্টি", 64: "চৌষট্টি", 65: "পঁয়ষট্টি",
  66: "ছেষট্টি", 67: "সাতষট্টি", 68: "আটষট্টি", 69: "উনসত্তর",
  71: "একাত্তর", 72: "বাহাত্তর", 73: "তিয়াত্তর", 74: "চুয়াত্তর", 75: "পঁচাত্তর",
  76: "ছিয়াত্তর", 77: "সাতাত্তর", 78: "আটাত্তর", 79: "উনআশি",
  81: "একাশি", 82: "বিরাশি", 83: "তিরাশি", 84: "চুরাশি", 85: "পঁচাশি",
  86: "ছিয়াশি", 87: "সাতাশি", 88: "আটাশি", 89: "উননব্বই",
  91: "একানব্বই", 92: "বিরানব্বই", 93: "তিরানব্বই", 94: "চুরানব্বই", 95: "পঁচানব্বই",
  96: "ছিয়ানব্বই", 97: "সাতানব্বই", 98: "আটানব্বই", 99: "নিরানব্বই",
};

function bnUnder1000(n: number): string[] {
  const parts: string[] = [];
  const h = Math.floor(n / 100) * 100;
  if (h > 0) parts.push(BN_HUNDREDS[h]);
  const rest = n - h;
  if (rest > 0) parts.push(BN_UNITS[rest] ?? BN_TENS[rest] ?? BN0_19[rest]);
  return parts;
}

/** কোটি / লাখ / হাজার grouping (BD system) — works up to 99 crore+. */
export function numberToBanglaWords(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "শূন্য";
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  if (crore > 0) parts.push(...bnUnder1000(crore), "কোটি");
  if (lakh > 0) parts.push(...bnUnder1000(lakh), "লাখ");
  if (thousand > 0) parts.push(...bnUnder1000(thousand), "হাজার");
  if (rest > 0) parts.push(...bnUnder1000(rest));
  return parts.join(" ");
}

/** Full invoice phrase: "পনেরো হাজার পাঁচশো টাকা মাত্র" */
export function banglaAmountWords(taka: number): string {
  return `${numberToBanglaWords(taka)} টাকা মাত্র`;
}

// ── English (BD convention: lakh/crore, not million) ──────────────────────
const EN_ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen",
];
const EN_TENS: Record<number, string> = {
  2: "twenty", 3: "thirty", 4: "forty", 5: "fifty", 6: "sixty", 7: "seventy", 8: "eighty", 9: "ninety",
};

function enUnder100(n: number): string[] {
  if (n < 20) return [EN_ONES[n]];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u > 0 ? [`${EN_TENS[t]}-${EN_ONES[u]}`] : [EN_TENS[t]];
}

function enUnder1000(n: number): string[] {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  if (h > 0) parts.push(EN_ONES[h], "hundred");
  const rest = n % 100;
  if (rest > 0) parts.push(...enUnder100(rest));
  return parts;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "Fifteen thousand five hundred" — lakh/crore grouping. */
export function numberToEnglishWords(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  if (crore > 0) parts.push(...enUnder1000(crore), "crore");
  if (lakh > 0) parts.push(...enUnder1000(lakh), "lakh");
  if (thousand > 0) parts.push(...enUnder1000(thousand), "thousand");
  if (rest > 0) parts.push(...enUnder1000(rest));
  return capitalize(parts.join(" "));
}

/** Full invoice phrase: "Fifteen thousand five hundred taka only" */
export function englishAmountWords(taka: number): string {
  return `${numberToEnglishWords(taka)} taka only`;
}

/** Lang-aware amount-in-words for the invoice. */
export function amountInWords(taka: number, lang: "bn" | "en"): string {
  return lang === "bn" ? banglaAmountWords(taka) : englishAmountWords(taka);
}
