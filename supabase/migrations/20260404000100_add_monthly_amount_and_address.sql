-- Add per-student monthly amount (decoupled from plan templates)
alter table public.alunos
  add column if not exists monthly_amount numeric check (monthly_amount >= 0);

-- Add address for future geo-mapping features
alter table public.alunos
  add column if not exists address text;

alter table public.profiles
  add column if not exists address text;
