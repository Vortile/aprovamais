alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.profiles
  alter column id set default gen_random_uuid();

alter table public.profiles
  add column if not exists clerk_user_id text,
  add column if not exists email text;

update public.profiles as profiles
set email = users.email
from auth.users as users
where users.id = profiles.id
  and profiles.email is distinct from users.email;

create unique index if not exists profiles_clerk_user_id_unique
  on public.profiles (clerk_user_id)
  where clerk_user_id is not null;

create unique index if not exists profiles_email_unique
  on public.profiles (lower(email))
  where email is not null;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
