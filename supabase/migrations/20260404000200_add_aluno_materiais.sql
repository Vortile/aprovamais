create table public.aluno_materiais (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  material_id uuid not null references public.materiais(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unique(aluno_id, material_id)
);

alter table public.aluno_materiais enable row level security;

create index aluno_materiais_aluno_id_idx on public.aluno_materiais(aluno_id);
create index aluno_materiais_material_id_idx on public.aluno_materiais(material_id);
