-- Admins + função is_admin() + policies de RLS para usuarios/equipamentos

create table if not exists public.admins (
  auth_user_id uuid primary key,
  created_at timestamptz not null default now(),
  created_by uuid null
);

create index if not exists idx_admins_auth_user_id on public.admins (auth_user_id);

insert into public.admins (auth_user_id)
select distinct u.auth_user_id
from public.usuarios u
where upper(coalesce(u.perfil, '')) = 'ADMIN'
  and u.auth_user_id is not null
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

grant execute on function public.is_admin() to authenticated;

alter table public.usuarios enable row level security;
alter table public.equipamentos enable row level security;

drop policy if exists usuarios_admin_all on public.usuarios;
drop policy if exists usuarios_self_select on public.usuarios;
drop policy if exists usuarios_self_update on public.usuarios;

drop policy if exists equipamentos_admin_all on public.equipamentos;
drop policy if exists equipamentos_authenticated_select on public.equipamentos;

create policy usuarios_admin_all
on public.usuarios
for all
using (public.is_admin())
with check (public.is_admin());

create policy usuarios_self_select
on public.usuarios
for select
using (auth_user_id = auth.uid());

create policy usuarios_self_update
on public.usuarios
for update
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

create policy equipamentos_admin_all
on public.equipamentos
for all
using (public.is_admin())
with check (public.is_admin());

create policy equipamentos_authenticated_select
on public.equipamentos
for select
using (auth.role() = 'authenticated');
