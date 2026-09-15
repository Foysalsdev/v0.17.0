-- ============================================================================
-- গাড়িখাতা (GarirKhata) — ক্লাউড মাইগ্রেশন ০০০৩
-- এই ফাইলটি Supabase Dashboard → SQL Editor → New query-তে পেস্ট করে Run করুন।
--
-- কী করবে এই স্ক্রিপ্ট:
--   ১. লগইন ইউজার বানাবে (ফোন নম্বর দিয়েই লগইন, আগের মতোই পাসওয়ার্ড)
--   ২. "রহিম ট্রাভেলস" ব্যবসাটি সব ডেটা সহ ক্লাউডে বসাবে
--   ৩. ড্রাইভার-মোড চালু করার অনুমতি (RLS) ঠিক করবে
--   ৪. শেষে একটি রিপোর্ট দেখাবে — সব সারি গোনা থাকবে
--
-- নিরাপদ: একাধিকবার চালালেও সমস্যা নেই (আগের ডেটা মুছে নতুন করে বসাবে)।
-- লগইন: 01711223344/owner123 · 01812345678/manager123 · 01815223344/driver123
-- (আসল ব্যবহার শুরুর আগে পাসওয়ার্ড বদলে নেওয়া ভালো)
-- ============================================================================

begin;

-- ০) আগের মাইগ্রেশন থাকলে মুছে ফেলা (idempotent)
delete from auth.users where email like '%@garirkhata.app';

-- ১) লগইন ইউজার (auth.users) — ফোন নম্বরই ইউজার, পাসওয়ার্ড bcrypt
insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values ('a0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', '01711223344@garirkhata.app', crypt('owner123', gen_salt('bf')), now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', 'মোঃ রহিম উদ্দিন'));
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000001', 'email', '01711223344@garirkhata.app', 'email_verified', true), 'email', now(), now(), now());

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values ('a0000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', '01812345678@garirkhata.app', crypt('manager123', gen_salt('bf')), now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', 'নাজমুল হাসান'));
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000002', 'email', '01812345678@garirkhata.app', 'email_verified', true), 'email', now(), now(), now());

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values ('a0000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', '01815223344@garirkhata.app', crypt('driver123', gen_salt('bf')), now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', 'জসিম উদ্দিন'));
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), 'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003', jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000003', 'email', '01815223344@garirkhata.app', 'email_verified', true), 'email', now(), now(), now());

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values ('a0000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', '01617556677@garirkhata.app', crypt('driver123', gen_salt('bf')), now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', 'সেলিম মিয়া'));
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), 'a0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000004', jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000004', 'email', '01617556677@garirkhata.app', 'email_verified', true), 'email', now(), now(), now());

-- ২) ব্যবসা + টিম (tenant)
insert into public.businesses (id, name, owner_user_id, phone, address, plan, created_at, updated_at)
values ('b0000000-0000-4000-8000-000000000001', 'রহিম ট্রাভেলস', 'a0000000-0000-4000-8000-000000000001', '01711223344', 'মিরপুর ১০, ঢাকা', 'free', now(), now());
insert into public.business_members (business_id, user_id, role, status, joined_at)
values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'owner', 'active', now());
insert into public.business_members (business_id, user_id, role, status, joined_at)
values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'manager', 'active', now());
insert into public.business_members (business_id, user_id, role, status, joined_at)
values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'driver', 'active', now());
insert into public.business_members (business_id, user_id, role, status, joined_at)
values ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'driver', 'active', now());

-- প্রোফাইলে ফোন নম্বর বসানো (ট্রিগার নাম-টা নিয়েছে, ফোন এখানে)
insert into public.profiles (id, full_name, phone, default_business_id)
values ('a0000000-0000-4000-8000-000000000001', 'মোঃ রহিম উদ্দিন', '01711223344', 'b0000000-0000-4000-8000-000000000001')
on conflict (id) do update set full_name = excluded.full_name, phone = excluded.phone, default_business_id = excluded.default_business_id;
insert into public.profiles (id, full_name, phone, default_business_id)
values ('a0000000-0000-4000-8000-000000000002', 'নাজমুল হাসান', '01812345678', 'b0000000-0000-4000-8000-000000000001')
on conflict (id) do update set full_name = excluded.full_name, phone = excluded.phone, default_business_id = excluded.default_business_id;
insert into public.profiles (id, full_name, phone, default_business_id)
values ('a0000000-0000-4000-8000-000000000003', 'জসিম উদ্দিন', '01815223344', 'b0000000-0000-4000-8000-000000000001')
on conflict (id) do update set full_name = excluded.full_name, phone = excluded.phone, default_business_id = excluded.default_business_id;
insert into public.profiles (id, full_name, phone, default_business_id)
values ('a0000000-0000-4000-8000-000000000004', 'সেলিম মিয়া', '01617556677', 'b0000000-0000-4000-8000-000000000001')
on conflict (id) do update set full_name = excluded.full_name, phone = excluded.phone, default_business_id = excluded.default_business_id;

-- ৩) গাড়ি
insert into public.vehicles (id, business_id, name, reg_number, brand, model, model_year, fuel_type, transmission, engine_cc, seats, color, current_km, status, purchase_price, current_value, created_at, updated_at)
values ('10000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Hiace', 'ঢাকা মেট্রো-GA 11-2345', 'Toyota', 'Hiace Super GL', 2010, 'diesel', 'manual', 2890, 28, 'সাদা', 90100, 'on_trip', 1850000, 2200000, '2026-09-13T06:28:35.910Z', '2026-09-13T06:28:35.910Z');
insert into public.vehicles (id, business_id, name, reg_number, brand, model, model_year, fuel_type, transmission, engine_cc, seats, color, current_km, status, purchase_price, current_value, created_at, updated_at)
values ('10000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Noah', 'ঢাকা মেট্রো-TA 45-6789', 'Toyota', 'Noah', 2018, 'petrol', 'automatic', 1998, 7, 'সিলভার', 64400, 'available', 2650000, 3100000, '2026-09-13T06:28:35.911Z', '2026-09-13T06:28:35.911Z');
insert into public.vehicles (id, business_id, name, reg_number, brand, model, model_year, fuel_type, transmission, engine_cc, seats, color, current_km, status, purchase_price, current_value, created_at, updated_at)
values ('10000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'Premio', 'ঢাকা মেট্রো-B 2103', 'Toyota', 'Premio', 2015, 'petrol', 'automatic', 1500, 5, 'কালো', 112800, 'maintenance', 1450000, 1350000, '2026-09-13T06:28:35.913Z', '2026-09-13T06:28:35.913Z');

-- ৪) কাগজপত্র
insert into public.vehicle_documents (id, business_id, vehicle_id, doc_type, doc_number, issue_date, expiry_date, notes)
values ('e0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'fitness', 'FIT-2023-1187', '2025-09-20', '2026-09-20', null);
insert into public.vehicle_documents (id, business_id, vehicle_id, doc_type, doc_number, issue_date, expiry_date, notes)
values ('e0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'tax_token', 'TAX-8821', '2025-10-28', '2026-10-28', null);
insert into public.vehicle_documents (id, business_id, vehicle_id, doc_type, doc_number, issue_date, expiry_date, notes)
values ('e0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'insurance', 'INS-5514', '2025-11-12', '2026-11-12', null);
insert into public.vehicle_documents (id, business_id, vehicle_id, doc_type, doc_number, issue_date, expiry_date, notes)
values ('e0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'registration', 'GA-11-2345', '2016-01-09', '2028-09-12', null);
insert into public.vehicle_documents (id, business_id, vehicle_id, doc_type, doc_number, issue_date, expiry_date, notes)
values ('e0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'fitness', 'FIT-2024-903', '2026-01-11', '2027-01-11', null);
insert into public.vehicle_documents (id, business_id, vehicle_id, doc_type, doc_number, issue_date, expiry_date, notes)
values ('e0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'tax_token', 'TAX-7741', '2025-12-12', '2026-12-12', null);
insert into public.vehicle_documents (id, business_id, vehicle_id, doc_type, doc_number, issue_date, expiry_date, notes)
values ('e0000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'insurance', 'INS-3318', '2026-04-01', '2027-04-01', null);
insert into public.vehicle_documents (id, business_id, vehicle_id, doc_type, doc_number, issue_date, expiry_date, notes)
values ('e0000000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'route_permit', 'RP-229', '2025-10-08', '2026-10-08', null);
insert into public.vehicle_documents (id, business_id, vehicle_id, doc_type, doc_number, issue_date, expiry_date, notes)
values ('e0000000-0000-4000-8000-000000000009', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'fitness', 'FIT-2022-447', '2025-09-08', '2026-09-08', null);
insert into public.vehicle_documents (id, business_id, vehicle_id, doc_type, doc_number, issue_date, expiry_date, notes)
values ('e0000000-0000-4000-8000-000000000010', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'tax_token', 'TAX-6612', '2025-10-18', '2026-10-18', null);
insert into public.vehicle_documents (id, business_id, vehicle_id, doc_type, doc_number, issue_date, expiry_date, notes)
values ('e0000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'insurance', 'INS-4409', '2025-11-27', '2026-11-27', null);

-- ৫) কাস্টমার
insert into public.customers (id, business_id, name, phone, company, address, created_at)
values ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'হোটেল সি ক্রাউন', '034163221', 'কক্সবাজার', 'কলাতলী, কক্সবাজার', '2024-12-02T12:00:00.000Z');
insert into public.customers (id, business_id, name, phone, company, address, created_at)
values ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'কামাল হোসেন', '01712345678', 'কামাল এন্টারপ্রাইজ', 'বনানী, ঢাকা', '2025-08-09T12:00:00.000Z');
insert into public.customers (id, business_id, name, phone, company, address, created_at)
values ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'সাবরিনা আহমেদ', '01819987654', null, 'ধানমন্ডি, ঢাকা', '2026-02-15T12:00:00.000Z');

-- ৬) ড্রাইভার (লগইন ইউজারের সাথে যুক্ত)
insert into public.drivers (id, business_id, user_id, name, phone, license_no, license_expiry, joining_date, salary, advance, due, is_active, created_at)
values ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'জসিম উদ্দিন', '01815223344', 'DL-04-2015-8821', '2027-10-18', '2024-09-23', 18000, 0, 0, true, '2026-09-13T06:28:35.812Z');
insert into public.drivers (id, business_id, user_id, name, phone, license_no, license_expiry, joining_date, salary, advance, due, is_active, created_at)
values ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'সেলিম মিয়া', '01617556677', 'DL-11-2017-3309', '2026-10-03', '2025-05-21', 15000, 2000, 0, true, '2026-09-13T06:28:35.865Z');
insert into public.drivers (id, business_id, user_id, name, phone, license_no, license_expiry, joining_date, salary, advance, due, is_active, created_at)
values ('d0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', null, 'রফিকুল ইসলাম', '01919887766', 'DL-02-2013-5117', '2027-07-10', '2023-09-09', 16000, 0, 0, false, '2026-09-13T06:28:35.909Z');

-- ৭) ট্রিপ (TR-000N রেফারেন্স অটুট)
insert into public.trips (id, business_id, trip_code, customer_id, vehicle_id, driver_id, pickup, destination, start_at, end_at, rental_type, total_amount, advance_amount, due_amount, start_km, end_km, notes, status, created_by, created_at, updated_at)
values ('20000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'TR-0006', 'c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002', 'গুলশান', 'শাহজালাল এয়ারপোর্ট', '2026-09-01T04:30:00.000Z', '2026-09-01T06:30:00.000Z', 'airport', 2200, 2200, 0, 63300, 63420, null, 'completed', 'a0000000-0000-4000-8000-000000000001', '2026-09-13T06:28:35.926Z', '2026-09-13T06:28:35.926Z');
insert into public.trips (id, business_id, trip_code, customer_id, vehicle_id, driver_id, pickup, destination, start_at, end_at, rental_type, total_amount, advance_amount, due_amount, start_km, end_km, notes, status, created_by, created_at, updated_at)
values ('20000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'TR-0005', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'ঢাকা', 'কক্সবাজার', '2026-09-08T07:00:00.000Z', '2026-09-10T21:00:00.000Z', 'tour', 24000, 24000, 0, 88350, 88850, null, 'completed', 'a0000000-0000-4000-8000-000000000001', '2026-09-13T06:28:35.924Z', '2026-09-13T06:28:35.924Z');
insert into public.trips (id, business_id, trip_code, customer_id, vehicle_id, driver_id, pickup, destination, start_at, end_at, rental_type, total_amount, advance_amount, due_amount, start_km, end_km, notes, status, created_by, created_at, updated_at)
values ('20000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'TR-0004', 'c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'ঢাকা', 'চট্টগ্রাম', '2026-09-12T06:00:00.000Z', '2026-09-12T23:00:00.000Z', 'per_trip', 16000, 16000, 0, 88850, 89350, null, 'completed', 'a0000000-0000-4000-8000-000000000001', '2026-09-13T06:28:35.922Z', '2026-09-13T06:28:35.922Z');
insert into public.trips (id, business_id, trip_code, customer_id, vehicle_id, driver_id, pickup, destination, start_at, end_at, rental_type, total_amount, advance_amount, due_amount, start_km, end_km, notes, status, created_by, created_at, updated_at)
values ('20000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', 'TR-0001', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'ঢাকা (মিরপুর ১০)', 'কক্সবাজার (হোটেল সি ক্রাউন)', '2026-09-13T07:00:00.000Z', '2026-09-15T21:00:00.000Z', 'tour', 24500, 15000, 9500, 89350, 89950, null, 'completed', 'a0000000-0000-4000-8000-000000000001', '2026-09-13T06:28:35.918Z', '2026-09-13T06:28:35.918Z');
insert into public.trips (id, business_id, trip_code, customer_id, vehicle_id, driver_id, pickup, destination, start_at, end_at, rental_type, total_amount, advance_amount, due_amount, start_km, end_km, notes, status, created_by, created_at, updated_at)
values ('20000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000001', 'TR-0008', 'c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'গুলশান', 'কক্সবাজার', '2026-09-13T07:00:00.000Z', '2026-09-13T15:00:00.000Z', 'per_trip', 24000, 0, 24000, null, null, null, 'confirmed', 'a0000000-0000-4000-8000-000000000001', '2026-09-13T06:31:23.168Z', '2026-09-13T06:31:23.168Z');
insert into public.trips (id, business_id, trip_code, customer_id, vehicle_id, driver_id, pickup, destination, start_at, end_at, rental_type, total_amount, advance_amount, due_amount, start_km, end_km, notes, status, created_by, created_at, updated_at)
values ('20000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000001', 'TR-0002', 'c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002', 'বনানী', 'শাহজালাল এয়ারপোর্ট', '2026-09-13T17:00:00.000Z', '2026-09-13T19:00:00.000Z', 'airport', 2500, 0, 2500, null, null, null, 'confirmed', 'a0000000-0000-4000-8000-000000000001', '2026-09-13T06:28:35.919Z', '2026-09-13T06:28:35.919Z');
insert into public.trips (id, business_id, trip_code, customer_id, vehicle_id, driver_id, pickup, destination, start_at, end_at, rental_type, total_amount, advance_amount, due_amount, start_km, end_km, notes, status, created_by, created_at, updated_at)
values ('20000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000001', 'TR-0003', 'c0000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', 'ধানমন্ডি', 'সিলেট (রাতারগুল)', '2026-09-14T08:00:00.000Z', '2026-09-16T20:00:00.000Z', 'tour', 18000, 5000, 13000, 64000, 64400, null, 'completed', 'a0000000-0000-4000-8000-000000000001', '2026-09-13T06:28:35.920Z', '2026-09-13T06:28:35.920Z');

-- ৭খ) ট্রিপ খরচ
insert into public.trip_expenses (id, business_id, trip_id, category, amount, notes, created_by, created_at)
values ('30000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 'fuel', 5800, 'ঢাকা-চট্টগ্রাম যাত্রা', 'a0000000-0000-4000-8000-000000000001', now());
insert into public.trip_expenses (id, business_id, trip_id, category, amount, notes, created_by, created_at)
values ('30000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 'toll', 400, null, 'a0000000-0000-4000-8000-000000000001', now());
insert into public.trip_expenses (id, business_id, trip_id, category, amount, notes, created_by, created_at)
values ('30000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 'parking', 100, null, 'a0000000-0000-4000-8000-000000000001', now());
insert into public.trip_expenses (id, business_id, trip_id, category, amount, notes, created_by, created_at)
values ('30000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 'driver_allowance', 1000, null, 'a0000000-0000-4000-8000-000000000001', now());
insert into public.trip_expenses (id, business_id, trip_id, category, amount, notes, created_by, created_at)
values ('30000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'fuel', 6200, null, 'a0000000-0000-4000-8000-000000000001', now());
insert into public.trip_expenses (id, business_id, trip_id, category, amount, notes, created_by, created_at)
values ('30000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'toll', 400, null, 'a0000000-0000-4000-8000-000000000001', now());
insert into public.trip_expenses (id, business_id, trip_id, category, amount, notes, created_by, created_at)
values ('30000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'driver_allowance', 1600, null, 'a0000000-0000-4000-8000-000000000001', now());

-- ৮) তেল
insert into public.fuel_entries (id, business_id, vehicle_id, entry_date, odometer_km, litres, price_per_litre, total_cost, station, created_by, created_at)
values ('f0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', '2026-08-27', 63100, 35, 120, 4200, 'জমজম ফুয়েল, গুলশান', 'a0000000-0000-4000-8000-000000000001', '2026-08-27T12:00:00.000Z');
insert into public.fuel_entries (id, business_id, vehicle_id, entry_date, odometer_km, litres, price_per_litre, total_cost, station, created_by, created_at)
values ('f0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '2026-09-02', 88350, 59.5, 92, 5474, 'পদ্মা পেট্রোল পাম্প, ঢাকা', 'a0000000-0000-4000-8000-000000000001', '2026-09-02T10:00:00.000Z');
insert into public.fuel_entries (id, business_id, vehicle_id, entry_date, odometer_km, litres, price_per_litre, total_cost, station, created_by, created_at)
values ('f0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', '2026-09-04', 63564, 38, 120, 4560, 'জমজম ফুয়েল, গুলশান', 'a0000000-0000-4000-8000-000000000001', '2026-09-04T12:00:00.000Z');
insert into public.fuel_entries (id, business_id, vehicle_id, entry_date, odometer_km, litres, price_per_litre, total_cost, station, created_by, created_at)
values ('f0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '2026-09-07', 88850, 60, 92, 5520, 'পদ্মা পেট্রোল পাম্প, ঢাকা', 'a0000000-0000-4000-8000-000000000001', '2026-09-07T10:00:00.000Z');
insert into public.fuel_entries (id, business_id, vehicle_id, entry_date, odometer_km, litres, price_per_litre, total_cost, station, created_by, created_at)
values ('f0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', '2026-09-11', 64000, 40, 122, 4880, 'জমজম ফুয়েল, গুলশান', 'a0000000-0000-4000-8000-000000000001', '2026-09-11T15:00:00.000Z');
insert into public.fuel_entries (id, business_id, vehicle_id, entry_date, odometer_km, litres, price_per_litre, total_cost, station, created_by, created_at)
values ('f0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '2026-09-12', 89350, 62, 93.5, 5797, 'পদ্মা পেট্রোল পাম্প, ঢাকা', 'a0000000-0000-4000-8000-000000000001', '2026-09-12T09:00:00.000Z');

-- ৯) সার্ভিস (শিডিউল + ইতিহাস)
insert into public.maintenance_schedule (id, business_id, vehicle_id, item, last_service_date, last_service_km, interval_km, created_at, updated_at)
values ('40000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'engine_oil', '2026-07-20', 84500, 5500, now(), now());
insert into public.maintenance_schedule (id, business_id, vehicle_id, item, last_service_date, last_service_km, interval_km, created_at, updated_at)
values ('40000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'oil_filter', '2026-07-20', 84500, 5500, now(), now());
insert into public.maintenance_schedule (id, business_id, vehicle_id, item, last_service_date, last_service_km, interval_km, created_at, updated_at)
values ('40000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'brake_pad', '2026-05-16', 80400, 5000, now(), now());
insert into public.maintenance_schedule (id, business_id, vehicle_id, item, last_service_date, last_service_km, interval_km, created_at, updated_at)
values ('40000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'ac_service', '2026-05-06', 80000, 20000, now(), now());
insert into public.maintenance_schedule (id, business_id, vehicle_id, item, last_service_date, last_service_km, interval_km, created_at, updated_at)
values ('40000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'engine_oil', '2026-08-09', 62000, 5000, now(), now());
insert into public.maintenance_schedule (id, business_id, vehicle_id, item, last_service_date, last_service_km, interval_km, created_at, updated_at)
values ('40000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'ac_service', '2026-08-24', 60000, 15000, now(), now());
insert into public.maintenance_schedule (id, business_id, vehicle_id, item, last_service_date, last_service_km, interval_km, created_at, updated_at)
values ('40000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'wheel_alignment', '2026-08-16', 61000, 8000, now(), now());
insert into public.maintenance_schedule (id, business_id, vehicle_id, item, last_service_date, last_service_km, interval_km, created_at, updated_at)
values ('40000000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'engine_oil', '2026-05-16', 106500, 5000, now(), now());
insert into public.maintenance_schedule (id, business_id, vehicle_id, item, last_service_date, last_service_km, interval_km, created_at, updated_at)
values ('40000000-0000-4000-8000-000000000009', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'air_filter', '2026-04-16', 108000, 10000, now(), now());
insert into public.maintenance_logs (id, business_id, vehicle_id, item, service_date, service_km, total_cost, workshop, notes, created_by, created_at)
values ('50000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'ac_service', '2026-08-24', 60000, 3500, 'কুল কার এসি, তেজগাঁও', 'গ্যাস রিফিল + ফিল্টার পরিষ্কার', 'a0000000-0000-4000-8000-000000000001', '2026-08-24T12:00:00.000Z');
insert into public.maintenance_logs (id, business_id, vehicle_id, item, service_date, service_km, total_cost, workshop, notes, created_by, created_at)
values ('50000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'engine_oil', '2026-07-20', 84500, 3800, 'সেফ মোটরস, মিরপুর', 'মোবিল ডিজেল অয়েল 5W-30', 'a0000000-0000-4000-8000-000000000001', '2026-07-20T12:00:00.000Z');
insert into public.maintenance_logs (id, business_id, vehicle_id, item, service_date, service_km, total_cost, workshop, notes, created_by, created_at)
values ('50000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'wheel_alignment', '2026-08-16', 61000, 800, 'টায়ার হাউস, ফার্মগেট', null, 'a0000000-0000-4000-8000-000000000001', '2026-08-16T12:00:00.000Z');
insert into public.maintenance_logs (id, business_id, vehicle_id, item, service_date, service_km, total_cost, workshop, notes, created_by, created_at)
values ('50000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'brake_pad', '2026-07-05', 111500, 2600, 'অটো টেক, মিরপুর', 'সামনের প্যাড বদল', 'a0000000-0000-4000-8000-000000000001', '2026-07-05T12:00:00.000Z');

-- ১০) আয়-খরচ
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', '2026-04-02', 'rental', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 24050, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-04-02T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', '2026-04-07', 'rental', 'c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', null, 24050, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-04-07T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', '2026-04-12', 'rental', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 24050, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-04-12T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', '2026-04-17', 'rental', 'c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', null, 24050, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-04-17T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000001', '2026-04-22', 'corporate', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 51800, 'bank', 'a0000000-0000-4000-8000-000000000001', '2026-04-22T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000001', '2026-05-02', 'rental', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 23075, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-05-02T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000001', '2026-05-07', 'rental', 'c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', null, 23075, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-05-07T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000001', '2026-05-12', 'rental', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 23075, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-05-12T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000009', 'b0000000-0000-4000-8000-000000000001', '2026-05-17', 'rental', 'c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', null, 23075, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-05-17T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000010', 'b0000000-0000-4000-8000-000000000001', '2026-05-22', 'corporate', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 49700, 'bank', 'a0000000-0000-4000-8000-000000000001', '2026-05-22T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000001', '2026-06-02', 'rental', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 26813, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-06-02T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-000000000001', '2026-06-07', 'rental', 'c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', null, 26813, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-06-07T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000013', 'b0000000-0000-4000-8000-000000000001', '2026-06-12', 'rental', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 26813, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-06-12T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000014', 'b0000000-0000-4000-8000-000000000001', '2026-06-17', 'rental', 'c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', null, 26813, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-06-17T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000015', 'b0000000-0000-4000-8000-000000000001', '2026-06-22', 'corporate', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 57750, 'bank', 'a0000000-0000-4000-8000-000000000001', '2026-06-22T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000016', 'b0000000-0000-4000-8000-000000000001', '2026-07-02', 'rental', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 28925, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-07-02T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000017', 'b0000000-0000-4000-8000-000000000001', '2026-07-07', 'rental', 'c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', null, 28925, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-07-07T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000018', 'b0000000-0000-4000-8000-000000000001', '2026-07-12', 'rental', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 28925, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-07-12T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000019', 'b0000000-0000-4000-8000-000000000001', '2026-07-17', 'rental', 'c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', null, 28925, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-07-17T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000020', 'b0000000-0000-4000-8000-000000000001', '2026-07-22', 'corporate', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 62300, 'bank', 'a0000000-0000-4000-8000-000000000001', '2026-07-22T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000021', 'b0000000-0000-4000-8000-000000000001', '2026-08-02', 'rental', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 25350, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-08-02T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000022', 'b0000000-0000-4000-8000-000000000001', '2026-08-07', 'rental', 'c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', null, 25350, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-08-07T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000023', 'b0000000-0000-4000-8000-000000000001', '2026-08-12', 'rental', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 25350, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-08-12T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000024', 'b0000000-0000-4000-8000-000000000001', '2026-08-17', 'rental', 'c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', null, 25350, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-08-17T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000025', 'b0000000-0000-4000-8000-000000000001', '2026-08-22', 'corporate', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 54600, 'bank', 'a0000000-0000-4000-8000-000000000001', '2026-08-22T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000026', 'b0000000-0000-4000-8000-000000000001', '2026-08-22', 'corporate', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', null, 16500, 'bank', 'a0000000-0000-4000-8000-000000000001', '2026-08-22T12:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000027', 'b0000000-0000-4000-8000-000000000001', '2026-08-26', 'rental', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 24000, 'bank', 'a0000000-0000-4000-8000-000000000001', '2026-08-26T11:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000028', 'b0000000-0000-4000-8000-000000000001', '2026-08-28', 'rental', 'c0000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', null, 14500, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-08-28T11:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000029', 'b0000000-0000-4000-8000-000000000001', '2026-08-30', 'extra_km', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 3500, 'bkash', 'a0000000-0000-4000-8000-000000000001', '2026-08-30T12:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000030', 'b0000000-0000-4000-8000-000000000001', '2026-09-01', 'corporate', 'c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003', null, 18000, 'bank', 'a0000000-0000-4000-8000-000000000001', '2026-09-01T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000031', 'b0000000-0000-4000-8000-000000000001', '2026-09-03', 'corporate', 'c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', null, 32000, 'bank', 'a0000000-0000-4000-8000-000000000001', '2026-09-03T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000032', 'b0000000-0000-4000-8000-000000000001', '2026-09-04', 'rental', 'c0000000-0000-4000-8000-000000000003', null, null, 9500, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-09-04T16:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000033', 'b0000000-0000-4000-8000-000000000001', '2026-09-05', 'corporate', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 55000, 'bank', 'a0000000-0000-4000-8000-000000000001', '2026-09-05T10:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000034', 'b0000000-0000-4000-8000-000000000001', '2026-09-07', 'rental', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000004', 15000, 'bank', 'a0000000-0000-4000-8000-000000000001', '2026-09-07T11:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000035', 'b0000000-0000-4000-8000-000000000001', '2026-09-10', 'corporate', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 8000, 'bank', 'a0000000-0000-4000-8000-000000000001', '2026-09-10T14:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000036', 'b0000000-0000-4000-8000-000000000001', '2026-09-12', 'rental', 'c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 16000, 'bkash', 'a0000000-0000-4000-8000-000000000001', '2026-09-12T20:00:00.000Z');
insert into public.incomes (id, business_id, income_date, category, customer_id, vehicle_id, trip_id, amount, payment_method, created_by, created_at)
values ('60000000-0000-4000-8000-000000000037', 'b0000000-0000-4000-8000-000000000001', '2026-09-13', 'rental', 'c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000006', 2500, 'cash', 'a0000000-0000-4000-8000-000000000001', '2026-09-13T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', '2026-04-03', 'fuel', '10000000-0000-4000-8000-000000000001', 8640, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-04-03T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', '2026-04-07', 'fuel', '10000000-0000-4000-8000-000000000001', 8640, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-04-07T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', '2026-04-11', 'driver_salary', null, 18000, 'ড্রাইভার বেতন', 'ড্রাইভার বেতন', 'a0000000-0000-4000-8000-000000000001', '2026-04-11T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', '2026-04-15', 'maintenance', '10000000-0000-4000-8000-000000000001', 8640, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-04-15T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000001', '2026-04-19', 'toll', null, 8640, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-04-19T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000001', '2026-04-23', 'loan_emi', null, 16200, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-04-23T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000001', '2026-04-27', 'cleaning', null, 8640, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-04-27T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000001', '2026-05-03', 'fuel', '10000000-0000-4000-8000-000000000001', 8448, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-05-03T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000009', 'b0000000-0000-4000-8000-000000000001', '2026-05-07', 'fuel', '10000000-0000-4000-8000-000000000001', 8448, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-05-07T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000010', 'b0000000-0000-4000-8000-000000000001', '2026-05-11', 'driver_salary', null, 17600, 'ড্রাইভার বেতন', 'ড্রাইভার বেতন', 'a0000000-0000-4000-8000-000000000001', '2026-05-11T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000001', '2026-05-15', 'maintenance', '10000000-0000-4000-8000-000000000001', 8448, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-05-15T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-000000000001', '2026-05-19', 'toll', null, 8448, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-05-19T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000013', 'b0000000-0000-4000-8000-000000000001', '2026-05-23', 'loan_emi', null, 15840, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-05-23T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000014', 'b0000000-0000-4000-8000-000000000001', '2026-05-27', 'cleaning', null, 8448, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-05-27T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000015', 'b0000000-0000-4000-8000-000000000001', '2026-06-03', 'fuel', '10000000-0000-4000-8000-000000000001', 9216, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-06-03T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000016', 'b0000000-0000-4000-8000-000000000001', '2026-06-07', 'fuel', '10000000-0000-4000-8000-000000000001', 9216, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-06-07T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000017', 'b0000000-0000-4000-8000-000000000001', '2026-06-11', 'driver_salary', null, 19200, 'ড্রাইভার বেতন', 'ড্রাইভার বেতন', 'a0000000-0000-4000-8000-000000000001', '2026-06-11T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000018', 'b0000000-0000-4000-8000-000000000001', '2026-06-15', 'maintenance', '10000000-0000-4000-8000-000000000001', 9216, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-06-15T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000019', 'b0000000-0000-4000-8000-000000000001', '2026-06-19', 'toll', null, 9216, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-06-19T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000020', 'b0000000-0000-4000-8000-000000000001', '2026-06-23', 'loan_emi', null, 17280, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-06-23T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000021', 'b0000000-0000-4000-8000-000000000001', '2026-06-27', 'cleaning', null, 9216, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-06-27T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000022', 'b0000000-0000-4000-8000-000000000001', '2026-07-03', 'fuel', '10000000-0000-4000-8000-000000000001', 9696, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-07-03T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000023', 'b0000000-0000-4000-8000-000000000001', '2026-07-07', 'fuel', '10000000-0000-4000-8000-000000000001', 9696, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-07-07T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000024', 'b0000000-0000-4000-8000-000000000001', '2026-07-11', 'driver_salary', null, 20200, 'ড্রাইভার বেতন', 'ড্রাইভার বেতন', 'a0000000-0000-4000-8000-000000000001', '2026-07-11T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000025', 'b0000000-0000-4000-8000-000000000001', '2026-07-15', 'maintenance', '10000000-0000-4000-8000-000000000001', 9696, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-07-15T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000026', 'b0000000-0000-4000-8000-000000000001', '2026-07-19', 'toll', null, 9696, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-07-19T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000027', 'b0000000-0000-4000-8000-000000000001', '2026-07-23', 'loan_emi', null, 18180, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-07-23T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000028', 'b0000000-0000-4000-8000-000000000001', '2026-07-27', 'cleaning', null, 9696, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-07-27T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000029', 'b0000000-0000-4000-8000-000000000001', '2026-08-03', 'fuel', '10000000-0000-4000-8000-000000000001', 8832, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-08-03T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000030', 'b0000000-0000-4000-8000-000000000001', '2026-08-07', 'fuel', '10000000-0000-4000-8000-000000000001', 8832, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-08-07T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000031', 'b0000000-0000-4000-8000-000000000001', '2026-08-11', 'driver_salary', null, 18400, 'ড্রাইভার বেতন', 'ড্রাইভার বেতন', 'a0000000-0000-4000-8000-000000000001', '2026-08-11T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000032', 'b0000000-0000-4000-8000-000000000001', '2026-08-15', 'maintenance', '10000000-0000-4000-8000-000000000001', 8832, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-08-15T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000033', 'b0000000-0000-4000-8000-000000000001', '2026-08-18', 'loan_emi', null, 24000, 'কিস্তি', 'কিস্তি', 'a0000000-0000-4000-8000-000000000001', '2026-08-18T12:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000034', 'b0000000-0000-4000-8000-000000000001', '2026-08-19', 'toll', null, 8832, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-08-19T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000035', 'b0000000-0000-4000-8000-000000000001', '2026-08-20', 'fuel', '10000000-0000-4000-8000-000000000001', 4800, 'পদ্মা পেট্রোল পাম্প', 'পদ্মা পেট্রোল পাম্প', 'a0000000-0000-4000-8000-000000000001', '2026-08-20T11:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000036', 'b0000000-0000-4000-8000-000000000001', '2026-08-23', 'loan_emi', null, 16560, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-08-23T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000037', 'b0000000-0000-4000-8000-000000000001', '2026-08-24', 'maintenance', '10000000-0000-4000-8000-000000000002', 3500, 'কুল কার এসি', 'কুল কার এসি', 'a0000000-0000-4000-8000-000000000001', '2026-08-24T16:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000038', 'b0000000-0000-4000-8000-000000000001', '2026-08-27', 'cleaning', null, 8832, null, null, 'a0000000-0000-4000-8000-000000000001', '2026-08-27T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000039', 'b0000000-0000-4000-8000-000000000001', '2026-08-27', 'fuel', '10000000-0000-4000-8000-000000000002', 4560, 'জমজম ফুয়েল', 'জমজম ফুয়েল', 'a0000000-0000-4000-8000-000000000001', '2026-08-27T16:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000040', 'b0000000-0000-4000-8000-000000000001', '2026-08-29', 'insurance', '10000000-0000-4000-8000-000000000001', 14500, 'গ্রিন ডেল্টা', 'গ্রিন ডেল্টা', 'a0000000-0000-4000-8000-000000000001', '2026-08-29T10:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000041', 'b0000000-0000-4000-8000-000000000001', '2026-09-01', 'fuel', '10000000-0000-4000-8000-000000000001', 5520, 'পদ্মা পেট্রোল পাম্প', 'পদ্মা পেট্রোল পাম্প', 'a0000000-0000-4000-8000-000000000001', '2026-09-01T14:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000042', 'b0000000-0000-4000-8000-000000000001', '2026-09-03', 'cleaning', null, 300, 'কার ওয়াশ', 'কার ওয়াশ', 'a0000000-0000-4000-8000-000000000001', '2026-09-03T11:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000043', 'b0000000-0000-4000-8000-000000000001', '2026-09-05', 'maintenance', '10000000-0000-4000-8000-000000000003', 4200, 'অটো টেক', 'অটো টেক', 'a0000000-0000-4000-8000-000000000001', '2026-09-05T12:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000044', 'b0000000-0000-4000-8000-000000000001', '2026-09-08', 'toll', '10000000-0000-4000-8000-000000000001', 400, 'টোল প্লাজা', 'টোল প্লাজা', 'a0000000-0000-4000-8000-000000000001', '2026-09-08T17:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000045', 'b0000000-0000-4000-8000-000000000001', '2026-09-10', 'driver_salary', null, 33000, 'জসিম + সেলিম', 'জসিম + সেলিম', 'a0000000-0000-4000-8000-000000000001', '2026-09-10T13:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000046', 'b0000000-0000-4000-8000-000000000001', '2026-09-11', 'fuel', '10000000-0000-4000-8000-000000000002', 4880, 'জমজম ফুয়েল', 'জমজম ফুয়েল', 'a0000000-0000-4000-8000-000000000001', '2026-09-11T15:00:00.000Z');
insert into public.expenses (id, business_id, expense_date, category, vehicle_id, amount, vendor, paid_by, created_by, created_at)
values ('70000000-0000-4000-8000-000000000047', 'b0000000-0000-4000-8000-000000000001', '2026-09-12', 'fuel', '10000000-0000-4000-8000-000000000001', 5797, 'পদ্মা পেট্রোল পাম্প', 'পদ্মা পেট্রোল পাম্প', 'a0000000-0000-4000-8000-000000000001', '2026-09-12T09:30:00.000Z');

-- ১০খ) কোটেশন
insert into public.quotations (id, business_id, quote_code, customer_id, vehicle_id, trip_summary, rate, additional, terms, status, valid_until, created_by, created_at)
values ('80000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'QT-0001', 'c0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'কক্সবাজার — ৩ দিনের ট্যুর প্যাকেজ', 24000, '[]'::jsonb, null, 'accepted', '2026-09-20', 'a0000000-0000-4000-8000-000000000001', '2026-09-13T06:31:20.412Z');

-- ১১) ড্রাইভার-মোড চালু করার RLS অনুমতি (§৩৮)
drop policy if exists trips_driver_update on public.trips;
create policy trips_driver_update on public.trips
  for update using (
    public.user_role_in(business_id) = 'driver'
    and driver_id in (select id from public.drivers d where d.user_id = auth.uid())
  );
drop policy if exists vehicles_driver_update on public.vehicles;
create policy vehicles_driver_update on public.vehicles
  for update using (
    exists (
      select 1 from public.trips t
      where t.vehicle_id = vehicles.id
        and t.status in ('confirmed','running')
        and t.driver_id in (select id from public.drivers d where d.user_id = auth.uid())
    )
  );

commit;

-- ১২) যাচাই — রান করার পর এই SELECT-গুলোর ফলাফল দেখুন
select 'লগইন ইউজার' as তথ্য, count(*) as সংখ্যা from auth.users where email like '%@garirkhata.app'
union all select 'গাড়ি', count(*) from public.vehicles
union all select 'ট্রিপ', count(*) from public.trips
union all select 'কাস্টমার', count(*) from public.customers
union all select 'ড্রাইভার', count(*) from public.drivers
union all select 'আয়', count(*) from public.incomes
union all select 'খরচ', count(*) from public.expenses
union all select 'কোটেশন', count(*) from public.quotations;
