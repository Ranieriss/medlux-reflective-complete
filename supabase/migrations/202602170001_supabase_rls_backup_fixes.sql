begin;

alter table if exists public.usuarios
  add column if not exists ultimo_acesso timestamptz null;

create table if not exists public.admins (
  auth_user_id uuid primary key,
  created_at timestamptz not null default now()
);

insert into public.admins (auth_user_id)
select distinct u.auth_user_id
from public.usuarios u
where u.auth_user_id is not null
  and upper(coalesce(u.perfil, '')) in ('ADMIN', 'ADMINISTRADOR')
on conflict (auth_user_id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where a.auth_user_id = auth.uid()
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
  order by u.created_at asc nulls last
  limit 1;
$$;

DO $$
DECLARE
  t text;
  p record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'usuarios','equipamentos','vinculos','leituras_medicao','leituras_vertical','leituras_dispositivos'
  ] LOOP
    IF to_regclass(format('public.%s', t)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    FOR p IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
    END LOOP;
  END LOOP;
END $$;

create policy usuarios_select_policy
  on public.usuarios
  for select
  to authenticated
  using (auth_user_id = auth.uid() OR public.is_admin());

create policy usuarios_update_policy
  on public.usuarios
  for update
  to authenticated
  using (auth_user_id = auth.uid() OR public.is_admin())
  with check (auth_user_id = auth.uid() OR public.is_admin());

create policy usuarios_insert_policy
  on public.usuarios
  for insert
  to authenticated
  with check (public.is_admin());

create policy usuarios_delete_policy
  on public.usuarios
  for delete
  to authenticated
  using (public.is_admin());

create policy equipamentos_select_policy
  on public.equipamentos
  for select
  to authenticated
  using (true);

create policy equipamentos_write_policy
  on public.equipamentos
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy vinculos_select_policy
  on public.vinculos
  for select
  to authenticated
  using (public.is_admin() OR usuario_id = public.current_usuario_id());

create policy vinculos_write_policy
  on public.vinculos
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

alter table if exists public.leituras_medicao add column if not exists usuario_id uuid;
alter table if exists public.leituras_vertical add column if not exists usuario_id uuid;
alter table if exists public.leituras_dispositivos add column if not exists usuario_id uuid;

create or replace function public.set_usuario_id_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.usuario_id is null then
    new.usuario_id := public.current_usuario_id();
  end if;
  return new;
end;
$$;

DO $$
DECLARE
  t text;
  trg record;
BEGIN
  FOREACH t IN ARRAY ARRAY['leituras_medicao','leituras_vertical','leituras_dispositivos'] LOOP
    IF to_regclass(format('public.%s', t)) IS NULL THEN
      CONTINUE;
    END IF;

    FOR trg IN
      SELECT tgname
      FROM pg_trigger
      WHERE tgrelid = format('public.%s', t)::regclass
        AND NOT tgisinternal
        AND tgname ILIKE '%usuario%'
    LOOP
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', trg.tgname, t);
    END LOOP;

    EXECUTE format(
      'CREATE TRIGGER trg_set_usuario_id_%s BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_usuario_id_from_auth()',
      t,
      t
    );
  END LOOP;
END $$;

create policy leituras_medicao_select_policy
  on public.leituras_medicao
  for select
  to authenticated
  using (public.is_admin() OR usuario_id = public.current_usuario_id());

create policy leituras_medicao_insert_policy
  on public.leituras_medicao
  for insert
  to authenticated
  with check (public.is_admin() OR usuario_id = public.current_usuario_id());

create policy leituras_medicao_write_admin_policy
  on public.leituras_medicao
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy leituras_vertical_select_policy
  on public.leituras_vertical
  for select
  to authenticated
  using (public.is_admin() OR usuario_id = public.current_usuario_id());

create policy leituras_vertical_insert_policy
  on public.leituras_vertical
  for insert
  to authenticated
  with check (public.is_admin() OR usuario_id = public.current_usuario_id());

create policy leituras_vertical_write_admin_policy
  on public.leituras_vertical
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy leituras_dispositivos_select_policy
  on public.leituras_dispositivos
  for select
  to authenticated
  using (public.is_admin() OR usuario_id = public.current_usuario_id());

create policy leituras_dispositivos_insert_policy
  on public.leituras_dispositivos
  for insert
  to authenticated
  with check (public.is_admin() OR usuario_id = public.current_usuario_id());

create policy leituras_dispositivos_write_admin_policy
  on public.leituras_dispositivos
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

commit;
