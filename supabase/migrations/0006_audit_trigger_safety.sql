-- 0006_audit_trigger_safety.sql
-- v0.13: audit_row_change() এখন কখনো অ্যাপ/SQL-এর কাজ আটকায় না।
-- পটভূমি: businesses (বা auth.users — যার মাধ্যমে owner-বিজনেস cascade হয়)
-- মুছলে FK-cascade আগে বিজনেস-সারি সরিয়ে নেয়; তারপর trips/vehicles/
-- payments-এর AFTER-DELETE audit trigger audit_logs-এ রেকর্ড বসাতে গিয়ে
-- FK violation (23503) দেয় — পুরো delete ব্যর্থ হতো।
-- ফিক্স: বিজনেস আর না থাকলে লগ বাদ; লগ বসাতে না পারলে শুধু warning।
-- (নতুন install-রা 0002-তেই ফিক্সড ভার্সন পায় — এই ফাইল পুরনো DB-দের জন্য।)
-- লাইভ DB-র জন্য download/v0.13-audit-fix-and-hardening.sql (এটা + পলিসি + cleanup)।

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
