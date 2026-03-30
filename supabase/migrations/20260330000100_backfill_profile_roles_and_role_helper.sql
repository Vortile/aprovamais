-- Backfill profile data from auth metadata for existing users.
update public.profiles as profiles
set
  role = coalesce(users.raw_user_meta_data->>'role', profiles.role),
  full_name = coalesce(users.raw_user_meta_data->>'full_name', profiles.full_name)
from auth.users as users
where users.id = profiles.id
  and (
    profiles.role is distinct from coalesce(users.raw_user_meta_data->>'role', profiles.role)
    or profiles.full_name is distinct from coalesce(users.raw_user_meta_data->>'full_name', profiles.full_name)
  );

-- Resolve the application role from the strongest available source.
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    auth.jwt() ->> 'user_role',
    (
      select profiles.role
      from public.profiles as profiles
      where profiles.id = auth.uid()
    ),
    auth.jwt() -> 'user_metadata' ->> 'role'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'admin';
$$;