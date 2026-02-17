# Troubleshooting MEDLUX (Supabase/RLS)

## Criar USER/ADMIN no Supabase
1. Crie o usuário em **Authentication > Users**.
2. Copie o UUID do usuário (`auth.users.id`).
3. Insira em `public.usuarios` com `auth_user_id` igual ao UUID do Auth.
4. Para ADMIN, use `perfil = 'ADMIN'` e garanta inclusão em `public.admins`.

## Como inserir `auth_user_id` em `public.usuarios`
```sql
insert into public.usuarios (id, nome, email, perfil, ativo, auth_user_id)
values (gen_random_uuid(), 'Nome', 'email@dominio.com', 'USER', true, '<AUTH_USER_UUID>');
```

## Como resolver `user banned`
- No painel Supabase, abra **Authentication > Users**.
- Localize o usuário e remova o bloqueio (`ban`).
- Solicite novo login no app.

## Como testar RLS com uma conta USER
1. Faça login com usuário `USER`.
2. Abra telas de Usuários/Vínculos/Leituras e valide escopo restrito ao próprio usuário.
3. Tente inserir em `leituras_*` e confirme `usuario_id` preenchido automaticamente.
4. Tente alterar cadastro de outro usuário/equipamento e valide bloqueio por policy.
