-- Safe RLS fix to avoid 54001 stack depth recursion.
-- Manual execution only.

begin;

create table if not exists public.admin_users (
  auth_user_id uuid primary key,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Admin mapping should not depend on public.usuarios to avoid recursive RLS checks.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.auth_user_id = auth.uid()
  );
$$;

-- Keep helper independent and direct.
create or replace function public.current_usuario_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select u.id
  from public.usuarios u
  where u.auth_user_id = auth.uid()
  limit 1;
$$;

revoke all on table public.admin_users from public;
grant select on table public.admin_users to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_usuario_id() to authenticated;

-- Keep minimal policy surface on admin_users.
drop policy if exists admin_users_select on public.admin_users;
create policy admin_users_select
  on public.admin_users
  for select
  to authenticated
  using (auth.uid() = auth_user_id or public.is_admin());

comment on function public.is_admin is
  'Uses public.admin_users only (no recursive access to public.usuarios).';

commit;
