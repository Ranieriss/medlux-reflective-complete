-- Diagnóstico e correção de triggers em auth.users que podem quebrar criação de usuário.
-- Este script:
--   1) Lista triggers ativos no auth.users para inspeção.
--   2) Cria/atualiza função pública resiliente para sync em public.usuarios.
--   3) Recria trigger padrão handle_new_user para nunca abortar insert em auth.users.

-- 1) Diagnóstico rápido (resultado no output do SQL editor / logs):
select
  t.tgname as trigger_name,
  n.nspname as function_schema,
  p.proname as function_name,
  t.tgenabled,
  pg_get_triggerdef(t.oid) as trigger_definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace cns on cns.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
join pg_namespace n on n.oid = p.pronamespace
where cns.nspname = 'auth'
  and c.relname = 'users'
  and not t.tgisinternal
order by t.tgname;

-- 2) Função resiliente: nunca interrompe criação em auth.users.
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
      new.email,
      coalesce(new.raw_user_meta_data ->> 'nome', split_part(coalesce(new.email, ''), '@', 1), 'Usuário'),
      upper(coalesce(new.raw_user_meta_data ->> 'perfil', 'USUARIO')),
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

-- 3) Trigger padrão (remove e recria para evitar apontar para função antiga quebrada).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
