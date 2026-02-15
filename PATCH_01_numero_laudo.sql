-- PATCH 01: Adicionar campo numero_laudo e função de geração automática
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna numero_laudo
ALTER TABLE historico_calibracoes 
ADD COLUMN IF NOT EXISTS numero_laudo VARCHAR(50) UNIQUE;

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_numero_laudo ON historico_calibracoes(numero_laudo);

-- 3. Criar função para gerar próximo número de laudo
CREATE OR REPLACE FUNCTION gerar_numero_laudo()
RETURNS VARCHAR AS $$
DECLARE
  ano_atual INT;
  proximo_numero INT;
  numero_formatado VARCHAR(50);
BEGIN
  -- Obter ano atual
  ano_atual := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Buscar último número do ano
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(numero_laudo FROM '\d{4}$') AS INT
      )
    ), 0
  ) + 1
  INTO proximo_numero
  FROM historico_calibracoes
  WHERE numero_laudo LIKE 'REL-' || ano_atual || '-%';
  
  -- Formatar número: REL-2026-0001
  numero_formatado := 'REL-' || ano_atual || '-' || LPAD(proximo_numero::TEXT, 4, '0');
  
  RETURN numero_formatado;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger para gerar número automaticamente ao inserir
CREATE OR REPLACE FUNCTION trigger_gerar_numero_laudo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_laudo IS NULL THEN
    NEW.numero_laudo := gerar_numero_laudo();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_numero_laudo ON historico_calibracoes;

CREATE TRIGGER auto_numero_laudo
BEFORE INSERT ON historico_calibracoes
FOR EACH ROW
EXECUTE FUNCTION trigger_gerar_numero_laudo();

-- 5. Atualizar registros existentes (se houver)
DO $$
DECLARE
  registro RECORD;
  contador INT := 1;
  ano INT;
BEGIN
  -- Agrupar por ano e atualizar
  FOR ano IN 
    SELECT DISTINCT EXTRACT(YEAR FROM data_calibracao)::INT as ano
    FROM historico_calibracoes 
    WHERE numero_laudo IS NULL
    ORDER BY ano
  LOOP
    contador := 1;
    FOR registro IN 
      SELECT id 
      FROM historico_calibracoes 
      WHERE EXTRACT(YEAR FROM data_calibracao) = ano 
        AND numero_laudo IS NULL
      ORDER BY created_at
    LOOP
      UPDATE historico_calibracoes
      SET numero_laudo = 'REL-' || ano || '-' || LPAD(contador::TEXT, 4, '0')
      WHERE id = registro.id;
      
      contador := contador + 1;
    END LOOP;
  END LOOP;
END $$;

-- 6. Verificar funcionamento
SELECT 
  numero_laudo,
  data_calibracao,
  equipamento_id,
  created_at
FROM historico_calibracoes
ORDER BY created_at DESC
LIMIT 10;

-- Resultado esperado:
-- REL-2026-0001
-- REL-2026-0002
-- REL-2026-0003
-- ...

SELECT '✅ Patch 01 aplicado com sucesso!' as status;
