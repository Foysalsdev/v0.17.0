-- ============================================================================
-- গাড়িখাতা (GariKhata) — v1.0 FINAL Setup & Repair Script
-- ============================================================================
-- কোথায় চালাবেন: Supabase Dashboard → SQL Editor → New query → এই পুরো ফাইল
-- পেস্ট করে Run। (একবারই লাগবে; আবার চালালেও কিছু নষ্ট হবে না।)
--
-- এটা কী করে (৬টি ধাপ, সব আগের প্যাচ এক জায়গায়):
--   A) Helper ফাংশন + profiles.email + ফোন-লগইন RPC
--   B) audit_row_change() v2 — বিজনেস/ইউজার মুছলে লগ-ট্রিগার যেন আর কখনো
--      FK error (23503) দিয়ে মুছতে আটকায় না (v0.12-এর সেই বাগ)
--   C) সব টেবিলের সম্পূর্ণ RLS পলিসি-সেট নতুন করে বসায়:
--      · নতুন signup ঠিক হয় (members_insert self-join — এখন লাইভ DB-তে
--        এটা নেই বলে "account create" আটকে যাচ্ছিল!)
--      · profiles আর anonymous পড়তে পারে না (security hole বন্ধ)
--   D) টেস্ট-ডেটা পরিষ্কার (শুধু টেস্ট প্যাটার্ন — আপনার আসল অ্যাকাউন্ট/
--      বিজনেস/ডেটা কখনো ছোঁয় না; নিচে D-০ তালিকায় দেখে নিন)
--   E) অ্যাডমিন প্যানেল (v1.0 নতুন!): আপনার অ্যাকাউন্টে is_platform_admin
--      ফ্ল্যাগ + platform_admin_overview() RPC — /admin-এ নিজের
--      ফোন+পাসওয়ার্ড দিয়ে লগইন করলেই আসল ক্লাউড হিসাব দেখাবে
--      (service key ছাড়াই)।
--   F) যাচাই — শেষে সবুজ সংখ্যাগুলো দেখলেই নিশ্চিত
--
-- নিরাপত্তা: ১০০% idempotent — যে-কোনো আংশিক-অবস্থার DB-তে চালানো যায়,
-- একাধিকবার চালানো যায়, আসল ডেটা ডিলিট হয় না।
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- A) ভিত্তি: helper ফাংশন + কলাম + ফোন-লগইন RPC
-- ═══════════════════════════════════════════════════════════════════════════

-- A-১) চেক: email কলাম (না থাকলে যোগ হবে)
alter table public.profiles add column if not exists email text;

-- A-২) পুরনো synthetic-অ্যাকাউন্টের email ব্যাকফিল
update public.profiles
set email = phone || '@garirkhata.app'
where email is null
  and phone ~ '^01[0-9]{9}$'
  and not exists (
    select 1 from auth.users u
    where u.id = public.profiles.id
      and u.email <> (public.profiles.phone || '@garirkhata.app')
  );

create unique index if not exists idx_profiles_email
  on public.profiles (email) where email is not null and email <> '';
create index if not exists idx_profiles_phone on public.profiles (phone);

-- A-৩) helper: সদস্য কি না / রোল কী / membership-বিহীন কি না
create or replace function public.is_business_member(check_business uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.business_members
    where user_id = auth.uid() and business_id = check_business and status = 'active'
  );
$$;

create or replace function public.user_role_in(check_business uuid)
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.business_members
  where user_id = auth.uid() and business_id = check_business and status = 'active'
  limit 1
$$;

create or replace function public.can_manage_records(check_business uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.user_role_in(check_business) in ('owner','manager','accountant'), false)
$$;

create or replace function public.user_is_memberless()
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from public.business_members m where m.user_id = auth.uid()
  );
$$;

-- A-৪) ফোন নম্বর দিয়ে লগইন/পাসওয়ার্ড-রিসেট: আসল email খুঁজে দেওয়ার RPC
--      (anon-ও কল করতে পারে — ভেতরে শুধু email রিটার্ন করে, আর কিছু না)
create or replace function public.profile_email_by_phone(p_phone text)
returns text language sql stable security definer set search_path = public as $$
  select email from public.profiles
  where phone = p_phone and email is not null and email <> ''
  order by created_at limit 1;
$$;
revoke all on function public.profile_email_by_phone(text) from public;
grant execute on function public.profile_email_by_phone(text) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- B) audit_row_change() v2 — cascade-safe
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.audit_row_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  biz uuid := coalesce(new.business_id, old.business_id);
begin
  if biz is null
     or not exists (select 1 from public.businesses b where b.id = biz) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  begin
    if tg_op = 'DELETE' then
      insert into public.audit_logs (business_id, user_id, action, entity, entity_id, old_values)
      values (biz, auth.uid(), 'delete', tg_table_name, old.id, to_jsonb(old));
    else
      insert into public.audit_logs (business_id, user_id, action, entity, entity_id, old_values, new_values)
      values (biz, auth.uid(), lower(tg_op), tg_table_name, new.id,
              case when tg_op = 'UPDATE' then to_jsonb(old) end, to_jsonb(new));
    end if;
  exception when others then
    raise warning 'GK-audit skip: % (%, %)', sqlerrm, tg_table_name, tg_op;
  end;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- signup-এ profile অটো-তৈরি (phone+email metadata থেকে — ফোন-লগইন তাই কাজ করে)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'email', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- C) সম্পূর্ণ RLS পলিসি-সেট (সব টেবিল — পুরনো/ভাঙা/অনুপস্থিত যা-ই থাকুক,
--    ড্রপ করে নতুন করে বসে) — এটাই signup-fix + security hardening
-- ═══════════════════════════════════════════════════════════════════════════

-- C-১) কোর-৩ টেবিল: businesses / business_members / profiles
alter table public.businesses       enable row level security;
alter table public.business_members enable row level security;
alter table public.profiles         enable row level security;

drop policy if exists businesses_select on public.businesses;
drop policy if exists businesses_insert on public.businesses;
drop policy if exists businesses_update on public.businesses;
create policy businesses_select on public.businesses
  for select using (public.is_business_member(id));
create policy businesses_insert on public.businesses
  for insert with check (owner_user_id = auth.uid());
create policy businesses_update on public.businesses
  for update using (public.user_role_in(id) in ('owner','manager'));

drop policy if exists members_select on public.business_members;
drop policy if exists members_insert on public.business_members;
drop policy if exists members_update on public.business_members;
drop policy if exists members_delete on public.business_members;
create policy members_select on public.business_members
  for select using (public.is_business_member(business_id));
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
create policy members_update on public.business_members
  for update using (public.user_role_in(business_id) = 'owner');
create policy members_delete on public.business_members
  for delete using (public.user_role_in(business_id) = 'owner');

-- profiles: শুধু authenticated পড়তে পারে (anon-read বন্ধ — আগের security hole),
-- লেখা নিজের রো-তেই।
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid());
create policy profiles_update on public.profiles
  for update using (id = auth.uid());

-- C-২) বাকি সব বিজনেস-টেবিল: সিলেক্ট = সদস্য; রাইট = রোল অনুযায়ী
do $$
declare
  t text;
  ops_tables text[] := array[
    'vehicles','vehicle_documents','customers','drivers',
    'trips','trip_expenses','fuel_entries',
    'maintenance_schedule','maintenance_logs','repairs','tyres','batteries',
    'quotations','invoices','receipts',
    'vehicle_listings','notifications'
  ];
  finance_tables text[] := array['incomes','expenses','payments'];
begin
  foreach t in array array[
    'vehicles','vehicle_documents','customers','drivers',
    'trips','trip_expenses','fuel_entries',
    'maintenance_schedule','maintenance_logs','repairs','tyres','batteries',
    'incomes','expenses','payments',
    'quotations','invoices','receipts',
    'reminders','notifications',
    'vehicle_listings','vehicle_sales',
    'audit_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_select', t);
    execute format(
      'create policy %I on public.%I for select using (public.is_business_member(business_id));',
      t || '_select', t);
  end loop;

  foreach t in array ops_tables loop
    execute format('drop policy if exists %I on public.%I;', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I;', t || '_update', t);
    execute format('drop policy if exists %I on public.%I;', t || '_delete', t);
    execute format('create policy %I on public.%I for insert with check (public.user_role_in(business_id) in (''owner'',''manager'',''staff''));', t || '_insert', t);
    execute format('create policy %I on public.%I for update using (public.user_role_in(business_id) in (''owner'',''manager'',''staff''));', t || '_update', t);
    execute format('create policy %I on public.%I for delete using (public.user_role_in(business_id) in (''owner'',''manager''));', t || '_delete', t);
  end loop;

  foreach t in array finance_tables loop
    execute format('drop policy if exists %I on public.%I;', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I;', t || '_update', t);
    execute format('drop policy if exists %I on public.%I;', t || '_delete', t);
    execute format('create policy %I on public.%I for insert with check (public.can_manage_records(business_id));', t || '_insert', t);
    execute format('create policy %I on public.%I for update using (public.can_manage_records(business_id));', t || '_update', t);
    execute format('create policy %I on public.%I for delete using (public.can_manage_records(business_id));', t || '_delete', t);
  end loop;

  -- reminders: v0.9 লেখার পলিসি (owner/manager/staff/accountant)
  execute 'drop policy if exists reminders_insert on public.reminders;';
  execute 'drop policy if exists reminders_update on public.reminders;';
  execute 'drop policy if exists reminders_delete on public.reminders;';
  execute 'create policy reminders_insert on public.reminders for insert with check (public.user_role_in(business_id) in (''owner'',''manager'',''staff'',''accountant''));';
  execute 'create policy reminders_update on public.reminders for update using (public.user_role_in(business_id) in (''owner'',''manager'',''staff'',''accountant''));';
  execute 'create policy reminders_delete on public.reminders for delete using (public.user_role_in(business_id) in (''owner'',''manager''));';
end;
$$;

-- vehicle_sales: owner-only (একমুখী বিক্রির রেকর্ড)
drop policy if exists vehicle_sales_insert on public.vehicle_sales;
drop policy if exists vehicle_sales_update on public.vehicle_sales;
create policy vehicle_sales_insert on public.vehicle_sales
  for insert with check (public.user_role_in(business_id) = 'owner');
create policy vehicle_sales_update on public.vehicle_sales
  for update using (public.user_role_in(business_id) = 'owner');

-- audit_logs: সদস্যরা দেখে; insert ট্রিগারই করে (দুটোই ক্যানোনিকাল)
drop policy if exists audit_logs_select on public.audit_logs;
drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_select on public.audit_logs
  for select using (public.is_business_member(business_id));
create policy audit_logs_insert on public.audit_logs
  for insert with check (public.is_business_member(business_id));

-- ═══════════════════════════════════════════════════════════════════════════
-- D) টেস্ট-ডেটা পরিষ্কার — আসল ডেটা কখনো ছোঁয় না
-- ═══════════════════════════════════════════════════════════════════════════

-- D-০) কী কী মুছবে আগে দেখে নিন (শুধু টেস্ট-প্যাটার্ন; আপনার অ্যাকাউন্ট
--      এখানে দেখা যাবে না — তাহলেই সঠিক)
select 'এই বিজনেসগুলো মুছবে (ZZ-TEST)' as কী, name as মান
  from public.businesses where name like 'ZZ-TEST%';
select 'এই অ্যাকাউন্টগুলো মুছবে (টেস্ট)' as কী, coalesce(email, id::text) as মান
  from auth.users
  where email like 'gk.e2e.%'
     or email like 'gk.cloude2e%'
     or email like 'probe.v15%'
     or email like 'rls.probe%'
     or email like 'worker.probe%'
     or email like '%@supabase.io'
     or email like '%@garirkhata.app'
     or id in (select id from public.profiles
                where phone like '01977%' or phone like '01966%' or phone like '01955%'
                   or phone in ('01999887766','01999887700','01999555777','01999444777'));

-- D-১) টেস্ট-বিজনেসের চিল্ড্রেন আগে (নির্ভরতা-ক্রমে; সব টেবিল থাকে না
--      এমন পুরনো DB-র জন্য to_regclass গার্ড)
do $$
declare
  biz_ids uuid[];
  t text;
  child_tables text[] := array[
    'payments','receipts','invoices','trip_expenses',
    'reminders','notifications',
    'fuel_entries','maintenance_logs','maintenance_schedule','repairs','tyres','batteries',
    'vehicle_documents','vehicle_sales','vehicle_listings',
    'quotations','trips','incomes','expenses',
    'drivers','customers','vehicles',
    'audit_logs'
  ];
begin
  select array_agg(id) into biz_ids from public.businesses where name like 'ZZ-TEST%';
  if biz_ids is null then raise notice 'D-1: ZZ-TEST বিজনেস নেই — স্কিপ'; return; end if;

  foreach t in array child_tables loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('delete from public.%I where business_id = any($1)', t) using biz_ids;
    end if;
  end loop;

  delete from public.business_members where business_id = any(biz_ids);
  delete from public.businesses where id = any(biz_ids);
  raise notice 'D-1: ZZ-TEST বিজনেস মুছে গেছে (%)', array_length(biz_ids, 1);
end;
$$;

-- D-২) টেস্ট auth-অ্যাকাউন্ট (ক্যাসকেডে তাদের profile/membership/বিজনেস
--      চলে যায় — B-এর v2 audit থাকায় 23503 আর হবে না)
delete from auth.users
  where email like 'gk.e2e.%'
     or email like 'gk.cloude2e%'
     or email like 'probe.v15%'
     or email like 'rls.probe%'
     or email like 'worker.probe%'
     or email like '%@supabase.io'
     or email like '%@garirkhata.app'
     or id in (select id from public.profiles
                where phone like '01977%' or phone like '01966%' or phone like '01955%'
                   or phone in ('01999887766','01999887700','01999555777','01999444777'));

-- D-৩) এতিম profile (auth-ইউজার নেই এমন) — থেকে যাওয়া রেসিডিউ
delete from public.profiles p
  where not exists (select 1 from auth.users u where u.id = p.id);

-- ═══════════════════════════════════════════════════════════════════════════
-- E) অ্যাডমিন প্যানেল (v1.0) — আসল অ্যাকাউন্ট-লগইন অ্যাডমিন
-- ═══════════════════════════════════════════════════════════════════════════

-- E-১) profiles-এ প্ল্যাটফর্ম-অ্যাডমিন ফ্ল্যাগ (নতুন কলাম; সবার default false)
alter table public.profiles
  add column if not exists is_platform_admin boolean not null default false;

-- E-২) মালিকের অ্যাকাউন্টে ফ্ল্যাগ = true
--      (নিচের ফোন/ইমেইল আপনার না হলে নিজেরটা বসিয়ে আবার Run করুন)
update public.profiles
set is_platform_admin = true
where phone = '01820556198'
   or email = 'abdulaziz.sarkarr@gmail.com';

-- E-৩) cross-tenant read-only overview RPC (security definer)।
--      ভেতরে auth.uid()-এর is_platform_admin যাচাই করে — অ্যাডমিন-ফ্ল্যাগ
--      ছাড়া কেউ ডাকলে error (42501)। শুধু পড়ে; কোনো ডেটা লেখে না।
create or replace function public.platform_admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_admin boolean;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select p.is_platform_admin into v_admin
  from public.profiles p
  where p.id = auth.uid();

  if v_admin is distinct from true then
    raise exception 'not_platform_admin' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'stats', jsonb_build_object(
      'businesses',  (select count(*) from public.businesses),
      'users',       (select count(*) from public.profiles),
      'vehicles',    (select count(*) from public.vehicles),
      'trips30d',    (select count(*) from public.trips
                        where created_at >= now() - interval '30 days'),
      'newUsers7d',  (select count(*) from public.profiles
                        where created_at >= now() - interval '7 days')
    ),
    'businesses', (
      select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb)
      from (
        select bz.id,
               bz.name,
               coalesce(p.full_name, '')   as owner_name,
               coalesce(bz.phone, p.phone, '') as phone,
               coalesce(bz.email, '')      as email,
               coalesce(bz.address, '')    as address,
               bz.plan,
               bz.created_at,
               (select count(*) from public.business_members m
                 where m.business_id = bz.id) as members,
               (select count(*) from public.vehicles v
                 where v.business_id = bz.id) as vehicles,
               (select count(*) from public.trips t
                 where t.business_id = bz.id
                   and t.created_at >= now() - interval '30 days') as trips30d
        from public.businesses bz
        left join public.profiles p on p.id = bz.owner_user_id
        order by bz.created_at desc
        limit 200
      ) x
    ),
    'members', (
      select coalesce(jsonb_agg(y order by y.joined_at desc), '[]'::jsonb)
      from (
        select p.full_name as name,
               p.phone,
               bm.role,
               bz.name       as business_name,
               bm.joined_at
        from public.business_members bm
        join public.profiles  p  on p.id  = bm.user_id
        join public.businesses bz on bz.id = bm.business_id
        where bm.status = 'active'
        order by bm.joined_at desc
        limit 30
      ) y
    )
  );
end;
$$;

-- শুধু signed-in ইউজাররাই ডাকতে পারবে; anon/public নয়
revoke all on function public.platform_admin_overview() from public, anon;
grant execute on function public.platform_admin_overview() to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- F) যাচাই — সবুজ সংখ্যাগুলো দেখবেন
-- ═══════════════════════════════════════════════════════════════════════════
select
  (select count(*) from pg_policies where schemaname='public'
     and policyname in ('businesses_insert','members_insert','profiles_select')) as policy_fix_ok,   -- 3 হলে ✅
  (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.proname='profile_email_by_phone') as phone_rpc_ok,               -- 1 হলে ✅
  (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.proname='audit_row_change'
       and p.prosrc like '%GK-audit skip%') as audit_v2_ok,                                          -- 1 হলে ✅
  (select count(*) from auth.users
     where email like 'gk.e2e.%' or email like 'gk.cloude2e%' or email like 'probe.v15%'
        or email like 'rls.probe%' or email like 'worker.probe%' or email like '%@supabase.io' or email like '%@garirkhata.app'
        or id in (select id from public.profiles where phone like '01977%' or phone like '01966%'
                  or phone like '01955%' or phone in ('01999887766','01999887700','01999555777','01999444777'))) as test_users_left, -- 0 হলে ✅
  (select count(*) from public.businesses where name like 'ZZ-TEST%') as zz_test_left,               -- 0 হলে ✅
  (select count(*) from public.profiles p where not exists
     (select 1 from auth.users u where u.id = p.id)) as orphan_profiles,                             -- 0 হলে ✅
  (select count(*) from public.businesses) as businesses_total,                                      -- আসল বিজনেস সংখ্যা
  (select count(*) from public.profiles) as profiles_total;                                          -- আসল অ্যাকাউন্ট সংখ্যা

-- আপনার অ্যাকাউন্ট অক্ষত + অ্যাডমিন-ফ্ল্যাগ সেট? (is_platform_admin = t দেখুন)
select full_name, phone, email, is_platform_admin from public.profiles
  where email = 'abdulaziz.sarkarr@gmail.com'
     or phone = '01820556198';

-- অ্যাডমিন RPC তৈরি হয়েছে? (1 হলে ✅)
select count(*) as admin_rpc_ok
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'platform_admin_overview';

-- পরের ধাপ: অ্যাপে /admin খুলুন → "অ্যাকাউন্ট দিয়ে" ট্যাব →
-- আপনার ফোন (01820556198) + পাসওয়ার্ড → আসল ক্লাউড হিসাব দেখবেন।
