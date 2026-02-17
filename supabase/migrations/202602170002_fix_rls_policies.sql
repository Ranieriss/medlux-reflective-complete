begin;

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
    where u.id = auth.uid()
      and upper(coalesce(u.perfil, '')) in ('ADMIN', 'ADMINISTRADOR')
  );
$$;

DO $$
DECLARE
  t text;
  p record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'usuarios','equipamentos','vinculos','auditoria','calibracoes','medicoes','historico_calibracoes'
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

DO $$
BEGIN
  IF to_regclass('public.usuarios') IS NOT NULL THEN
    EXECUTE $p$
      create policy usuarios_select_own
      on public.usuarios
      for select
      to authenticated
      using (id = auth.uid())
    $p$;

    EXECUTE $p$
      create policy usuarios_select_admin
      on public.usuarios
      for select
      to authenticated
      using (public.is_admin())
    $p$;

    EXECUTE $p$
      create policy usuarios_insert_own
      on public.usuarios
      for insert
      to authenticated
      with check (id = auth.uid() or public.is_admin())
    $p$;

    EXECUTE $p$
      create policy usuarios_update_own
      on public.usuarios
      for update
      to authenticated
      using (id = auth.uid())
      with check (id = auth.uid())
    $p$;

    EXECUTE $p$
      create policy usuarios_update_admin
      on public.usuarios
      for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin())
    $p$;

    EXECUTE $p$
      create policy usuarios_delete_admin
      on public.usuarios
      for delete
      to authenticated
      using (public.is_admin())
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.equipamentos') IS NOT NULL THEN
    EXECUTE $p$
      create policy equipamentos_select_authenticated
      on public.equipamentos
      for select
      to authenticated
      using (true)
    $p$;

    EXECUTE $p$
      create policy equipamentos_insert_admin
      on public.equipamentos
      for insert
      to authenticated
      with check (public.is_admin())
    $p$;

    EXECUTE $p$
      create policy equipamentos_update_admin
      on public.equipamentos
      for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin())
    $p$;

    EXECUTE $p$
      create policy equipamentos_delete_admin
      on public.equipamentos
      for delete
      to authenticated
      using (public.is_admin())
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.vinculos') IS NOT NULL THEN
    EXECUTE $p$
      create policy vinculos_select_admin_or_owner
      on public.vinculos
      for select
      to authenticated
      using (public.is_admin() or usuario_id = auth.uid())
    $p$;

    EXECUTE $p$
      create policy vinculos_insert_admin
      on public.vinculos
      for insert
      to authenticated
      with check (public.is_admin())
    $p$;

    EXECUTE $p$
      create policy vinculos_update_admin
      on public.vinculos
      for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin())
    $p$;

    EXECUTE $p$
      create policy vinculos_delete_admin
      on public.vinculos
      for delete
      to authenticated
      using (public.is_admin())
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.auditoria') IS NOT NULL THEN
    EXECUTE $p$
      create policy auditoria_insert_owner_or_admin
      on public.auditoria
      for insert
      to authenticated
      with check (usuario_id = auth.uid() or public.is_admin())
    $p$;

    EXECUTE $p$
      create policy auditoria_select_admin
      on public.auditoria
      for select
      to authenticated
      using (public.is_admin())
    $p$;
  END IF;
END $$;

DO $$
DECLARE
  t text;
  has_usuario_id boolean;
BEGIN
  FOREACH t IN ARRAY ARRAY['calibracoes', 'medicoes', 'historico_calibracoes'] LOOP
    IF to_regclass(format('public.%s', t)) IS NULL THEN
      CONTINUE;
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = t
        AND column_name = 'usuario_id'
    ) INTO has_usuario_id;

    IF has_usuario_id THEN
      EXECUTE format(
        'create policy %I on public.%I for select to authenticated using (public.is_admin() or usuario_id = auth.uid())',
        t || '_select_admin_or_owner',
        t
      );

      EXECUTE format(
        'create policy %I on public.%I for insert to authenticated with check (public.is_admin() or usuario_id = auth.uid())',
        t || '_insert_admin_or_owner',
        t
      );

      EXECUTE format(
        'create policy %I on public.%I for update to authenticated using (public.is_admin() or usuario_id = auth.uid()) with check (public.is_admin() or usuario_id = auth.uid())',
        t || '_update_admin_or_owner',
        t
      );
    ELSE
      EXECUTE format(
        'create policy %I on public.%I for select to authenticated using (true)',
        t || '_select_authenticated',
        t
      );

      EXECUTE format(
        'create policy %I on public.%I for insert to authenticated with check (public.is_admin())',
        t || '_insert_admin',
        t
      );

      EXECUTE format(
        'create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())',
        t || '_update_admin',
        t
      );
    END IF;

    EXECUTE format(
      'create policy %I on public.%I for delete to authenticated using (public.is_admin())',
      t || '_delete_admin',
      t
    );
  END LOOP;
END $$;

commit;
