-- ============================================================================
-- গাড়িখাতা (GarirKhata) — মাইগ্রেশন ০০০৪ (v0.9.0)
-- এই ফাইলটি Supabase Dashboard → SQL Editor → New query-তে পেস্ট করে Run করুন।
--
-- কী করবে এই স্ক্রিপ্ট (একবারই লাগবে):
--   ১. profiles টেবিলে email কলাম যোগ করবে — signup-এ email দিলে সেটা
--      এখানে জমা থাকে। ফোন দিয়ে লগইন করলেও আসল email খুঁজে বের করা যায়।
--   ২. self-signup ঠিক করবে — নতুন ইউজার নিজের business খুলে নিজে owner
--      হতে পারবে (আগের members_insert policy শুধু ভেতর থেকে owner-ই
--      সদস্য যোগ করতে পারত — signup আটকে যেত RLS-এ)।
--   ৩. একই সুবিধা Google লগইনের জন্য — প্রথমবার Google দিয়ে ঢুকলে
--      নিজের business অটো-তৈরি হবে।
--
-- নিরাপদ: একাধিকবার চালালেও সমস্যা নেই (idempotent)।
-- ============================================================================

begin;

-- ১) profiles-এ email কলাম (না থাকলে যোগ হবে; থাকলে কিছু হবে না)
alter table public.profiles
  add column if not exists email text;

-- ১ক) পুরনো synthetic-account (0003 seed / পুরনো team) — তাদের auth ইমেইল
--     phone@garirkhata.app ছিল। সেটা profiles.email-এ বসালে "ফোন দিয়ে লগইন"
--     তিন ধাপে খুঁজে পায়: নতুন domain → legacy domain → profiles.email।
update public.profiles
set email = phone || '@garirkhata.app'
where email is null
  and phone ~ '^01[0-9]{9}$'
  and not exists (
    select 1 from auth.users u
    where u.email <> (public.profiles.phone || '@garirkhata.app')
      and u.id = public.profiles.id
  );

create unique index if not exists idx_profiles_email
  on public.profiles (email)
  where email is not null and email <> '';

create index if not exists idx_profiles_phone
  on public.profiles (phone);

-- ২) helper: এই ইউজারের কোনো membership আছে কি না (security definer —
--    RLS-এর ভেতরে same-table subquery-এর recursion এড়াতে)
create or replace function public.user_is_memberless() returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from public.business_members m
    where m.user_id = auth.uid()
  );
$$;

-- ৩) members_insert policy patch — owner/manager যেমন আগেই পারত, এখন
--    "membership-হীন নতুন ইউজার" নিজের নতুন business-এ নিজেকে owner
--    বানাতেও পারবে (self-signup + Google first-login)।
drop policy if exists members_insert on public.business_members;
create policy members_insert on public.business_members
  for insert with check (
    public.user_role_in(business_id) in ('owner', 'manager')
    or (
      user_id = auth.uid()
      and role = 'owner'
      and status = 'active'
      and public.user_is_memberless()
    )
  );

-- ৪) রিপোর্ট — কাজ হল কি না দ্রুত দেখা যাবে
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'email') as profiles_email_ok,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'business_members' and policyname = 'members_insert') as members_policy_ok;

commit;

-- ============================================================================
-- Google লগইন চালু করতে (এই SQL-এর বাইরে, ড্যাশবোর্ডে ক্লিক করতে হবে):
--   ১. Authentication → Providers → Google → Enable
--      (Google Cloud Console-এ OAuth client বানিয়ে Client ID + Secret বসান)
--   ২. Authentication → URL Configuration → Redirect URLs-এ যোগ করুন:
--         https://<আপনার-অ্যাপ-ডোমেইন>/auth/callback
--      (localhost দিয়ে টেস্ট করলে http://localhost:3000/auth/callback-ও দিন)
--   ৩. .env.local-এ NEXT_PUBLIC_GK_CLOUD=1 রাখুন (login-এ Google বাটন দেখাবে)
--
-- আর যদি চান নতুন signup-এ ইমেইল কনফার্মেশন না লাগুক (সরাসরি লগইন):
--   Authentication → Sign In / Up → Email → "Confirm email" বন্ধ করুন।
--   চালু রাখলে signup-এর পর ইউজার ইমেইলের লিংকে ক্লিক করে ভেরিফাই করবে।
-- ============================================================================
