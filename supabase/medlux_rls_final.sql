-- MEDLUX RLS definitivo (ADMIN/USER)
-- Idempotente: pode rodar múltiplas vezes.

begin;

-- 1) Funções auxiliares ------------------------------------------------------
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
      and u.perfil = 'ADMIN'
  );
$$;

-- 2) public.usuarios ---------------------------------------------------------
alter table if exists public.usuarios enable row level security;

-- Limpeza de policies antigas/conflitantes conhecidas
DO $$
DECLARE
  p text;
  known_policies text[] := array[
    'usuarios_admin_all',
    'usuarios_select_self',
    'usuarios_update_self',
    'usuarios_select_own',
    'usuarios_update_own',
    'usuarios_all_admin',
    'usuarios_read_self',
    'usuarios_insert_self'
  ];
BEGIN
  IF to_regclass('public.usuarios') IS NULL THEN
    RETURN;
  END IF;

  FOREACH p IN ARRAY known_policies LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.usuarios', p);
  END LOOP;
END $$;

create policy usuarios_admin_all
  on public.usuarios
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy usuarios_select_self
  on public.usuarios
  for select
  to authenticated
  using (auth_user_id = auth.uid());

create policy usuarios_update_self
  on public.usuarios
  for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- 3) cadastros de medição (read auth + write admin) -------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['trechos_medicao','segmentos_medicao','estacoes_medicao'] LOOP
    IF to_regclass(format('public.%s', t)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_read_auth', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_write', t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)',
      t || '_read_auth',
      t
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())',
      t || '_admin_write',
      t
    );
  END LOOP;
END $$;

-- 4) ownership em tabelas de leituras ----------------------------------------
alter table if exists public.leituras_medicao add column if not exists usuario_id uuid;
alter table if exists public.leituras_vertical add column if not exists usuario_id uuid;
alter table if exists public.leituras_dispositivos add column if not exists usuario_id uuid;

DO $$
BEGIN
  IF to_regclass('public.leituras_medicao') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leituras_medicao_usuario_id_fkey'
  ) THEN
    EXECUTE 'ALTER TABLE public.leituras_medicao ADD CONSTRAINT leituras_medicao_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT';
  END IF;

  IF to_regclass('public.leituras_vertical') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leituras_vertical_usuario_id_fkey'
  ) THEN
    EXECUTE 'ALTER TABLE public.leituras_vertical ADD CONSTRAINT leituras_vertical_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT';
  END IF;

  IF to_regclass('public.leituras_dispositivos') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leituras_dispositivos_usuario_id_fkey'
  ) THEN
    EXECUTE 'ALTER TABLE public.leituras_dispositivos ADD CONSTRAINT leituras_dispositivos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT';
  END IF;
END $$;

create index if not exists idx_leituras_medicao_usuario_id on public.leituras_medicao(usuario_id);
create index if not exists idx_leituras_vertical_usuario_id on public.leituras_vertical(usuario_id);
create index if not exists idx_leituras_dispositivos_usuario_id on public.leituras_dispositivos(usuario_id);

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
BEGIN
  IF to_regclass('public.leituras_medicao') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_set_usuario_id_leituras_medicao ON public.leituras_medicao;
    CREATE TRIGGER trg_set_usuario_id_leituras_medicao
      BEFORE INSERT ON public.leituras_medicao
      FOR EACH ROW
      EXECUTE FUNCTION public.set_usuario_id_from_auth();
  END IF;

  IF to_regclass('public.leituras_vertical') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_set_usuario_id_leituras_vertical ON public.leituras_vertical;
    CREATE TRIGGER trg_set_usuario_id_leituras_vertical
      BEFORE INSERT ON public.leituras_vertical
      FOR EACH ROW
      EXECUTE FUNCTION public.set_usuario_id_from_auth();
  END IF;

  IF to_regclass('public.leituras_dispositivos') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_set_usuario_id_leituras_dispositivos ON public.leituras_dispositivos;
    CREATE TRIGGER trg_set_usuario_id_leituras_dispositivos
      BEFORE INSERT ON public.leituras_dispositivos
      FOR EACH ROW
      EXECUTE FUNCTION public.set_usuario_id_from_auth();
  END IF;
END $$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['leituras_medicao','leituras_vertical','leituras_dispositivos'] LOOP
    IF to_regclass(format('public.%s', t)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_all', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_user_select', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_user_insert', t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())',
      t || '_admin_all',
      t
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (usuario_id = public.current_usuario_id())',
      t || '_user_select',
      t
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (usuario_id = public.current_usuario_id())',
      t || '_user_insert',
      t
    );
  END LOOP;
END $$;

-- 5) logs_erro (opcional) ----------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.logs_erro') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.logs_erro ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS logs_erro_select_admin ON public.logs_erro;
  DROP POLICY IF EXISTS logs_erro_insert_auth ON public.logs_erro;

  CREATE POLICY logs_erro_select_admin
    ON public.logs_erro
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

  CREATE POLICY logs_erro_insert_auth
    ON public.logs_erro
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
END $$;

commit;
