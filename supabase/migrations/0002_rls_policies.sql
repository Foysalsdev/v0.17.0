-- ============================================================================
-- গাড়িখাতা (GarirKhata) — Migration 0002: Tenant isolation (RLS) + helpers
--
-- SECURITY MODEL (§37, §38, §55):
--   * Authentication  → Supabase Auth
--   * Authorization   → Row Level Security (database-level, not frontend)
--   * Tenant ownership → every business table filters by business_id
--   * Membership      → business_members grants access to a tenant
--
-- Rule: a member of Business A can never read or write Business B's rows.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: is the current auth user an active member of the given business?
-- SECURITY DEFINER so policies can use it without recursion on business_members.
-- ----------------------------------------------------------------------------
create or replace function public.is_business_member(check_business uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.business_members
    where user_id = auth.uid()
      and business_id = check_business
      and status = 'active'
  );
$$;

-- Helper: the current user's role in a business (null if not a member)
create or replace function public.user_role_in(check_business uuid)
returns user_role
language sql stable security definer
set search_path = public
as $$
  select role from public.business_members
  where user_id = auth.uid()
    and business_id = check_business
    and status = 'active'
  limit 1
$$;

-- Helper: can the user manage money/records (owner, manager, accountant)
create or replace function public.can_manage_records(check_business uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(public.user_role_in(check_business) in ('owner','manager','accountant'), false)
$$;

-- ----------------------------------------------------------------------------
-- TENANT TABLES
-- ----------------------------------------------------------------------------
alter table public.businesses          enable row level security;
alter table public.business_members    enable row level security;
alter table public.profiles            enable row level security;

-- businesses: members can see their tenant; creator can insert (owner)
create policy businesses_select on public.businesses
  for select using (public.is_business_member(id));
create policy businesses_insert on public.businesses
  for insert with check (owner_user_id = auth.uid());
create policy businesses_update on public.businesses
  for update using (public.user_role_in(id) in ('owner','manager'));

-- members: visible to everyone in that business; owners/admins manage
create policy members_select on public.business_members
  for select using (public.is_business_member(business_id));
create policy members_insert on public.business_members
  for insert with check (public.user_role_in(business_id) = 'owner');
create policy members_update on public.business_members
  for update using (public.user_role_in(business_id) = 'owner');
create policy members_delete on public.business_members
  for delete using (public.user_role_in(business_id) = 'owner');

-- profiles: public read (name/avatar inside tenant screens), self write
create policy profiles_select on public.profiles
  for select using (true);
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid());
create policy profiles_update on public.profiles
  for update using (id = auth.uid());

-- ----------------------------------------------------------------------------
-- GENERIC RLS FOR ALL BUSINESS TABLES
-- Pattern: members read; owner/manager/staff (+accountant for finance) write.
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
  read_only_tables text[] := array['reminders']; -- system-generated rows
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

    execute format(
      'create policy %I on public.%I for select using (public.is_business_member(business_id));',
      t || '_select', t
    );
  end loop;
end;
$$;

-- Write policies per sensitivity (owner/manager/staff manage operations;
-- accountant additionally manages finance tables)
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
  foreach t in array ops_tables loop
    execute format(
      'create policy %I on public.%I for insert with check (public.user_role_in(business_id) in (''owner'',''manager'',''staff''));',
      t || '_insert', t
    );
    execute format(
      'create policy %I on public.%I for update using (public.user_role_in(business_id) in (''owner'',''manager'',''staff''));',
      t || '_update', t
    );
    execute format(
      'create policy %I on public.%I for delete using (public.user_role_in(business_id) in (''owner'',''manager''));',
      t || '_delete', t
    );
  end loop;

  foreach t in array finance_tables loop
    execute format(
      'create policy %I on public.%I for insert with check (public.can_manage_records(business_id));',
      t || '_insert', t
    );
    execute format(
      'create policy %I on public.%I for update using (public.can_manage_records(business_id));',
      t || '_update', t
    );
    execute format(
      'create policy %I on public.%I for delete using (public.can_manage_records(business_id));',
      t || '_delete', t
    );
  end loop;
end;
$$;

-- vehicle_sales: owner-only (one-way sale records)
create policy vehicle_sales_insert on public.vehicle_sales
  for insert with check (public.user_role_in(business_id) = 'owner');
create policy vehicle_sales_update on public.vehicle_sales
  for update using (public.user_role_in(business_id) = 'owner');

-- audit_logs: system-inserted, never updated/deleted from the client
create policy audit_logs_insert on public.audit_logs
  for insert with check (public.is_business_member(business_id));

-- ----------------------------------------------------------------------------
-- UPDATED TRIP DUE + AUDIT AUTOMATION (app calls these; DB enforces)
-- ----------------------------------------------------------------------------
-- Recompute trip due_amount from payments (call after payment insert)
create or replace function public.refresh_trip_due(trip uuid)
returns void language sql security definer set search_path = public as $$
  update public.trips t set
    due_amount = greatest(0, t.total_amount + t.extra_charges - t.discount
      - coalesce((select sum(p.amount) from public.payments p where p.trip_id = trip), 0)),
    advance_amount = coalesce((select sum(p.amount) from public.payments p where p.trip_id = trip), 0)
  where t.id = trip;
$$;

-- Generic audit trigger: attach to sensitive tables
-- v0.13: cascade-safe — বিজনেস মুছে গেলে (FK-cascade চলাকালীন) লগ বাদ দেয়,
-- আর লগ বসাতে না পারলে শুধু warning — অ্যাপের কাজ কখনো আটকায় না।
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

create trigger trg_audit_trips    after insert or update or delete on public.trips
  for each row execute function public.audit_row_change();
create trigger trg_audit_vehicles after insert or update or delete on public.vehicles
  for each row execute function public.audit_row_change();
create trigger trg_audit_payments after insert or delete on public.payments
  for each row execute function public.audit_row_change();

-- ----------------------------------------------------------------------------
-- On signup: auto-create profile row (v0.11: phone + email from metadata so
-- phone-login works without the signup route's upsert)
-- ----------------------------------------------------------------------------
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
