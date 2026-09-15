(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/amount-words.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "amountInWords",
    ()=>amountInWords,
    "banglaAmountWords",
    ()=>banglaAmountWords,
    "englishAmountWords",
    ()=>englishAmountWords,
    "numberToBanglaWords",
    ()=>numberToBanglaWords,
    "numberToEnglishWords",
    ()=>numberToEnglishWords
]);
/**
 * Amount in words — Bangla (কথায়) + English, BD convention (lakh/crore).
 * Used on invoices: "কথায়: পনেরো হাজার পাঁচশো টাকা মাত্র"
 * / "In words: Fifteen thousand five hundred taka only".
 */ // ── Bangla ─────────────────────────────────────────────────────────────────
const BN0_19 = [
    "শূন্য",
    "এক",
    "দুই",
    "তিন",
    "চার",
    "পাঁচ",
    "ছয়",
    "সাত",
    "আট",
    "নয়",
    "দশ",
    "এগারো",
    "বারো",
    "তেরো",
    "চৌদ্দ",
    "পনেরো",
    "ষোলো",
    "সতেরো",
    "আঠারো",
    "উনিশ"
];
const BN_TENS = {
    20: "বিশ",
    30: "ত্রিশ",
    40: "চল্লিশ",
    50: "পঞ্চাশ",
    60: "ষাট",
    70: "সত্তর",
    80: "আশি",
    90: "নব্বই"
};
const BN_HUNDREDS = {
    100: "একশো",
    200: "দুইশো",
    300: "তিনশো",
    400: "চারশো",
    500: "পাঁচশো",
    600: "ছয়শো",
    700: "সাতশো",
    800: "আটশো",
    900: "নয়শো"
};
/** Bangla 0–99 — the 1–99 compound forms are irregular, so they are listed. */ const BN_UNITS = {
    1: "এক",
    2: "দুই",
    3: "তিন",
    4: "চার",
    5: "পাঁচ",
    6: "ছয়",
    7: "সাত",
    8: "আট",
    9: "নয়",
    10: "দশ",
    11: "এগারো",
    12: "বারো",
    13: "তেরো",
    14: "চৌদ্দ",
    15: "পনেরো",
    16: "ষোলো",
    17: "সতেরো",
    18: "আঠারো",
    19: "উনিশ",
    21: "একুশ",
    22: "বাইশ",
    23: "তেইশ",
    24: "চব্বিশ",
    25: "পঁচিশ",
    26: "ছাব্বিশ",
    27: "সাতাশ",
    28: "আটাশ",
    29: "উনত্রিশ",
    31: "একত্রিশ",
    32: "বত্রিশ",
    33: "তেত্রিশ",
    34: "চৌত্রিশ",
    35: "পঁয়ত্রিশ",
    36: "ছত্রিশ",
    37: "সাঁইত্রিশ",
    38: "আটত্রিশ",
    39: "উনচল্লিশ",
    41: "একচল্লিশ",
    42: "বিয়াল্লিশ",
    43: "তেতাল্লিশ",
    44: "চুয়াল্লিশ",
    45: "পঁয়তাল্লিশ",
    46: "ছেচল্লিশ",
    47: "সাতচল্লিশ",
    48: "আটচল্লিশ",
    49: "উনপঞ্চাশ",
    51: "একান্ন",
    52: "বায়ান্ন",
    53: "তিপ্পান্ন",
    54: "চুয়ান্ন",
    55: "পঞ্চান্ন",
    56: "ছাপ্পান্ন",
    57: "সাতান্ন",
    58: "আটান্ন",
    59: "উনষাট",
    61: "একষট্টি",
    62: "বাষট্টি",
    63: "তেষট্টি",
    64: "চৌষট্টি",
    65: "পঁয়ষট্টি",
    66: "ছেষট্টি",
    67: "সাতষট্টি",
    68: "আটষট্টি",
    69: "উনসত্তর",
    71: "একাত্তর",
    72: "বাহাত্তর",
    73: "তিয়াত্তর",
    74: "চুয়াত্তর",
    75: "পঁচাত্তর",
    76: "ছিয়াত্তর",
    77: "সাতাত্তর",
    78: "আটাত্তর",
    79: "উনআশি",
    81: "একাশি",
    82: "বিরাশি",
    83: "তিরাশি",
    84: "চুরাশি",
    85: "পঁচাশি",
    86: "ছিয়াশি",
    87: "সাতাশি",
    88: "আটাশি",
    89: "উননব্বই",
    91: "একানব্বই",
    92: "বিরানব্বই",
    93: "তিরানব্বই",
    94: "চুরানব্বই",
    95: "পঁচানব্বই",
    96: "ছিয়ানব্বই",
    97: "সাতানব্বই",
    98: "আটানব্বই",
    99: "নিরানব্বই"
};
function bnUnder1000(n) {
    const parts = [];
    const h = Math.floor(n / 100) * 100;
    if (h > 0) parts.push(BN_HUNDREDS[h]);
    const rest = n - h;
    if (rest > 0) parts.push(BN_UNITS[rest] ?? BN_TENS[rest] ?? BN0_19[rest]);
    return parts;
}
function numberToBanglaWords(n) {
    n = Math.floor(Math.abs(n));
    if (n === 0) return "শূন্য";
    const parts = [];
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor(n % 10000000 / 100000);
    const thousand = Math.floor(n % 100000 / 1000);
    const rest = n % 1000;
    if (crore > 0) parts.push(...bnUnder1000(crore), "কোটি");
    if (lakh > 0) parts.push(...bnUnder1000(lakh), "লাখ");
    if (thousand > 0) parts.push(...bnUnder1000(thousand), "হাজার");
    if (rest > 0) parts.push(...bnUnder1000(rest));
    return parts.join(" ");
}
function banglaAmountWords(taka) {
    return `${numberToBanglaWords(taka)} টাকা মাত্র`;
}
// ── English (BD convention: lakh/crore, not million) ──────────────────────
const EN_ONES = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen"
];
const EN_TENS = {
    2: "twenty",
    3: "thirty",
    4: "forty",
    5: "fifty",
    6: "sixty",
    7: "seventy",
    8: "eighty",
    9: "ninety"
};
function enUnder100(n) {
    if (n < 20) return [
        EN_ONES[n]
    ];
    const t = Math.floor(n / 10);
    const u = n % 10;
    return u > 0 ? [
        `${EN_TENS[t]}-${EN_ONES[u]}`
    ] : [
        EN_TENS[t]
    ];
}
function enUnder1000(n) {
    const parts = [];
    const h = Math.floor(n / 100);
    if (h > 0) parts.push(EN_ONES[h], "hundred");
    const rest = n % 100;
    if (rest > 0) parts.push(...enUnder100(rest));
    return parts;
}
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
function numberToEnglishWords(n) {
    n = Math.floor(Math.abs(n));
    if (n === 0) return "Zero";
    const parts = [];
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor(n % 10000000 / 100000);
    const thousand = Math.floor(n % 100000 / 1000);
    const rest = n % 1000;
    if (crore > 0) parts.push(...enUnder1000(crore), "crore");
    if (lakh > 0) parts.push(...enUnder1000(lakh), "lakh");
    if (thousand > 0) parts.push(...enUnder1000(thousand), "thousand");
    if (rest > 0) parts.push(...enUnder1000(rest));
    return capitalize(parts.join(" "));
}
function englishAmountWords(taka) {
    return `${numberToEnglishWords(taka)} taka only`;
}
function amountInWords(taka, lang) {
    return lang === "bn" ? banglaAmountWords(taka) : englishAmountWords(taka);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/csv.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * CSV export — Excel / Google Sheets friendly (Phase 12).
 *
 * Rules:
 *  - UTF-8 BOM + CRLF so Bangla headers render correctly in Windows Excel.
 *  - Amounts are plain ASCII digits with no symbol — accountants sum/pivot them.
 *  - Dates are `YYYY-MM-DD HH:MM` (sortable, locale-neutral).
 *  - One file per export; built fully client-side from the current snapshot.
 */ __turbopack_context__.s([
    "buildCsv",
    ()=>buildCsv,
    "buildCustomersCsv",
    ()=>buildCustomersCsv,
    "buildLedgerCsv",
    ()=>buildLedgerCsv,
    "buildTripsCsv",
    ()=>buildTripsCsv,
    "buildVehiclesCsv",
    ()=>buildVehiclesCsv,
    "downloadCsv",
    ()=>downloadCsv
]);
/* ---------- shared label maps (same i18n keys as the forms) ---------- */ const INCOME_LABELS = {
    rental: "icRental",
    extra_km: "icExtraKm",
    extra_hour: "icExtraHour",
    driver_charge: "icDriverCharge",
    delivery: "icDelivery",
    corporate: "icCorporate",
    other: "icOther"
};
const EXPENSE_LABELS = {
    fuel: "ecFuel",
    maintenance: "ecMaintenance",
    parts: "ecParts",
    driver_salary: "ecDriverSalary",
    driver_allowance: "ecDriverAllowance",
    toll: "ecToll",
    parking: "ecParking",
    tax: "ecTax",
    insurance: "ecInsurance",
    registration: "ecRegistration",
    workshop: "ecWorkshop",
    loan: "ecLoan",
    cleaning: "ecCleaning",
    misc: "ecMisc"
};
const METHOD_LABELS = {
    cash: "cash",
    bkash: "bkash",
    bank: "bank",
    nagad: "nagad",
    card: "card",
    other: "icOther"
};
const RENTAL_LABELS = {
    daily: "rentalDaily",
    per_trip: "rentalPerTrip",
    per_km: "rentalPerKm",
    per_hour: "rentalPerHour",
    airport: "rentalAirport",
    corporate: "rentalCorporate",
    tour: "rentalTour",
    wedding: "rentalWedding",
    monthly: "rentalMonthly",
    other: "icOther"
};
const TRIP_STATUS_LABELS = {
    draft: "tripStatusDraft",
    confirmed: "tripStatusConfirmed",
    running: "tripStatusRunning",
    completed: "tripStatusCompleted",
    cancelled: "tripStatusCancelled"
};
/* ---------- CSV primitives ---------- */ /** Quote a cell when it contains a separator, quote or newline; double the quotes. */ function esc(v) {
    const s = String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(headers, rows) {
    const lines = [
        headers.map(esc).join(","),
        ...rows.map((r)=>r.map(esc).join(","))
    ];
    return lines.join("\r\n");
}
/** `2026-09-13 14:30` from an ISO string (local time, Excel-friendly). */ function isoToCell(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const p = (n)=>String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function stamp() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function downloadCsv(file) {
    const blob = new Blob([
        `\ufeff${file.content}`
    ], {
        type: "text/csv;charset=utf-8"
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
}
function buildTripsCsv(data, t) {
    const rows = data.trips.slice().sort((a, b)=>b.startAt.localeCompare(a.startAt)).map((tr)=>{
        const c = data.customers.find((x)=>x.id === tr.customerId);
        const v = data.vehicles.find((x)=>x.id === tr.vehicleId);
        const d = data.drivers.find((x)=>x.id === tr.driverId);
        const paid = tr.advance + data.incomes.filter((i)=>i.tripId === tr.id).reduce((s, i)=>s + i.amount, 0);
        const km = tr.endKm != null && tr.startKm != null ? tr.endKm - tr.startKm : "";
        return [
            tr.ref,
            isoToCell(tr.startAt),
            c?.name ?? "",
            c?.phone ?? "",
            v?.name ?? "",
            d?.name ?? "",
            `${tr.from} → ${tr.to}`,
            t(RENTAL_LABELS[tr.rentalType]),
            km,
            tr.fare,
            paid,
            tr.due,
            tr.expenseTotal ?? 0,
            tr.profit ?? "",
            t(TRIP_STATUS_LABELS[tr.status])
        ];
    });
    return {
        filename: `garirkhata-trips-${stamp()}.csv`,
        content: toCsv([
            t("csvRef"),
            t("csvDate"),
            t("csvCustomer"),
            t("csvPhone"),
            t("csvVehicle"),
            t("csvDriver"),
            t("csvRoute"),
            t("csvRentalType"),
            t("csvKm"),
            `${t("csvFare")} (৳)`,
            `${t("csvPaid")} (৳)`,
            `${t("csvDue")} (৳)`,
            `${t("csvTripExpense")} (৳)`,
            `${t("csvProfit")} (৳)`,
            t("csvStatus")
        ], rows)
    };
}
function buildLedgerCsv(data, t) {
    const rows = [];
    for (const i of data.incomes){
        const c = data.customers.find((x)=>x.id === i.customerId);
        const v = data.vehicles.find((x)=>x.id === i.vehicleId);
        const tr = data.trips.find((x)=>x.id === i.tripId);
        rows.push({
            date: i.date,
            cells: [
                isoToCell(i.date),
                t("tabIncome"),
                t(INCOME_LABELS[i.category]),
                v?.name ?? "",
                c?.name ?? "",
                tr?.ref ?? "",
                t(METHOD_LABELS[i.method]),
                i.amount
            ]
        });
    }
    for (const e of data.expenses){
        const v = data.vehicles.find((x)=>x.id === e.vehicleId);
        rows.push({
            date: e.date,
            cells: [
                isoToCell(e.date),
                t("tabExpense"),
                t(EXPENSE_LABELS[e.category]),
                v?.name ?? "",
                e.paidTo ?? "",
                "",
                t(METHOD_LABELS[e.method]),
                e.amount
            ]
        });
    }
    rows.sort((a, b)=>a.date.localeCompare(b.date));
    return {
        filename: `garirkhata-ledger-${stamp()}.csv`,
        content: toCsv([
            t("csvDate"),
            t("csvType"),
            t("csvCategory"),
            t("csvVehicle"),
            t("csvCustomerOrPaidTo"),
            t("csvRef"),
            t("csvMethod"),
            `${t("csvAmount")} (৳)`
        ], rows.map((r)=>r.cells))
    };
}
function buildCustomersCsv(data, t) {
    const rows = data.customers.slice().sort((a, b)=>b.due - a.due || a.name.localeCompare(b.name)).map((c)=>[
            c.name,
            c.phone,
            c.company ?? "",
            c.address ?? "",
            c.totalTrips,
            c.totalPaid,
            c.due,
            isoToCell(c.since)
        ]);
    return {
        filename: `garirkhata-customers-${stamp()}.csv`,
        content: toCsv([
            t("csvName"),
            t("csvPhone"),
            t("csvCompany"),
            t("csvAddress"),
            t("totalTrips"),
            `${t("csvTotalPaid")} (৳)`,
            `${t("csvDue")} (৳)`,
            t("csvCustomerSince")
        ], rows)
    };
}
function buildVehiclesCsv(data, t) {
    const rows = data.vehicles.slice().sort((a, b)=>b.monthlyRevenue - b.monthlyCost - (a.monthlyRevenue - a.monthlyCost)).map((v)=>[
            v.name,
            v.regNumber,
            v.fuelTypes.map((f)=>t(f)).join("+"),
            v.currentKm,
            v.mileage || "",
            v.monthlyRevenue,
            v.monthlyCost,
            v.monthlyRevenue - v.monthlyCost
        ]);
    return {
        filename: `garirkhata-vehicles-${stamp()}.csv`,
        content: toCsv([
            t("csvVehicle"),
            t("csvRegNumber"),
            t("csvFuel"),
            t("csvCurrentKm"),
            `${t("csvMileage")} (km/L)`,
            `${t("monthIncome")} (৳)`,
            `${t("monthExpense")} (৳)`,
            `${t("netProfit")} (৳)`
        ], rows)
    };
}
function buildCsv(kind, data, t) {
    switch(kind){
        case "trips":
            return buildTripsCsv(data, t);
        case "ledger":
            return buildLedgerCsv(data, t);
        case "customers":
            return buildCustomersCsv(data, t);
        case "vehicles":
            return buildVehiclesCsv(data, t);
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/format.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fmtDate",
    ()=>fmtDate,
    "fmtDayLabel",
    ()=>fmtDayLabel,
    "fmtMoney",
    ()=>fmtMoney,
    "fmtNum",
    ()=>fmtNum,
    "fmtTime",
    ()=>fmtTime,
    "isUpcoming",
    ()=>isUpcoming,
    "sameDay",
    ()=>sameDay,
    "toBnDigits",
    ()=>toBnDigits
]);
const BN_DIGITS = [
    "০",
    "১",
    "২",
    "৩",
    "৪",
    "৫",
    "৬",
    "৭",
    "৮",
    "৯"
];
function toBnDigits(s) {
    return String(s).replace(/[0-9]/g, (d)=>BN_DIGITS[Number(d)]);
}
function fmtMoney(n, lang, opts) {
    const locale = lang === "bn" ? "bn-BD" : "en-IN";
    if (opts?.compact && Math.abs(n) >= 100000) {
        const lakh = Math.round(n / 100) / 10; // e.g. 185000 → 1.85
        const str = lang === "bn" ? toBnDigits(lakh.toFixed(1)) : lakh.toFixed(1);
        return `৳${str} ${lang === "bn" ? "লাখ" : "L"}`;
    }
    const num = new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0
    }).format(Math.round(n));
    return `৳${num}`;
}
function fmtNum(n, lang, decimals = 0) {
    const locale = lang === "bn" ? "bn-BD" : "en-IN";
    const s = new Intl.NumberFormat(locale, {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals
    }).format(n);
    return lang === "bn" ? s : s;
}
function fmtDate(iso, lang, withYear = false) {
    const d = new Date(iso);
    const locale = lang === "bn" ? "bn-BD" : "en-GB";
    return new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        ...withYear ? {
            year: "numeric"
        } : {}
    }).format(d);
}
function fmtTime(iso, lang) {
    const d = new Date(iso);
    const locale = lang === "bn" ? "bn-BD" : "en-GB";
    return new Intl.DateTimeFormat(locale, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    }).format(d);
}
function fmtDayLabel(iso, lang, t) {
    const d = new Date(iso);
    const today = new Date();
    const diff = Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000);
    if (diff === 0) return t("today");
    if (diff === 1) return t("tomorrow");
    if (diff === -1) return t("yesterday");
    return fmtDate(iso, lang);
}
function sameDay(a, b = new Date()) {
    const d = new Date(a);
    return d.getFullYear() === b.getFullYear() && d.getMonth() === b.getMonth() && d.getDate() === b.getDate();
}
function isUpcoming(iso) {
    return new Date(iso).getTime() >= Date.now() - 2 * 3600 * 1000;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/i18n.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * i18n — Bangla (default) + English
 * Simple flat dictionary. `bn` is the source of truth; `en` must match keys exactly.
 * Terminology rule: SIMPLE > technical. (e.g. "বাকি টাকা", not "Outstanding Receivable")
 */ __turbopack_context__.s([
    "translate",
    ()=>translate,
    "translations",
    ()=>translations
]);
const bn = {
    // Brand
    appName: "গাড়িখাতা",
    appTagline: "আপনার গাড়ির ব্যবসা, একটি অ্যাপে",
    // Nav / modules
    navHome: "হোম",
    navTrips: "ট্রিপ",
    navVehicles: "গাড়ি",
    navMore: "আরও",
    navGroupOps: "কার্যক্রম",
    navGroupMoney: "আয়-ব্যয়",
    navGroupInfo: "তথ্য ও রিপোর্ট",
    navCustomers: "কাস্টমার",
    navDrivers: "ড্রাইভার",
    navFuel: "তেল",
    navMaintenance: "সার্ভিস",
    navFinance: "আয়-খরচ",
    navDocuments: "কাগজপত্র",
    navReminders: "রিমাইন্ডার",
    navReports: "রিপোর্ট",
    navGuide: "সমস্যা গাইড",
    navSettings: "সেটিংস",
    search: "খুঁজুন",
    searchPlaceholder: "গাড়ি, কাস্টমার, ট্রিপ, ড্রাইভার…",
    notifications: "নোটিফিকেশন",
    viewAll: "সব দেখুন",
    save: "সেভ",
    cancel: "বাতিল",
    me: "আমি",
    close: "বন্ধ",
    yes: "হ্যাঁ",
    no: "না",
    delete: "মুছুন",
    edit: "এডিট",
    add: "যোগ করুন",
    optional: "না দিলেও চলবে",
    today: "আজ",
    tomorrow: "আগামীকাল",
    yesterday: "গতকাল",
    all: "সব",
    status: "অবস্থা",
    notes: "নোট",
    phone: "ফোন",
    name: "নাম",
    date: "তারিখ",
    time: "সময়",
    amount: "টাকা",
    total: "মোট",
    from: "কোথা থেকে",
    to: "কোথায়",
    vehicle: "গাড়ি",
    driver: "ড্রাইভার",
    customer: "কাস্টমার",
    km: "কিমি",
    litre: "লিটার",
    perLitre: "প্রতি লিটার",
    // Login
    driverMode: "ড্রাইভার মোড",
    driverModeDesc: "ড্রাইভাররা যা দেখবে — খুব সহজ ভার্সন",
    logout: "বাহির যান",
    // Dashboard
    welcome: "স্বাগতম",
    quickActions: "দ্রুত কাজ",
    addTrip: "নতুন ট্রিপ",
    addIncome: "আয় যোগ",
    addExpense: "খরচ যোগ",
    addFuel: "তেল ভরান",
    addService: "সার্ভিস যোগ",
    todayTrips: "আজকের ট্রিপ",
    upcomingTrips: "আসছে ট্রিপ",
    noTripsToday: "আজ কোনো ট্রিপ নেই",
    noUpcoming: "আসছে কোনো ট্রিপ নেই",
    todayIncome: "আজকের আয়",
    monthIncome: "এই মাসের আয়",
    monthExpense: "এই মাসের খরচ",
    netProfit: "নিট লাভ",
    moneyDue: "বাকি টাকা",
    totalVehicles: "মোট গাড়ি",
    availableNow: "খালি আছে",
    onTripNow: "ট্রিপে আছে",
    inMaintenance: "সার্ভিসে আছে",
    needAttention: "খেয়াল রাখুন",
    incomeTrend: "৬ মাসের আয়",
    recentActivity: "সাম্প্রতিক কাজ",
    // Vehicle statuses
    vAvailable: "খালি আছে",
    vOnTrip: "ট্রিপে আছে",
    vMaintenance: "সার্ভিসে আছে",
    vInactive: "বন্ধ আছে",
    vForSale: "বিক্রি হবে",
    vSold: "বিক্রি হয়েছে",
    // Vehicle details
    vehiclesEmpty: "এখনো কোনো গাড়ি যোগ করা হয়নি",
    addVehicle: "গাড়ি যোগ করুন",
    regNumber: "রেজিস্ট্রেশন নম্বর",
    brandModel: "ব্র্যান্ড ও মডেল",
    modelYear: "মডেল ইয়ার",
    fuelType: "তেলের ধরন",
    seats: "আসন সংখ্যা",
    color: "রং",
    vehicleKm: "গাড়ির কিমি",
    transmission: "গিয়ার",
    diesel: "ডিজেল",
    petrol: "পেট্রোল",
    cng: "সিএনজি",
    automatic: "অটোমেটিক",
    manual: "ম্যানুয়াল",
    vehicleIncome: "এই মাসের আয়",
    vehicleFuelEff: "মাইলেজ",
    vehicleDocs: "কাগজপত্র",
    vehicleService: "পরের সার্ভিস",
    vehicleProfit: "এই মাসের লাভ",
    vehicleSince: "যোগ করেছেন",
    // Trips
    tripStatusDraft: "খসড়া",
    tripStatusConfirmed: "নিশ্চিত",
    tripStatusRunning: "চলছে",
    tripStatusCompleted: "শেষ",
    tripStatusCancelled: "বাতিল",
    tripsEmpty: "কোনো ট্রিপ নেই",
    filterToday: "আজ",
    filterUpcoming: "আসছে",
    filterRunning: "চলছে",
    filterCompleted: "শেষ",
    tripFare: "ভাড়া",
    tripAdvance: "অগ্রিম",
    tripDue: "বাকি",
    tripProfit: "ট্রিপের লাভ",
    tripRoute: "রুট",
    tripStart: "শুরু",
    tripEnd: "শেষ",
    bookingConflict: "এই গাড়িটি এই সময়ে অন্য Trip-এ আছে। অন্য গাড়ি নির্বাচন করুন।",
    tripAdded: "ট্রিপ যোগ হয়েছে",
    tripCompleted: "ট্রিপ শেষ হয়েছে",
    rentalDaily: "ডেইলি",
    rentalPerTrip: "প্রতি ট্রিপ",
    rentalPerKm: "প্রতি কিমি",
    rentalPerHour: "প্রতি ঘণ্টা",
    rentalAirport: "এয়ারপোর্ট",
    rentalCorporate: "কর্পোরেট",
    rentalTour: "ট্যুর",
    rentalWedding: "বিয়ে/অনুষ্ঠান",
    rentalMonthly: "মাসিক",
    // Customers
    customersEmpty: "কোনো কাস্টমার নেই",
    addCustomer: "কাস্টমার যোগ",
    customerAdded: "কাস্টমার যোগ হয়েছে",
    company: "প্রতিষ্ঠান",
    address: "ঠিকানা",
    totalTrips: "মোট ট্রিপ",
    totalPaid: "মোট জমা",
    customerSince: "কাস্টমার হয়েছেন",
    // Drivers
    driversEmpty: "কোনো ড্রাইভার নেই",
    licenseExpiry: "লাইসেন্স শেষ",
    salary: "বেতন",
    driverDue: "বাকি",
    driverAdvance: "অগ্রিম",
    tripsDone: "ট্রিপ করেছেন",
    driverActive: "কাজ করছেন",
    // Fuel
    fuelEntries: "তেল ভরার হিসাব",
    fuelEmpty: "কোনো তেলের এন্ট্রি নেই",
    kmPerLitre: "কিমি/লিটার",
    costPerKm: "প্রতি কিমি খরচ",
    fuelEffDropped: "মাইলেজ কমেছে। গাড়ি চেক করানো ভালো।",
    lastFillup: "শেষ ভরার পর",
    station: "পেট্রোল পাম্প",
    fuelAdded: "তেলের হিসাব যোগ হয়েছে",
    monthFuelCost: "এই মাসের তেল খরচ",
    // Maintenance
    serviceSchedule: "পরের সার্ভিস",
    serviceHistory: "সার্ভিসের হিসাব",
    engineOil: "ইঞ্জিন অয়েল",
    oilFilter: "অয়েল ফিল্টার",
    airFilter: "এয়ার ফিল্টার",
    brakePad: "ব্রেক প্যাড",
    acService: "এসি সার্ভিস",
    tyreRotation: "টায়ার ঘোরানো",
    wheelAlignment: "হুইল অ্যালাইনমেন্ট",
    otherItem: "অন্যান্য",
    statusGood: "ভালো আছে",
    statusSoon: "শীঘ্রই দরকার",
    statusDue: "দরকার",
    statusOverdue: "দেরি হয়ে গেছে",
    kmLeft: "কিমি বাকি",
    kmOver: "কিমি পার",
    daysLeft: "দিন বাকি",
    daysOver: "দিন পার",
    serviceDueSoon: "প্রায় due —",
    serviceAdded: "সার্ভিস যোগ হয়েছে",
    workshop: "ওয়ার্কশপ",
    lastServiceAt: "শেষ সার্ভিস",
    // Finance
    tabIncome: "আয়",
    tabExpense: "খরচ",
    income: "আয়",
    expense: "খরচ",
    net: "নিট",
    thisMonth: "এই মাস",
    incomeEmpty: "কোনো আয় নেই",
    expenseEmpty: "কোনো খরচ নেই",
    incomeAdded: "আয় যোগ হয়েছে",
    expenseAdded: "খরচ যোগ হয়েছে",
    paymentMethod: "কীভাবে পেয়েছেন",
    paidTo: "কাকে দিয়েছেন",
    cash: "ক্যাশ",
    bank: "ব্যাংক",
    bkash: "বিকাশ",
    nagad: "নগদ",
    card: "কার্ড",
    // Income categories
    icRental: "ভাড়া",
    icExtraKm: "এক্সট্রা কিমি",
    icExtraHour: "এক্সট্রা ঘণ্টা",
    icDriverCharge: "ড্রাইভার চার্জ",
    icDelivery: "ডেলিভারি",
    icCorporate: "কর্পোরেট চুক্তি",
    icOther: "অন্যান্য",
    // Expense categories
    ecFuel: "তেল",
    ecMaintenance: "সার্ভিস",
    ecParts: "পার্টস",
    ecDriverSalary: "ড্রাইভার বেতন",
    ecDriverAllowance: "ড্রাইভার ভাতা",
    ecToll: "টোল",
    ecParking: "পার্কিং",
    ecTax: "ট্যাক্স",
    ecInsurance: "ইনস্যুরেন্স",
    ecRegistration: "রেজিস্ট্রেশন",
    ecWorkshop: "ওয়ার্কশপ",
    ecLoan: "লোন/কিস্তি",
    ecCleaning: "পরিষ্কার-পরিচ্ছন্ন",
    ecMisc: "অন্যান্য",
    // Documents
    docRegistration: "রেজিস্ট্রেশন",
    docTaxToken: "ট্যাক্স টোকেন",
    docFitness: "ফিটনেস",
    docInsurance: "ইনস্যুরেন্স",
    docPermit: "রুট পারমিট",
    docOther: "অন্য কাগজ",
    expiresOn: "শেষ হবে",
    expiredOn: "শেষ হয়েছে",
    daysLeftShort: "দিন বাকি",
    expired: "শেষ হয়ে গেছে",
    valid: "চালু আছে",
    docsEmpty: "কোনো কাগজপত্র নেই",
    expiryRemainder: "দিনের মধ্যে শেষ হবে",
    // Reminders
    remindersEmpty: "এখন কোনো রিমাইন্ডার নেই",
    allClear: "সব ঠিক আছে",
    groupOwn: "আমার রিমাইন্ডার",
    groupDocuments: "কাগজপত্র",
    groupMaintenance: "সার্ভিস",
    groupPayments: "টাকার রিমাইন্ডার",
    groupTrips: "ট্রিপ",
    addReminder: "রিমাইন্ডার সেট করুন",
    reminderFormDesc: "সময় সহ মনে করিয়ে দেওয়া হবে",
    reminderTitle: "কী মনে করাতে হবে",
    reminderTitleHint: "যেমন: কাস্টমারকে ফোন দিন",
    reminderTime: "কখন",
    reminderTimeHint: "তারিখ ও সময় — ঠিক ওই সময়ে মনে করানো হবে",
    linkTrip: "ট্রিপের সাথে যুক্ত",
    reminderSaved: "রিমাইন্ডার সেভ হয়েছে",
    reminderOverdue: "সময় পার হয়েছে",
    minutesLeft: "মিনিট বাকি",
    markDone: "সম্পন্ন হিসেবে চিহ্নিত করুন",
    autoReminderNote: "শুরুর ১ ঘণ্টা আগে অটো রিমাইন্ডার যাবে",
    autoReminderToast: "শুরুর ১ ঘণ্টা আগে রিমাইন্ডার সেট হয়েছে",
    reminderAlarmTitle: "রিমাইন্ডার — সময় হয়েছে",
    pendingRemindersSummary: "টা কাজের রিমাইন্ডার বাকি আছে",
    viewNow: "দেখুন",
    setTripReminder: "এই ট্রিপের জন্য সময় সহ রিমাইন্ডার সেট করুন",
    driverSalaryDue: "ড্রাইভার বেতন দেওয়ার দিন",
    customerDueRem: "কাস্টমারের বাকি",
    tripTodayRem: "আজকের ট্রিপ",
    // Reports
    reportsNote: "বিস্তারিত রিপোর্ট ধাপে ধাপে যোগ হবে",
    bestVehicle: "সবচেয়ে লাভজনক গাড়ি",
    topCustomer: "নিয়মিত কাস্টমার",
    topDriver: "সবচেয়ে বেশি ট্রিপ",
    monthlySummary: "এই মাসের হিসাব",
    perVehicleProfit: "গাড়ি অনুযায়ী লাভ",
    revenue: "আয়",
    cost: "খরচ",
    // Problem guide
    guideDisclaimer: "এটি শেখার জন্য সাধারণ গাইড — নিশ্চিত সমাধান নয়।",
    possibleCauses: "সম্ভাব্য কারণ",
    checkFirst: "প্রথমে যা চেক করুন",
    severityLow: "হালকা",
    severityMedium: "মাঝারি",
    severityHigh: "জরুরি",
    canDrive: "চালিয়ে যাওয়া যাবে?",
    seeMechanic: "মেকানিক দেখানো ভালো",
    guideIntro: "গাড়ির সমস্যার লক্ষণ বেছে নিন",
    symptomAcNotCooling: "এসি ঠান্ডা হয় না",
    symptomOverheating: "ইঞ্জিন গরম হয়ে যায়",
    symptomHardStart: "গাড়ি স্টার্ট হতে সমস্যা",
    symptomLowPickup: "পিকআপ কম",
    symptomBrakeNoise: "ব্রেকে শব্দ",
    symptomSmoke: "ধোঁয়া বের হয়",
    symptomVibration: "কাঁপুনি/ভাইব্রেশন",
    symptomBattery: "ব্যাটারি দুর্বল",
    moreSymptomsSoon: "আরও সমস্যা ধাপে ধাপে যোগ হবে",
    // Driver mode
    dmTodayTrip: "আজকের ট্রিপ",
    dmStartTrip: "ট্রিপ শুরু করুন",
    dmCompleteTrip: "ট্রিপ শেষ করুন",
    dmStartKm: "শুরুর কিমি",
    dmEndKm: "শেষের কিমি",
    dmFuelAdded: "তেল ভরেছেন?",
    dmTripRunning: "ট্রিপ চলছে",
    dmNoTrip: "আজ কোনো ট্রিপ দেওয়া হয়নি",
    dmCallCustomer: "কাস্টমারকে ফোন",
    dmTripDone: "ভালো ট্রিপ ছিল!",
    dmEmergency: "জরুরি যোগাযোগ",
    dmBackToOwner: "মালিকের মোডে ফিরুন",
    // Settings
    businessProfile: "ব্যবসার প্রোফাইল",
    businessName: "ব্যবসার নাম",
    language: "ভাষা",
    appearance: "চেহারা",
    lightMode: "লাইট",
    darkMode: "ডার্ক",
    team: "টিম",
    roleOwner: "মালিক",
    roleManager: "ম্যানেজার",
    roleDriver: "ড্রাইভার",
    roleAccountant: "হিসাবরক্ষক",
    plan: "প্ল্যান",
    planFree: "ফ্রি",
    planVehicles: "গাড়ি",
    version: "ভার্সন",
    installApp: "অ্যাপ ইনস্টল করুন",
    installAppDesc: "ফোনের হোম স্ক্রিনে রাখুন",
    aboutApp: "অ্যাপ সম্পর্কে",
    dataSafety: "আপনার তথ্য শুধু আপনার ব্যবসার — অন্য কেউ দেখতে পারে না।",
    // Misc / errors
    offline: "ইন্টারনেট নেই",
    offlineDesc: "কানেকশন ফিরলে সব ঠিক হয়ে যাবে",
    retry: "আবার চেষ্টা করুন",
    comingSoon: "শীঘ্রই আসছে",
    savedServerNote: "সব তথ্য সেভ থাকে — রিফ্রেশের পরও হারায় না",
    saving: "সেভ হচ্ছে…",
    pleaseWait: "একটু অপেক্ষা করুন…",
    fillAll: "সব ঘর পূরণ করুন",
    serverError: "সমস্যা হয়েছে — আবার চেষ্টা করুন",
    forbidden: "আপনার এই কাজের অনুমতি নেই",
    notLoggedIn: "আবার লগইন করুন",
    // Login (production)
    loginPhone: "ফোন নম্বর",
    loginPassword: "পাসওয়ার্ড",
    loginBtn: "লগইন",
    loginFailed: "ফোন, ইমেইল বা পাসওয়ার্ড ভুল",
    // Password reset (v0.15)
    forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
    send: "পাঠান",
    forgotPasswordHint: "আপনার ইমেইল বা ফোন নম্বর দিন — রিসেট লিংক পাঠিয়ে দেব।",
    resetSent: "রিসেট লিংক ইমেইলে চলে গেছে ✓",
    resetPhoneNotFound: "এই ফোন নম্বরে কোনো একাউন্ট পাওয়া যায়নি",
    resetLocalUnsupported: "পাসওয়ার্ড রিসেট শুধু অনলাইন একাউন্টে কাজ করে",
    resetLinkExpired: "লিংকটি আর কার্যকর নেই — আবার রিসেট লিংক নিন",
    resetPasswordTitle: "নতুন পাসওয়ার্ড",
    resetPasswordSubtitle: "নতুন পাসওয়ার্ড দিয়ে সেভ করুন — তারপর লগইন করুন।",
    confirmPassword: "পাসওয়ার্ড আবার লিখুন",
    resetPasswordBtn: "পাসওয়ার্ড সেভ করুন",
    resetPasswordDone: "পাসওয়ার্ড বদলে গেছে ✓",
    // Business profile edit (v0.15)
    editProfileBtn: "সম্পাদনা",
    editBusinessTitle: "ব্যবসার তথ্য সম্পাদনা",
    addressPh: "বাসা, রোড, এলাকা, শহর",
    businessSaved: "ব্যবসার তথ্য সেভ হয়েছে ✓",
    ownerNamePh: "মালিকের নাম",
    // Signup (self-service business registration)
    signupTitle: "নতুন ব্যবসা খুলুন",
    signupSubtitle: "মাত্র ১ মিনিটে আপনার গাড়ির ব্যবসার হিসাব শুরু করুন",
    signupBusinessName: "ব্যবসার নাম",
    signupBusinessNamePh: "যেমন: রহিম ট্রাভেলস",
    signupOwnerName: "আপনার নাম",
    signupPassword: "পাসওয়ার্ড (৬+ অক্ষর)",
    signupBtn: "একাউন্ট খুলুন",
    signupHaveAccount: "একাউন্ট আছে? লগইন করুন",
    loginNoAccount: "নতুন ব্যবসা? একাউন্ট খুলুন",
    phoneTaken: "এই ফোন নম্বরে একাউন্ট আছে — লগইন করুন",
    emailTaken: "এই ইমেইলে একাউন্ট আছে — লগইন করুন",
    invalidPhone: "সঠিক ফোন নম্বর দিন (১১ সংখ্যা, 01 দিয়ে শুরু)",
    invalidEmail: "সঠিক ইমেইল দিন (যেমন: example@gmail.com)",
    shortPassword: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের দিন",
    signupFailed: "একাউন্ট খোলা যায়নি — আবার চেষ্টা করুন",
    confirmEmailOn: "Supabase এ auto-confirm SQL চালান (চ্যাটে দেওয়া আছে)",
    policyPatchNeeded: "Supabase এ policy SQL চালান (চ্যাটে দেওয়া আছে)",
    checkEmailToConfirm: "আপনার ইমেইলে কনফার্মেশন লিংক গেছে — ইমেইল খুলে ভেরিফাই করে তারপর লগইন করুন",
    // Login — identifier + Google OAuth
    loginId: "ফোন নম্বর বা ইমেইল",
    loginIdPh: "01XXXXXXXXX / example@gmail.com",
    signupEmail: "ইমেইল",
    signupEmailPh: "example@gmail.com",
    signupEmailHint: "পাসওয়ার্ড ভুলে গেলে রিকভারি ও Google লগইনে কাজে লাগবে",
    orContinueWith: "অথবা",
    googleLogin: "Google দিয়ে লগইন করুন",
    googleNotConfigured: "Google সাইন-ইন এখনো চালু নয় — Supabase ড্যাশবোর্ডে Google প্রোভাইডার যোগ করুন",
    googleFailed: "Google লগইন সফল হয়নি — আবার চেষ্টা করুন",
    multiSelectHint: "একাধিক নির্বাচন করা যায়",
    // Team management (owner creates login accounts)
    teamAddMember: "নতুন সদস্য যোগ",
    teamAddMemberDesc: "ম্যানেজার / হিসাবরক্ষক / ড্রাইভারের লগইন একাউন্ট খুলুন",
    teamMemberName: "নাম",
    teamMemberPhone: "ফোন নম্বর",
    teamMemberRole: "ভূমিকা",
    teamMemberPassword: "পাসওয়ার্ড (৬+ অক্ষর)",
    teamInactive: "নিষ্ক্রিয়",
    teamAddBtn: "একাউন্ট খুলুন",
    teamAdded: "সদস্য যোগ হয়েছে",
    teamDeactivated: "একাউন্ট বন্ধ করা হয়েছে",
    teamActivated: "একাউন্ট চালু করা হয়েছে",
    teamRemoved: "সদস্য বাদ দেওয়া হয়েছে",
    teamRemoveConfirm: "এই সদস্যকে বাদ দিতে চান?",
    teamRemoveHint: "লগইন বন্ধ হবে, পরে আবার যোগ করা যাবে",
    teamRoleChanged: "ভূমিকা বদলেছে",
    cannotEditSelf: "নিজের একাউন্ট এখানে বদলানো যায় না",
    invalidRole: "ভূমিকা সঠিক নয়",
    notFound: "পাওয়া যায়নি",
    // Password change (self)
    changePassword: "নিজের পাসওয়ার্ড বদলান",
    changePasswordDesc: "নিরাপত্তার জন্য পুরোনো পাসওয়ার্ড লাগবে",
    currentPassword: "বর্তমান পাসওয়ার্ড",
    newPassword: "নতুন পাসওয়ার্ড",
    changePasswordBtn: "পাসওয়ার্ড বদলান",
    passwordChanged: "পাসওয়ার্ড বদলে গেছে",
    wrongPassword: "পুরোনো পাসওয়ার্ড ভুল",
    samePassword: "নতুন পাসওয়ার্ড আগেরটার থেকে আলাদা দিন",
    passwordMismatch: "দুইটা পাসওয়ার্ড মিলছে না",
    // Pickers / chips
    newCustomer: "নতুন কাস্টমার",
    noneOption: "নেই",
    searchList: "নাম দিয়ে খুঁজুন",
    typeToSearch: "নাম বা ফোন লিখে খুঁজুন…",
    moreN: "আরও {n}টা — লিখে খুঁজুন",
    noMatchFound: "কিছু পাওয়া যায়নি",
    // Trip complete — expense lines
    tripExpenses: "ট্রিপের খরচ",
    addExpenses: "খরচ যোগ করবেন? (না দিলেও চলবে)",
    expensesTotal: "খরচ মোট",
    profitPreview: "লাভ (আন্দাজ)",
    // Trip cancel
    cancelTrip: "ট্রিপ বাতিল",
    cancelTripConfirm: "ট্রিপটি বাতিল করবেন? এটা আর ফেরানো যাবে না।",
    tripCancelled: "ট্রিপ বাতিল হয়েছে",
    // Customer edit
    editCustomer: "কাস্টমার এডিট",
    customerUpdated: "কাস্টমার হালনাগাদ হয়েছে",
    // Calendar
    calendar: "ক্যালেন্ডার",
    listView: "তালিকা",
    noTripsThatDay: "এই দিনে কোনো ট্রিপ নেই",
    // Trip extras
    tripRefLabel: "রেফ",
    tripRef: "রেফারেন্স",
    invalidTripTime: "ফেরার সময় যাওয়ার সময়ের পরে হতে হবে",
    invalidEndKm: "শেষের কিমি শুরুর কিমির চেয়ে কম হতে পারে না",
    // Vehicle form
    brand: "ব্র্যান্ড",
    model: "মডেল",
    engineCc: "ইঞ্জিন (cc)",
    purchasePrice: "কেনার দাম",
    vehicleAdded: "গাড়ি যোগ হয়েছে",
    vehicleInMaintenance: "গাড়িটি এখন সার্ভিসে আছে",
    vehicleUnavailable: "গাড়িটি এখন ব্যবহার করা যাবে না",
    invalidOdometer: "নতুন কিমি আগের কিমির চেয়ে কম হতে পারে না",
    // Driver form
    addDriver: "ড্রাইভার যোগ",
    driverAdded: "ড্রাইভার যোগ হয়েছে",
    licenseNo: "লাইসেন্স নম্বর",
    // Payment collection (owner round 3)
    collectPayment: "পেমেন্ট নিন",
    paymentAdded: "পেমেন্ট যোগ হয়েছে",
    remainingAfter: "এর পরে বাকি",
    invalidTrip: "ট্রিপটি খুঁজে পাওয়া যায়নি",
    invalidDriver: "ড্রাইভার খুঁজে পাওয়া যায়নি",
    // Invoice (Phase 11)
    invoiceTitle: "ভাড়া ইনভয়েস",
    invoiceNo: "ইনভয়েস নং",
    billTo: "গ্রাহকের নাম",
    invoicePaid: "জমা",
    invoiceFullyPaid: "পরিশোধিত",
    invoiceTotalPaid: "মোট পরিশোধিত",
    printSave: "প্রিন্ট / PDF",
    invoiceThanks: "ধন্যবাদ! আবার সেবা নিয়ে যাবেন।",
    invoiceGenerated: "গাড়িখাতা দিয়ে তৈরি",
    kmRun: "কিমি চলেছে",
    tripInfo: "যাত্রার তথ্য",
    invoiceSummary: "হিসাব",
    amountInWords: "কথায়",
    receiverSign: "গ্রাহকের স্বাক্ষর",
    authorizedSign: "অনুমোদিত স্বাক্ষর",
    // Vehicle / driver edit (owner round 3)
    editVehicle: "গাড়ি এডিট",
    vehicleUpdated: "গাড়ির তথ্য হালনাগাদ হয়েছে",
    editDriver: "ড্রাইভার এডিট",
    driverUpdated: "ড্রাইভারের তথ্য হালনাগাদ হয়েছে",
    driverInactive: "কাজ করছেন না",
    // Reports drill-down
    monthTrips: "এই মাসের ট্রিপ",
    reportTapHint: "গাড়ির নামে চাপ দিলে এই মাসের হিসাব দেখা যাবে",
    // CSV export (v0.5)
    exportData: "ডাউনলোড",
    exportTrips: "ট্রিপ রেকর্ড",
    exportLedger: "আয়-খরচ বই",
    exportCustomers: "কাস্টমার হিসাব",
    exportVehicles: "গাড়ির মাসিক হিসাব",
    exportedToast: "ফাইল সেভ হয়েছে ✓",
    exportHint: "CSV ফাইল এক্সেল বা গুগল শিটে খোলা যাবে — হিসাবরক্ষককে পাঠাতে পারবেন।",
    csvRef: "রেফ",
    csvDate: "তারিখ",
    csvCustomer: "কাস্টমার",
    csvPhone: "ফোন",
    csvVehicle: "গাড়ি",
    csvDriver: "ড্রাইভার",
    csvRoute: "রুট",
    csvRentalType: "ভাড়ার ধরন",
    csvKm: "কিমি",
    csvFare: "ভাড়া",
    csvPaid: "জমা",
    csvDue: "বাকি",
    csvTripExpense: "ট্রিপ খরচ",
    csvProfit: "লাভ",
    csvStatus: "স্ট্যাটাস",
    csvType: "ধরন",
    csvCategory: "খাত",
    csvCustomerOrPaidTo: "কাস্টমার / কাকে দেওয়া",
    csvMethod: "মাধ্যম",
    csvAmount: "টাকা",
    csvName: "নাম",
    csvCompany: "কোম্পানি",
    csvAddress: "ঠিকানা",
    csvTotalPaid: "মোট জমা",
    csvCustomerSince: "কাস্টমার হওয়ার তারিখ",
    csvRegNumber: "রেজিস্ট্রেশন নম্বর",
    csvFuel: "ফুয়েল",
    csvCurrentKm: "বর্তমান KM",
    csvMileage: "মাইলেজ",
    // WhatsApp share (v0.5)
    sendWhatsApp: "WhatsApp",
    // Quotations (v0.7)
    navQuotations: "কোটেশন",
    addQuotation: "নতুন কোটেশন",
    quotationDesc: "কাস্টমারকে ভাড়ার প্রস্তাব — পরে এক ট্যাপে ট্রিপ হয়ে যাবে",
    quotationAdded: "কোটেশন তৈরি হয়েছে ✓",
    quoteAddedDesc: "{code} · {rate}",
    quotationsEmpty: "এখনো কোটেশন নেই",
    quotationsEmptyDesc: "কাস্টমারকে ভাড়ার প্রস্তাব পাঠান",
    quoteSummary: "কাজের বিবরণ",
    quoteSummaryPlaceholder: "যেমন: ঢাকা → কক্সবাজার, ৩ দিন",
    quoteRate: "প্রস্তাবিত ভাড়া",
    quoteValidUntil: "এই ভাড়া বৈধ থাকবে",
    quoteTerms: "শর্ত (না দিলেও চলবে)",
    quoteTermsPlaceholder: "যেমন: অগ্রিম ৫০%, টোল-পার্কিং আলাদা",
    quoteSent: "পাঠানো হয়েছে",
    quoteAccepted: "গৃহীত",
    quoteRejected: "বাতিল",
    quoteExpired: "মেয়াদ শেষ",
    quoteDaysLeft: "{n} দিন বাকি",
    quoteValidity: "বৈধতা",
    makeTrip: "ট্রিপ বানান",
    quoteRejectBtn: "বাতিল",
    viewQuote: "কোটেশন দেখুন",
    quotationTitle: "ভাড়া কোটেশন",
    quoteFor: "প্রস্তাবিত কাজ",
    quoteTermsLabel: "শর্তাবলী",
    quoteValidNote: "উপরের ভাড়া নির্ধারিত মেয়াদ পর্যন্ত বৈধ",
    quoteInvalid: "কোটেশন পাওয়া যায়নি",
    invalidQuoteState: "এই কোটেশনের সিদ্ধান্ত আগেই নেওয়া হয়েছে",
    quoteConvertedToast: "ট্রিপ তৈরি হয়েছে ✓",
    quoteAcceptedToast: "কোটেশন গৃহীত হয়েছে",
    quoteRejectedToast: "কোটেশন বাতিল করা হয়েছে",
    quoteFromLabel: "কোটেশন",
    quoteCustomerLabel: "কাস্টমারের নাম",
    // PWA install (v0.7)
    installNow: "ইনস্টল করুন",
    installLater: "পরে",
    installBannerTitle: "অ্যাপটি ইনস্টল করুন",
    installBannerDesc: "স্ক্রিনে এক ট্যাপে খুলবেন — ইন্টারনেট ছাড়াও চলবে",
    appInstalled: "ইনস্টল হয়েছে ✓",
    iosInstallTitle: "iPhone-এ অ্যাপ বসান",
    iosInstallStep1: "নিচের Share (উপরের দিকে তীর) বোতামে চাপ দিন",
    iosInstallStep2: "লিস্টে “Add to Home Screen” খুঁজে চাপ দিন",
    iosInstallStep3: "“Add” চাপলেই স্ক্রিনে অ্যাপ বসে যাবে",
    iosInstallHint: "Safari ব্রাউজারে এখনই করা যায়",
    androidInstallHint: "Chrome মেনু → “Install app”",
    // Cloud auth (v0.7)
    accountNoBusiness: "এই অ্যাকাউন্ট কোনো ব্যবসার সাথে যুক্ত নেই",
    // Admin panel (v0.16)
    adminPanelTitle: "অ্যাডমিন প্যানেল",
    adminPanelSubtitle: "প্ল্যাটফর্মের সব ব্যবসা ও ইউজার — এক নজরে",
    adminTabAccount: "অ্যাকাউন্ট দিয়ে",
    adminTabKey: "অ্যাডমিন কী",
    adminPhoneLabel: "ফোন বা ইমেইল",
    adminPasswordLabel: "পাসওয়ার্ড",
    adminAccountHint: "আসল ক্লাউড ডেটা দেখতে নিজের অ্যাকাউন্ট দিয়ে লগইন করুন (অ্যাপের একই ফোন ও পাসওয়ার্ড)",
    adminKeyHint: "বিকল্প — সার্ভারে সেট করা অ্যাডমিন কী (GK_ADMIN_KEY)",
    adminKeyLabel: "অ্যাডমিন কী",
    adminKeyPlaceholder: "অ্যাডমিন কী লিখুন",
    adminLoginBtn: "অ্যাডমিনে ঢুকুন",
    adminWrongKey: "ভুল অ্যাডমিন কী",
    adminLoginFailed: "ফোন/ইমেইল বা পাসওয়ার্ড ভুল",
    adminNotPlatformOwner: "এই অ্যাকাউন্ট প্ল্যাটফর্ম অ্যাডমিন নয় — SQL-এর F-ধাপ চালালে আপনার অ্যাকাউন্ট অ্যাডমিন হবে",
    adminSetupMissing: "অ্যাডমিন সেটআপ এখনো হয়নি — Supabase-এ v1.0 SQL-এর F সেকশন চালান",
    adminWarnLocal: "এখন লোকাল ডেমো ডেটা দেখানো হচ্ছে — আসল ক্লাউড ডেটার জন্য লগআউট করে নিজের অ্যাকাউন্ট দিয়ে লগইন করুন",
    adminKeyNoCloud: "কী দিয়ে লগইন হয়েছে, কিন্তু আসল ক্লাউড ডেটা দেখার জন্য উপরের 'অ্যাকাউন্ট দিয়ে' ট্যাবে নিজের ফোন + পাসওয়ার্ড দিয়ে লগইন করুন (অথবা Cloudflare secret-এ SUPABASE_SERVICE_ROLE বসান)",
    adminKeyNotSet: "অ্যাডমিন কী সেট করা নেই — .env বা Cloudflare secret-এ GK_ADMIN_KEY বসান",
    adminDataUnavailable: "ডেটা আনা যায়নি — Cloudflare secret-এ SUPABASE_SERVICE_ROLE বসান",
    adminSessionExpired: "অ্যাডমিন সেশন শেষ — আবার লগইন করুন",
    adminStatBusinesses: "মোট ব্যবসা",
    adminStatUsers: "মোট ইউজার",
    adminStatVehicles: "মোট গাড়ি",
    adminStatTrips30: "ট্রিপ (৩০ দিন)",
    adminStatNew7: "নতুন ইউজার (৭ দিন)",
    adminBusinessesSection: "সব ব্যবসা",
    adminMembersSection: "সাম্প্রতিক ইউজার",
    adminSearchPlaceholder: "নাম, ফোন বা ব্যবসা খুঁজুন…",
    adminSourceCloud: "লাইভ ক্লাউড ডেটা",
    adminSourceLocal: "লোকাল ডেমো ডেটা",
    adminRefresh: "রিফ্রেশ",
    adminLogout: "লগআউট",
    adminOwner: "মালিক",
    adminJoined: "যোগ দিয়েছেন",
    adminNoResults: "কিছু পাওয়া যায়নি",
    adminBackToApp: "অ্যাপে ফিরুন",
    adminLoading: "লোড হচ্ছে…"
};
const en = {
    appName: "GarirKhata",
    appTagline: "Your vehicle business, in one app",
    navHome: "Home",
    navTrips: "Trips",
    navVehicles: "Vehicles",
    navMore: "More",
    navGroupOps: "Operations",
    navGroupMoney: "Finance",
    navGroupInfo: "Info & Reports",
    navCustomers: "Customers",
    navDrivers: "Drivers",
    navFuel: "Fuel",
    navMaintenance: "Service",
    navFinance: "Money",
    navDocuments: "Documents",
    navReminders: "Reminders",
    navReports: "Reports",
    navGuide: "Problem Guide",
    navSettings: "Settings",
    search: "Search",
    searchPlaceholder: "Vehicle, customer, trip, driver…",
    notifications: "Notifications",
    viewAll: "View all",
    save: "Save",
    cancel: "Cancel",
    me: "Me",
    close: "Close",
    yes: "Yes",
    no: "No",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    optional: "Optional",
    today: "Today",
    tomorrow: "Tomorrow",
    yesterday: "Yesterday",
    all: "All",
    status: "Status",
    notes: "Notes",
    phone: "Phone",
    name: "Name",
    date: "Date",
    time: "Time",
    amount: "Amount",
    total: "Total",
    from: "From",
    to: "To",
    vehicle: "Vehicle",
    driver: "Driver",
    customer: "Customer",
    km: "KM",
    litre: "Litre",
    perLitre: "per litre",
    driverMode: "Driver Mode",
    driverModeDesc: "What drivers see — the simple version",
    logout: "Log out",
    welcome: "Welcome",
    quickActions: "Quick Actions",
    addTrip: "New Trip",
    addIncome: "Add Income",
    addExpense: "Add Expense",
    addFuel: "Add Fuel",
    addService: "Add Service",
    todayTrips: "Today's Trips",
    upcomingTrips: "Upcoming Trips",
    noTripsToday: "No trips today",
    noUpcoming: "No upcoming trips",
    todayIncome: "Today's Income",
    monthIncome: "This Month's Income",
    monthExpense: "This Month's Expense",
    netProfit: "Net Profit",
    moneyDue: "Money Due",
    totalVehicles: "Total Vehicles",
    availableNow: "Available",
    onTripNow: "On Trip",
    inMaintenance: "In Service",
    needAttention: "Needs Attention",
    incomeTrend: "Last 6 Months Income",
    recentActivity: "Recent Activity",
    vAvailable: "Available",
    vOnTrip: "On Trip",
    vMaintenance: "In Service",
    vInactive: "Inactive",
    vForSale: "For Sale",
    vSold: "Sold",
    vehiclesEmpty: "No vehicles added yet",
    addVehicle: "Add Vehicle",
    regNumber: "Registration No.",
    brandModel: "Brand & Model",
    modelYear: "Model Year",
    fuelType: "Fuel Type",
    seats: "Seats",
    color: "Color",
    vehicleKm: "Vehicle KM",
    transmission: "Transmission",
    diesel: "Diesel",
    petrol: "Petrol",
    cng: "CNG",
    automatic: "Automatic",
    manual: "Manual",
    vehicleIncome: "Income this month",
    vehicleFuelEff: "Mileage",
    vehicleDocs: "Documents",
    vehicleService: "Next service",
    vehicleProfit: "Profit this month",
    vehicleSince: "Added on",
    tripStatusDraft: "Draft",
    tripStatusConfirmed: "Confirmed",
    tripStatusRunning: "Running",
    tripStatusCompleted: "Completed",
    tripStatusCancelled: "Cancelled",
    tripsEmpty: "No trips",
    filterToday: "Today",
    filterUpcoming: "Upcoming",
    filterRunning: "Running",
    filterCompleted: "Done",
    tripFare: "Fare",
    tripAdvance: "Advance",
    tripDue: "Due",
    tripProfit: "Trip Profit",
    tripRoute: "Route",
    tripStart: "Start",
    tripEnd: "End",
    bookingConflict: "This vehicle is already booked for another trip at this time. Please choose a different vehicle.",
    tripAdded: "Trip added",
    tripCompleted: "Trip completed",
    rentalDaily: "Daily",
    rentalPerTrip: "Per Trip",
    rentalPerKm: "Per KM",
    rentalPerHour: "Per Hour",
    rentalAirport: "Airport",
    rentalCorporate: "Corporate",
    rentalTour: "Tour",
    rentalWedding: "Wedding/Event",
    rentalMonthly: "Monthly",
    customersEmpty: "No customers",
    addCustomer: "Add Customer",
    customerAdded: "Customer added",
    company: "Company",
    address: "Address",
    totalTrips: "Total Trips",
    totalPaid: "Total Paid",
    customerSince: "Customer since",
    driversEmpty: "No drivers",
    licenseExpiry: "License expires",
    salary: "Salary",
    driverDue: "Due",
    driverAdvance: "Advance",
    tripsDone: "Trips done",
    driverActive: "Working",
    fuelEntries: "Fuel Entries",
    fuelEmpty: "No fuel entries",
    kmPerLitre: "KM/Litre",
    costPerKm: "Cost per KM",
    fuelEffDropped: "Mileage has dropped. Getting the vehicle checked is a good idea.",
    lastFillup: "Since last fill",
    station: "Fuel station",
    fuelAdded: "Fuel entry added",
    monthFuelCost: "Fuel cost this month",
    serviceSchedule: "Next Service",
    serviceHistory: "Service History",
    engineOil: "Engine Oil",
    oilFilter: "Oil Filter",
    airFilter: "Air Filter",
    brakePad: "Brake Pad",
    acService: "AC Service",
    tyreRotation: "Tyre Rotation",
    wheelAlignment: "Wheel Alignment",
    otherItem: "Other",
    statusGood: "Good",
    statusSoon: "Soon",
    statusDue: "Due",
    statusOverdue: "Overdue",
    kmLeft: "KM left",
    kmOver: "KM over",
    daysLeft: "days left",
    daysOver: "days over",
    serviceDueSoon: "almost due —",
    serviceAdded: "Service added",
    workshop: "Workshop",
    lastServiceAt: "Last service",
    tabIncome: "Income",
    tabExpense: "Expense",
    income: "Income",
    expense: "Expense",
    net: "Net",
    thisMonth: "This month",
    incomeEmpty: "No income recorded",
    expenseEmpty: "No expenses recorded",
    incomeAdded: "Income added",
    expenseAdded: "Expense added",
    paymentMethod: "Payment method",
    paidTo: "Paid to",
    cash: "Cash",
    bank: "Bank",
    bkash: "bKash",
    nagad: "Nagad",
    card: "Card",
    icRental: "Rental",
    icExtraKm: "Extra KM",
    icExtraHour: "Extra Hour",
    icDriverCharge: "Driver Charge",
    icDelivery: "Delivery",
    icCorporate: "Corporate Contract",
    icOther: "Other",
    ecFuel: "Fuel",
    ecMaintenance: "Service",
    ecParts: "Parts",
    ecDriverSalary: "Driver Salary",
    ecDriverAllowance: "Driver Allowance",
    ecToll: "Toll",
    ecParking: "Parking",
    ecTax: "Tax",
    ecInsurance: "Insurance",
    ecRegistration: "Registration",
    ecWorkshop: "Workshop",
    ecLoan: "Loan/EMI",
    ecCleaning: "Cleaning",
    ecMisc: "Miscellaneous",
    docRegistration: "Registration",
    docTaxToken: "Tax Token",
    docFitness: "Fitness",
    docInsurance: "Insurance",
    docPermit: "Route Permit",
    docOther: "Other",
    expiresOn: "Expires on",
    expiredOn: "Expired on",
    daysLeftShort: "days left",
    expired: "Expired",
    valid: "Valid",
    docsEmpty: "No documents",
    expiryRemainder: "days to expiry",
    remindersEmpty: "No reminders right now",
    allClear: "All clear",
    groupOwn: "My Reminders",
    groupDocuments: "Documents",
    groupMaintenance: "Service",
    groupPayments: "Payment Reminders",
    groupTrips: "Trips",
    addReminder: "Set Reminder",
    reminderFormDesc: "You'll be reminded at the exact time",
    reminderTitle: "What to remind",
    reminderTitleHint: "e.g. Call the customer",
    reminderTime: "When",
    reminderTimeHint: "Date and time — you'll be reminded exactly then",
    linkTrip: "Link a trip",
    reminderSaved: "Reminder saved",
    reminderOverdue: "Time passed",
    minutesLeft: "min left",
    markDone: "Mark as done",
    autoReminderNote: "Auto reminder 1 hour before start",
    autoReminderToast: "Reminder set for 1 hour before start",
    reminderAlarmTitle: "Reminder — it's time",
    pendingRemindersSummary: "reminders pending",
    viewNow: "View",
    setTripReminder: "Set a time reminder for this trip",
    driverSalaryDue: "Driver salary day",
    customerDueRem: "Customer due",
    tripTodayRem: "Today's trip",
    reportsNote: "Detailed reports are added step by step",
    bestVehicle: "Most profitable vehicle",
    topCustomer: "Most frequent customer",
    topDriver: "Most trips",
    monthlySummary: "This month",
    perVehicleProfit: "Profit by vehicle",
    revenue: "Revenue",
    cost: "Cost",
    guideDisclaimer: "This is a general educational guide — not a confirmed diagnosis.",
    possibleCauses: "Possible causes",
    checkFirst: "Check first",
    severityLow: "Minor",
    severityMedium: "Moderate",
    severityHigh: "Urgent",
    canDrive: "OK to keep driving?",
    seeMechanic: "Best to see a mechanic",
    guideIntro: "Pick the symptom you notice",
    symptomAcNotCooling: "AC not cooling",
    symptomOverheating: "Engine overheating",
    symptomHardStart: "Hard to start",
    symptomLowPickup: "Low pickup",
    symptomBrakeNoise: "Brake noise",
    symptomSmoke: "Excessive smoke",
    symptomVibration: "Vibration",
    symptomBattery: "Weak battery",
    moreSymptomsSoon: "More symptoms will be added step by step",
    dmTodayTrip: "Today's Trip",
    dmStartTrip: "Start Trip",
    dmCompleteTrip: "Complete Trip",
    dmStartKm: "Starting KM",
    dmEndKm: "Ending KM",
    dmFuelAdded: "Refuelled?",
    dmTripRunning: "Trip running",
    dmNoTrip: "No trip assigned today",
    dmCallCustomer: "Call customer",
    dmTripDone: "Trip completed — nice!",
    dmEmergency: "Emergency contact",
    dmBackToOwner: "Back to owner mode",
    businessProfile: "Business Profile",
    businessName: "Business name",
    language: "Language",
    appearance: "Appearance",
    lightMode: "Light",
    darkMode: "Dark",
    team: "Team",
    roleOwner: "Owner",
    roleManager: "Manager",
    roleDriver: "Driver",
    roleAccountant: "Accountant",
    plan: "Plan",
    planFree: "Free",
    planVehicles: "vehicles",
    version: "Version",
    installApp: "Install the app",
    installAppDesc: "Keep it on your home screen",
    aboutApp: "About",
    dataSafety: "Your data belongs only to your business — nobody else can see it.",
    offline: "No internet",
    offlineDesc: "Everything will sync when connection returns",
    retry: "Try again",
    comingSoon: "Coming soon",
    savedServerNote: "Everything is saved — it survives refresh",
    saving: "Saving…",
    pleaseWait: "Please wait…",
    fillAll: "Please fill everything",
    serverError: "Something went wrong — please try again",
    forbidden: "You're not allowed to do this",
    notLoggedIn: "Please log in again",
    loginPhone: "Phone number",
    loginPassword: "Password",
    loginBtn: "Log in",
    loginFailed: "Wrong phone, email or password",
    // Password reset (v0.15)
    forgotPassword: "Forgot password?",
    send: "Send",
    forgotPasswordHint: "Enter your email or phone — we'll send a reset link.",
    resetSent: "Reset link sent to your email ✓",
    resetPhoneNotFound: "No account found for this phone number",
    resetLocalUnsupported: "Password reset works only for online accounts",
    resetLinkExpired: "This link has expired — request a new one",
    resetPasswordTitle: "New password",
    resetPasswordSubtitle: "Set a new password and save — then log in.",
    confirmPassword: "Re-enter password",
    resetPasswordBtn: "Save password",
    resetPasswordDone: "Password changed ✓",
    // Business profile edit (v0.15)
    editProfileBtn: "Edit",
    editBusinessTitle: "Edit business details",
    addressPh: "House, road, area, city",
    businessSaved: "Business details saved ✓",
    ownerNamePh: "Owner's name",
    signupTitle: "Start your business",
    signupSubtitle: "Your vehicle business ledger — ready in 1 minute",
    signupBusinessName: "Business name",
    signupBusinessNamePh: "e.g. Rahim Travels",
    signupOwnerName: "Your name",
    signupPassword: "Password (6+ characters)",
    signupBtn: "Create account",
    signupHaveAccount: "Already have an account? Log in",
    loginNoAccount: "New business? Create an account",
    phoneTaken: "This phone already has an account — please log in",
    emailTaken: "This email already has an account — please log in",
    invalidPhone: "Enter a valid phone (11 digits, starts 01)",
    invalidEmail: "Enter a valid email (e.g. example@gmail.com)",
    shortPassword: "Password must be at least 6 characters",
    signupFailed: "Could not create the account — try again",
    confirmEmailOn: "Run the auto-confirm SQL in Supabase (in the chat)",
    policyPatchNeeded: "Run the policy SQL in Supabase (in the chat)",
    checkEmailToConfirm: "A confirmation link was sent to your email — open it, verify, then log in",
    // Login — identifier + Google OAuth
    loginId: "Phone number or email",
    loginIdPh: "01XXXXXXXXX / example@gmail.com",
    signupEmail: "Email",
    signupEmailPh: "example@gmail.com",
    signupEmailHint: "Used for password recovery and Google login",
    orContinueWith: "or",
    googleLogin: "Continue with Google",
    googleNotConfigured: "Google sign-in is not set up yet — add the Google provider in the Supabase dashboard",
    googleFailed: "Google sign-in failed — try again",
    multiSelectHint: "Select one or more",
    teamAddMember: "Add member",
    teamAddMemberDesc: "Create logins for manager / accountant / driver",
    teamMemberName: "Name",
    teamMemberPhone: "Phone number",
    teamMemberRole: "Role",
    teamMemberPassword: "Password (6+ characters)",
    teamInactive: "Inactive",
    teamAddBtn: "Create account",
    teamAdded: "Member added",
    teamDeactivated: "Account deactivated",
    teamActivated: "Account activated",
    teamRemoved: "Member removed",
    teamRemoveConfirm: "Remove this member?",
    teamRemoveHint: "Their login stops; they can be re-added later",
    teamRoleChanged: "Role updated",
    cannotEditSelf: "You cannot edit your own account here",
    invalidRole: "Invalid role",
    notFound: "Not found",
    changePassword: "Change my password",
    changePasswordDesc: "Current password needed for security",
    currentPassword: "Current password",
    newPassword: "New password",
    changePasswordBtn: "Change password",
    passwordChanged: "Password changed",
    wrongPassword: "Current password is wrong",
    samePassword: "New password must be different",
    passwordMismatch: "Passwords do not match",
    newCustomer: "New customer",
    noneOption: "None",
    searchList: "Search by name",
    typeToSearch: "Type name or phone…",
    moreN: "{n} more — keep typing",
    noMatchFound: "Nothing found",
    tripExpenses: "Trip expenses",
    addExpenses: "Add expenses? (optional)",
    expensesTotal: "Expenses total",
    profitPreview: "Profit (est.)",
    cancelTrip: "Cancel trip",
    cancelTripConfirm: "Cancel this trip? This cannot be undone.",
    tripCancelled: "Trip cancelled",
    editCustomer: "Edit customer",
    customerUpdated: "Customer updated",
    calendar: "Calendar",
    listView: "List",
    noTripsThatDay: "No trips that day",
    tripRefLabel: "Ref",
    tripRef: "Reference",
    invalidTripTime: "Return time must be after the start time",
    invalidEndKm: "End KM can't be less than start KM",
    brand: "Brand",
    model: "Model",
    engineCc: "Engine (cc)",
    purchasePrice: "Purchase price",
    vehicleAdded: "Vehicle added",
    vehicleInMaintenance: "This vehicle is in service right now",
    vehicleUnavailable: "This vehicle can't be used right now",
    invalidOdometer: "New KM can't be less than the last KM",
    addDriver: "Add Driver",
    driverAdded: "Driver added",
    licenseNo: "License no.",
    collectPayment: "Collect Payment",
    paymentAdded: "Payment recorded",
    remainingAfter: "Remaining due",
    invalidTrip: "Trip not found",
    invalidDriver: "Driver not found",
    invoiceTitle: "Rental Invoice",
    invoiceNo: "Invoice No",
    billTo: "Bill To",
    invoicePaid: "Payment",
    invoiceFullyPaid: "FULLY PAID",
    invoiceTotalPaid: "Total Paid",
    printSave: "Print / PDF",
    invoiceThanks: "Thank you for your business!",
    invoiceGenerated: "Generated with GarirKhata",
    kmRun: "Distance",
    tripInfo: "Trip Details",
    invoiceSummary: "Summary",
    amountInWords: "In words",
    receiverSign: "Customer's Signature",
    authorizedSign: "Authorized Signature",
    editVehicle: "Edit Vehicle",
    vehicleUpdated: "Vehicle updated",
    editDriver: "Edit Driver",
    driverUpdated: "Driver updated",
    driverInactive: "Not working",
    monthTrips: "This month's trips",
    reportTapHint: "Tap a vehicle to see its month",
    // CSV export (v0.5)
    exportData: "Download",
    exportTrips: "Trip records",
    exportLedger: "Income-expense book",
    exportCustomers: "Customer accounts",
    exportVehicles: "Vehicle monthly P&L",
    exportedToast: "File saved ✓",
    exportHint: "CSV files open in Excel or Google Sheets — send them to your accountant.",
    csvRef: "Ref",
    csvDate: "Date",
    csvCustomer: "Customer",
    csvPhone: "Phone",
    csvVehicle: "Vehicle",
    csvDriver: "Driver",
    csvRoute: "Route",
    csvRentalType: "Rental type",
    csvKm: "KM",
    csvFare: "Fare",
    csvPaid: "Paid",
    csvDue: "Due",
    csvTripExpense: "Trip expenses",
    csvProfit: "Profit",
    csvStatus: "Status",
    csvType: "Type",
    csvCategory: "Category",
    csvCustomerOrPaidTo: "Customer / Paid to",
    csvMethod: "Method",
    csvAmount: "Amount",
    csvName: "Name",
    csvCompany: "Company",
    csvAddress: "Address",
    csvTotalPaid: "Total paid",
    csvCustomerSince: "Customer since",
    csvRegNumber: "Reg. no.",
    csvFuel: "Fuel",
    csvCurrentKm: "Current KM",
    csvMileage: "Mileage",
    // WhatsApp share (v0.5)
    sendWhatsApp: "WhatsApp",
    // Quotations (v0.7)
    navQuotations: "Quotes",
    addQuotation: "New Quote",
    quotationDesc: "Send a price offer — turns into a trip in one tap",
    quotationAdded: "Quote created ✓",
    quoteAddedDesc: "{code} · {rate}",
    quotationsEmpty: "No quotes yet",
    quotationsEmptyDesc: "Send customers a price offer",
    quoteSummary: "Work summary",
    quoteSummaryPlaceholder: "e.g. Dhaka → Cox's Bazar, 3 days",
    quoteRate: "Quoted rate",
    quoteValidUntil: "Rate valid until",
    quoteTerms: "Terms (optional)",
    quoteTermsPlaceholder: "e.g. 50% advance, toll/parking extra",
    quoteSent: "Sent",
    quoteAccepted: "Accepted",
    quoteRejected: "Rejected",
    quoteExpired: "Expired",
    quoteDaysLeft: "{n} days left",
    quoteValidity: "Validity",
    makeTrip: "Make Trip",
    quoteRejectBtn: "Reject",
    viewQuote: "View Quote",
    quotationTitle: "RENTAL QUOTATION",
    quoteFor: "Proposed Work",
    quoteTermsLabel: "Terms",
    quoteValidNote: "The above rate is valid until the stated date",
    quoteInvalid: "Quote not found",
    invalidQuoteState: "This quote's decision was already made",
    quoteConvertedToast: "Trip created ✓",
    quoteAcceptedToast: "Quote marked as accepted",
    quoteRejectedToast: "Quote rejected",
    quoteFromLabel: "Quote",
    quoteCustomerLabel: "Customer",
    // PWA install (v0.7)
    installNow: "Install",
    installLater: "Later",
    installBannerTitle: "Install the app",
    installBannerDesc: "Opens in one tap from your screen — works offline too",
    appInstalled: "Installed ✓",
    iosInstallTitle: "Install on iPhone",
    iosInstallStep1: "Tap the Share button (arrow pointing up)",
    iosInstallStep2: "Find “Add to Home Screen” in the list and tap it",
    iosInstallStep3: "Tap “Add” — the app lands on your home screen",
    iosInstallHint: "Works right now in Safari",
    androidInstallHint: "Chrome menu → “Install app”",
    // Cloud auth (v0.7)
    accountNoBusiness: "This account is not linked to any business",
    // Admin panel (v0.16)
    adminPanelTitle: "Admin Panel",
    adminPanelSubtitle: "Every business and user on the platform — at a glance",
    adminTabAccount: "With account",
    adminTabKey: "Admin key",
    adminPhoneLabel: "Phone or email",
    adminPasswordLabel: "Password",
    adminAccountHint: "Sign in with your own account (same phone and password as the app) to see real cloud data",
    adminKeyHint: "Alternative — the server-side admin key (GK_ADMIN_KEY)",
    adminKeyLabel: "Admin key",
    adminKeyPlaceholder: "Enter the admin key",
    adminLoginBtn: "Enter admin",
    adminWrongKey: "Wrong admin key",
    adminLoginFailed: "Wrong phone/email or password",
    adminNotPlatformOwner: "This account is not a platform admin — run section F of the SQL to make your account an admin",
    adminSetupMissing: "Admin setup not done yet — run section F of the v1.0 SQL in Supabase",
    adminWarnLocal: "Showing local demo data — log out and sign in with your own account for real cloud data",
    adminKeyNoCloud: "Key login works, but for real cloud data use the 'Account' tab above (your phone + password), or set SUPABASE_SERVICE_ROLE in Cloudflare secrets",
    adminKeyNotSet: "Admin key not set — add GK_ADMIN_KEY in .env or Cloudflare secrets",
    adminDataUnavailable: "Could not load data — set SUPABASE_SERVICE_ROLE in Cloudflare secrets",
    adminSessionExpired: "Admin session expired — sign in again",
    adminStatBusinesses: "Total businesses",
    adminStatUsers: "Total users",
    adminStatVehicles: "Total vehicles",
    adminStatTrips30: "Trips (30 days)",
    adminStatNew7: "New users (7 days)",
    adminBusinessesSection: "All businesses",
    adminMembersSection: "Recent users",
    adminSearchPlaceholder: "Search name, phone or business…",
    adminSourceCloud: "Live cloud data",
    adminSourceLocal: "Local demo data",
    adminRefresh: "Refresh",
    adminLogout: "Log out",
    adminOwner: "Owner",
    adminJoined: "Joined",
    adminNoResults: "No results",
    adminBackToApp: "Back to app",
    adminLoading: "Loading…"
};
const translations = {
    bn,
    en
};
function translate(lang, key, vars) {
    let text = translations[lang][key] ?? translations.bn[key] ?? key;
    if (vars) {
        for (const [k, v] of Object.entries(vars)){
            text = text.replace(`{${k}}`, String(v));
        }
    }
    return text;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/insights.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GROUP_TITLES",
    ()=>GROUP_TITLES,
    "useDashboardStats",
    ()=>useDashboardStats,
    "useDocTypeLabel",
    ()=>useDocTypeLabel,
    "useMaintItemLabel",
    ()=>useMaintItemLabel,
    "useMaintStatus",
    ()=>useMaintStatus,
    "useMileageWarnings",
    ()=>useMileageWarnings,
    "useReminders",
    ()=>useReminders,
    "useVehicleStatus",
    ()=>useVehicleStatus
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/types.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/format.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature(), _s4 = __turbopack_context__.k.signature(), _s5 = __turbopack_context__.k.signature(), _s6 = __turbopack_context__.k.signature();
"use client";
;
;
;
function useVehicleStatus() {
    _s();
    const { t } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useT"])();
    return {
        available: {
            label: t("vAvailable"),
            tone: "success"
        },
        on_trip: {
            label: t("vOnTrip"),
            tone: "warning"
        },
        maintenance: {
            label: t("vMaintenance"),
            tone: "danger"
        },
        inactive: {
            label: t("vInactive"),
            tone: "neutral"
        },
        for_sale: {
            label: t("vForSale"),
            tone: "info"
        },
        sold: {
            label: t("vSold"),
            tone: "neutral"
        }
    };
}
_s(useVehicleStatus, "ButTCEMFbNz5RhPo3+jXg4nAtj8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useT"]
    ];
});
function useMaintStatus() {
    _s1();
    const { t } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useT"])();
    return {
        good: {
            label: t("statusGood"),
            tone: "success"
        },
        soon: {
            label: t("statusSoon"),
            tone: "warning"
        },
        due: {
            label: t("statusDue"),
            tone: "danger"
        },
        overdue: {
            label: t("statusOverdue"),
            tone: "danger"
        }
    };
}
_s1(useMaintStatus, "ButTCEMFbNz5RhPo3+jXg4nAtj8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useT"]
    ];
});
function useDocTypeLabel() {
    _s2();
    const { t } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useT"])();
    return {
        registration: t("docRegistration"),
        tax_token: t("docTaxToken"),
        fitness: t("docFitness"),
        insurance: t("docInsurance"),
        permit: t("docPermit"),
        other: t("docOther")
    };
}
_s2(useDocTypeLabel, "ButTCEMFbNz5RhPo3+jXg4nAtj8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useT"]
    ];
});
function useMaintItemLabel() {
    _s3();
    const { t } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useT"])();
    return {
        engine_oil: t("engineOil"),
        oil_filter: t("oilFilter"),
        air_filter: t("airFilter"),
        brake_pad: t("brakePad"),
        ac_service: t("acService"),
        tyre_rotation: t("tyreRotation"),
        wheel_alignment: t("wheelAlignment"),
        other: t("otherItem")
    };
}
_s3(useMaintItemLabel, "ButTCEMFbNz5RhPo3+jXg4nAtj8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useT"]
    ];
});
function useReminders() {
    _s4();
    const { data, t, lang } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useApp"])();
    const docLabel = useDocTypeLabel();
    const itemLabel = useMaintItemLabel();
    const maintStatusMap = useMaintStatus();
    const out = [];
    // User-set reminders (v0.9): title + notes + EXACT time, optional trip link
    for (const r of data.reminders){
        if (r.done) continue;
        const trip = r.tripId ? data.trips.find((tr)=>tr.id === r.tripId) : undefined;
        const mins = Math.round((+new Date(r.dueAt) - Date.now()) / 60000);
        const when = mins < 0 ? t("reminderOverdue") : mins < 60 ? `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toBnDigits"])(mins)} ${t("minutesLeft")}` : `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmtDate"])(r.dueAt, lang)} · ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmtTime"])(r.dueAt, lang)}`;
        const message = `${r.title}${trip ? ` · ${trip.ref}` : ""} — ${when}${r.notes ? ` · ${r.notes}` : ""}`;
        out.push({
            id: `own-${r.id}`,
            group: "own",
            message,
            tone: mins < 0 ? "danger" : mins < 120 ? "warning" : "info",
            sortKey: mins,
            reminderId: r.id,
            dueAt: r.dueAt
        });
    }
    // Vehicle documents
    for (const doc of data.documents){
        const days = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["daysUntil"])(doc.expiryDate);
        if (days > 30) continue;
        const v = data.vehicles.find((x)=>x.id === doc.vehicleId);
        const label = docLabel[doc.docType];
        const message = days < 0 ? `${v?.name} — ${label} ${t("expired")} (${fmtDateShort(doc.expiryDate)})` : `${v?.name} — ${label} ${days < 7 ? "" : t("expiresOn") + " "}${fmtDateShort(doc.expiryDate)} · ${days} ${t("daysLeftShort")}`;
        out.push({
            id: `doc-${doc.id}`,
            group: "documents",
            message,
            tone: days < 0 ? "danger" : days <= 7 ? "danger" : days <= 15 ? "warning" : "info",
            sortKey: days < 0 ? -1000 + days : days
        });
    }
    // Maintenance (KM based)
    for (const ms of data.maintenanceSchedule){
        if (ms.status === "good") continue;
        const v = data.vehicles.find((x)=>x.id === ms.vehicleId);
        const nextDueKm = ms.lastServiceKm + ms.intervalKm;
        const remaining = nextDueKm - (v?.currentKm ?? 0);
        const kmText = remaining >= 0 ? `${t("serviceDueSoon")} ${Math.abs(remaining).toLocaleString(lang === "bn" ? "bn-BD" : "en-IN")} ${t("kmLeft")}` : `${maintStatusMap[ms.status].label} · ${Math.abs(remaining).toLocaleString(lang === "bn" ? "bn-BD" : "en-IN")} ${t("kmOver")}`;
        out.push({
            id: `ms-${ms.id}`,
            group: "maintenance",
            message: `${v?.name} — ${itemLabel[ms.item]} ${kmText}`,
            tone: ms.status === "soon" ? "warning" : "danger",
            sortKey: ms.status === "overdue" ? -2000 + remaining / 1000 : -remaining / 1000
        });
    }
    // Payments: customer dues
    for (const c of data.customers){
        if (c.due <= 0) continue;
        out.push({
            id: `due-${c.id}`,
            group: "payments",
            message: `${c.name} — ${t("moneyDue")} ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmtMoney"])(c.due, lang)}`,
            tone: c.due > 15000 ? "warning" : "info",
            sortKey: c.due / 100
        });
    }
    // Driver license expiry
    for (const d of data.drivers){
        const days = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["daysUntil"])(d.licenseExpiry);
        if (days > 30 || days < 0) continue;
        out.push({
            id: `lic-${d.id}`,
            group: "payments",
            message: `${d.name} — ${t("licenseExpiry")} ${toBn(days, lang)} ${t("daysLeftShort")}`,
            tone: days <= 20 ? "warning" : "info",
            sortKey: days
        });
    }
    // Trips: today + tomorrow (v0.9 — with time, not just today's)
    const todayStr = new Date().toDateString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toDateString();
    for (const tr of data.trips){
        if (tr.status === "cancelled" || tr.status === "completed") continue;
        const d = new Date(tr.startAt);
        const dayStr = d.toDateString();
        if (dayStr !== todayStr && dayStr !== tomorrowStr) continue;
        const v = data.vehicles.find((x)=>x.id === tr.vehicleId);
        const label = dayStr === todayStr ? t("today") : t("tomorrow");
        out.push({
            id: `trip-${tr.id}`,
            group: "trips",
            message: `${label} ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fmtTime"])(tr.startAt, lang)} — ${v?.name} · ${tr.from} → ${tr.to}`,
            tone: tr.status === "running" ? "warning" : dayStr === todayStr ? "warning" : "info",
            sortKey: dayStr === todayStr ? 400 : 450 + (+d - Date.now()) / 60000
        });
    }
    return out.sort((a, b)=>a.sortKey - b.sortKey);
}
_s4(useReminders, "S5d7BpFmEa9s2gperdoCSzfQ90Y=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useApp"],
        useDocTypeLabel,
        useMaintItemLabel,
        useMaintStatus
    ];
});
function toBn(n, lang) {
    return lang === "bn" ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toBnDigits"])(n) : String(n);
}
function fmtDateShort(iso) {
    const d = new Date(iso);
    const locale = "bn-BD";
    return new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short"
    }).format(d);
}
function useDashboardStats() {
    _s5();
    const { data } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useApp"])();
    const vehicles = data.vehicles;
    const todayStr = new Date().toDateString();
    const todayTrips = data.trips.filter((t)=>new Date(t.startAt).toDateString() === todayStr && (t.status === "confirmed" || t.status === "running"));
    const upcoming = data.trips.filter((t)=>new Date(t.startAt) > new Date() && t.status === "confirmed").sort((a, b)=>+new Date(a.startAt) - +new Date(b.startAt)).slice(0, 5);
    return {
        total: vehicles.length,
        available: vehicles.filter((v)=>v.status === "available").length,
        onTrip: vehicles.filter((v)=>v.status === "on_trip").length,
        inMaintenance: vehicles.filter((v)=>v.status === "maintenance").length,
        monthIncome: data.monthStats.income,
        monthExpense: data.monthStats.expense,
        net: data.monthStats.income - data.monthStats.expense,
        totalDue: data.customers.reduce((s, c)=>s + c.due, 0),
        todayIncome: data.todayIncome,
        todayTrips,
        upcomingTrips: upcoming
    };
}
_s5(useDashboardStats, "5Wev5TA1wtoXu+NQkHiFyGgLqoE=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useApp"]
    ];
});
function useMileageWarnings() {
    _s6();
    const { data, t } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useApp"])();
    return data.vehicles.filter((v)=>v.mileagePrev > 0 && v.mileage < v.mileagePrev * 0.9).map((v)=>`${v.name}: ${t("fuelEffDropped")}`);
}
_s6(useMileageWarnings, "q3mGn/XCKLmCsuCb8tuIJOh471s=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useApp"]
    ];
});
const GROUP_TITLES = {
    own: "groupOwn",
    documents: "groupDocuments",
    maintenance: "groupMaintenance",
    payments: "groupPayments",
    trips: "groupTrips"
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/install-prompt.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "initInstallPrompt",
    ()=>initInstallPrompt,
    "useInstallPrompt",
    ()=>useInstallPrompt
]);
/**
 * PWA install prompt (Phase "install UX"):
 * - Captures Chrome/Edge Android+Desktop `beforeinstallprompt` so the app can
 *   show its OWN Bangla install UI (the native mini-infobar is suppressed).
 * - iOS Safari never fires that event → the settings row + banner open the
 *   3-step "Add to Home Screen" guide instead.
 * - Dismissal is remembered in localStorage until the app is actually installed.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
"use client";
;
const DISMISS_KEY = "gk-install-dismissed";
let deferredPrompt = null;
function readDismissed() {
    try {
        return window.localStorage.getItem(DISMISS_KEY) === "1";
    } catch  {
        return false;
    }
}
function isStandalone() {
    return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
const useInstallPrompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])()((set, get)=>({
        canInstall: false,
        standalone: false,
        isIOS: false,
        dismissed: false,
        instructionsOpen: false,
        capture: (e)=>{
            e.preventDefault(); // suppress the browser's own mini-infobar
            deferredPrompt = e;
            set({
                canInstall: true
            });
        },
        promptInstall: async ()=>{
            if (!deferredPrompt) {
                get().openInstructions();
                return;
            }
            try {
                await deferredPrompt.prompt();
                const choice = await deferredPrompt.userChoice;
                if (choice.outcome === "accepted") set({
                    canInstall: false,
                    standalone: true
                });
                else set({
                    dismissed: true
                });
            } catch  {
                /* browser refused — fall back to the guide */ get().openInstructions();
            } finally{
                deferredPrompt = null;
            }
        },
        openInstructions: ()=>set({
                instructionsOpen: true
            }),
        closeInstructions: ()=>set({
                instructionsOpen: false
            }),
        dismiss: ()=>{
            try {
                window.localStorage.setItem(DISMISS_KEY, "1");
            } catch  {}
            set({
                dismissed: true
            });
        }
    }));
function initInstallPrompt() {
    const store = useInstallPrompt.getState();
    useInstallPrompt.setState({
        standalone: isStandalone(),
        isIOS: /iphone|ipad|ipod/i.test(window.navigator.userAgent),
        dismissed: readDismissed()
    });
    window.addEventListener("beforeinstallprompt", store.capture);
    window.addEventListener("appinstalled", ()=>{
        useInstallPrompt.setState({
            canInstall: false,
            standalone: true
        });
    });
    return ()=>window.removeEventListener("beforeinstallprompt", store.capture);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/lucide-compat.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ArrowLeft",
    ()=>ArrowLeft,
    "ArrowLeftIcon",
    ()=>ArrowLeftIcon,
    "ArrowRight",
    ()=>ArrowRight,
    "ArrowRightIcon",
    ()=>ArrowRightIcon,
    "Ban",
    ()=>Ban,
    "BanIcon",
    ()=>BanIcon,
    "Banknote",
    ()=>Banknote,
    "BanknoteIcon",
    ()=>BanknoteIcon,
    "BarChart3",
    ()=>BarChart3,
    "BarChart3Icon",
    ()=>BarChart3Icon,
    "Bell",
    ()=>Bell,
    "BellIcon",
    ()=>BellIcon,
    "BellRing",
    ()=>BellRing,
    "BellRingIcon",
    ()=>BellRingIcon,
    "BookOpen",
    ()=>BookOpen,
    "BookOpenIcon",
    ()=>BookOpenIcon,
    "Briefcase",
    ()=>Briefcase,
    "BriefcaseIcon",
    ()=>BriefcaseIcon,
    "Build",
    ()=>Build,
    "BuildIcon",
    ()=>BuildIcon,
    "CalendarClock",
    ()=>CalendarClock,
    "CalendarClockIcon",
    ()=>CalendarClockIcon,
    "CalendarDays",
    ()=>CalendarDays,
    "CalendarDaysIcon",
    ()=>CalendarDaysIcon,
    "Car",
    ()=>Car,
    "CarFront",
    ()=>CarFront,
    "CarFrontIcon",
    ()=>CarFrontIcon,
    "CarIcon",
    ()=>CarIcon,
    "Check",
    ()=>Check,
    "CheckCircle2",
    ()=>CheckCircle2,
    "CheckCircle2Icon",
    ()=>CheckCircle2Icon,
    "CheckIcon",
    ()=>CheckIcon,
    "CheckSquare",
    ()=>CheckSquare,
    "CheckSquareIcon",
    ()=>CheckSquareIcon,
    "ChevronDown",
    ()=>ChevronDown,
    "ChevronDownIcon",
    ()=>ChevronDownIcon,
    "ChevronLeft",
    ()=>ChevronLeft,
    "ChevronLeftIcon",
    ()=>ChevronLeftIcon,
    "ChevronRight",
    ()=>ChevronRight,
    "ChevronRightIcon",
    ()=>ChevronRightIcon,
    "ChevronUp",
    ()=>ChevronUp,
    "ChevronUpIcon",
    ()=>ChevronUpIcon,
    "Circle",
    ()=>Circle,
    "CircleAlert",
    ()=>CircleAlert,
    "CircleAlertIcon",
    ()=>CircleAlertIcon,
    "CircleCheck",
    ()=>CircleCheck,
    "CircleCheckIcon",
    ()=>CircleCheckIcon,
    "CircleIcon",
    ()=>CircleIcon,
    "ClipboardList",
    ()=>ClipboardList,
    "ClipboardListIcon",
    ()=>ClipboardListIcon,
    "Clock",
    ()=>Clock,
    "ClockIcon",
    ()=>ClockIcon,
    "Crown",
    ()=>Crown,
    "CrownIcon",
    ()=>CrownIcon,
    "Database",
    ()=>Database,
    "DatabaseIcon",
    ()=>DatabaseIcon,
    "Delete",
    ()=>Delete,
    "DeleteIcon",
    ()=>DeleteIcon,
    "Download",
    ()=>Download,
    "DownloadIcon",
    ()=>DownloadIcon,
    "Droplets",
    ()=>Droplets,
    "DropletsIcon",
    ()=>DropletsIcon,
    "Edit",
    ()=>Edit,
    "EditIcon",
    ()=>EditIcon,
    "Eye",
    ()=>Eye,
    "EyeIcon",
    ()=>EyeIcon,
    "FileDown",
    ()=>FileDown,
    "FileDownIcon",
    ()=>FileDownIcon,
    "FileSpreadsheet",
    ()=>FileSpreadsheet,
    "FileSpreadsheetIcon",
    ()=>FileSpreadsheetIcon,
    "FileText",
    ()=>FileText,
    "FileTextIcon",
    ()=>FileTextIcon,
    "Fuel",
    ()=>Fuel,
    "FuelIcon",
    ()=>FuelIcon,
    "Gauge",
    ()=>Gauge,
    "GaugeIcon",
    ()=>GaugeIcon,
    "GripVertical",
    ()=>GripVertical,
    "GripVerticalIcon",
    ()=>GripVerticalIcon,
    "Home",
    ()=>Home,
    "HomeIcon",
    ()=>HomeIcon,
    "IdCard",
    ()=>IdCard,
    "IdCardIcon",
    ()=>IdCardIcon,
    "Info",
    ()=>Info,
    "InfoIcon",
    ()=>InfoIcon,
    "KeyRound",
    ()=>KeyRound,
    "KeyRoundIcon",
    ()=>KeyRoundIcon,
    "Languages",
    ()=>Languages,
    "LanguagesIcon",
    ()=>LanguagesIcon,
    "LayoutGrid",
    ()=>LayoutGrid,
    "LayoutGridIcon",
    ()=>LayoutGridIcon,
    "List",
    ()=>List,
    "ListChecks",
    ()=>ListChecks,
    "ListChecksIcon",
    ()=>ListChecksIcon,
    "ListIcon",
    ()=>ListIcon,
    "Loader2",
    ()=>Loader2,
    "Loader2Icon",
    ()=>Loader2Icon,
    "Lock",
    ()=>Lock,
    "LockIcon",
    ()=>LockIcon,
    "LogIn",
    ()=>LogIn,
    "LogInIcon",
    ()=>LogInIcon,
    "LogOut",
    ()=>LogOut,
    "LogOutIcon",
    ()=>LogOutIcon,
    "Mail",
    ()=>Mail,
    "MailIcon",
    ()=>MailIcon,
    "MapPin",
    ()=>MapPin,
    "MapPinIcon",
    ()=>MapPinIcon,
    "MessageCircle",
    ()=>MessageCircle,
    "MessageCircleIcon",
    ()=>MessageCircleIcon,
    "Minus",
    ()=>Minus,
    "MinusIcon",
    ()=>MinusIcon,
    "Moon",
    ()=>Moon,
    "MoonIcon",
    ()=>MoonIcon,
    "MoreHorizontal",
    ()=>MoreHorizontal,
    "MoreHorizontalIcon",
    ()=>MoreHorizontalIcon,
    "Palette",
    ()=>Palette,
    "PaletteIcon",
    ()=>PaletteIcon,
    "PanelLeft",
    ()=>PanelLeft,
    "PanelLeftIcon",
    ()=>PanelLeftIcon,
    "Pencil",
    ()=>Pencil,
    "PencilIcon",
    ()=>PencilIcon,
    "Phone",
    ()=>Phone,
    "PhoneIcon",
    ()=>PhoneIcon,
    "Play",
    ()=>Play,
    "PlayCircle",
    ()=>PlayCircle,
    "PlayCircleIcon",
    ()=>PlayCircleIcon,
    "PlayIcon",
    ()=>PlayIcon,
    "Plus",
    ()=>Plus,
    "PlusIcon",
    ()=>PlusIcon,
    "PlusSquare",
    ()=>PlusSquare,
    "PlusSquareIcon",
    ()=>PlusSquareIcon,
    "Printer",
    ()=>Printer,
    "PrinterIcon",
    ()=>PrinterIcon,
    "Receipt",
    ()=>Receipt,
    "ReceiptIcon",
    ()=>ReceiptIcon,
    "RefreshCcw",
    ()=>RefreshCcw,
    "RefreshCcwIcon",
    ()=>RefreshCcwIcon,
    "Route",
    ()=>Route,
    "RouteIcon",
    ()=>RouteIcon,
    "Search",
    ()=>Search,
    "SearchIcon",
    ()=>SearchIcon,
    "SendHorizonal",
    ()=>SendHorizonal,
    "SendHorizonalIcon",
    ()=>SendHorizonalIcon,
    "Share",
    ()=>Share,
    "ShareIcon",
    ()=>ShareIcon,
    "ShieldCheck",
    ()=>ShieldCheck,
    "ShieldCheckIcon",
    ()=>ShieldCheckIcon,
    "Smartphone",
    ()=>Smartphone,
    "SmartphoneIcon",
    ()=>SmartphoneIcon,
    "Store",
    ()=>Store,
    "StoreIcon",
    ()=>StoreIcon,
    "Sun",
    ()=>Sun,
    "SunIcon",
    ()=>SunIcon,
    "Trash2",
    ()=>Trash2,
    "Trash2Icon",
    ()=>Trash2Icon,
    "TrendingDown",
    ()=>TrendingDown,
    "TrendingDownIcon",
    ()=>TrendingDownIcon,
    "TrendingUp",
    ()=>TrendingUp,
    "TrendingUpIcon",
    ()=>TrendingUpIcon,
    "TriangleAlert",
    ()=>TriangleAlert,
    "TriangleAlertIcon",
    ()=>TriangleAlertIcon,
    "User",
    ()=>User,
    "UserIcon",
    ()=>UserIcon,
    "UserPlus",
    ()=>UserPlus,
    "UserPlusIcon",
    ()=>UserPlusIcon,
    "UserRound",
    ()=>UserRound,
    "UserRoundIcon",
    ()=>UserRoundIcon,
    "UserRoundPlus",
    ()=>UserRoundPlus,
    "UserRoundPlusIcon",
    ()=>UserRoundPlusIcon,
    "Users",
    ()=>Users,
    "UsersIcon",
    ()=>UsersIcon,
    "Wallet",
    ()=>Wallet,
    "WalletIcon",
    ()=>WalletIcon,
    "WifiOff",
    ()=>WifiOff,
    "WifiOffIcon",
    ()=>WifiOffIcon,
    "Wrench",
    ()=>Wrench,
    "WrenchIcon",
    ()=>WrenchIcon,
    "X",
    ()=>X,
    "XIcon",
    ()=>XIcon
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
;
/* size-4 → 16px, size-4.5 → 18px, size-[20px] → 20px … (n × 4px) */ function parseSizeClass(className) {
    if (!className) return undefined;
    const arb = /size-\[([0-9.]+)px\]/.exec(className);
    if (arb) return Number(arb[1]);
    const m = /(?:^|\s)size-([0-9]+(?:\.[0-9]+)?)(?=\s|$)/.exec(className);
    if (m) return Math.round(Number(m[1]) * 4 * 100) / 100;
    return undefined;
}
function toPx(size) {
    const n = typeof size === "number" ? size : Number.parseFloat(size);
    return Number.isFinite(n) ? n : undefined;
}
function weightFor(strokeWidth) {
    const sw = typeof strokeWidth === "number" ? strokeWidth : Number.parseFloat(String(strokeWidth ?? ""));
    if (Number.isFinite(sw) && sw >= 2.6) return 600;
    if (Number.isFinite(sw) && sw >= 2.1) return 500;
    return 400;
}
function createIcon(name) {
    function CompatIcon({ className, strokeWidth, size, style, ...rest }) {
        const px = size != null ? toPx(size) : parseSizeClass(className);
        const wght = weightFor(strokeWidth);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            "aria-hidden": "true",
            translate: "no",
            "data-icon": name,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("ms-icon", className),
            style: {
                ...px !== undefined ? {
                    fontSize: `${px}px`
                } : null,
                fontVariationSettings: `'FILL' 0, 'wght' ${wght}, 'GRAD' 0, 'opsz' 24`,
                ...style
            },
            ...rest
        }, void 0, false, {
            fileName: "[project]/src/lib/lucide-compat.tsx",
            lineNumber: 63,
            columnNumber: 7
        }, this);
    }
    CompatIcon.displayName = `Material(${name})`;
    return CompatIcon;
}
/* ---------------- the lucide-react surface, remapped ---------------- */ const MAP = {
    ArrowLeft: "arrow_back",
    ArrowRight: "arrow_forward",
    Banknote: "payments",
    BarChart3: "bar_chart",
    Bell: "notifications",
    BellRing: "notifications_active",
    BookOpen: "menu_book",
    Briefcase: "work",
    Build: "build",
    CalendarClock: "calendar_clock",
    CalendarDays: "calendar_month",
    Car: "directions_car",
    CarFront: "directions_car",
    Check: "check",
    CheckCircle2: "check_circle",
    CheckSquare: "check_box",
    ChevronDown: "expand_more",
    ChevronLeft: "chevron_left",
    ChevronRight: "chevron_right",
    ChevronUp: "expand_less",
    Circle: "circle",
    CircleAlert: "error",
    CircleCheck: "check_circle",
    ClipboardList: "assignment",
    Clock: "schedule",
    Crown: "workspace_premium",
    Delete: "delete",
    Download: "download",
    Droplets: "water_drop",
    Edit: "edit",
    Eye: "visibility",
    FileDown: "file_download",
    FileSpreadsheet: "table_chart",
    FileText: "description",
    Fuel: "local_gas_station",
    Gauge: "speed",
    GripVertical: "drag_indicator",
    Home: "home",
    IdCard: "badge",
    Info: "info",
    Database: "database",
    KeyRound: "key",
    Lock: "lock",
    Languages: "translate",
    LayoutGrid: "grid_view",
    List: "list",
    ListChecks: "checklist",
    Loader2: "progress_activity",
    LogIn: "login",
    LogOut: "logout",
    Mail: "mail",
    MapPin: "location_on",
    MessageCircle: "chat_bubble",
    Moon: "dark_mode",
    MoreHorizontal: "more_horiz",
    Pencil: "edit",
    Phone: "call",
    Play: "play_arrow",
    PlayCircle: "play_circle",
    Plus: "add",
    PlusSquare: "add_box",
    Printer: "print",
    Receipt: "receipt_long",
    RefreshCcw: "refresh",
    Route: "route",
    Search: "search",
    SendHorizonal: "send",
    Share: "share",
    ShieldCheck: "shield",
    Smartphone: "smartphone",
    Store: "storefront",
    Sun: "light_mode",
    Trash2: "delete",
    TrendingDown: "trending_down",
    TrendingUp: "trending_up",
    TriangleAlert: "warning",
    User: "person",
    UserPlus: "person_add",
    UserRound: "person",
    UserRoundPlus: "person_add",
    Users: "group",
    Wallet: "account_balance_wallet",
    Wrench: "build",
    X: "close",
    Ban: "block",
    WifiOff: "wifi_off"
};
const ArrowLeft = createIcon(MAP.ArrowLeft);
const ArrowLeftIcon = ArrowLeft;
const Banknote = createIcon(MAP.Banknote);
const BanknoteIcon = Banknote;
const BarChart3 = createIcon(MAP.BarChart3);
const BarChart3Icon = BarChart3;
const Bell = createIcon(MAP.Bell);
const BellIcon = Bell;
const BellRing = createIcon(MAP.BellRing);
const BellRingIcon = BellRing;
const BookOpen = createIcon(MAP.BookOpen);
const BookOpenIcon = BookOpen;
const Briefcase = createIcon(MAP.Briefcase);
const BriefcaseIcon = Briefcase;
const Build = createIcon(MAP.Build);
const BuildIcon = Build;
const CalendarClock = createIcon(MAP.CalendarClock);
const CalendarClockIcon = CalendarClock;
const CalendarDays = createIcon(MAP.CalendarDays);
const CalendarDaysIcon = CalendarDays;
const Car = createIcon(MAP.Car);
const CarIcon = Car;
const CarFront = createIcon(MAP.CarFront);
const CarFrontIcon = CarFront;
const Check = createIcon(MAP.Check);
const CheckIcon = Check;
const CheckCircle2 = createIcon(MAP.CheckCircle2);
const CheckCircle2Icon = CheckCircle2;
const CheckSquare = createIcon(MAP.CheckSquare);
const CheckSquareIcon = CheckSquare;
const ChevronDown = createIcon(MAP.ChevronDown);
const ChevronDownIcon = ChevronDown;
const ChevronLeft = createIcon(MAP.ChevronLeft);
const ChevronLeftIcon = ChevronLeft;
const ChevronRight = createIcon(MAP.ChevronRight);
const ChevronRightIcon = ChevronRight;
const ChevronUp = createIcon(MAP.ChevronUp);
const ChevronUpIcon = ChevronUp;
const Circle = createIcon(MAP.Circle);
const CircleIcon = Circle;
const CircleAlert = createIcon(MAP.CircleAlert);
const CircleAlertIcon = CircleAlert;
const CircleCheck = createIcon(MAP.CircleCheck);
const CircleCheckIcon = CircleCheck;
const ClipboardList = createIcon(MAP.ClipboardList);
const ClipboardListIcon = ClipboardList;
const Clock = createIcon(MAP.Clock);
const ClockIcon = Clock;
const Crown = createIcon(MAP.Crown);
const CrownIcon = Crown;
const Delete = createIcon(MAP.Delete);
const DeleteIcon = Delete;
const Download = createIcon(MAP.Download);
const DownloadIcon = Download;
const Droplets = createIcon(MAP.Droplets);
const DropletsIcon = Droplets;
const Edit = createIcon(MAP.Edit);
const EditIcon = Edit;
const Eye = createIcon(MAP.Eye);
const EyeIcon = Eye;
const FileDown = createIcon(MAP.FileDown);
const FileDownIcon = FileDown;
const FileSpreadsheet = createIcon(MAP.FileSpreadsheet);
const FileSpreadsheetIcon = FileSpreadsheet;
const FileText = createIcon(MAP.FileText);
const FileTextIcon = FileText;
const Fuel = createIcon(MAP.Fuel);
const FuelIcon = Fuel;
const Gauge = createIcon(MAP.Gauge);
const GaugeIcon = Gauge;
const GripVertical = createIcon(MAP.GripVertical);
const GripVerticalIcon = GripVertical;
const Home = createIcon(MAP.Home);
const HomeIcon = Home;
const IdCard = createIcon(MAP.IdCard);
const IdCardIcon = IdCard;
const Info = createIcon(MAP.Info);
const InfoIcon = Info;
const Database = createIcon(MAP.Database);
const DatabaseIcon = Database;
const KeyRound = createIcon(MAP.KeyRound);
const KeyRoundIcon = KeyRound;
const Languages = createIcon(MAP.Languages);
const LanguagesIcon = Languages;
const LayoutGrid = createIcon(MAP.LayoutGrid);
const LayoutGridIcon = LayoutGrid;
const List = createIcon(MAP.List);
const ListIcon = List;
const ListChecks = createIcon(MAP.ListChecks);
const ListChecksIcon = ListChecks;
const Loader2 = createIcon(MAP.Loader2);
const Loader2Icon = Loader2;
const LogIn = createIcon(MAP.LogIn);
const LogInIcon = LogIn;
const LogOut = createIcon(MAP.LogOut);
const LogOutIcon = LogOut;
const Mail = createIcon(MAP.Mail);
const MailIcon = Mail;
const MapPin = createIcon(MAP.MapPin);
const MapPinIcon = MapPin;
const MessageCircle = createIcon(MAP.MessageCircle);
const MessageCircleIcon = MessageCircle;
const Moon = createIcon(MAP.Moon);
const MoonIcon = Moon;
const MoreHorizontal = createIcon(MAP.MoreHorizontal);
const MoreHorizontalIcon = MoreHorizontal;
const Pencil = createIcon(MAP.Pencil);
const PencilIcon = Pencil;
const Phone = createIcon(MAP.Phone);
const PhoneIcon = Phone;
const Play = createIcon(MAP.Play);
const PlayIcon = Play;
const PlayCircle = createIcon(MAP.PlayCircle);
const PlayCircleIcon = PlayCircle;
const Plus = createIcon(MAP.Plus);
const PlusIcon = Plus;
const PlusSquare = createIcon(MAP.PlusSquare);
const PlusSquareIcon = PlusSquare;
const Printer = createIcon(MAP.Printer);
const PrinterIcon = Printer;
const Receipt = createIcon(MAP.Receipt);
const ReceiptIcon = Receipt;
const RefreshCcw = createIcon(MAP.RefreshCcw);
const RefreshCcwIcon = RefreshCcw;
const Lock = createIcon(MAP.Lock);
const LockIcon = Lock;
const Route = createIcon(MAP.Route);
const RouteIcon = Route;
const Search = createIcon(MAP.Search);
const SearchIcon = Search;
const SendHorizonal = createIcon(MAP.SendHorizonal);
const SendHorizonalIcon = SendHorizonal;
const Share = createIcon(MAP.Share);
const ShareIcon = Share;
const ShieldCheck = createIcon(MAP.ShieldCheck);
const ShieldCheckIcon = ShieldCheck;
const Smartphone = createIcon(MAP.Smartphone);
const SmartphoneIcon = Smartphone;
const Store = createIcon(MAP.Store);
const StoreIcon = Store;
const Sun = createIcon(MAP.Sun);
const SunIcon = Sun;
const Trash2 = createIcon(MAP.Trash2);
const Trash2Icon = Trash2;
const TrendingDown = createIcon(MAP.TrendingDown);
const TrendingDownIcon = TrendingDown;
const TrendingUp = createIcon(MAP.TrendingUp);
const TrendingUpIcon = TrendingUp;
const TriangleAlert = createIcon(MAP.TriangleAlert);
const TriangleAlertIcon = TriangleAlert;
const User = createIcon(MAP.User);
const UserIcon = User;
const UserPlus = createIcon(MAP.UserPlus);
const UserPlusIcon = UserPlus;
const UserRound = createIcon(MAP.UserRound);
const UserRoundIcon = UserRound;
const UserRoundPlus = createIcon(MAP.UserRoundPlus);
const UserRoundPlusIcon = UserRoundPlus;
const Users = createIcon(MAP.Users);
const UsersIcon = Users;
const Wallet = createIcon(MAP.Wallet);
const WalletIcon = Wallet;
const Wrench = createIcon(MAP.Wrench);
const WrenchIcon = Wrench;
const X = createIcon(MAP.X);
const XIcon = X;
const Ban = createIcon(MAP.Ban);
const BanIcon = Ban;
const WifiOff = createIcon(MAP.WifiOff);
const WifiOffIcon = WifiOff;
const ArrowRight = createIcon(MAP.ArrowRight);
const ArrowRightIcon = ArrowRight;
const Minus = createIcon("remove");
const MinusIcon = Minus;
const Palette = createIcon("palette");
const PaletteIcon = Palette;
const PanelLeft = createIcon("menu_open");
const PanelLeftIcon = PanelLeft;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/nav.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BOTTOM_NAV",
    ()=>BOTTOM_NAV,
    "GROUP_LABELS",
    ()=>GROUP_LABELS,
    "MODULES",
    ()=>MODULES,
    "getModule",
    ()=>getModule
]);
const MODULES = [
    {
        id: "dashboard",
        icon: "space_dashboard",
        labelKey: "navHome",
        group: "main"
    },
    {
        id: "trips",
        icon: "route",
        labelKey: "navTrips",
        group: "work"
    },
    {
        id: "quotations",
        icon: "request_quote",
        labelKey: "navQuotations",
        group: "work"
    },
    {
        id: "vehicles",
        icon: "directions_car",
        labelKey: "navVehicles",
        group: "work"
    },
    {
        id: "customers",
        icon: "group",
        labelKey: "navCustomers",
        group: "work"
    },
    {
        id: "drivers",
        icon: "person",
        labelKey: "navDrivers",
        group: "work"
    },
    {
        id: "finance",
        icon: "account_balance_wallet",
        labelKey: "navFinance",
        group: "money"
    },
    {
        id: "fuel",
        icon: "local_gas_station",
        labelKey: "navFuel",
        group: "money"
    },
    {
        id: "maintenance",
        icon: "build",
        labelKey: "navMaintenance",
        group: "money"
    },
    {
        id: "documents",
        icon: "description",
        labelKey: "navDocuments",
        group: "records"
    },
    {
        id: "reminders",
        icon: "notifications",
        labelKey: "navReminders",
        group: "records"
    },
    {
        id: "reports",
        icon: "monitoring",
        labelKey: "navReports",
        group: "records"
    },
    {
        id: "guide",
        icon: "menu_book",
        labelKey: "navGuide",
        group: "records"
    },
    {
        id: "settings",
        icon: "settings",
        labelKey: "navSettings",
        group: "records"
    }
];
const BOTTOM_NAV = MODULES.filter(_c = (m)=>[
        "dashboard",
        "trips",
        "vehicles"
    ].includes(m.id));
_c1 = BOTTOM_NAV;
const GROUP_LABELS = {
    main: null,
    work: null,
    money: null,
    records: null
};
function getModule(id) {
    return MODULES.find((m)=>m.id === id) ?? MODULES[0];
}
var _c, _c1;
__turbopack_context__.k.register(_c, "BOTTOM_NAV$MODULES.filter");
__turbopack_context__.k.register(_c1, "BOTTOM_NAV");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/share.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * WhatsApp sharing (Phase 14, lite — no API, just wa.me deep links).
 *
 * Opens WhatsApp with a pre-written Bangla summary; when the customer's phone
 * is known, the chat is pre-addressed (BD numbers: 01XXXXXXXXX → 8801XXXXXXXXX).
 * Everything is built client-side — no credentials, no server round-trip.
 */ __turbopack_context__.s([
    "buildInvoiceMessage",
    ()=>buildInvoiceMessage,
    "buildQuoteMessage",
    ()=>buildQuoteMessage,
    "openWhatsApp",
    ()=>openWhatsApp,
    "waPhone",
    ()=>waPhone
]);
function waPhone(phone) {
    if (!phone) return null;
    const digits = phone.replace(/[^\d]/g, "");
    if (digits.length < 10) return null;
    if (digits.startsWith("880")) return digits;
    if (digits.startsWith("0")) return `88${digits}`;
    if (digits.startsWith("1")) return `880${digits}`;
    return null;
}
function buildInvoiceMessage(input, lang) {
    const { trip, customer, business, paymentsTotal, vehicleName } = input;
    const due = Math.max(0, trip.due);
    const money = (n)=>`৳${new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-IN").format(n)}`;
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
            "— sent from GarirKhata"
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
        "— গাড়িখাতা অ্যাপ থেকে পাঠানো"
    ].filter(Boolean).join("\n");
}
function openWhatsApp(message, phone) {
    const number = waPhone(phone);
    const url = number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener");
}
function buildQuoteMessage(input, lang) {
    const { quote, customer, business, vehicleName } = input;
    const money = (n)=>`৳${new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-IN").format(n)}`;
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
            "— sent from GarirKhata"
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
        "— গাড়িখাতা অ্যাপ থেকে পাঠানো"
    ].filter(Boolean).join("\n");
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/types.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * DOMAIN TYPES — shared app-wide (client + server).
 * Mirrors the Prisma schema / supabase/migrations/0001_schema.sql.
 * Dates are ISO strings; money is whole Taka (Int).
 */ __turbopack_context__.s([
    "FUEL_TYPES",
    ()=>FUEL_TYPES,
    "daysUntil",
    ()=>daysUntil,
    "parseFuelTypes",
    ()=>parseFuelTypes
]);
const FUEL_TYPES = [
    "diesel",
    "petrol",
    "cng"
];
function parseFuelTypes(raw) {
    const list = (raw ?? "").split(",").map((s)=>s.trim()).filter((s)=>FUEL_TYPES.includes(s));
    return list.length ? list : [
        "diesel"
    ];
}
/* ---------- helpers ---------- */ const now = ()=>new Date();
function daysUntil(iso) {
    const diff = new Date(iso).getTime() - now().getTime();
    return Math.ceil(diff / 86400000);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/version.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * App version — single source of truth for every place the version is shown
 * (login badge, settings about card). Bump with each release.
 */ __turbopack_context__.s([
    "APP_VERSION",
    ()=>APP_VERSION
]);
const APP_VERSION = "1.0.1";
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_lib_1d7b6vf._.js.map