# গাড়িখাতা (GarirKhata)

**Vehicle Rental, Fleet & Business Management SaaS for Bangladesh.**
গাড়ি ভাড়া ব্যবসার হিসাব — ট্রিপ, আয়-খরচ, তেল, সার্ভিস, কাগজপত্র ও রিমাইন্ডার, একটি সহজ অ্যাপে।

> **Status: v1.0.1 — FINAL, production-ready.** Dual-mode backend (SQLite local /
> Supabase cloud via RLS) · Bangla-first · Mobile-first · Installable PWA · Quotations → trips ·
> Premium invoices · CSV exports · password reset flow · settings business-profile editing ·
> **Admin panel (আসল অ্যাকাউন্ট-লগইন)**।
>
> **🚀 Production (GitHub → Cloudflare):** `docs/DEPLOY-CLOUDFLARE.md` ফলো করুন।
>
> **সেটআপ-এর একমাত্র ধাপ (Supabase):** এই ফোল্ডারের **`sql/v1.0-final-setup.sql`** —
> Supabase Dashboard → SQL Editor-এ পুরো ফাইল পেস্ট করে Run। একবারই লাগবে।
> এতে: signup ঠিক হবে · RLS হার্ডেনিং · ফোন-লগইন RPC · audit-fix · টেস্ট-ডেটা
> পরিষ্কার · **আপনার অ্যাকাউন্টে প্ল্যাটফর্ম-অ্যাডমিন ফ্ল্যাগ** (আসল ডেটা অক্ষত থাকবে)।

## 🔐 Admin Panel — আসল অ্যাডমিন কীভাবে খুলবেন

অ্যাপের কোনো মেনুতে নেই — ব্রাউজারে সরাসরি **`/admin`** URL খুলুন।

**প্রধান পথ (REAL):** "অ্যাকাউন্ট দিয়ে" ট্যাব → **আপনার ফোন ও পাসওয়ার্ড** (অ্যাপের
একই লগইন) → প্ল্যাটফর্মের সব ব্যবসা, ইউজার, গাড়ি, ট্রিপের আসল ক্লাউড হিসাব।
কোনো service key লাগে না — `platform_admin_overview()` RPC আপনার নিজের
লগইন-টোকেন দিয়ে যাচাই হয়। শর্ত একটাই: `sql/v1.0-final-setup.sql` চালানো থাকতে
হবে (E-২ ধাপে আপনার ফোনে `is_platform_admin = true` বসে যায়)।

**বিকল্প পথ:** "অ্যাডমিন কী" ট্যাব → সার্ভারের `GK_ADMIN_KEY` (Cloudflare secret)।
এই পথে cloud ডেটা দেখতে চাইলে `SUPABASE_SERVICE_ROLE` secret লাগবে।

**লগইন-এ দেখা বার্তাগুলো:**
- `অ্যাডমিন সেটআপ এখনো হয়নি` → SQL চালান এখনো হয়নি
- `এই অ্যাকাউন্ট প্ল্যাটফর্ম অ্যাডমিন নয়` → SQL-এর E-২-এ আপনার ফোন বসান
- ড্যাশবোর্ডে হলুদ ব্যানার = লোকাল ডেমো ডেটা দেখাচ্ছে; অ্যাকাউন্ট দিয়ে লগইন করলেই আসল ডেটা

## ফিচার হাইলাইট

| ফিচার | কোথায় |
-----|-------|
| **Bangla ⇄ English** | one-tap toggle in the top bar |
| **Dashboard** | fleet status, money today/this month, today's & upcoming trips, reminders |
| **+ Quick actions** | big center button → ট্রিপ / কোটেশন / আয় / খরচ / তেল |
| **Quotation → trip** | আরও → কোটেশন: create a price quote, print/share it, then ট্রিপ বানান in one tap |
| **Install the app** | dashboard banner / Settings → অ্যাপ ইনস্টল (Android prompt, iOS 3-step guide) |
| **Double-booking protection** | create a trip for a vehicle already booked at that time |
| **Vehicles → tap Hiace** | profile, documents, next service, per-vehicle profit |
| **পরের সার্ভিস** | see "Engine Oil … 400 KM বাকি" style reminders |
| **Driver Mode** | from the login screen — the ultra-simple driver view |
| **Problem Guide** | 8 common symptoms with "সম্ভাব্য কারণ" (educational, never a diagnosis) |

## Tech stack

Next.js 16 · TypeScript · Tailwind CSS 4 · shadcn/ui · Zustand · PWA (service worker + manifest) ·
**Supabase** (Postgres + Auth + RLS — production) · **Cloudflare Workers** (OpenNext hosting).

## Project structure

```
src/               app shell, views, i18n, store, domain types
prisma/            local dev database schema (SQLite)
supabase/          cloud database (Postgres schema + row-level security)
sql/               v1.0-final-setup.sql — Supabase একবারের সেটআপ
docs/              ARCHITECTURE.md + DEPLOY-CLOUDFLARE.md
public/            PWA manifest, service worker, Bengali font, icons
```

## Development

```bash
bun install        # install dependencies
bun run dev        # start dev server (http://localhost:3000)
bun run lint       # code quality check
```

## Production-এ যাওয়ার চেকলিস্ট

1. Supabase প্রজেক্ট → `sql/v1.0-final-setup.sql` চালান (schema + RLS + অ্যাডমিন ফ্ল্যাগ, এক ফাইলে)।
2. GitHub-এ repo push করুন → Cloudflare Workers Builds পথ দেখান
   `docs/DEPLOY-CLOUDFLARE.md` — secrets: `GK_ADMIN_KEY` (required),
   `SUPABASE_SERVICE_ROLE` (optional, key-মোডের জন্য)।
3. Supabase Auth → Site URL + redirect URLs-এ আপনার ডোমেইন যোগ করুন।
4. **কখনোই** আসল key বা service-role secret কোডে commit করবেন না —
   সব মান Cloudflare dashboard-এ থাকবে (`.env.example` দেখুন)।

## Rules everyone follows (from the master prompt)

- Inspect before modifying · smallest safe change · test after changing.
- Never break working features · never delete data · never bypass RLS · never expose secrets.
- Bangla-first simple wording (বাকি টাকা, গাড়ির KM, পরের সার্ভিস).
- Mobile UX first, touch targets ≥ 44px, no technical error messages.
