update public.tarefas
set title = 'Tarefa sem título'
where title is null or btrim(title) = '';

alter table public.tarefas
  alter column title set not null;

alter table public.tarefas
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

create table if not exists public.tarefa_alunos (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'entregue', 'revisado')),
  student_notes text,
  submission_url text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  teacher_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tarefa_id, aluno_id)
);

create index if not exists tarefa_alunos_tarefa_id_idx on public.tarefa_alunos(tarefa_id);
create index if not exists tarefa_alunos_aluno_id_idx on public.tarefa_alunos(aluno_id);
create index if not exists tarefa_alunos_status_idx on public.tarefa_alunos(status);

alter table public.tarefa_alunos enable row level security;

create policy "Admins manage tarefa_alunos"
  on public.tarefa_alunos for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Alunos read own tarefa_alunos"
  on public.tarefa_alunos for select
  using (
    aluno_id in (
      select id from public.alunos where profile_id = auth.uid()
    )
  );

create policy "Alunos update own tarefa_alunos"
  on public.tarefa_alunos for update
  using (
    aluno_id in (
      select id from public.alunos where profile_id = auth.uid()
    )
  )
  with check (
    aluno_id in (
      select id from public.alunos where profile_id = auth.uid()
    )
  );