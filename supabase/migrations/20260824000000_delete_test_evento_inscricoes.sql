-- Remove test event registrations for luciano@nutcake.com and lucianosimonipersonal@gmail.com
delete from public.evento_inscricoes
where email_aluno in ('luciano@nutcake.com', 'lucianosimonipersonal@gmail.com');
