-- Delete analytics metrics recorded before last Saturday (August 22, 2026)
delete from public.evento_analytics
where created_at < '2026-08-22 00:00:00-03';
