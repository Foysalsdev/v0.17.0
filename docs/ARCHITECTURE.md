# Architecture — গাড়িখাতা (GarirKhata)

> Companion to `PROJECT_CONTEXT.md` (the source of truth). This document explains **how**
> the system is built and why.

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT (PWA)                                                    │
│  Next.js 16 · TypeScript · Tailwind 4 · shadcn/ui · Zustand      │
│  Bangla-first i18n · Service Worker · Installable                │
│  deployed on Cloudflare Pages (CDN edge, global)                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS (fetch / realtime)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  SUPABASE (backend)                                              │
│  ├─ Auth (email/phone + OTP)                                     │
│  ├─ PostgreSQL + Row Level Security (tenant isolation)           │
│  ├─ Storage (vehicle photos, documents, receipts)                │
│  ├─ Realtime (dashboard live updates)                            │
│  └─ Edge Functions (WhatsApp API, PDF, scheduled reminder jobs)  │
└─────────────────────────────────────────────────────────────────┘
```

**Zero privileged keys in the client.** The frontend only ever holds the `anon` key —
all authorization is enforced by RLS at the database. Server-only work (WhatsApp,
PDF generation, scheduled jobs) runs in Edge Functions with secrets stored in Supabase.

## 2. Frontend Structure

```
src/
├─ app/
│  ├─ layout.tsx            # fonts, PWA metadata, theme, toaster
│  ├─ page.tsx              # entry: login → driver mode | owner shell
│  └─ globals.css           # design tokens (emerald), safe-area, Bengali font
├─ store.ts                 # Zustand: language, view, session, demo data + actions
├─ lib/
│  ├─ i18n.ts               # bn (source of truth) + en dictionary
│  ├─ demo-data.ts          # typed demo dataset (mirrors Supabase schema)
│  ├─ format.ts             # ৳ money, Bengali digits, bn-BD dates
│  ├─ nav.ts                # module registry (order = business order)
│  └─ insights.tsx          # derived selectors: dashboard stats, reminders
├─ components/
│  ├─ app/                  # shell: top bar, bottom nav, sidebar, search,
│  │                        # quick actions, form sheets, PWA runtime
│  ├─ views/                # one file per module (dashboard, trips, …)
│  └─ shared/ui-bits.tsx    # StatCard, StatusBadge, EmptyState…
└─ public/                  # manifest, sw.js, icons, Bengali font
```

**Why one page?** The product must feel like an installed app, not a website: instant view
switching, no full page loads, offline-friendly shell. Deep links and more routes arrive
with Phase 2+ as modules gain shareable URLs (quotations, invoices, public listings).

## 3. Data Layer Strategy (demo → production)

| Phase | Source | Notes |
|-------|--------|-------|
| 0 (now) | `demo-data.ts` in-memory | UI/UX approval, architecture review |
| 1+ | Supabase client (SSR-aware) | same TypeScript types, real RLS |

The demo types (`Vehicle`, `Trip`, `FuelEntry`…) intentionally match the SQL schema
field-for-field, so swapping the data source does not change the components.

## 4. Tenant & Security Model

1. **Identity:** Supabase Auth. A user may belong to several businesses.
2. **Membership:** `business_members (business_id, user_id, role, status)`.
3. **Isolation:** every business table has `business_id` + RLS policy
   `using (is_business_member(business_id))`. Even a buggy query cannot cross tenants.
4. **Roles:** owner / manager / staff / driver / accountant — enforced in policies
   (`user_role_in`, `can_manage_records`), not by hiding UI.
5. **Audit:** triggers write `audit_logs` for vehicles, trips, payments.

### Double booking (guaranteed)

```sql
exclude using gist (vehicle_id with =, tstzrange(start_at, end_at) with &&)
where (status in ('confirmed','running'))
```

The UI also checks first (friendly Bangla message), but the database is the final guard.

## 5. PWA & Offline Strategy

- **Installable:** manifest + icons + service worker registration on load.
- **Service worker policy (conservative):**
  - fonts/icons → cache-first (immutable);
  - everything else → network-first with cache fallback (never serves stale HTML when online;
    safe even in dev).
- **Offline banner** (§50/51): "ইন্টারনেট নেই — কানেকশন ফিরলে সব ঠিক হয়ে যাবে".
- **Phase 2+:** draft queue for offline entries with unique client IDs (idempotent upsert)
  to prevent duplicate submissions on flaky networks.

## 6. Performance

- Client-side view switching (no route round-trips).
- Data fetching in production uses pagination (list endpoints page by date) — never full tables.
- Self-hosted variable font (single file, all weights, swap display).
- Charts: one lightweight bar chart (recharts) on the dashboard only.
- Realtime subscriptions scoped per tenant + per view (dashboard, reminders).

## 7. Deployment

| Environment | Frontend | Database |
|-------------|----------|----------|
| Development | local `next dev` | local Supabase CLI |
| Staging | Cloudflare Pages preview branch | Supabase staging project |
| Production | Cloudflare Pages (main) | Supabase production project |

Deploy gates (§68): build ✓ lint ✓ types ✓ migration check ✓ RLS test ✓ auth test ✓
mobile test ✓ empty/error state test ✓ permission test ✓.

## 8. Future Integration Points

- **WhatsApp Business API (Phase 14):** Edge Function `send-whatsapp`; templates for trip
  confirmation, reminders, quotations, invoices, receipts, payment nudges.
- **Web Push (Phase 13):** reminder engine → push subscription in `notifications`.
- **PDF (Phase 11):** server-rendered quotation/invoice/receipt (Edge Function or client
  print CSS — decision at Phase 11).
- **Reminder engine (Phase 9):** scheduled Edge Function scans documents/maintenance/payments
  and writes `reminders` rows (30/15/7/1-day + expired thresholds).
