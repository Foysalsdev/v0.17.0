# গাড়িখাতা — Cloudflare Deploy Guide (GitHub → Workers)

এই গাইড অনুসরণ করলে app-টা **আপনার Cloudflare অ্যাকাউন্টে** ১০ মিনিটে live হবে —
GitHub repo কানেক্ট করে, প্রতি push-এ auto-deploy।

> টেকনিক্যাল নোট: Cloudflare-এ Next.js সার্ভার অ্যাপ চলে **Workers**-এ
> (OpenNext adapter দিয়ে — এই repo-তে সেটআপ করা-ই আছে: `wrangler.jsonc`,
> `open-next.config.ts`)। Pages-এর নতুন-অফিসিয়াল পথ এটাই — GitHub connect +
> custom domain একইভাবে কাজ করে, ফ্রি প্ল্যানে দিনে ১,০০,০০০ রিকোয়েস্ট।

---

## ধাপ ০ — আগে একবার (Supabase)

### ০-ক) v1.0 SQL চালান (একবারই)
1. repo-র **`sql/v1.0-final-setup.sql`** ফাইলের পুরো কনটেন্ট কপি করুন
2. Supabase Dashboard → **SQL Editor** → New query → পেস্ট → **Run**
3. শেষের টেবিলে দেখুন:
   - `policy_fix_ok = 3` ✅ · `phone_rpc_ok = 1` ✅ · `audit_v2_ok = 1` ✅
   - `test_users_left = 0` ✅ · `zz_test_left = 0` ✅ · `orphan_profiles = 0` ✅
   - আপনার নাম-সহ শেষ রোটা দেখা যাচ্ছে কি না — দেখলেই অ্যাকাউন্ট অক্ষত।

> এই SQL ছাড়া **নতুন অ্যাকাউন্ট তৈরি হবে না** (RLS আটকে দেবে) — আগে চালান।

### ০-খ) Site URL ঠিক করুন (পাসওয়ার্ড রিসেট ইমেইল যেন আপনার domain-এ ফিরে আসে)
Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://আপনার-ডোমেইন` (প্রথমে ধাপ ৩-এর ঠিকানাটা বসান, পরে আপডেট করা যাবে)
- **Redirect URLs**-এ যোগ করুন:
  - `https://আপনার-ডোমেইন/auth/callback`
  - `https://আপনার-ডোমেইন/auth/reset`
  - `http://localhost:3000/auth/reset` (লোকাল টেস্টের জন্য)

---

## ধাপ ১ — GitHub-এ repo বানান

```bash
# এই প্রজেক্ট ফোল্ডারে (gitignore-এ .env বাদ-ই দেওয়া আছে)
git init
git add .
git commit -m "গাড়িখাতা v0.16.0 — Cloudflare-ready"
git remote add origin https://github.com/আপনার-ইউজার/garikhata.git
git push -u origin main
```

> ⚠️ কমিট করার আগে নিশ্চিত হন `.gitignore`-এ `.env.local` আছে (আছে)।
> Supabase key publishable — repo-তে `wrangler.jsonc`-এও মান দেওয়া আছে;
> ওটা গোপন নয়, RLS-ই আসল পাহারা।

---

## ধাপ ২ — Cloudflare-তে Workers Build কানেক্ট করুন

1. Cloudflare Dashboard → **Workers & Pages** → **Create** →
   **Import a repository** (GitHub অ্যাকাউন্ট কানেক্ট করুন → repo সিলেক্ট করুন)
2. Project name: `garikhata` (বা আপনার পছন্দ)
3. Build settings:
   - **Build command**: `npx opennextjs-cloudflare@latest build`
   - **Deploy command**: (খালি রাখুন — wrangler নিজেই deploy করবে)
   - Root directory: `/`
4. **Settings → Variables** (Build ও Runtime দুই জায়গাতেই যোগ করুন):

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://hevlfxmivchefmjvzgxp.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_G20JvHqq_jK7tDYGlbedXg_IUK4OL_X` |
   | `GK_BACKEND` | `supabase` |
   | `NEXT_PUBLIC_GK_CLOUD` | `1` |

   > টিপ: `wrangler.jsonc`-এর `vars` সেকশনে এগুলো রেডি-ই আছে — runtime-এর
   > জন্য আলাদা করে দিতে হবে না; শুধু **Build variables** হিসেবে
   > NEXT_PUBLIC_ দুটি সেট করুন (client bundle-এ inline হয় বলে)।
5. **Save and Deploy** → প্রথম build ৩–৫ মিনিট নেবে।

---

## ধাপ ৩ — নিজের Domain লাগান (ইচ্ছা হলে)

Workers & Pages → আপনার worker → **Settings → Domains & Routes** →
**Add → Custom domain** → `garikhata.com`-এর মতো ডোমেইন লিখুন।
(Cloudflare-এ domain থাকলে DNS নিজেই সেট হয়ে যায়।)

তারপর **ধাপ ০-খ**-এর Site URL আপডেট করে নতুন domain বসান।

---

## ধাপ ৪ — অ্যাডমিন প্যানেল চালু করুন (v0.16)

আপনার প্ল্যাটফর্মের সব ব্যবসা-ইউজার এক জায়গায় দেখতে `/admin` পেজ রেডি
(অ্যাপের কোনো মেনুতে নেই — সরাসরি URL)। দুটি **secret** সেট করলেই চালু:

```bash
# Cloudflare Dashboard → Workers ও পেজ → garikhata worker →
# Settings → Variables and Secrets → Add (Type: Secret)

# ১) অ্যাডমিন লগইন কী (নিজে বানান, ৮+ অক্ষর, গোপন):
GK_ADMIN_KEY = <আপনার-পছন্দের-শক্ত-কী>

# ২) লাইভ ক্লাউড ডেটার জন্য (Supabase → Settings → API → service_role):
SUPABASE_SERVICE_ROLE = <service_role-কী>
```

| কী | কী করে |
|---|---|
| `GK_ADMIN_KEY` | `/admin`-এর সেশন-signing + "অ্যাডমিন কী" ট্যাবের লগইন (cookie ১২ ঘণ্টা; ৫ ভুল চেষ্টায় ১০ মিনিট ব্লক) |
| `SUPABASE_SERVICE_ROLE` | (ঐচ্ছিক) "অ্যাডমিন কী" পথে সব ব্যবসার হিসাব দেখায় — **শুধু সার্ভারে থাকে, ব্রাউজারে কখনো যায় না**। বিকল্প: অ্যাকাউন্ট-লগইন (`/admin` → "অ্যাকাউন্ট দিয়ে") দিলে এটা লাগেই না |

> ⚠️ `SUPABASE_SERVICE_ROLE` **কখনো** Build variables-এ বা `NEXT_PUBLIC_`-
> প্রিফিক্সে দেবেন না — ওটা RLS bypass করে; শুধু Secret হিসেবে।
> না দিলে `/admin` লোকাল ডেমো ডেটা দেখাবে (production-এ ঢাকার কথা লেখা আসবে)।

---

## যাচাই করুন (deploy-এর পরে)

| চেক | প্রত্যাশা |
|---|---|
| `https://…/` খুলুন | লগইন পেজ, লোগো দেখাবে |
| নতুন অ্যাকাউন্ট খুলুন | সরাসরি ড্যাশবোর্ডে ঢুকবে ✅ |
| Settings → ব্যবসার প্রোফাইল → **সম্পাদনা** | নাম/ঠিকানা/ফোন বদলে সেভ হবে ✅ |
| লগইন পেজে **পাসওয়ার্ড ভুলে গেছেন?** | ইমেইলে রিসেট লিংক আসবে ✅ |
| ফোন দিয়ে লগইন | কাজ করবে (v1.0 SQL চালানোর পরে) ✅ |
| `https://…/admin` | কী দিয়ে ঢুকে সব ব্যবসার হিসাব দেখাবে (ধাপ ৪-এর সিক্রেটগুলো দিলে) ✅ |

---

## লোকাল রান (ডেভেলপার)

```bash
bun install
bun run dev            # .env.local-এ GK_BACKEND=local → SQLite ডেমো
# অথবা cloud মোড: .env.local-এ Supabase মান বসিয়ে
bunx opennextjs-cloudflare build && bunx wrangler dev   # হুবহু Workers-এর মতো
```

---

## সাধারণ সমস্যা

| উপসর্গ | কারণ → সমাধান |
|---|---|
| Signup-এ error | v1.0 SQL চালানো হয়নি → ধাপ ০-ক |
| রিসেট ইমেইলের লিংক কাজ করে না | Site URL ঠিক নয় → ধাপ ০-খ |
| `loginFailed` | পাসওয়ার্ড ভুল — রিসেট লিংক নিন (login পেজের লিংক) |
| Build fail: next version | `bun add next@^16.3.3` (package.json-এ ঠিকই আছে) |
| Worker size limit | ফ্রি প্ল্যান 3MB — বর্তমান bundle ~1.3MB, জায়গা আছে |
| `/admin`-এ key দিয়ে লগইনে "আসল ক্লাউড ডেটার জন্য অ্যাকাউন্ট দিয়ে লগইন করুন" | এটাই স্বাভাবিক — key-মোড শুধু জরুরি প্রবেশ। আসল ডেটার জন্য "অ্যাকাউন্ট দিয়ে" ট্যাব (আপনার ফোন+পাসওয়ার্ড) — অথবা `SUPABASE_SERVICE_ROLE` secret → ধাপ ৪ |
| `/admin`-এ ঢুকতেই `adminKeyNotSet` | `GK_ADMIN_KEY` secret সেট করেননি → ধাপ ৪ |
| অ্যাডমিন কী ভুলে গেছেন | secret আবার সেট করুন (নতুন মান) — পুরনো cookie ১২ ঘণ্টা পরে নিজেই মরে যায় |
