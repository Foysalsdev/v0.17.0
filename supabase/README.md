# Supabase Setup (non-technical guide)

This folder contains the **database blueprint** for গাড়িখাতা — the tables, security rules, and protections that will power the real app.

## What is here

| File | What it does |
|------|--------------|
| `migrations/0001_schema.sql` | Creates all tables (vehicles, trips, customers, drivers, fuel, service, money, documents…) |
| `migrations/0002_rls_policies.sql` | The security wall — each business can only see its own data |
| `migrations/0003_cloud_migration.sql` | (Optional) Demo business "রহিম ট্রাভেলস" + login users for testing |
| `migrations/0004_email_and_selfsignup.sql` | **v0.9.0 — REQUIRED** for email signup + Google login: `profiles.email` column, self-signup policy patch, old-account email backfill |

## How to apply (when we go live in Phase 1)

1. Create a free project at **supabase.com** (or app.supabase.com).
2. Open **SQL Editor → New query**.
3. Paste the full contents of `0001_schema.sql` → **Run**.
4. Paste the full contents of `0002_rls_policies.sql` → **Run**.
5. **Already have the project running?** Run `0004_email_and_selfsignup.sql` → **Run** — this fixes self-signup (নিজে অ্যাকাউন্ট খোলা) and adds the email column.
6. In **Project Settings → API**, copy:
   - Project URL
   - anon (public) key
   and give them to the developer — they go into environment variables, never into code.

## Google login চালু করা (v0.9.0)

1. **Authentication → Providers → Google → Enable**
   - Google Cloud Console-এ একটা OAuth Client বানাতে হবে (type: Web application)
   - Authorized redirect URI-তে বসান: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - সেখান থেকে Client ID + Client Secret নিয়ে Supabase-এ বসান
2. **Authentication → URL Configuration → Redirect URLs** → যোগ করুন:
   - `https://<আপনার-অ্যাপ-ডোমেইন>/auth/callback`
   - (localhost-এ টেস্ট করলে) `http://localhost:3000/auth/callback`
3. `.env.local`-এ `NEXT_PUBLIC_GK_CLOUD=1` রাখুন — login page-এ Google বাটন দেখাবে।

Google দিয়ে প্রথমবার লগইন করলে অ্যাপ নিজেই একটা business বানিয়ে নেবে — নাম থাকবে Google profile-এর নাম।

## Email confirmation (ঐচ্ছিক সিটিং)

- **Authentication → Sign In / Up → Email → "Confirm email"**:
  - **OFF** (সহজ): signup-এর সাথে সাথেই লগইন হয়ে যাবে।
  - **ON** (কঠোর): signup-এর পর ইমেইলে যাওয়া লিংকে ক্লিক করতে হবে, তারপর লগইন।
  - অ্যাপ দুটোই সাপোর্ট করে — ON থাকলে signup-এর ভেতরেই বাংলায় বুঝিয়ে দেয় "ইমেইলে কনফার্মেশন লিংক গেছে"।

## Safety

- These files only **create** new tables. They never delete data.
- Double-booking protection (the same vehicle can never be on two overlapping trips) is enforced by the database itself — not just the app.
- Row Level Security means: even if there is a bug, Business A can never read Business B's data.

## After applying

Nothing visible changes immediately — the app connects to the real database in Phase 1 (Authentication + tenant setup). Until then the preview runs on demo data.
