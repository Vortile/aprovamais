create table public.planos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  monthly_amount numeric not null check (monthly_amount >= 0),
  billing_day integer check (billing_day between 1 and 31),
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.planos enable row level security;

alter table public.alunos
  add column if not exists plan_id uuid references public.planos(id) on delete restrict;

create index if not exists alunos_plan_id_idx on public.alunos(plan_id);

create policy "Admins manage planos"
  on public.planos for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Aluno reads own plan"
  on public.planos for select
  using (
    id in (
      select plan_id from public.alunos where profile_id = auth.uid()
    )
  );