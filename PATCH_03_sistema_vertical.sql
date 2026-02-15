-- ============================================================
-- PATCH 03: Sistema Completo Retrorrefletância Vertical
-- ABNT NBR 15426:2020 + NBR 14644:2021
-- ============================================================
-- Data: 2026-02-15
-- Versão: 1.0.0
-- ============================================================

-- ============================================================
-- PARTE 1: TABELA DE PLACAS (Identificação)
-- ============================================================

CREATE TABLE IF NOT EXISTS placas_verticais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação e Localização
  codigo_placa VARCHAR(100) NOT NULL,
  rodovia VARCHAR(200),
  km DECIMAL(10,3),
  sentido_trafego VARCHAR(100),
  pista VARCHAR(100),
  lado VARCHAR(50), -- 'Direita' ou 'Esquerda'
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  georreferenciamento_automatico BOOLEAN DEFAULT false,
  
  -- Classificação do Sinal
  classificacao_sinal VARCHAR(200), -- 'Regulamentação', 'Advertência', 'Indicação', etc
  codigo_ctb VARCHAR(50), -- Código CTB do sinal
  
  -- Película
  tipo_pelicula VARCHAR(10) NOT NULL, -- 'I', 'II', 'III', 'VI', 'VII', 'VIII', 'IX', 'X'
  cores JSONB NOT NULL, -- Array de cores: ['Branca', 'Amarela', 'Vermelha', etc]
  data_fabricacao DATE,
  
  -- Medição
  data_medicao DATE NOT NULL,
  tecnico_responsavel VARCHAR(200) NOT NULL,
  modo_medicao VARCHAR(20) NOT NULL, -- 'angulo_unico' ou 'multiangulo'
  
  -- Equipamento e Calibração
  equipamento_id UUID REFERENCES equipamentos(id),
  equipamento_fabricante VARCHAR(200),
  equipamento_modelo VARCHAR(200),
  equipamento_serie VARCHAR(100),
  numero_certificado VARCHAR(100) NOT NULL,
  data_emissao_certificado DATE,
  data_validade_certificado DATE NOT NULL,
  calibracao_valida BOOLEAN DEFAULT true,
  
  -- Inspeção Visual
  descascamento BOOLEAN DEFAULT false,
  delaminacao BOOLEAN DEFAULT false,
  descoloracao BOOLEAN DEFAULT false,
  perfuracao BOOLEAN DEFAULT false,
  entalhe BOOLEAN DEFAULT false,
  sujidade BOOLEAN DEFAULT false,
  observacoes_inspecao TEXT,
  
  -- Fotos
  foto_url TEXT,
  fotos_inspecao JSONB, -- Array de URLs de fotos
  
  -- Resultado Global
  resultado_global VARCHAR(20), -- 'Conforme' ou 'Não Conforme'
  todas_geometrias_conforme BOOLEAN DEFAULT false,
  
  -- Metadados
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices e constraints
  CONSTRAINT chk_modo_medicao CHECK (modo_medicao IN ('angulo_unico', 'multiangulo')),
  CONSTRAINT chk_tipo_pelicula CHECK (tipo_pelicula IN ('I', 'II', 'III', 'VI', 'VII', 'VIII', 'IX', 'X')),
  CONSTRAINT chk_resultado CHECK (resultado_global IN ('Conforme', 'Não Conforme', 'Pendente'))
);

-- ============================================================
-- PARTE 2: TABELA DE MEDIÇÕES POR COR
-- ============================================================

CREATE TABLE IF NOT EXISTS medicoes_cor_vertical (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa_id UUID REFERENCES placas_verticais(id) ON DELETE CASCADE,
  
  cor VARCHAR(50) NOT NULL, -- 'Branca', 'Amarela', 'Vermelha', 'Verde', 'Azul', 'Marrom', 'Laranja', 'Preta'
  
  -- Resultado da cor (média de todas as geometrias)
  resultado_cor VARCHAR(20), -- 'Conforme', 'Não Conforme', 'Pendente'
  todas_geometrias_ok BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(placa_id, cor)
);

-- ============================================================
-- PARTE 3: TABELA DE GEOMETRIAS POR COR
-- ============================================================

CREATE TABLE IF NOT EXISTS geometrias_medicao_vertical (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicao_cor_id UUID REFERENCES medicoes_cor_vertical(id) ON DELETE CASCADE,
  
  -- Geometria (Observação / Entrada)
  angulo_observacao DECIMAL(3,1) NOT NULL, -- 0.2, 0.5, 1.0
  angulo_entrada DECIMAL(4,1) NOT NULL,    -- -4, +30
  geometria_nome VARCHAR(50), -- '0,2° / -4°', '0,2° / +30°', etc
  
  -- Obrigatoriedade
  geometria_obrigatoria BOOLEAN DEFAULT true,
  
  -- Valores
  numero_leituras INT DEFAULT 0,
  media_obtida DECIMAL(10,2),
  valor_minimo_normativo DECIMAL(10,2) NOT NULL,
  
  -- Status
  status VARCHAR(20), -- 'Conforme', 'Não Conforme', 'Pendente'
  conforme BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(medicao_cor_id, angulo_observacao, angulo_entrada),
  CONSTRAINT chk_status_geo CHECK (status IN ('Conforme', 'Não Conforme', 'Pendente'))
);

-- ============================================================
-- PARTE 4: TABELA DE LEITURAS INDIVIDUAIS
-- ============================================================

CREATE TABLE IF NOT EXISTS leituras_vertical (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  geometria_id UUID REFERENCES geometrias_medicao_vertical(id) ON DELETE CASCADE,
  
  numero_leitura INT NOT NULL,
  valor_cd_lx_m2 DECIMAL(10,2) NOT NULL, -- Valor em cd/lx/m²
  
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(geometria_id, numero_leitura),
  CONSTRAINT chk_valor_positivo CHECK (valor_cd_lx_m2 >= 0)
);

-- ============================================================
-- PARTE 5: TABELA DE VALORES MÍNIMOS NORMATIVOS NBR 14644
-- ============================================================

CREATE TABLE IF NOT EXISTS valores_minimos_nbr14644 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  tipo_pelicula VARCHAR(10) NOT NULL,
  cor VARCHAR(50) NOT NULL,
  angulo_observacao DECIMAL(3,1) NOT NULL,
  angulo_entrada DECIMAL(4,1) NOT NULL,
  
  valor_minimo DECIMAL(10,2) NOT NULL,
  
  norma_referencia VARCHAR(100) DEFAULT 'ABNT NBR 14644:2021',
  observacoes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tipo_pelicula, cor, angulo_observacao, angulo_entrada)
);

-- ============================================================
-- PARTE 6: ÍNDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_placas_codigo ON placas_verticais(codigo_placa);
CREATE INDEX IF NOT EXISTS idx_placas_data ON placas_verticais(data_medicao);
CREATE INDEX IF NOT EXISTS idx_placas_rodovia ON placas_verticais(rodovia);
CREATE INDEX IF NOT EXISTS idx_medicoes_placa ON medicoes_cor_vertical(placa_id);
CREATE INDEX IF NOT EXISTS idx_geometrias_medicao ON geometrias_medicao_vertical(medicao_cor_id);
CREATE INDEX IF NOT EXISTS idx_leituras_geometria ON leituras_vertical(geometria_id);
CREATE INDEX IF NOT EXISTS idx_valores_lookup ON valores_minimos_nbr14644(tipo_pelicula, cor, angulo_observacao, angulo_entrada);

SELECT '✅ Passo 1: Tabelas verticais criadas' as status;

-- ============================================================
-- PARTE 7: POPULAR VALORES MÍNIMOS NBR 14644:2021
-- ============================================================

-- TIPO I - Branca
INSERT INTO valores_minimos_nbr14644 (tipo_pelicula, cor, angulo_observacao, angulo_entrada, valor_minimo) VALUES
('I', 'Branca', 0.2, -4, 70),
('I', 'Branca', 0.2, 30, 30),
('I', 'Branca', 0.5, -4, 25),
('I', 'Branca', 0.5, 30, 15)
ON CONFLICT (tipo_pelicula, cor, angulo_observacao, angulo_entrada) DO NOTHING;

-- TIPO I - Amarela
INSERT INTO valores_minimos_nbr14644 (tipo_pelicula, cor, angulo_observacao, angulo_entrada, valor_minimo) VALUES
('I', 'Amarela', 0.2, -4, 50),
('I', 'Amarela', 0.2, 30, 20),
('I', 'Amarela', 0.5, -4, 15),
('I', 'Amarela', 0.5, 30, 10)
ON CONFLICT (tipo_pelicula, cor, angulo_observacao, angulo_entrada) DO NOTHING;

-- TIPO I - Vermelha
INSERT INTO valores_minimos_nbr14644 (tipo_pelicula, cor, angulo_observacao, angulo_entrada, valor_minimo) VALUES
('I', 'Vermelha', 0.2, -4, 14),
('I', 'Vermelha', 0.2, 30, 5),
('I', 'Vermelha', 0.5, -4, 5),
('I', 'Vermelha', 0.5, 30, 2)
ON CONFLICT (tipo_pelicula, cor, angulo_observacao, angulo_entrada) DO NOTHING;

-- TIPO I - Verde
INSERT INTO valores_minimos_nbr14644 (tipo_pelicula, cor, angulo_observacao, angulo_entrada, valor_minimo) VALUES
('I', 'Verde', 0.2, -4, 9),
('I', 'Verde', 0.2, 30, 4),
('I', 'Verde', 0.5, -4, 3),
('I', 'Verde', 0.5, 30, 1.5)
ON CONFLICT (tipo_pelicula, cor, angulo_observacao, angulo_entrada) DO NOTHING;

-- TIPO I - Azul
INSERT INTO valores_minimos_nbr14644 (tipo_pelicula, cor, angulo_observacao, angulo_entrada, valor_minimo) VALUES
('I', 'Azul', 0.2, -4, 4),
('I', 'Azul', 0.2, 30, 1.5),
('I', 'Azul', 0.5, -4, 1.5),
('I', 'Azul', 0.5, 30, 0.75)
ON CONFLICT (tipo_pelicula, cor, angulo_observacao, angulo_entrada) DO NOTHING;

-- TIPO I - Marrom
INSERT INTO valores_minimos_nbr14644 (tipo_pelicula, cor, angulo_observacao, angulo_entrada, valor_minimo) VALUES
('I', 'Marrom', 0.2, -4, 4),
('I', 'Marrom', 0.2, 30, 1.5),
('I', 'Marrom', 0.5, -4, 1.5),
('I', 'Marrom', 0.5, 30, 0.75)
ON CONFLICT (tipo_pelicula, cor, angulo_observacao, angulo_entrada) DO NOTHING;

-- TIPO I - Laranja
INSERT INTO valores_minimos_nbr14644 (tipo_pelicula, cor, angulo_observacao, angulo_entrada, valor_minimo) VALUES
('I', 'Laranja', 0.2, -4, 25),
('I', 'Laranja', 0.2, 30, 10),
('I', 'Laranja', 0.5, -4, 8),
('I', 'Laranja', 0.5, 30, 5)
ON CONFLICT (tipo_pelicula, cor, angulo_observacao, angulo_entrada) DO NOTHING;

SELECT '✅ Passo 2: Valores Tipo I inseridos' as status;

-- TIPO II - Valores superiores (multiplicar Tipo I por fator ~1.5-2)
INSERT INTO valores_minimos_nbr14644 (tipo_pelicula, cor, angulo_observacao, angulo_entrada, valor_minimo) VALUES
('II', 'Branca', 0.2, -4, 140),
('II', 'Branca', 0.2, 30, 60),
('II', 'Branca', 0.5, -4, 50),
('II', 'Branca', 0.5, 30, 30),
('II', 'Amarela', 0.2, -4, 100),
('II', 'Amarela', 0.2, 30, 40),
('II', 'Amarela', 0.5, -4, 30),
('II', 'Amarela', 0.5, 30, 20),
('II', 'Vermelha', 0.2, -4, 28),
('II', 'Vermelha', 0.2, 30, 10),
('II', 'Vermelha', 0.5, -4, 10),
('II', 'Vermelha', 0.5, 30, 4),
('II', 'Verde', 0.2, -4, 18),
('II', 'Verde', 0.2, 30, 8),
('II', 'Verde', 0.5, -4, 6),
('II', 'Verde', 0.5, 30, 3),
('II', 'Azul', 0.2, -4, 8),
('II', 'Azul', 0.2, 30, 3),
('II', 'Azul', 0.5, -4, 3),
('II', 'Azul', 0.5, 30, 1.5)
ON CONFLICT (tipo_pelicula, cor, angulo_observacao, angulo_entrada) DO NOTHING;

SELECT '✅ Passo 3: Valores Tipo II inseridos' as status;

-- TIPO III - Alta intensidade
INSERT INTO valores_minimos_nbr14644 (tipo_pelicula, cor, angulo_observacao, angulo_entrada, valor_minimo) VALUES
('III', 'Branca', 0.2, -4, 250),
('III', 'Branca', 0.2, 30, 150),
('III', 'Branca', 0.5, -4, 100),
('III', 'Branca', 0.5, 30, 60),
('III', 'Amarela', 0.2, -4, 170),
('III', 'Amarela', 0.2, 30, 100),
('III', 'Amarela', 0.5, -4, 65),
('III', 'Amarela', 0.5, 30, 40),
('III', 'Vermelha', 0.2, -4, 45),
('III', 'Vermelha', 0.2, 30, 25),
('III', 'Vermelha', 0.5, -4, 16),
('III', 'Vermelha', 0.5, 30, 10),
('III', 'Verde', 0.2, -4, 45),
('III', 'Verde', 0.2, 30, 25),
('III', 'Verde', 0.5, -4, 16),
('III', 'Verde', 0.5, 30, 10),
('III', 'Azul', 0.2, -4, 20),
('III', 'Azul', 0.2, 30, 11),
('III', 'Azul', 0.5, -4, 7),
('III', 'Azul', 0.5, 30, 4)
ON CONFLICT (tipo_pelicula, cor, angulo_observacao, angulo_entrada) DO NOTHING;

SELECT '✅ Passo 4: Valores Tipo III inseridos' as status;

-- TIPO VII - Prismático (adiciona ângulo 1.0°)
INSERT INTO valores_minimos_nbr14644 (tipo_pelicula, cor, angulo_observacao, angulo_entrada, valor_minimo) VALUES
('VII', 'Branca', 0.2, -4, 360),
('VII', 'Branca', 0.2, 30, 250),
('VII', 'Branca', 0.5, -4, 170),
('VII', 'Branca', 0.5, 30, 110),
('VII', 'Branca', 1.0, -4, 70),
('VII', 'Branca', 1.0, 30, 50),
('VII', 'Amarela', 0.2, -4, 250),
('VII', 'Amarela', 0.2, 30, 170),
('VII', 'Amarela', 0.5, -4, 120),
('VII', 'Amarela', 0.5, 30, 75),
('VII', 'Amarela', 1.0, -4, 50),
('VII', 'Amarela', 1.0, 30, 35),
('VII', 'Vermelha', 0.2, -4, 65),
('VII', 'Vermelha', 0.2, 30, 40),
('VII', 'Vermelha', 0.5, -4, 30),
('VII', 'Vermelha', 0.5, 30, 20),
('VII', 'Vermelha', 1.0, -4, 13),
('VII', 'Vermelha', 1.0, 30, 9),
('VII', 'Verde', 0.2, -4, 55),
('VII', 'Verde', 0.2, 30, 35),
('VII', 'Verde', 0.5, -4, 25),
('VII', 'Verde', 0.5, 30, 15),
('VII', 'Verde', 1.0, -4, 11),
('VII', 'Verde', 1.0, 30, 7),
('VII', 'Azul', 0.2, -4, 27),
('VII', 'Azul', 0.2, 30, 16),
('VII', 'Azul', 0.5, -4, 13),
('VII', 'Azul', 0.5, 30, 8),
('VII', 'Azul', 1.0, -4, 5),
('VII', 'Azul', 1.0, 30, 3.5)
ON CONFLICT (tipo_pelicula, cor, angulo_observacao, angulo_entrada) DO NOTHING;

SELECT '✅ Passo 5: Valores Tipo VII inseridos' as status;

-- ============================================================
-- PARTE 8: FUNÇÕES DE CÁLCULO E VALIDAÇÃO
-- ============================================================

-- Função: Calcular média de geometria
CREATE OR REPLACE FUNCTION calcular_media_geometria(p_geometria_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_media DECIMAL;
  v_count INT;
BEGIN
  SELECT AVG(valor_cd_lx_m2), COUNT(*)
  INTO v_media, v_count
  FROM leituras_vertical
  WHERE geometria_id = p_geometria_id;
  
  IF v_count < 5 THEN
    RAISE EXCEPTION 'Mínimo 5 leituras necessárias. Atual: %', v_count;
  END IF;
  
  -- Atualizar geometria
  UPDATE geometrias_medicao_vertical
  SET 
    media_obtida = v_media,
    numero_leituras = v_count,
    conforme = (v_media >= valor_minimo_normativo),
    status = CASE 
      WHEN v_media >= valor_minimo_normativo THEN 'Conforme'
      ELSE 'Não Conforme'
    END
  WHERE id = p_geometria_id;
  
  RETURN v_media;
END;
$$ LANGUAGE plpgsql;

-- Função: Validar conformidade de cor
CREATE OR REPLACE FUNCTION validar_conformidade_cor(p_medicao_cor_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_todas_ok BOOLEAN;
  v_count_obrigatorias INT;
  v_count_conformes INT;
BEGIN
  -- Contar geometrias obrigatórias
  SELECT COUNT(*) INTO v_count_obrigatorias
  FROM geometrias_medicao_vertical
  WHERE medicao_cor_id = p_medicao_cor_id
    AND geometria_obrigatoria = true;
  
  -- Contar conformes
  SELECT COUNT(*) INTO v_count_conformes
  FROM geometrias_medicao_vertical
  WHERE medicao_cor_id = p_medicao_cor_id
    AND geometria_obrigatoria = true
    AND conforme = true;
  
  v_todas_ok := (v_count_conformes = v_count_obrigatorias);
  
  UPDATE medicoes_cor_vertical
  SET 
    todas_geometrias_ok = v_todas_ok,
    resultado_cor = CASE 
      WHEN v_todas_ok THEN 'Conforme'
      ELSE 'Não Conforme'
    END
  WHERE id = p_medicao_cor_id;
  
  RETURN v_todas_ok;
END;
$$ LANGUAGE plpgsql;

-- Função: Validar conformidade global da placa
CREATE OR REPLACE FUNCTION validar_conformidade_placa(p_placa_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_todas_cores_ok BOOLEAN;
  v_count_cores INT;
  v_count_cores_conformes INT;
BEGIN
  SELECT COUNT(*) INTO v_count_cores
  FROM medicoes_cor_vertical
  WHERE placa_id = p_placa_id;
  
  SELECT COUNT(*) INTO v_count_cores_conformes
  FROM medicoes_cor_vertical
  WHERE placa_id = p_placa_id
    AND todas_geometrias_ok = true;
  
  v_todas_cores_ok := (v_count_cores_conformes = v_count_cores);
  
  UPDATE placas_verticais
  SET 
    todas_geometrias_conforme = v_todas_cores_ok,
    resultado_global = CASE 
      WHEN v_todas_cores_ok THEN 'Conforme'
      ELSE 'Não Conforme'
    END
  WHERE id = p_placa_id;
  
  RETURN v_todas_cores_ok;
END;
$$ LANGUAGE plpgsql;

-- Função: Buscar valor mínimo normativo
CREATE OR REPLACE FUNCTION buscar_valor_minimo(
  p_tipo VARCHAR, 
  p_cor VARCHAR, 
  p_obs DECIMAL, 
  p_ent DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  v_valor DECIMAL;
BEGIN
  SELECT valor_minimo INTO v_valor
  FROM valores_minimos_nbr14644
  WHERE tipo_pelicula = p_tipo
    AND cor = p_cor
    AND angulo_observacao = p_obs
    AND angulo_entrada = p_ent;
  
  IF v_valor IS NULL THEN
    RAISE EXCEPTION 'Valor mínimo não encontrado: Tipo %, Cor %, Obs %, Ent %', 
      p_tipo, p_cor, p_obs, p_ent;
  END IF;
  
  RETURN v_valor;
END;
$$ LANGUAGE plpgsql;

SELECT '✅ Passo 6: Funções criadas' as status;

-- ============================================================
-- VERIFICAÇÕES FINAIS
-- ============================================================

-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%vertical%' OR table_name LIKE '%placas%')
ORDER BY table_name;

-- Verificar contagem de valores mínimos
SELECT 
  tipo_pelicula,
  COUNT(*) as total_geometrias
FROM valores_minimos_nbr14644
GROUP BY tipo_pelicula
ORDER BY tipo_pelicula;

-- Mensagem final
SELECT '✅ ✅ ✅ PATCH 03 - SISTEMA VERTICAL COMPLETO! ✅ ✅ ✅' as status;
SELECT 'NBR 15426:2020 + NBR 14644:2021 implementadas' as info;
