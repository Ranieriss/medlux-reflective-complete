-- RLS policies for vinculos/auditoria and helper functions

-- 1) Helper functions
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios u
    where u.auth_user_id = auth.uid()
      and coalesce(u.ativo, false) = true
      and upper(coalesce(u.perfil, to_jsonb(u) ->> 'role', '')) = 'ADMIN'
  );
$$;

create or replace function public.current_usuario_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from public.usuarios u
  where u.auth_user_id = auth.uid()
  limit 1;
$$;

-- 2) Recommended index
create index if not exists idx_usuarios_auth_user_id on public.usuarios (auth_user_id);

-- 3) Enable RLS
alter table public.vinculos enable row level security;
alter table public.auditoria enable row level security;

-- 4) Recreate policies safely
DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'vinculos'
  LOOP
    EXECUTE format('drop policy if exists %I on public.vinculos', policy_record.policyname);
  END LOOP;

  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'auditoria'
  LOOP
    EXECUTE format('drop policy if exists %I on public.auditoria', policy_record.policyname);
  END LOOP;
END $$;

-- public.vinculos
create policy vinculos_select_admin_or_owner
on public.vinculos
for select
to authenticated
using (
  public.is_admin()
  or usuario_id = public.current_usuario_id()
);

create policy vinculos_insert_admin_only
on public.vinculos
for insert
to authenticated
with check (public.is_admin());

create policy vinculos_update_admin_only
on public.vinculos
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy vinculos_delete_admin_only
on public.vinculos
for delete
to authenticated
using (public.is_admin());

-- public.auditoria
create policy auditoria_select_admin_only
on public.auditoria
for select
to authenticated
using (public.is_admin());

create policy auditoria_insert_authenticated_self
on public.auditoria
for insert
to authenticated
with check (usuario_id = auth.uid());
