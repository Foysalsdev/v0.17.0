-- ============================================================================
-- গাড়িখাতা (GarirKhata) — Vehicle Rental, Fleet & Business Management SaaS
-- Migration 0001: Core schema (multi-tenant, Bangladesh market)
--
-- Design rules (master prompt §40):
--   1. Every business-owned table carries business_id (tenant ownership).
--   2. Double-booking protection enforced at the DATABASE level (§12).
--   3. Money columns numeric(12,2) — BDT has no subunits in practice.
--   4. Indexes cover every list view + reminder scan.
--   5. No destructive operations in this migration (fresh install).
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
create type user_role        as enum ('owner','manager','staff','driver','accountant');
create type vehicle_status   as enum ('available','on_trip','maintenance','inactive','for_sale','sold');
create type fuel_type        as enum ('diesel','petrol','cng','hybrid','electric');
create type transmission_type as enum ('manual','automatic');
create type doc_type         as enum ('registration','tax_token','fitness','insurance','route_permit','other');
create type trip_status      as enum ('draft','confirmed','running','completed','cancelled');
create type rental_type      as enum ('daily','per_trip','per_km','per_hour','airport','corporate','tour','wedding','monthly','other');
create type income_category  as enum ('rental','extra_km','extra_hour','driver_charge','delivery','corporate','other');
create type expense_category as enum (
  'fuel','maintenance','parts','driver_salary','driver_allowance','toll','parking',
  'tax','insurance','registration','workshop','loan_emi','cleaning','misc'
);
create type payment_method   as enum ('cash','bank','bkash','nagad','card','other');
create type maint_item       as enum (
  'engine_oil','oil_filter','air_filter','fuel_filter','ac_filter','transmission_oil',
  'differential_oil','brake_fluid','coolant','brake_pad','brake_disc','battery',
  'tyres','wheel_alignment','wheel_balancing','ac_service','suspension','belts','other'
);
create type reminder_type    as enum ('document','maintenance','payment','trip','other');
create type reminder_status  as enum ('pending','sent','done','dismissed');
create type quote_status     as enum ('draft','sent','accepted','rejected','expired');
create type invoice_status   as enum ('unpaid','partial','paid','cancelled');
create type member_status    as enum ('invited','active','inactive','removed');

-- ----------------------------------------------------------------------------
-- TENANTS & USERS  (§37 multi-tenant SaaS)
-- ----------------------------------------------------------------------------
create table public.businesses (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  owner_user_id  uuid not null references auth.users(id) on delete cascade,
  phone          text,
  email          text,
  address        text,
  logo_url       text,
  currency       text not null default 'BDT',
  plan           text not null default 'free',            -- free | starter | business | pro
  settings       jsonb not null default '{}'::jsonb,      -- reminder prefs, numbering formats…
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.business_members (
  business_id  uuid not null references public.businesses(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         user_role not null default 'staff',
  status       member_status not null default 'active',
  invited_by   uuid references auth.users(id),
  joined_at    timestamptz not null default now(),
  primary key (business_id, user_id)
);

-- One row per auth user (public profile — safe to show in tenant UIs)
create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  full_name           text not null default '',
  phone               text,
  avatar_url          text,
  default_business_id uuid references public.businesses(id) on delete set null,
  created_at          timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- FLEET — vehicles, documents  (§9, §10)
-- ----------------------------------------------------------------------------
create table public.vehicles (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses(id) on delete cascade,
  name           text not null,                            -- e.g. "Hiace" (display name)
  reg_number     text not null,                            -- e.g. "ঢাকা মেট্রো-GA 11-2345"
  brand          text,
  model          text,
  model_year     int,
  variant        text,
  fuel_type      text default 'diesel',                            -- comma list (dual-fuel: 'petrol,cng') — v0.11
  transmission   transmission_type default 'manual',
  engine_cc      int,
  seats          int,
  color          text,
  chassis_no     text,
  engine_no      text,
  purchase_date  date,
  purchase_price numeric(12,2),
  current_value  numeric(12,2),
  current_km     numeric(10,1) not null default 0,         -- "গাড়ির KM"
  status         vehicle_status not null default 'available',
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (business_id, reg_number)
);
create index idx_vehicles_business_status on public.vehicles (business_id, status);
create index idx_vehicles_business_name   on public.vehicles (business_id, name);

create table public.vehicle_documents (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  vehicle_id  uuid not null references public.vehicles(id) on delete cascade,
  doc_type    doc_type not null,
  doc_number  text,
  issue_date  date not null default current_date,             -- v0.11: app always sends one
  expiry_date date,                                        -- NULL = never expires (registration)
  file_url    text,                                        -- Supabase Storage path
  notes       text,
  created_at  timestamptz not null default now()
);
create index idx_docs_business_vehicle on public.vehicle_documents (business_id, vehicle_id);
create index idx_docs_expiry           on public.vehicle_documents (business_id, expiry_date)
  where expiry_date is not null;

-- ----------------------------------------------------------------------------
-- PEOPLE — customers, drivers  (§14, §15)
-- ----------------------------------------------------------------------------
create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name        text not null,
  phone       text,
  company     text,
  address     text,
  nid         text,
  notes       text,
  created_at  timestamptz not null default now()
);
create index idx_customers_business on public.customers (business_id, name);
create index idx_customers_phone    on public.customers (business_id, phone);

create table public.drivers (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses(id) on delete cascade,
  user_id        uuid references auth.users(id) on delete set null,  -- optional app login
  name           text not null,
  phone          text,
  address        text,
  nid            text,
  license_no     text,
  license_expiry date,
  joining_date   date not null default current_date,          -- v0.11: app/seed always send one
  salary         numeric(12,2) default 0,
  advance        numeric(12,2) default 0,                    -- owner's advance to driver
  due            numeric(12,2) default 0,                    -- driver's due to owner
  is_active      boolean not null default true,
  notes          text,
  created_at     timestamptz not null default now()
);
create index idx_drivers_business on public.drivers (business_id, is_active);

-- ----------------------------------------------------------------------------
-- TRIPS  (§11, §12, §13)
-- ----------------------------------------------------------------------------
create table public.trips (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses(id) on delete cascade,
  trip_code      text,                                      -- human ref e.g. TRP-2026-0001
  customer_id    uuid references public.customers(id) on delete set null,
  vehicle_id     uuid not null references public.vehicles(id) on delete restrict,
  driver_id      uuid references public.drivers(id) on delete set null,
  pickup         text not null,
  destination    text not null,
  start_at       timestamptz not null,
  end_at         timestamptz not null,
  rental_type    rental_type not null default 'per_trip',
  rate           numeric(12,2) default 0,                   -- agreed rate (type-dependent)
  total_amount   numeric(12,2) not null default 0,
  advance_amount numeric(12,2) not null default 0,
  due_amount     numeric(12,2) not null default 0,          -- generated app-side from payments
  extra_charges  numeric(12,2) default 0,
  discount       numeric(12,2) default 0,
  start_km       numeric(10,1),
  end_km         numeric(10,1),
  notes          text,
  status         trip_status not null default 'draft',
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint trips_time_order check (end_at > start_at)
);

-- DOUBLE-BOOKING PROTECTION (§12): a vehicle can never have two overlapping
-- confirmed/running trips — enforced by the database itself, not just the UI.
alter table public.trips
  add constraint trips_no_double_booking
  exclude using gist (
    vehicle_id with =,
    tstzrange(start_at, end_at) with &&
  ) where (status in ('confirmed','running'));

create index idx_trips_business_start   on public.trips (business_id, start_at desc);
create index idx_trips_vehicle_window   on public.trips (vehicle_id, start_at, end_at)
  where status in ('confirmed','running');
create index idx_trips_customer         on public.trips (customer_id);
create index idx_trips_driver           on public.trips (driver_id, start_at desc);

-- Per-trip cost lines used for Trip Profit (§13)
create table public.trip_expenses (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  trip_id     uuid not null references public.trips(id) on delete cascade,
  category    expense_category not null,
  amount      numeric(12,2) not null check (amount >= 0),
  notes       text,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);
create index idx_trip_expenses_trip on public.trip_expenses (trip_id);

-- ----------------------------------------------------------------------------
-- FUEL  (§16)
-- ----------------------------------------------------------------------------
create table public.fuel_entries (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  vehicle_id      uuid not null references public.vehicles(id) on delete restrict,
  trip_id         uuid references public.trips(id) on delete set null,
  driver_id       uuid references public.drivers(id) on delete set null,
  entry_date      date not null default current_date,
  odometer_km     numeric(10,1),
  fuel_type       fuel_type,
  litres          numeric(8,2) not null check (litres > 0),
  price_per_litre numeric(8,2) not null check (price_per_litre >= 0),
  total_cost      numeric(12,2) not null,
  station         text,
  receipt_url     text,
  notes           text,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now()
);
create index idx_fuel_business_date on public.fuel_entries (business_id, entry_date desc);
create index idx_fuel_vehicle_date  on public.fuel_entries (vehicle_id, entry_date desc);

-- ----------------------------------------------------------------------------
-- MAINTENANCE — configurable intervals + logs  (§17, §18)
-- ----------------------------------------------------------------------------
create table public.maintenance_schedule (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.businesses(id) on delete cascade,
  vehicle_id       uuid not null references public.vehicles(id) on delete cascade,
  item             maint_item not null default 'other',
  custom_name      text,
  last_service_date date,
  last_service_km  numeric(10,1),
  interval_km      numeric(10,1),                           -- by manufacturer/owner preference
  interval_days    int,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint maintenance_interval_check check (
    interval_km is not null or interval_days is not null
  )
);
create index idx_maint_sched_vehicle on public.maintenance_schedule (business_id, vehicle_id);

create table public.maintenance_logs (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  vehicle_id      uuid not null references public.vehicles(id) on delete cascade,
  schedule_id     uuid references public.maintenance_schedule(id) on delete set null,
  item            maint_item not null default 'other',
  service_date    date not null default current_date,
  service_km      numeric(10,1),
  total_cost      numeric(12,2) not null default 0,
  parts_cost      numeric(12,2) default 0,
  labour_cost     numeric(12,2) default 0,
  workshop        text,
  warranty_months int,
  notes           text,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now()
);
create index idx_maint_logs_vehicle_date on public.maintenance_logs (business_id, vehicle_id, service_date desc);

-- Repairs (§21), tyres (§22), batteries (§23)
create table public.repairs (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  vehicle_id    uuid not null references public.vehicles(id) on delete cascade,
  problem       text not null,
  repair_date   date not null default current_date,
  odometer_km   numeric(10,1),
  workshop      text,
  mechanic      text,
  parts_cost    numeric(12,2) default 0,
  labour_cost   numeric(12,2) default 0,
  other_cost    numeric(12,2) default 0,
  total_cost    numeric(12,2) not null default 0,
  warranty_until date,
  photos        jsonb default '[]'::jsonb,                  -- Supabase Storage paths
  invoice_url   text,
  notes         text,
  created_at    timestamptz not null default now()
);
create index idx_repairs_vehicle on public.repairs (business_id, vehicle_id, repair_date desc);

create table public.tyres (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  vehicle_id      uuid not null references public.vehicles(id) on delete cascade,
  brand           text,
  size            text,
  position        text,                                     -- e.g. FL, FR, RL, RR, Spare
  purchase_date   date,
  purchase_cost   numeric(12,2),
  install_date    date,
  install_km      numeric(10,1),
  removal_date    date,
  removal_reason  text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);
create index idx_tyres_vehicle on public.tyres (business_id, vehicle_id, is_active);

create table public.batteries (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  vehicle_id      uuid not null references public.vehicles(id) on delete cascade,
  brand           text,
  model           text,
  purchase_date   date,
  cost            numeric(12,2),
  warranty_months int,
  install_date    date,
  install_km      numeric(10,1),
  replacement_date date,
  replacement_reason text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);
create index idx_batteries_vehicle on public.batteries (business_id, vehicle_id, is_active);

-- ----------------------------------------------------------------------------
-- FINANCE — incomes, expenses, payments  (§24, §25, §26)
-- ----------------------------------------------------------------------------
create table public.incomes (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  income_date     date not null default current_date,
  category        income_category not null default 'rental',
  customer_id     uuid references public.customers(id) on delete set null,
  vehicle_id      uuid references public.vehicles(id) on delete set null,
  trip_id         uuid references public.trips(id) on delete set null,
  amount          numeric(12,2) not null check (amount > 0),
  payment_method  payment_method default 'cash',
  notes           text,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now()
);
create index idx_incomes_business_date on public.incomes (business_id, income_date desc);
create index idx_incomes_customer      on public.incomes (customer_id);

create table public.expenses (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  expense_date  date not null default current_date,
  category      expense_category not null default 'misc',
  payment_method payment_method default 'cash',              -- v0.11: app writes method on expenses
  vehicle_id    uuid references public.vehicles(id) on delete set null,
  trip_id       uuid references public.trips(id) on delete set null,
  amount        numeric(12,2) not null check (amount > 0),
  paid_by       text,                                       -- who paid out of pocket
  vendor        text,
  receipt_url   text,
  notes         text,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now()
);
create index idx_expenses_business_date on public.expenses (business_id, expense_date desc);

create table public.payments (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  trip_id     uuid references public.trips(id) on delete set null,
  invoice_id  uuid,                                         -- fk added by 0003 billing module
  amount      numeric(12,2) not null check (amount > 0),
  method      payment_method not null default 'cash',
  paid_at     timestamptz not null default now(),
  reference   text,                                         -- trx id / cheque no
  receipt_no  text,
  notes       text,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);
create index idx_payments_business_date on public.payments (business_id, paid_at desc);
create index idx_payments_customer      on public.payments (customer_id);

-- ----------------------------------------------------------------------------
-- BILLING DOCS — quotation / invoice / receipt  (§27, §28, §29)
-- ----------------------------------------------------------------------------
create table public.quotations (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  quote_code      text not null,
  customer_id     uuid references public.customers(id) on delete set null,
  vehicle_id      uuid references public.vehicles(id) on delete set null,
  trip_summary    text,
  rate            numeric(12,2) default 0,
  additional      jsonb default '[]'::jsonb,                 -- [{label, amount}]
  terms           text,
  status          quote_status not null default 'draft',
  valid_until     date,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  unique (business_id, quote_code)
);

create table public.invoices (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  invoice_code  text not null,
  customer_id   uuid references public.customers(id) on delete set null,
  trip_id       uuid references public.trips(id) on delete set null,
  vehicle_id    uuid references public.vehicles(id) on delete set null,
  subtotal      numeric(12,2) not null default 0,
  discount      numeric(12,2) not null default 0,
  total_amount  numeric(12,2) not null default 0,
  paid_amount   numeric(12,2) not null default 0,
  due_amount    numeric(12,2) generated always as (total_amount - paid_amount) stored,
  status        invoice_status not null default 'unpaid',
  issue_date    date not null default current_date,
  due_date      date,
  notes         text,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  unique (business_id, invoice_code)
);

-- receipts are printed documents referencing a payment
create table public.receipts (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  receipt_code text not null,
  payment_id  uuid references public.payments(id) on delete cascade,
  amount      numeric(12,2) not null,
  issued_at   timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  unique (business_id, receipt_code)
);

-- ----------------------------------------------------------------------------
-- REMINDERS & NOTIFICATIONS  (§31, §32)
-- ----------------------------------------------------------------------------
create table public.reminders (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  r_type      reminder_type not null,
  title       text not null,                                -- simple Bangla wording
  message     text not null,                                -- "Hiace-এর Fitness 7 দিনের মধ্যে শেষ হবে।"
  ref_table   text,
  ref_id      uuid,
  due_date    date not null,
  severity    text not null default 'info',                 -- info | warning | danger
  status      reminder_status not null default 'pending',
  created_at  timestamptz not null default now()
);
create index idx_reminders_business_due on public.reminders (business_id, status, due_date);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  body        text,
  data        jsonb default '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index idx_notifications_user on public.notifications (user_id, read_at);

-- ----------------------------------------------------------------------------
-- VEHICLE SALE MARKETPLACE  (§34) — architecture only, build in Phase 15
-- ----------------------------------------------------------------------------
create table public.vehicle_listings (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  vehicle_id  uuid not null references public.vehicles(id) on delete cascade,
  slug        text not null,                                -- /vehicle-for-sale/toyota-hiace-2010
  asking_price numeric(12,2),
  description text,
  photos      jsonb default '[]'::jsonb,
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (business_id, slug)
);

create table public.vehicle_sales (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.businesses(id) on delete cascade,
  vehicle_id       uuid not null references public.vehicles(id) on delete restrict,
  listing_id       uuid references public.vehicle_listings(id) on delete set null,
  buyer_name       text not null,
  buyer_phone      text,
  sale_date        date not null default current_date,
  sale_price       numeric(12,2) not null,
  selling_expense  numeric(12,2) not null default 0,
  notes            text,
  created_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- AUDIT LOG  (§56) — who did what, when
-- ----------------------------------------------------------------------------
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  action      text not null,                                -- create | update | delete | login | payment…
  entity      text not null,                                -- table name
  entity_id   uuid,
  old_values  jsonb,
  new_values  jsonb,
  created_at  timestamptz not null default now()
);
create index idx_audit_business_time on public.audit_logs (business_id, created_at desc);

-- ----------------------------------------------------------------------------
-- SHARED TRIGGERS — updated_at
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_vehicles_updated before update on public.vehicles
  for each row execute function public.set_updated_at();
create trigger trg_trips_updated before update on public.trips
  for each row execute function public.set_updated_at();
create trigger trg_maint_sched_updated before update on public.maintenance_schedule
  for each row execute function public.set_updated_at();
create trigger trg_businesses_updated before update on public.businesses
  for each row execute function public.set_updated_at();
