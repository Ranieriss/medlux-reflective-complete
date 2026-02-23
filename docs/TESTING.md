# Manual Testing Guide (Review & Fix Pack)

## Pré-requisitos
1. Sessão válida no app com um usuário ADMIN ativo.
2. `create-user` Edge Function publicada no Supabase com `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` configurados.
3. Frontend com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` válidas.

---

## 1) Criar usuário OPERADOR
1. Acesse `/usuarios` com ADMIN.
2. Clique em **Novo Usuário**.
3. Preencha:
   - Nome completo
   - CPF
   - Telefone
   - E-mail único
   - Senha (>= 6)
   - Perfil = **Operador**
   - Status ativo
4. Clique em **Salvar**.
5. Verifique snackbar de sucesso.
6. Abra DevTools > Network e confirme:
   - request para `functions/v1/create-user` com `Authorization: Bearer <access_token>`.
   - `x-request-id` presente no header.
   - response JSON com `requestId`.

## 2) Criar usuário ADMIN
1. Ainda na tela `/usuarios`, clique em **Novo Usuário**.
2. Preencha outro e-mail válido.
3. Selecione Perfil = **Administrador**.
4. Salve.
5. Validar sucesso visual e atualização da lista.

## 3) Tentar criar usuário sem ser ADMIN (deve falhar 403)
1. Faça logout.
2. Faça login com um usuário OPERADOR.
3. Tente abrir `/usuarios`:
   - Deve redirecionar/bloquear por guard.
4. Se conseguir acionar criação por qualquer caminho, salvar deve retornar erro `403 forbidden` com mensagem amigável.
5. Em DevTools, confirmar que a resposta da function contém `requestId` para rastreio.

## 4) Testar CORS no browser (preflight deve passar)
1. Em DevTools, abra aba Network.
2. Execute criação de usuário.
3. Confira requisição `OPTIONS` para `functions/v1/create-user`:
   - Status 200.
   - Headers:
     - `Access-Control-Allow-Origin: *`
     - `Access-Control-Allow-Headers` contendo `authorization, apikey, content-type, x-client-info, x-request-id`
     - `Access-Control-Allow-Methods` contendo `POST, OPTIONS`

## 5) Validar persistência em `auth.users` e `public.usuarios`
1. No Supabase SQL Editor, rode:
```sql
select id, email, created_at
from auth.users
where lower(email) = lower('<email-criado>');
```
2. Rode:
```sql
select auth_user_id, email, nome, perfil, ativo, updated_at
from public.usuarios
where lower(email) = lower('<email-criado>');
```
3. Validar:
   - existe 1 usuário no Auth;
   - existe 1 registro em `public.usuarios`;
   - `auth_user_id` aponta para `auth.users.id`;
   - `perfil` é `ADMIN` ou `OPERADOR`.

---

## Regressão rápida sugerida
1. Login/logout continuam funcionando.
2. Dashboard carrega para ADMIN e OPERADOR.
3. Lista de usuários abre sem erro 500.
4. Edição de usuário continua funcional.
