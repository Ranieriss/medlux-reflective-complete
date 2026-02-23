-- Align profile domain to ADMIN/OPERADOR and keep auth trigger idempotent.

-- 1) Normalize existing data before constraints.
update public.usuarios
set email = lower(trim(email))
where email is not null and email <> lower(trim(email));

update public.usuarios
set perfil = 'ADMIN'
where upper(coalesce(perfil, '')) in ('ADMINISTRADOR', 'ADM');

update public.usuarios
set perfil = 'OPERADOR'
where upper(coalesce(perfil, '')) in ('OPERADOR', 'USUARIO', 'USER', 'TECNICO', 'TECNICA', 'TEC');

update public.usuarios
set perfil = 'OPERADOR'
where perfil is null or trim(perfil) = '';

-- 2) Enforce profile domain and safe default.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'usuarios_perfil_check'
      and conrelid = 'public.usuarios'::regclass
  ) then
    alter table public.usuarios
      add constraint usuarios_perfil_check
      check (upper(perfil) in ('ADMIN', 'OPERADOR'));
  end if;
end $$;

alter table public.usuarios
  alter column perfil set default 'OPERADOR';

-- 3) Keep trigger strategy #1:
--    Trigger creates/updates a minimal row, and Edge Function can safely update richer fields via upsert(auth_user_id).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.usuarios (
      auth_user_id,
      email,
      nome,
      perfil,
      cpf,
      telefone,
      ativo
    )
    values (
      new.id,
      lower(coalesce(new.email, '')),
      coalesce(new.raw_user_meta_data ->> 'nome', split_part(coalesce(new.email, ''), '@', 1), 'Usuário'),
      case
        when upper(coalesce(new.raw_user_meta_data ->> 'perfil', 'OPERADOR')) in ('ADMIN', 'ADMINISTRADOR', 'ADM') then 'ADMIN'
        else 'OPERADOR'
      end,
      nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'cpf', ''), '\\D', '', 'g'), ''),
      nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'telefone', ''), '\\D', '', 'g'), ''),
      true
    )
    on conflict (auth_user_id)
    do update set
      email = excluded.email,
      nome = coalesce(excluded.nome, public.usuarios.nome),
      perfil = coalesce(excluded.perfil, public.usuarios.perfil),
      cpf = coalesce(excluded.cpf, public.usuarios.cpf),
      telefone = coalesce(excluded.telefone, public.usuarios.telefone),
      updated_at = now();
  exception
    when others then
      raise warning '[handle_new_user] failed to sync public.usuarios for auth user %, error: %', new.id, sqlerrm;
      return new;
  end;

  return new;
end;
$$;
