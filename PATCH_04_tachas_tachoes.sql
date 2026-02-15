-- ============================================================
-- PATCH 04: Sistema Completo Tachas e Tachões
-- ABNT NBR 14636:2021 + NBR 15576:2015
-- ============================================================
-- Data: 2026-02-15
-- Versão: 1.0.0
-- ============================================================

-- ============================================================
-- PARTE 1: TABELA PRINCIPAL DE DISPOSITIVOS
-- ============================================================

CREATE TABLE IF NOT EXISTS dispositivos_pavimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  codigo VARCHAR(100) NOT NULL UNIQUE,
  categoria VARCHAR(20) NOT NULL, -- 'tacha' ou 'tachao'
  fabricante VARCHAR(200) NOT NULL,
  modelo VARCHAR(200) NOT NULL,
  lote VARCHAR(100),
  
  -- TACHAS - Tipo de Corpo (NBR 14636)
  tipo_corpo_tacha VARCHAR(50), -- 'Tipo A - Resina', 'Tipo B - Plástico', 'Tipo C - Metálico'
  
  -- TACHAS - Tipo de Lente (NBR 14636)
  tipo_lente_tacha VARCHAR(10), -- 'I', 'II', 'III', 'IV'
  descricao_lente_tacha TEXT,
  
  -- TACHAS - Características
  numero_faces VARCHAR(20), -- 'Unidirecional', 'Bidirecional'
  tipo_fixacao TEXT, -- 'Químico', 'Pino metálico', 'Pino fundido', 'Base incrustação'
  
  -- TACHÕES - Tipo (NBR 15576)
  tipo_tachao VARCHAR(10), -- 'I' (prismático), 'II' (esferas)
  descricao_tachao TEXT,
  
  -- Cor do elemento retrorrefletivo
  cor VARCHAR(50) NOT NULL, -- 'Branco', 'Amarelo', 'Vermelho', 'Verde', 'Azul'
  
  -- Medição Fotométrica
  geometria_medicao VARCHAR(50) DEFAULT '0,2° / 0°',
  data_medicao DATE NOT NULL,
  equipamento_id UUID REFERENCES equipamentos(id),
  numero_certificado VARCHAR(100),
  data_validade_certificado DATE,
  tecnico_responsavel VARCHAR(200),
  
  -- Resultados Fotométricos
  valor_ri_medio DECIMAL(10,2), -- Coeficiente de Intensidade Luminosa (mcd/lux)
  valor_minimo_normativo DECIMAL(10,2),
  status_ri VARCHAR(20), -- 'Conforme', 'Não Conforme'
  
  -- Ensaio de Abrasão (NBR 14636)
  ensaio_abrasao_realizado BOOLEAN DEFAULT false,
  valor_ri_pos_abrasao DECIMAL(10,2),
  percentual_retencao DECIMAL(5,2), -- % mantido após abrasão
  status_abrasao VARCHAR(20), -- 'Conforme' (≥80%), 'Não Conforme' (<80%)
  
  -- TACHÕES - Dimensões (NBR 15576)
  comprimento_mm DECIMAL(6,2),
  largura_mm DECIMAL(6,2),
  altura_mm DECIMAL(6,2),
  angulo_frontal DECIMAL(5,2),
  angulo_lateral DECIMAL(5,2),
  diametro_pino_mm DECIMAL(5,2),
  altura_pino_mm DECIMAL(6,2),
  comprimento_refletivo_mm DECIMAL(6,2),
  largura_refletivo_mm DECIMAL(6,2),
  espacamento_pinos_mm DECIMAL(6,2),
  status_dimensional VARCHAR(20), -- 'Conforme', 'Não Conforme', 'N/A'
  
  -- Ensaios Mecânicos (Opcionais)
  ensaio_compressao_realizado BOOLEAN DEFAULT false,
  carga_compressao_kgf DECIMAL(10,2),
  status_compressao VARCHAR(20),
  
  ensaio_impacto_realizado BOOLEAN DEFAULT false,
  status_impacto VARCHAR(20),
  
  ensaio_penetracao_agua_realizado BOOLEAN DEFAULT false,
  status_penetracao_agua VARCHAR(20),
  
  -- Status Global
  status_global VARCHAR(20), -- 'Conforme', 'Não Conforme', 'Pendente'
  observacoes TEXT,
  
  -- Metadados
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_categoria CHECK (categoria IN ('tacha', 'tachao')),
  CONSTRAINT chk_status_ri CHECK (status_ri IN ('Conforme', 'Não Conforme', 'Pendente')),
  CONSTRAINT chk_status_global CHECK (status_global IN ('Conforme', 'Não Conforme', 'Pendente'))
);

-- ============================================================
-- PARTE 2: TABELA DE LEITURAS FOTOMÉTRICAS
-- ============================================================

CREATE TABLE IF NOT EXISTS leituras_dispositivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispositivo_id UUID REFERENCES dispositivos_pavimento(id) ON DELETE CASCADE,
  
  face VARCHAR(20), -- 'Face 1', 'Face 2' (para bidirecionais)
  tipo_medicao VARCHAR(20) DEFAULT 'inicial', -- 'inicial', 'pos_abrasao'
  
  numero_leitura INT NOT NULL,
  valor_ri DECIMAL(10,2) NOT NULL, -- mcd/lux
  
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(dispositivo_id, face, tipo_medicao, numero_leitura),
  CONSTRAINT chk_valor_ri_positivo CHECK (valor_ri >= 0)
);

-- ============================================================
-- PARTE 3: TABELA DE VALORES MÍNIMOS NORMATIVOS
-- ============================================================

CREATE TABLE IF NOT EXISTS valores_minimos_dispositivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  categoria VARCHAR(20) NOT NULL, -- 'tacha', 'tachao'
  tipo VARCHAR(10) NOT NULL, -- Para Tacha: 'I','II','III','IV'; Para Tachão: 'I','II'
  cor VARCHAR(50) NOT NULL,
  
  valor_minimo DECIMAL(10,2) NOT NULL,
  norma_referencia VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(categoria, tipo, cor),
  CONSTRAINT chk_categoria_min CHECK (categoria IN ('tacha', 'tachao'))
);

-- ============================================================
-- PARTE 4: ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_dispositivos_codigo ON dispositivos_pavimento(codigo);
CREATE INDEX IF NOT EXISTS idx_dispositivos_categoria ON dispositivos_pavimento(categoria);
CREATE INDEX IF NOT EXISTS idx_dispositivos_fabricante ON dispositivos_pavimento(fabricante);
CREATE INDEX IF NOT EXISTS idx_leituras_dispositivo ON leituras_dispositivos(dispositivo_id);
CREATE INDEX IF NOT EXISTS idx_valores_lookup ON valores_minimos_dispositivos(categoria, tipo, cor);

SELECT '✅ Passo 1: Tabelas criadas' as status;

-- ============================================================
-- PARTE 5: POPULAR VALORES MÍNIMOS NBR 14636 (TACHAS)
-- ============================================================

-- TACHA Tipo I (polimérica sem revestimento)
INSERT INTO valores_minimos_dispositivos (categoria, tipo, cor, valor_minimo, norma_referencia) VALUES
('tacha', 'I', 'Branco', 280, 'ABNT NBR 14636:2021'),
('tacha', 'I', 'Amarelo', 167, 'ABNT NBR 14636:2021'),
('tacha', 'I', 'Vermelho', 70, 'ABNT NBR 14636:2021'),
('tacha', 'I', 'Verde', 93, 'ABNT NBR 14636:2021'),
('tacha', 'I', 'Azul', 26, 'ABNT NBR 14636:2021')
ON CONFLICT (categoria, tipo, cor) DO NOTHING;

-- TACHA Tipo II, III, IV (com revestimento)
INSERT INTO valores_minimos_dispositivos (categoria, tipo, cor, valor_minimo, norma_referencia) VALUES
('tacha', 'II', 'Branco', 400, 'ABNT NBR 14636:2021'),
('tacha', 'II', 'Amarelo', 220, 'ABNT NBR 14636:2021'),
('tacha', 'II', 'Vermelho', 90, 'ABNT NBR 14636:2021'),
('tacha', 'II', 'Verde', 120, 'ABNT NBR 14636:2021'),
('tacha', 'II', 'Azul', 34, 'ABNT NBR 14636:2021'),
('tacha', 'III', 'Branco', 400, 'ABNT NBR 14636:2021'),
('tacha', 'III', 'Amarelo', 220, 'ABNT NBR 14636:2021'),
('tacha', 'III', 'Vermelho', 90, 'ABNT NBR 14636:2021'),
('tacha', 'III', 'Verde', 120, 'ABNT NBR 14636:2021'),
('tacha', 'III', 'Azul', 34, 'ABNT NBR 14636:2021'),
('tacha', 'IV', 'Branco', 400, 'ABNT NBR 14636:2021'),
('tacha', 'IV', 'Amarelo', 220, 'ABNT NBR 14636:2021'),
('tacha', 'IV', 'Vermelho', 90, 'ABNT NBR 14636:2021'),
('tacha', 'IV', 'Verde', 120, 'ABNT NBR 14636:2021'),
('tacha', 'IV', 'Azul', 34, 'ABNT NBR 14636:2021')
ON CONFLICT (categoria, tipo, cor) DO NOTHING;

SELECT '✅ Passo 2: Valores Tachas inseridos' as status;

-- ============================================================
-- PARTE 6: POPULAR VALORES MÍNIMOS NBR 15576 (TACHÕES)
-- ============================================================

-- TACHÃO Tipo I (prismático)
INSERT INTO valores_minimos_dispositivos (categoria, tipo, cor, valor_minimo, norma_referencia) VALUES
('tachao', 'I', 'Branco', 280, 'ABNT NBR 15576:2015'),
('tachao', 'I', 'Amarelo', 167, 'ABNT NBR 15576:2015'),
('tachao', 'I', 'Vermelho', 70, 'ABNT NBR 15576:2015')
ON CONFLICT (categoria, tipo, cor) DO NOTHING;

-- TACHÃO Tipo II (esferas de vidro)
INSERT INTO valores_minimos_dispositivos (categoria, tipo, cor, valor_minimo, norma_referencia) VALUES
('tachao', 'II', 'Branco', 150, 'ABNT NBR 15576:2015'),
('tachao', 'II', 'Amarelo', 75, 'ABNT NBR 15576:2015'),
('tachao', 'II', 'Vermelho', 15, 'ABNT NBR 15576:2015')
ON CONFLICT (categoria, tipo, cor) DO NOTHING;

SELECT '✅ Passo 3: Valores Tachões inseridos' as status;

-- ============================================================
-- PARTE 7: FUNÇÕES DE CÁLCULO E VALIDAÇÃO
-- ============================================================

-- Função: Calcular média Ri e validar
CREATE OR REPLACE FUNCTION calcular_media_ri(p_dispositivo_id UUID, p_face VARCHAR DEFAULT NULL, p_tipo_medicao VARCHAR DEFAULT 'inicial')
RETURNS DECIMAL AS $$
DECLARE
  v_media DECIMAL;
  v_count INT;
  v_leitura1 DECIMAL;
  v_leitura2 DECIMAL;
  v_diferenca DECIMAL;
BEGIN
  -- Buscar leituras
  SELECT COUNT(*), AVG(valor_ri)
  INTO v_count, v_media
  FROM leituras_dispositivos
  WHERE dispositivo_id = p_dispositivo_id
    AND (p_face IS NULL OR face = p_face)
    AND tipo_medicao = p_tipo_medicao;
  
  -- Validar mínimo 2 leituras
  IF v_count < 2 THEN
    RAISE EXCEPTION 'Mínimo 2 leituras necessárias. Atual: %', v_count;
  END IF;
  
  -- Verificar diferença entre 2 primeiras leituras (10% máximo)
  SELECT valor_ri INTO v_leitura1
  FROM leituras_dispositivos
  WHERE dispositivo_id = p_dispositivo_id
    AND (p_face IS NULL OR face = p_face)
    AND tipo_medicao = p_tipo_medicao
    AND numero_leitura = 1;
  
  SELECT valor_ri INTO v_leitura2
  FROM leituras_dispositivos
  WHERE dispositivo_id = p_dispositivo_id
    AND (p_face IS NULL OR face = p_face)
    AND tipo_medicao = p_tipo_medicao
    AND numero_leitura = 2;
  
  v_diferenca := ABS(v_leitura1 - v_leitura2) / GREATEST(v_leitura1, v_leitura2) * 100;
  
  IF v_diferenca > 10 AND v_count < 3 THEN
    RAISE EXCEPTION 'Diferença entre leituras 1 e 2 é %.2f%% (>10%%). Necessária 3ª leitura.', v_diferenca;
  END IF;
  
  RETURN v_media;
END;
$$ LANGUAGE plpgsql;

-- Função: Buscar valor mínimo normativo
CREATE OR REPLACE FUNCTION buscar_valor_minimo_dispositivo(
  p_categoria VARCHAR,
  p_tipo VARCHAR,
  p_cor VARCHAR
)
RETURNS DECIMAL AS $$
DECLARE
  v_valor DECIMAL;
BEGIN
  SELECT valor_minimo INTO v_valor
  FROM valores_minimos_dispositivos
  WHERE categoria = p_categoria
    AND tipo = p_tipo
    AND cor = p_cor;
  
  IF v_valor IS NULL THEN
    RAISE EXCEPTION 'Valor mínimo não encontrado: Categoria %, Tipo %, Cor %', 
      p_categoria, p_tipo, p_cor;
  END IF;
  
  RETURN v_valor;
END;
$$ LANGUAGE plpgsql;

-- Função: Validar conformidade global
CREATE OR REPLACE FUNCTION validar_conformidade_dispositivo(p_dispositivo_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_disp RECORD;
  v_status VARCHAR;
BEGIN
  SELECT * INTO v_disp
  FROM dispositivos_pavimento
  WHERE id = p_dispositivo_id;
  
  -- Validação Ri
  IF v_disp.status_ri != 'Conforme' THEN
    v_status := 'Não Conforme';
  
  -- Validação Abrasão (se realizado)
  ELSIF v_disp.ensaio_abrasao_realizado AND v_disp.status_abrasao != 'Conforme' THEN
    v_status := 'Não Conforme';
  
  -- Validação Dimensional (tachões)
  ELSIF v_disp.categoria = 'tachao' AND v_disp.status_dimensional = 'Não Conforme' THEN
    v_status := 'Não Conforme';
  
  -- Validação Compressão (se realizado)
  ELSIF v_disp.ensaio_compressao_realizado AND v_disp.status_compressao = 'Não Conforme' THEN
    v_status := 'Não Conforme';
  
  -- Validação Impacto (se realizado)
  ELSIF v_disp.ensaio_impacto_realizado AND v_disp.status_impacto = 'Não Conforme' THEN
    v_status := 'Não Conforme';
  
  ELSE
    v_status := 'Conforme';
  END IF;
  
  UPDATE dispositivos_pavimento
  SET status_global = v_status
  WHERE id = p_dispositivo_id;
  
  RETURN v_status;
END;
$$ LANGUAGE plpgsql;

-- Função: Validar dimensões de tachão (NBR 15576)
CREATE OR REPLACE FUNCTION validar_dimensoes_tachao(p_dispositivo_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_disp RECORD;
  v_status VARCHAR := 'Conforme';
BEGIN
  SELECT * INTO v_disp
  FROM dispositivos_pavimento
  WHERE id = p_dispositivo_id AND categoria = 'tachao';
  
  IF v_disp IS NULL THEN
    RAISE EXCEPTION 'Dispositivo não é tachão';
  END IF;
  
  -- Validar dimensões conforme NBR 15576
  IF v_disp.comprimento_mm < 145 OR v_disp.comprimento_mm > 155 THEN
    v_status := 'Não Conforme';
  ELSIF v_disp.largura_mm < 245 OR v_disp.largura_mm > 255 THEN
    v_status := 'Não Conforme';
  ELSIF v_disp.altura_mm < 44 OR v_disp.altura_mm > 50 THEN
    v_status := 'Não Conforme';
  ELSIF v_disp.angulo_frontal < 24 OR v_disp.angulo_frontal > 30 THEN
    v_status := 'Não Conforme';
  ELSIF v_disp.angulo_lateral < 44 OR v_disp.angulo_lateral > 50 THEN
    v_status := 'Não Conforme';
  ELSIF v_disp.diametro_pino_mm < 11.4 OR v_disp.diametro_pino_mm > 14.0 THEN
    v_status := 'Não Conforme';
  ELSIF v_disp.altura_pino_mm < 45 OR v_disp.altura_pino_mm > 55 THEN
    v_status := 'Não Conforme';
  ELSIF v_disp.comprimento_refletivo_mm < 100 THEN
    v_status := 'Não Conforme';
  ELSIF v_disp.largura_refletivo_mm < 15 THEN
    v_status := 'Não Conforme';
  ELSIF v_disp.espacamento_pinos_mm < 120 THEN
    v_status := 'Não Conforme';
  END IF;
  
  UPDATE dispositivos_pavimento
  SET status_dimensional = v_status
  WHERE id = p_dispositivo_id;
  
  RETURN v_status;
END;
$$ LANGUAGE plpgsql;

SELECT '✅ Passo 4: Funções criadas' as status;

-- ============================================================
-- VERIFICAÇÕES FINAIS
-- ============================================================

-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%dispositivo%' OR table_name LIKE '%tacha%' OR table_name LIKE '%tachao%')
ORDER BY table_name;

-- Verificar contagem de valores mínimos
SELECT 
  categoria,
  tipo,
  COUNT(*) as total_cores
FROM valores_minimos_dispositivos
GROUP BY categoria, tipo
ORDER BY categoria, tipo;

-- Mensagem final
SELECT '✅ ✅ ✅ PATCH 04 - TACHAS E TACHÕES COMPLETO! ✅ ✅ ✅' as status;
SELECT 'NBR 14636:2021 + NBR 15576:2015 implementadas' as info;
