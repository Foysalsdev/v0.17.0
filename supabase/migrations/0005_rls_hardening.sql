-- 0005_rls_hardening.sql
-- v0.12: profiles anon-read বন্ধ + ফোন-লগইন RPC + ৫ টেবিলের পলিসি sweep-normalize।
-- লাইভ DB-র জন্য download/v0.13-audit-fix-and-hardening.sql (এই পলিসি + audit-ফিক্স + টেস্ট-cleanup)।
-- পটভূমি: আগে profiles_select ছিল using (true) — anon (publishable) কী দিয়েও
-- সব প্রোফাইল (নাম/ফোন/email) পড়া যেত। ফোন-লগইন flow এই read-এর উপর নির্ভর
-- করত → সেটা profile_email_by_phone() RPC-তে সরানো হলো, তারপর read বন্ধ।

-- ১) ৫ টেবিলের পলিসি sweep-drop (নাম যাই হোক — রেসিডিউ পলিসি ধরা পড়ে)
do $$
declare
  r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('businesses','business_members','profiles','customers','audit_logs')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end
$$;

alter table public.businesses       enable row level security;
alter table public.business_members enable row level security;
alter table public.profiles         enable row level security;
alter table public.customers        enable row level security;
alter table public.audit_logs       enable row level security;

-- ২) পলিসি-সেট (0002-এর ডিজাইন + profiles কড়া + members_insert self-join)
create policy businesses_select on public.businesses
  for select using (public.is_business_member(id));
create policy businesses_insert on public.businesses
  for insert with check (owner_user_id = auth.uid());
create policy businesses_update on public.businesses
  for update using (public.user_role_in(id) in ('owner','manager'));

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

-- profiles: শুধু authenticated পড়তে পারে (আগে using(true) = anon-ও পড়ত)
create policy profiles_select on public.profiles
  for select to authenticated using (true);
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid());
create policy profiles_update on public.profiles
  for update using (id = auth.uid());

create policy customers_select on public.customers
  for select using (public.is_business_member(business_id));
create policy customers_insert on public.customers
  for insert with check (public.user_role_in(business_id) in ('owner','manager','staff'));
create policy customers_update on public.customers
  for update using (public.user_role_in(business_id) in ('owner','manager','staff'));
create policy customers_delete on public.customers
  for delete using (public.user_role_in(business_id) in ('owner','manager'));

create policy audit_logs_select on public.audit_logs
  for select using (public.is_business_member(business_id));

-- ৩) ফোন-লগইন RPC (cloud-auth.ts পথ-১ এটা ব্যবহার করে)
create or replace function public.profile_email_by_phone(p_phone text)
returns text
language sql stable security definer set search_path = public as $$
  select email from public.profiles
  where phone = p_phone
  order by created_at
  limit 1;
$$;

revoke all on function public.profile_email_by_phone(text) from public;
grant execute on function public.profile_email_by_phone(text) to anon, authenticated;
