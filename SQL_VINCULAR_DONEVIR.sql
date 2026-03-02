-- =============================================
-- SQL para vincular equipamentos ao operador
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- 1. Verificar ID do usuário donevir
SELECT id, nome, email, perfil FROM usuarios WHERE email = 'donevir@medlux.com';

-- 2. Verificar equipamentos disponíveis
SELECT id, codigo, nome, tipo FROM equipamentos WHERE ativo = true LIMIT 5;

-- 3. Criar vínculos para o operador donevir
-- (Substitua 'USUARIO_ID' e 'EQUIPAMENTO_ID' pelos IDs reais das queries acima)

-- Exemplo de INSERT (ajuste os IDs conforme necessário):
INSERT INTO vinculos (
  id,
  usuario_id,
  equipamento_id,
  data_inicio,
  ativo,
  observacoes
) VALUES
-- Vincular primeiro equipamento
(
  gen_random_uuid(),
  (SELECT id FROM usuarios WHERE email = 'donevir@medlux.com'),
  (SELECT id FROM equipamentos WHERE ativo = true LIMIT 1),
  NOW(),
  true,
  'Vínculo criado para teste'
);

-- 4. Verificar vínculos criados
SELECT 
  v.id,
  u.nome as usuario,
  u.email,
  e.codigo as equipamento,
  e.nome as equipamento_nome,
  v.data_inicio,
  v.ativo
FROM vinculos v
JOIN usuarios u ON v.usuario_id = u.id
JOIN equipamentos e ON v.equipamento_id = e.id
WHERE u.email = 'donevir@medlux.com';

-- 5. Se quiser vincular TODOS os equipamentos ao operador:
INSERT INTO vinculos (
  id,
  usuario_id,
  equipamento_id,
  data_inicio,
  ativo,
  observacoes
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM usuarios WHERE email = 'donevir@medlux.com'),
  e.id,
  NOW(),
  true,
  'Vínculo automático - todos equipamentos'
FROM equipamentos e
WHERE e.ativo = true
AND NOT EXISTS (
  SELECT 1 FROM vinculos v 
  WHERE v.equipamento_id = e.id 
  AND v.usuario_id = (SELECT id FROM usuarios WHERE email = 'donevir@medlux.com')
);

-- =============================================
-- RESULTADO ESPERADO:
-- Após executar, o operador donevir verá os
-- equipamentos vinculados na tela "Equipamentos"
-- =============================================
