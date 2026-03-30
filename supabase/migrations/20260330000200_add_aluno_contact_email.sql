alter table public.alunos
  add column contact_email text;

update public.alunos as alunos
set contact_email = users.email
from auth.users as users
where users.id = alunos.profile_id
  and alunos.contact_email is distinct from users.email;
