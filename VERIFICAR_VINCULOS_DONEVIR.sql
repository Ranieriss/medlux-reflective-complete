-- Verificar vínculos do usuário donevir
-- Execute no Supabase SQL Editor

-- 1. Buscar ID do usuário
SELECT id, nome, email, perfil, ativo 
FROM usuarios 
WHERE email = 'donevir@medlux.com';

-- 2. Listar vínculos ativos
SELECT 
  v.id,
  v.usuario_id,
  v.equipamento_id,
  v.ativo,
  v.data_inicio,
  v.data_fim,
  e.codigo,
  e.nome,
  e.tipo
FROM vinculos v
INNER JOIN equipamentos e ON e.id = v.equipamento_id
WHERE v.usuario_id = (SELECT id FROM usuarios WHERE email = 'donevir@medlux.com')
  AND v.ativo = true;

-- 3. Contar equipamentos vinculados
SELECT COUNT(*) as total_vinculos
FROM vinculos
WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'donevir@medlux.com')
  AND ativo = true;

-- ❌ SE NÃO HOUVER VÍNCULOS, CRIAR UM VÍNCULO DE TESTE:
-- Descomente as linhas abaixo e execute

/*
INSERT INTO vinculos (
  usuario_id,
  equipamento_id,
  data_inicio,
  ativo,
  observacoes
)
SELECT 
  (SELECT id FROM usuarios WHERE email = 'donevir@medlux.com'),
  (SELECT id FROM equipamentos WHERE codigo = 'RH01' LIMIT 1),
  CURRENT_DATE,
  true,
  'Vínculo criado para testes - ' || CURRENT_TIMESTAMP
RETURNING *;
*/

-- Mensagem final
SELECT '✅ Verificação concluída. Se não houver vínculos, descomente o INSERT acima.' as status;
