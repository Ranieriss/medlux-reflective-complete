-- Compatibilidade para código legado que consulta public.criterios_validacao
create or replace view public.criterios_validacao as
select *
from public.norma_criterios_validacao;
