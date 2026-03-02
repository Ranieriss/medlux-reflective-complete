-- Diagnóstico de recursão RLS / stack depth
-- Execute este arquivo no Supabase SQL Editor antes/depois da migration de correção.

-- 1) Policies das tabelas críticas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('usuarios','equipamentos','vinculos','medicoes')
ORDER BY tablename, policyname;

-- 2) Views que referenciam usuários/equipamentos
SELECT table_schema, table_name
FROM information_schema.views
WHERE view_definition ILIKE '%usuarios%'
   OR view_definition ILIKE '%equipamentos%'
ORDER BY table_schema, table_name;

-- 3) Triggers nas tabelas críticas
SELECT event_object_table, trigger_name, action_timing, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('usuarios','equipamentos','vinculos','medicoes')
ORDER BY event_object_table, trigger_name;

-- 4) Functions que referenciam as tabelas críticas
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS args,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE pg_get_functiondef(p.oid) ILIKE '%usuarios%'
   OR pg_get_functiondef(p.oid) ILIKE '%equipamentos%'
   OR pg_get_functiondef(p.oid) ILIKE '%vinculos%'
   OR pg_get_functiondef(p.oid) ILIKE '%medicoes%'
ORDER BY schema_name, function_name;
