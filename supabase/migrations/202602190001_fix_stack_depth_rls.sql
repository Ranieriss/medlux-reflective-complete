-- Corrige recursão de RLS (erro 54001 stack depth limit exceeded)
-- Execução: Supabase SQL Editor (ou supabase db push)
begin;

-- 1) Função helper sem recursão em policy da mesma tabela.
-- Usa SECURITY DEFINER + row_security off + search_path fixo.
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid;
  has_role boolean := false;
begin
  uid := auth.uid();
  if uid is null then
    return false;
  end if;

  perform set_config('row_security', 'off', true);

  -- Suporta esquemas legados: id/auth_user_id/user_id
  select exists (
    select 1
    from public.usuarios u
    where (
      u.id = uid
      or coalesce(u.auth_user_id::text, '') = uid::text
      or coalesce(u.user_id::text, '') = uid::text
    )
      and upper(coalesce(u.perfil, '')) in ('ADMIN', 'ADMINISTRADOR')
  ) into has_role;

  return coalesce(has_role, false);
exception
  when undefined_column then
    select exists (
      select 1
      from public.usuarios u
      where u.id = uid
        and upper(coalesce(u.perfil, '')) in ('ADMIN', 'ADMINISTRADOR')
    ) into has_role;
    return coalesce(has_role, false);
end;
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 2) Recria policies críticas sem subselect recursivo em public.usuarios
DO $$
DECLARE
  p record;
BEGIN
  if to_regclass('public.usuarios') is not null then
    for p in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = 'usuarios'
    loop
      execute format('drop policy if exists %I on public.usuarios', p.policyname);
    end loop;

    execute $pol$
      create policy usuarios_select_self_or_admin
      on public.usuarios
      for select
      to authenticated
      using (
        id = auth.uid()
        or coalesce(auth_user_id::text, '') = auth.uid()::text
        or coalesce(user_id::text, '') = auth.uid()::text
        or public.is_admin()
      )
    $pol$;

    execute $pol$
      create policy usuarios_insert_self_or_admin
      on public.usuarios
      for insert
      to authenticated
      with check (
        public.is_admin()
        or id = auth.uid()
        or coalesce(auth_user_id::text, '') = auth.uid()::text
        or coalesce(user_id::text, '') = auth.uid()::text
      )
    $pol$;

    execute $pol$
      create policy usuarios_update_self_or_admin
      on public.usuarios
      for update
      to authenticated
      using (
        public.is_admin()
        or id = auth.uid()
        or coalesce(auth_user_id::text, '') = auth.uid()::text
        or coalesce(user_id::text, '') = auth.uid()::text
      )
      with check (
        public.is_admin()
        or id = auth.uid()
        or coalesce(auth_user_id::text, '') = auth.uid()::text
        or coalesce(user_id::text, '') = auth.uid()::text
      )
    $pol$;

    execute $pol$
      create policy usuarios_delete_admin
      on public.usuarios
      for delete
      to authenticated
      using (public.is_admin())
    $pol$;
  end if;
END
$$;

DO $$
DECLARE
  p record;
BEGIN
  if to_regclass('public.equipamentos') is not null then
    for p in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = 'equipamentos'
    loop
      execute format('drop policy if exists %I on public.equipamentos', p.policyname);
    end loop;

    execute $pol$
      create policy equipamentos_select_admin_or_vinculado
      on public.equipamentos
      for select
      to authenticated
      using (
        public.is_admin()
        or exists (
          select 1
          from public.vinculos v
          where v.equipamento_id = equipamentos.id
            and v.usuario_id = auth.uid()
            and coalesce(v.ativo, true)
        )
      )
    $pol$;

    execute $pol$
      create policy equipamentos_insert_admin
      on public.equipamentos
      for insert
      to authenticated
      with check (public.is_admin())
    $pol$;

    execute $pol$
      create policy equipamentos_update_admin
      on public.equipamentos
      for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin())
    $pol$;

    execute $pol$
      create policy equipamentos_delete_admin
      on public.equipamentos
      for delete
      to authenticated
      using (public.is_admin())
    $pol$;
  end if;
END
$$;

commit;
