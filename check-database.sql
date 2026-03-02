-- Verificar estrutura da tabela usuarios
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela equipamentos  
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'equipamentos'
ORDER BY ordinal_position;

-- Contar registros
SELECT 'usuarios' as tabela, COUNT(*) as total FROM usuarios
UNION ALL
SELECT 'equipamentos', COUNT(*) FROM equipamentos;
