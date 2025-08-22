-- Prevent self-demotion and last-admin demotion/deletion
-- This trigger enforces:
-- 1) An ADMIN cannot demote or delete themselves.
-- 2) The last remaining ADMIN cannot be demoted or deleted.

create or replace function public.prevent_admin_demotion()
returns trigger as $$
declare
  admin_count int;
  acting_user uuid;
begin
  select count(*) into admin_count from public.profiles where role = 'ADMIN';
  acting_user := auth.uid();

  if TG_OP = 'UPDATE' then
    if OLD.role = 'ADMIN' and NEW.role <> 'ADMIN' then
      -- Block demoting the last admin
      if admin_count <= 1 then
        raise exception 'Cannot demote the last admin';
      end if;
      -- Block self-demotion
      if acting_user is not null and acting_user = OLD.id then
        raise exception 'Admins cannot demote themselves';
      end if;
    end if;
    return NEW;
  elsif TG_OP = 'DELETE' then
    if OLD.role = 'ADMIN' then
      -- Block deleting the last admin
      if admin_count <= 1 then
        raise exception 'Cannot delete the last admin';
      end if;
      -- Block self-delete
      if acting_user is not null and acting_user = OLD.id then
        raise exception 'Admins cannot delete themselves';
      end if;
    end if;
    return OLD;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- Attach triggers
DROP TRIGGER IF EXISTS trg_prevent_admin_demotion_update ON public.profiles;
CREATE TRIGGER trg_prevent_admin_demotion_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.prevent_admin_demotion();

DROP TRIGGER IF EXISTS trg_prevent_admin_demotion_delete ON public.profiles;
CREATE TRIGGER trg_prevent_admin_demotion_delete
BEFORE DELETE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.prevent_admin_demotion();
