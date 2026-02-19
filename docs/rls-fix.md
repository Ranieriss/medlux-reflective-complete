# Plano seguro para erro `54001 stack depth limit exceeded` (RLS)

## Sintoma
Em produção, algumas consultas (`usuarios`, `vinculos`, `medicoes`) podem falhar com `54001 stack depth limit exceeded` quando políticas RLS chamam funções que, por sua vez, consultam tabelas protegidas por políticas que chamam as mesmas funções.

## Causa provável
Ciclo típico:

1. Policy usa `public.is_admin()`.
2. `public.is_admin()` consulta `public.usuarios`.
3. `public.usuarios` tem policy com `public.is_admin()`.
4. Recursão infinita de avaliação de policy.

## Estratégia de correção (sem recursão)

- Criar uma tabela dedicada `public.admin_users` (fonte simples de verdade para admin).
- Reescrever `public.is_admin()` para consultar **apenas** `public.admin_users`.
- Manter `public.current_usuario_id()` como `SECURITY DEFINER`, sem chamar `is_admin()`.
- Atualizar políticas para usar a nova `is_admin()` sem depender de leitura recursiva da `usuarios`.

## Script recomendado
Use o script:

- `supabase/sql/rls_stack_depth_safe_fix.sql`

> O script **não é aplicado automaticamente** pelo app. Rode manualmente no SQL Editor do Supabase, em janela de manutenção.

## Checklist de aplicação

1. Fazer backup das funções/policies atuais.
2. Executar `supabase/sql/rls_stack_depth_safe_fix.sql`.
3. Popular `public.admin_users` com os usuários administradores.
4. Testar com contas:
   - admin
   - técnico/operador
5. Validar páginas críticas: Usuários, Vínculos, Medições.

## Rollback simples

- Restaurar funções/policies a partir do backup anterior.
- Manter `admin_users` sem uso até nova janela de correção.

