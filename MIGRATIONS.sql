-- MedLux critical fixes: RLS + grants + schema compatibility + measurement ownership

begin;

-- =====================================================
-- 1) Grants mínimos para REST/SDK autenticado
-- =====================================================
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.equipamentos to authenticated;
grant select, insert, update, delete on table public.vinculos to authenticated;
grant select, insert, update, delete on table public.historico_calibracoes to authenticated;
grant select on table public.norma_criterios_validacao to authenticated;
grant select on table public.criterios_retrorrefletancia to authenticated;
grant select on table public.usuarios to authenticated;

-- =====================================================
-- 2) Compatibilidade de schema para filtros de critérios
-- =====================================================
alter table if exists public.norma_criterios_validacao
  add column if not exists cor text,
  add column if not exists geometria text,
  add column if not exists tipo_material text,
  add column if not exists tipo_pelicula text,
  add column if not exists ativo boolean default true;

update public.norma_criterios_validacao
set ativo = true
where ativo is null;

create index if not exists idx_norma_criterios_lookup
  on public.norma_criterios_validacao (tipo_equipamento, ativo, cor, geometria, tipo_material, tipo_pelicula);

-- =====================================================
-- 3) Ownership da medição para "Minhas medições"
-- =====================================================
alter table if exists public.historico_calibracoes
  add column if not exists criado_por_auth_user_id uuid,
  add column if not exists criado_por_usuario_id uuid;

update public.historico_calibracoes hc
set criado_por_auth_user_id = u.auth_user_id,
    criado_por_usuario_id = u.id
from public.vinculos v
join public.usuarios u on u.id = v.usuario_id
where hc.criado_por_auth_user_id is null
  and v.equipamento_id = hc.equipamento_id
  and v.ativo = true;

create index if not exists idx_historico_calibracoes_owner_auth
  on public.historico_calibracoes (criado_por_auth_user_id, data_calibracao desc);
create index if not exists idx_historico_calibracoes_equip_data
  on public.historico_calibracoes (equipamento_id, data_calibracao desc);

-- =====================================================
-- 4) RLS coerente ADMIN x OPERADOR
-- =====================================================
alter table public.equipamentos enable row level security;
alter table public.vinculos enable row level security;
alter table public.historico_calibracoes enable row level security;
alter table public.norma_criterios_validacao enable row level security;
alter table public.criterios_retrorrefletancia enable row level security;

-- Equipamentos
 drop policy if exists equipamentos_admin_all on public.equipamentos;
 drop policy if exists equipamentos_operador_select_vinculados on public.equipamentos;
create policy equipamentos_admin_all
on public.equipamentos
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy equipamentos_operador_select_vinculados
on public.equipamentos
for select
to authenticated
using (
  exists (
    select 1
    from public.vinculos v
    join public.usuarios u on u.id = v.usuario_id
    where v.equipamento_id = equipamentos.id
      and v.ativo = true
      and u.auth_user_id = auth.uid()
  )
);

-- Vinculos
 drop policy if exists vinculos_admin_all on public.vinculos;
 drop policy if exists vinculos_operador_select_own on public.vinculos;
create policy vinculos_admin_all
on public.vinculos
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy vinculos_operador_select_own
on public.vinculos
for select
to authenticated
using (
  exists (
    select 1 from public.usuarios u
    where u.id = vinculos.usuario_id
      and u.auth_user_id = auth.uid()
  )
);

-- Histórico de medições
 drop policy if exists historico_calibracoes_admin_all on public.historico_calibracoes;
 drop policy if exists historico_calibracoes_operador_select on public.historico_calibracoes;
 drop policy if exists historico_calibracoes_operador_insert on public.historico_calibracoes;

create policy historico_calibracoes_admin_all
on public.historico_calibracoes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy historico_calibracoes_operador_select
on public.historico_calibracoes
for select
to authenticated
using (
  criado_por_auth_user_id = auth.uid()
  or exists (
    select 1
    from public.vinculos v
    join public.usuarios u on u.id = v.usuario_id
    where v.equipamento_id = historico_calibracoes.equipamento_id
      and v.ativo = true
      and u.auth_user_id = auth.uid()
  )
);

create policy historico_calibracoes_operador_insert
on public.historico_calibracoes
for insert
to authenticated
with check (
  criado_por_auth_user_id = auth.uid()
  and exists (
    select 1
    from public.vinculos v
    join public.usuarios u on u.id = v.usuario_id
    where v.equipamento_id = historico_calibracoes.equipamento_id
      and v.ativo = true
      and u.auth_user_id = auth.uid()
  )
);

-- Critérios normativos (somente leitura para autenticados)
drop policy if exists criterios_admin_all on public.norma_criterios_validacao;
drop policy if exists criterios_authenticated_select on public.norma_criterios_validacao;
create policy criterios_admin_all
on public.norma_criterios_validacao
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy criterios_authenticated_select
on public.norma_criterios_validacao
for select
to authenticated
using (true);

drop policy if exists criterios_retro_admin_all on public.criterios_retrorrefletancia;
drop policy if exists criterios_retro_authenticated_select on public.criterios_retrorrefletancia;
create policy criterios_retro_admin_all
on public.criterios_retrorrefletancia
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy criterios_retro_authenticated_select
on public.criterios_retrorrefletancia
for select
to authenticated
using (true);

commit;
