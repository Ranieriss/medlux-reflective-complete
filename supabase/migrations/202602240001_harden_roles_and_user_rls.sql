-- Enforce only ADMIN/OPERADOR role values and harden usuarios RLS.

update public.usuarios
set perfil = 'ADMIN'
where upper(coalesce(perfil, '')) in ('ADMINISTRADOR', 'ADM');

update public.usuarios
set perfil = 'OPERADOR'
where upper(coalesce(perfil, '')) not in ('ADMIN', 'OPERADOR')
   or perfil is null
   or trim(perfil) = '';

alter table public.usuarios
  drop constraint if exists usuarios_perfil_check;

alter table public.usuarios
  add constraint usuarios_perfil_check
  check (upper(perfil) in ('ADMIN', 'OPERADOR'));

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
      and upper(coalesce(u.perfil, '')) = 'ADMIN'
  );
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists usuarios_admin_all on public.usuarios;
drop policy if exists usuarios_self_select on public.usuarios;
drop policy if exists usuarios_self_update on public.usuarios;

create policy usuarios_admin_all
on public.usuarios
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy usuarios_self_select
on public.usuarios
for select
to authenticated
using (auth_user_id = auth.uid());
