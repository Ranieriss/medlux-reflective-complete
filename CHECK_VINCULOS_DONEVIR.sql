-- Script para verificar vínculos do usuário donevir
-- Execute no SQL Editor do Supabase

-- 1. Verificar ID do usuário donevir
SELECT id, nome, email, perfil, ativo 
FROM usuarios 
WHERE email = 'donevir@medlux.com' OR nome ILIKE '%donevir%';

-- 2. Verificar vínculos ativos para donevir (se ID = 2)
SELECT v.*, 
       e.codigo, 
       e.nome as equipamento_nome,
       e.status as equipamento_status
FROM vinculos v
INNER JOIN equipamentos e ON v.equipamento_id = e.id
WHERE v.usuario_id = 2  -- Ajuste o ID se necessário
AND v.ativo = true;

-- 3. Verificar TODOS os vínculos (ativos e inativos) para donevir
SELECT v.*, 
       e.codigo, 
       e.nome as equipamento_nome,
       e.status as equipamento_status
FROM vinculos v
INNER JOIN equipamentos e ON v.equipamento_id = e.id
WHERE v.usuario_id = 2;  -- Ajuste o ID se necessário

-- 4. Contar equipamentos disponíveis para vincular
SELECT COUNT(*) as total_equipamentos_ativos
FROM equipamentos
WHERE ativo = true;

-- 5. Se não houver vínculos, criar um vínculo de teste:
-- REMOVA O COMENTÁRIO DAS LINHAS ABAIXO PARA EXECUTAR

-- INSERT INTO vinculos (
--   usuario_id,
--   equipamento_id,
--   data_inicio,
--   termo_responsabilidade_url,
--   assinatura_digital_url,
--   ativo
-- )
-- SELECT 
--   2,  -- ID do donevir
--   id,  -- ID de um equipamento ativo
--   CURRENT_DATE,
--   'https://exemplo.com/termo_donevir.pdf',
--   'https://exemplo.com/assinatura_donevir.png',
--   true
-- FROM equipamentos
-- WHERE ativo = true
-- LIMIT 1;

-- 6. Verificar estrutura da tabela vinculos
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'vinculos'
ORDER BY ordinal_position;
