-- Update price for Intensivão ENEM Medicina 2026 to R$ 399,00 (39900 centavos)

update public.eventos
set preco_centavos = 39900
where slug = 'intensivao-enem-medicina-2026';
