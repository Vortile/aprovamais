-- ============================================================
-- Teacher Platform — Initial Schema
-- Run: supabase db push
-- ============================================================

-- profiles (extends auth.users)
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text,
  role        text not null default 'aluno' check (role in ('admin', 'aluno')),
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'aluno'),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- alunos
create table public.alunos (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid references public.profiles(id) on delete set null,
  grade          text,
  subject_focus  text[],
  notes          text,
  created_at     timestamptz not null default now()
);

-- materiais
create table public.materiais (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  file_url     text,
  subject      text,
  grade_level  text,
  uploaded_by  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- financeiro
create table public.financeiro (
  id         uuid primary key default gen_random_uuid(),
  aluno_id   uuid references public.alunos(id) on delete cascade,
  amount     numeric not null check (amount >= 0),
  due_date   date,
  paid_at    timestamptz,
  notes      text,
  created_at timestamptz not null default now()
);

-- tarefas (scaffold — no UI yet)
create table public.tarefas (
  id          uuid primary key default gen_random_uuid(),
  title       text,
  description text,
  due_date    date,
  material_id uuid references public.materiais(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles   enable row level security;
alter table public.alunos     enable row level security;
alter table public.materiais  enable row level security;
alter table public.financeiro enable row level security;
alter table public.tarefas    enable row level security;

-- Helper: check if current user is admin
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── profiles ──────────────────────────────────────────────────
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin());

-- ── alunos ────────────────────────────────────────────────────
create policy "Admins manage alunos"
  on public.alunos for all
  using (public.is_admin());

create policy "Aluno reads own record"
  on public.alunos for select
  using (profile_id = auth.uid());

-- ── materiais ─────────────────────────────────────────────────
create policy "Admins manage materiais"
  on public.materiais for all
  using (public.is_admin());

create policy "Alunos read materiais"
  on public.materiais for select
  using (auth.role() = 'authenticated');

-- ── financeiro ────────────────────────────────────────────────
create policy "Admins manage financeiro"
  on public.financeiro for all
  using (public.is_admin());

create policy "Aluno reads own financeiro"
  on public.financeiro for select
  using (
    aluno_id in (
      select id from public.alunos where profile_id = auth.uid()
    )
  );

-- ── tarefas ───────────────────────────────────────────────────
create policy "Admins manage tarefas"
  on public.tarefas for all
  using (public.is_admin());

create policy "Alunos read tarefas"
  on public.tarefas for select
  using (auth.role() = 'authenticated');
