-- ============================================================
-- PATCH 02: Corrigir Equipamentos e Criar Sistema Horizontal
-- ============================================================
-- Data: 2026-02-15
-- Versão: 1.0.0
-- ============================================================

-- PARTE 1: CORRIGIR EQUIPAMENTOS
-- ============================================================

-- 1. Adicionar coluna ultima_calibracao
ALTER TABLE equipamentos 
ADD COLUMN IF NOT EXISTS ultima_calibracao DATE;

-- 2. Verificar estrutura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'equipamentos' 
  AND column_name IN ('ultima_calibracao', 'proxima_calibracao', 'certificado_calibracao');

SELECT '✅ Passo 1: Coluna ultima_calibracao adicionada' as status;

-- ============================================================
-- PARTE 2: CRIAR VÍNCULO PARA DONEVIR
-- ============================================================

-- 3. Verificar se usuário donevir existe
SELECT id, nome, email, perfil 
FROM usuarios 
WHERE email = 'donevir@medlux.com';

-- 4. Criar vínculo do donevir com equipamento RH01
-- IMPORTANTE: Só executa se NÃO existir vínculo ativo
INSERT INTO vinculos (
  usuario_id,
  equipamento_id,
  data_inicio,
  ativo,
  observacoes
)
SELECT 
  u.id,
  e.id,
  CURRENT_DATE,
  true,
  'Vínculo automático criado via patch - ' || CURRENT_TIMESTAMP
FROM usuarios u
CROSS JOIN equipamentos e
WHERE u.email = 'donevir@medlux.com'
  AND e.codigo = 'RH01'
  AND NOT EXISTS (
    SELECT 1 
    FROM vinculos v 
    WHERE v.usuario_id = u.id 
      AND v.equipamento_id = e.id
      AND v.ativo = true
  )
RETURNING id, usuario_id, equipamento_id, data_inicio;

SELECT '✅ Passo 2: Vínculo donevir criado' as status;

-- ============================================================
-- PARTE 3: TABELAS PARA MEDIÇÃO HORIZONTAL NBR 14723
-- ============================================================

-- 5. Criar tabela de trechos (rodovias)
CREATE TABLE IF NOT EXISTS trechos_medicao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(200) NOT NULL,
  rodovia VARCHAR(100),
  km_inicial DECIMAL(10,3),
  km_final DECIMAL(10,3),
  extensao_metros DECIMAL(10,2),
  sentido VARCHAR(50), -- 'Norte/Sul', 'Leste/Oeste', 'Crescente', 'Decrescente'
  pista VARCHAR(50), -- 'Direita', 'Esquerda', 'Central'
  data_aplicacao DATE, -- data de aplicação da demarcação
  tipo_medicao VARCHAR(20) DEFAULT 'residual', -- 'inicial' ou 'residual'
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Criar tabela de segmentos (divisões de trechos longos)
CREATE TABLE IF NOT EXISTS segmentos_medicao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trecho_id UUID REFERENCES trechos_medicao(id) ON DELETE CASCADE,
  numero_segmento INT NOT NULL,
  km_inicial DECIMAL(10,3),
  km_final DECIMAL(10,3),
  extensao_metros DECIMAL(10,2),
  marca_tipo VARCHAR(100), -- 'Linha de Bordo', 'Linha de Eixo', 'Zebrado', 'Transversal', etc
  marca_cor VARCHAR(50), -- 'Branca', 'Amarela', 'Branca+Amarela'
  resultado_final DECIMAL(10,2), -- Resultado calculado do segmento
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trecho_id, numero_segmento, marca_tipo, marca_cor)
);

-- 7. Criar tabela de estações de medição
CREATE TABLE IF NOT EXISTS estacoes_medicao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segmento_id UUID REFERENCES segmentos_medicao(id) ON DELETE CASCADE,
  numero_estacao INT NOT NULL,
  km_localizacao DECIMAL(10,3),
  distancia_km_desde_inicio DECIMAL(10,2),
  numero_leituras INT DEFAULT 10,
  resultado_estacao DECIMAL(10,2), -- Média calculada (excluindo max e min)
  valor_maximo DECIMAL(10,2),
  valor_minimo DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(segmento_id, numero_estacao)
);

-- 8. Criar tabela de leituras individuais
CREATE TABLE IF NOT EXISTS leituras_medicao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estacao_id UUID REFERENCES estacoes_medicao(id) ON DELETE CASCADE,
  numero_leitura INT NOT NULL,
  valor_mcd DECIMAL(10,2) NOT NULL, -- Valor em mcd·m⁻²·lx⁻¹
  espacamento_metros DECIMAL(5,2) DEFAULT 0.50,
  excluida_calculo BOOLEAN DEFAULT false, -- true se for max ou min excluído
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(estacao_id, numero_leitura)
);

-- 9. Criar tabela de condições ambientais
CREATE TABLE IF NOT EXISTS condicoes_medicao_horizontal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trecho_id UUID REFERENCES trechos_medicao(id) ON DELETE CASCADE,
  equipamento_id UUID REFERENCES equipamentos(id),
  tecnico_responsavel VARCHAR(200),
  data_medicao DATE NOT NULL,
  periodo_medicao VARCHAR(100), -- Ex: '08:00 às 17:00'
  
  -- Certificação do equipamento
  numero_certificado VARCHAR(100),
  data_emissao_certificado DATE,
  data_validade_certificado DATE,
  incerteza_medicao VARCHAR(100),
  calibracao_valida BOOLEAN GENERATED ALWAYS AS (
    data_validade_certificado >= CURRENT_DATE
  ) STORED,
  
  -- Condições obrigatórias NBR 14723
  superficie_seca BOOLEAN NOT NULL,
  ausencia_pedras BOOLEAN NOT NULL,
  equipamento_apoiado BOOLEAN NOT NULL,
  posicionamento_correto BOOLEAN NOT NULL, -- conforme sentido tráfego
  ausencia_luz_externa BOOLEAN NOT NULL,
  condicoes_atendidas BOOLEAN GENERATED ALWAYS AS (
    superficie_seca AND ausencia_pedras AND equipamento_apoiado 
    AND posicionamento_correto AND ausencia_luz_externa
  ) STORED,
  
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_segmentos_trecho ON segmentos_medicao(trecho_id);
CREATE INDEX IF NOT EXISTS idx_estacoes_segmento ON estacoes_medicao(segmento_id);
CREATE INDEX IF NOT EXISTS idx_leituras_estacao ON leituras_medicao(estacao_id);
CREATE INDEX IF NOT EXISTS idx_condicoes_trecho ON condicoes_medicao_horizontal(trecho_id);
CREATE INDEX IF NOT EXISTS idx_condicoes_data ON condicoes_medicao_horizontal(data_medicao);
CREATE INDEX IF NOT EXISTS idx_trechos_codigo ON trechos_medicao(codigo);

SELECT '✅ Passo 3: Tabelas NBR 14723 criadas' as status;

-- ============================================================
-- PARTE 4: FUNCTIONS PARA CÁLCULOS NBR 14723
-- ============================================================

-- 11. Função para calcular resultado de estação (exclui max e min)
CREATE OR REPLACE FUNCTION calcular_resultado_estacao(p_estacao_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_soma DECIMAL;
  v_max DECIMAL;
  v_min DECIMAL;
  v_count INT;
  v_resultado DECIMAL;
BEGIN
  -- Buscar valores
  SELECT 
    SUM(valor_mcd),
    MAX(valor_mcd),
    MIN(valor_mcd),
    COUNT(*)
  INTO v_soma, v_max, v_min, v_count
  FROM leituras_medicao
  WHERE estacao_id = p_estacao_id;
  
  -- Verificar se há leituras suficientes
  IF v_count < 3 THEN
    RAISE EXCEPTION 'Mínimo de 3 leituras necessárias. Atual: %', v_count;
  END IF;
  
  -- Calcular: (soma - max - min) / (n - 2)
  v_resultado := (v_soma - v_max - v_min) / (v_count - 2);
  
  -- Atualizar estação
  UPDATE estacoes_medicao
  SET 
    resultado_estacao = v_resultado,
    valor_maximo = v_max,
    valor_minimo = v_min,
    numero_leituras = v_count
  WHERE id = p_estacao_id;
  
  -- Marcar leituras excluídas
  UPDATE leituras_medicao
  SET excluida_calculo = true
  WHERE estacao_id = p_estacao_id
    AND (valor_mcd = v_max OR valor_mcd = v_min);
  
  RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- 12. Função para calcular resultado de segmento (média das estações)
CREATE OR REPLACE FUNCTION calcular_resultado_segmento(p_segmento_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_resultado DECIMAL;
BEGIN
  SELECT AVG(resultado_estacao)
  INTO v_resultado
  FROM estacoes_medicao
  WHERE segmento_id = p_segmento_id
    AND resultado_estacao IS NOT NULL;
  
  IF v_resultado IS NULL THEN
    RAISE EXCEPTION 'Nenhuma estação calculada para o segmento';
  END IF;
  
  UPDATE segmentos_medicao
  SET resultado_final = v_resultado
  WHERE id = p_segmento_id;
  
  RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- 13. Função para validar condições obrigatórias
CREATE OR REPLACE FUNCTION validar_condicoes_medicao(p_trecho_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_condicoes_ok BOOLEAN;
  v_calibracao_ok BOOLEAN;
BEGIN
  SELECT 
    condicoes_atendidas,
    calibracao_valida
  INTO v_condicoes_ok, v_calibracao_ok
  FROM condicoes_medicao_horizontal
  WHERE trecho_id = p_trecho_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT v_condicoes_ok THEN
    RAISE EXCEPTION 'Condições ambientais não atendidas conforme NBR 14723';
  END IF;
  
  IF NOT v_calibracao_ok THEN
    RAISE EXCEPTION 'Calibração do equipamento vencida';
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

SELECT '✅ Passo 4: Funções de cálculo criadas' as status;

-- ============================================================
-- VERIFICAÇÕES FINAIS
-- ============================================================

-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%medicao%'
ORDER BY table_name;

-- Verificar vínculos do donevir
SELECT 
  u.nome,
  u.email,
  e.codigo,
  e.nome as equipamento,
  v.data_inicio,
  v.ativo
FROM vinculos v
INNER JOIN usuarios u ON u.id = v.usuario_id
INNER JOIN equipamentos e ON e.id = v.equipamento_id
WHERE u.email = 'donevir@medlux.com'
  AND v.ativo = true;

-- Mensagem final
SELECT '✅ PATCH 02 APLICADO COM SUCESSO!' as status;
SELECT 'Sistema NBR 14723:2020 criado e operacional' as info;
