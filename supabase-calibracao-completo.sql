-- ============================================
-- MEDLUX Reflective - Módulo de Calibração Completo
-- Script SQL para Supabase PostgreSQL
-- Baseado nas Normas ABNT NBR 15426, 14644, 14636, 14723
-- ============================================

-- ============================================
-- 1. TABELA: criterios_retrorrefletancia
-- Armazena os valores mínimos de referência
-- ============================================

CREATE TABLE IF NOT EXISTS public.criterios_retrorrefletancia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_equipamento VARCHAR(50) NOT NULL, -- 'vertical', 'horizontal', 'tachas', 'tachoes'
    tipo_pelicula VARCHAR(50), -- 'Tipo I', 'Tipo II', 'Tipo III', 'Tipo IV', 'Tipo V', 'Tipo VII', 'Tipo VIII'
    tipo_material VARCHAR(100), -- 'Tinta Convencional', 'Termoplástico', 'Plástico Tipo I', etc.
    cor VARCHAR(50) NOT NULL, -- 'Branco', 'Amarelo', 'Vermelho', 'Verde', 'Azul', 'Marrom'
    geometria VARCHAR(50), -- '0,2°/-4°', '15m/1,5°', '0,2°/0°', '0,2°/20°'
    valor_minimo NUMERIC(10,2) NOT NULL, -- Valor mínimo em cd/(lx·m²) ou mcd/lx
    unidade VARCHAR(50) NOT NULL, -- 'cd/(lx·m²)', 'mcd/(lx·m²)', 'mcd/lx'
    norma_referencia VARCHAR(100), -- 'NBR 15426:2020', 'NBR 14723:2020', etc.
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_criterios_tipo_equipamento ON public.criterios_retrorrefletancia(tipo_equipamento);
CREATE INDEX IF NOT EXISTS idx_criterios_tipo_pelicula ON public.criterios_retrorrefletancia(tipo_pelicula);
CREATE INDEX IF NOT EXISTS idx_criterios_cor ON public.criterios_retrorrefletancia(cor);
CREATE INDEX IF NOT EXISTS idx_criterios_ativo ON public.criterios_retrorrefletancia(ativo);

-- ============================================
-- 2. ATUALIZAR TABELA: historico_calibracoes
-- Adicionar campos específicos de medição
-- ============================================

-- Adicionar colunas se não existirem
ALTER TABLE public.historico_calibracoes 
ADD COLUMN IF NOT EXISTS tipo_pelicula VARCHAR(50),
ADD COLUMN IF NOT EXISTS tipo_material VARCHAR(100),
ADD COLUMN IF NOT EXISTS cor_medicao VARCHAR(50),
ADD COLUMN IF NOT EXISTS geometria_medicao VARCHAR(50),
ADD COLUMN IF NOT EXISTS valores_medicoes JSONB, -- Array de valores medidos
ADD COLUMN IF NOT EXISTS valor_medio NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS valor_minimo_medido NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS valor_maximo_medido NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS valor_minimo_referencia NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS quantidade_medicoes INTEGER,
ADD COLUMN IF NOT EXISTS quantidade_aprovadas INTEGER,
ADD COLUMN IF NOT EXISTS percentual_aprovacao NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS status_validacao VARCHAR(50), -- 'APROVADO', 'REPROVADO', 'ATENÇÃO'
ADD COLUMN IF NOT EXISTS norma_referencia VARCHAR(100),
ADD COLUMN IF NOT EXISTS tecnico_responsavel VARCHAR(255),
ADD COLUMN IF NOT EXISTS condicoes_medicao TEXT,
ADD COLUMN IF NOT EXISTS temperatura_ambiente NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS umidade_relativa NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS fotos_medicao JSONB; -- Array de URLs das fotos

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_calibracoes_status ON public.historico_calibracoes(status_validacao);
CREATE INDEX IF NOT EXISTS idx_calibracoes_tipo_pelicula ON public.historico_calibracoes(tipo_pelicula);
CREATE INDEX IF NOT EXISTS idx_calibracoes_cor ON public.historico_calibracoes(cor_medicao);

-- ============================================
-- 3. POPULAR TABELA DE CRITÉRIOS
-- Inserir valores mínimos conforme normas ABNT
-- ============================================

-- Limpar dados antigos (se houver)
TRUNCATE TABLE public.criterios_retrorrefletancia;

-- SINALIZAÇÃO VERTICAL (PLACAS) - NBR 15426:2020 + NBR 14644:2021
-- Tipo I - Película de Lentes Esféricas
INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, tipo_pelicula, cor, geometria, valor_minimo, unidade, norma_referencia) VALUES
('vertical', 'Tipo I', 'Branco', '0,2°/-4°', 70, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo I', 'Amarelo', '0,2°/-4°', 45, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo I', 'Vermelho', '0,2°/-4°', 14, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo I', 'Verde', '0,2°/-4°', 9, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo I', 'Azul', '0,2°/-4°', 4, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo I', 'Marrom', '0,2°/-4°', 1, 'cd/(lx·m²)', 'NBR 15426:2020');

-- Tipo II - Película Microprismática
INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, tipo_pelicula, cor, geometria, valor_minimo, unidade, norma_referencia) VALUES
('vertical', 'Tipo II', 'Branco', '0,2°/-4°', 140, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo II', 'Amarelo', '0,2°/-4°', 100, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo II', 'Vermelho', '0,2°/-4°', 25, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo II', 'Verde', '0,2°/-4°', 25, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo II', 'Azul', '0,2°/-4°', 14, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo II', 'Marrom', '0,2°/-4°', 4, 'cd/(lx·m²)', 'NBR 15426:2020');

-- Tipo III - Microprismática Alta Intensidade
INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, tipo_pelicula, cor, geometria, valor_minimo, unidade, norma_referencia) VALUES
('vertical', 'Tipo III', 'Branco', '0,2°/-4°', 250, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo III', 'Amarelo', '0,2°/-4°', 150, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo III', 'Vermelho', '0,2°/-4°', 45, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo III', 'Verde', '0,2°/-4°', 45, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo III', 'Azul', '0,2°/-4°', 25, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo III', 'Marrom', '0,2°/-4°', 7, 'cd/(lx·m²)', 'NBR 15426:2020');

-- Tipo IV - Microprismática Alta Intensidade
INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, tipo_pelicula, cor, geometria, valor_minimo, unidade, norma_referencia) VALUES
('vertical', 'Tipo IV', 'Branco', '0,2°/-4°', 360, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo IV', 'Amarelo', '0,2°/-4°', 250, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo IV', 'Vermelho', '0,2°/-4°', 65, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo IV', 'Verde', '0,2°/-4°', 65, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo IV', 'Azul', '0,2°/-4°', 40, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo IV', 'Marrom', '0,2°/-4°', 13, 'cd/(lx·m²)', 'NBR 15426:2020');

-- Tipo V - Ultra-Alta Intensidade (Delineadores)
INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, tipo_pelicula, cor, geometria, valor_minimo, unidade, norma_referencia) VALUES
('vertical', 'Tipo V', 'Branco', '0,2°/-4°', 700, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo V', 'Amarelo', '0,2°/-4°', 525, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo V', 'Vermelho', '0,2°/-4°', 140, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo V', 'Verde', '0,2°/-4°', 100, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo V', 'Azul', '0,2°/-4°', 80, 'cd/(lx·m²)', 'NBR 15426:2020');

-- Tipo VII - Alta Intensidade
INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, tipo_pelicula, cor, geometria, valor_minimo, unidade, norma_referencia) VALUES
('vertical', 'Tipo VII', 'Branco', '0,2°/-4°', 750, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo VII', 'Amarelo', '0,2°/-4°', 525, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo VII', 'Vermelho', '0,2°/-4°', 170, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo VII', 'Verde', '0,2°/-4°', 105, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo VII', 'Azul', '0,2°/-4°', 85, 'cd/(lx·m²)', 'NBR 15426:2020');

-- Tipo VIII - Alto Desempenho
INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, tipo_pelicula, cor, geometria, valor_minimo, unidade, norma_referencia) VALUES
('vertical', 'Tipo VIII', 'Branco', '0,2°/-4°', 700, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo VIII', 'Amarelo', '0,2°/-4°', 500, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo VIII', 'Vermelho', '0,2°/-4°', 120, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo VIII', 'Verde', '0,2°/-4°', 80, 'cd/(lx·m²)', 'NBR 15426:2020'),
('vertical', 'Tipo VIII', 'Azul', '0,2°/-4°', 60, 'cd/(lx·m²)', 'NBR 15426:2020');

-- SINALIZAÇÃO HORIZONTAL (TINTAS) - NBR 14723:2020
INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, tipo_material, cor, geometria, valor_minimo, unidade, norma_referencia) VALUES
('horizontal', 'Tinta Convencional', 'Branco', '15m/1,5°', 100, 'mcd/(lx·m²)', 'NBR 14723:2020'),
('horizontal', 'Tinta Convencional', 'Amarelo', '15m/1,5°', 80, 'mcd/(lx·m²)', 'NBR 14723:2020'),
('horizontal', 'Termoplástico', 'Branco', '15m/1,5°', 200, 'mcd/(lx·m²)', 'NBR 14723:2020'),
('horizontal', 'Termoplástico', 'Amarelo', '15m/1,5°', 150, 'mcd/(lx·m²)', 'NBR 14723:2020'),
('horizontal', 'Tinta à Base d''Água', 'Branco', '15m/1,5°', 100, 'mcd/(lx·m²)', 'NBR 14723:2020'),
('horizontal', 'Tinta à Base d''Água', 'Amarelo', '15m/1,5°', 80, 'mcd/(lx·m²)', 'NBR 14723:2020'),
('horizontal', 'Tinta à Base Solvente', 'Branco', '15m/1,5°', 100, 'mcd/(lx·m²)', 'NBR 14723:2020'),
('horizontal', 'Tinta à Base Solvente', 'Amarelo', '15m/1,5°', 80, 'mcd/(lx·m²)', 'NBR 14723:2020'),
('horizontal', 'Plástico Pré-Fabricado Tipo I', 'Branco', '15m/1,5°', 250, 'mcd/(lx·m²)', 'NBR 14723:2020'),
('horizontal', 'Plástico Pré-Fabricado Tipo I', 'Amarelo', '15m/1,5°', 200, 'mcd/(lx·m²)', 'NBR 14723:2020'),
('horizontal', 'Plástico Pré-Fabricado Tipo II', 'Branco', '15m/1,5°', 350, 'mcd/(lx·m²)', 'NBR 14723:2020'),
('horizontal', 'Plástico Pré-Fabricado Tipo II', 'Amarelo', '15m/1,5°', 280, 'mcd/(lx·m²)', 'NBR 14723:2020');

-- TACHAS REFLETIVAS - NBR 14636:2021
-- Geometria 0° (0,2°/0°)
INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, cor, geometria, valor_minimo, unidade, norma_referencia) VALUES
('tachas', 'Branco', '0,2°/0°', 167, 'mcd/lx', 'NBR 14636:2021'),
('tachas', 'Amarelo', '0,2°/0°', 100, 'mcd/lx', 'NBR 14636:2021'),
('tachas', 'Vermelho', '0,2°/0°', 42, 'mcd/lx', 'NBR 14636:2021');

-- Geometria 20° (0,2°/20°)
INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, cor, geometria, valor_minimo, unidade, norma_referencia) VALUES
('tachas', 'Branco', '0,2°/20°', 67, 'mcd/lx', 'NBR 14636:2021'),
('tachas', 'Amarelo', '0,2°/20°', 40, 'mcd/lx', 'NBR 14636:2021'),
('tachas', 'Vermelho', '0,2°/20°', 17, 'mcd/lx', 'NBR 14636:2021');

-- TACHÕES REFLETIVOS - NBR 15576:2015
INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, cor, geometria, valor_minimo, unidade, norma_referencia, observacoes) VALUES
('tachoes', 'Branco', '0,2°/-4°', 200, 'mcd/lx', 'NBR 15576:2015', 'Valor típico bidirecional'),
('tachoes', 'Amarelo', '0,2°/-4°', 150, 'mcd/lx', 'NBR 15576:2015', 'Valor típico bidirecional'),
('tachoes', 'Vermelho', '0,2°/-4°', 70, 'mcd/lx', 'NBR 15576:2015', 'Uso em bloqueios');

-- ============================================
-- 4. VIEW: vw_calibracoes_status
-- Visão consolidada de calibrações com status
-- ============================================

CREATE OR REPLACE VIEW public.vw_calibracoes_status AS
SELECT 
    e.id AS equipamento_id,
    e.codigo AS equipamento_codigo,
    e.nome AS equipamento_nome,
    e.tipo AS equipamento_tipo,
    e.localizacao,
    hc.id AS calibracao_id,
    hc.data_calibracao,
    hc.proxima_calibracao,
    hc.status_validacao,
    hc.valor_medio,
    hc.valor_minimo_referencia,
    hc.percentual_aprovacao,
    hc.tipo_pelicula,
    hc.cor_medicao,
    hc.certificado_numero,
    hc.tecnico_responsavel,
    CASE 
        WHEN hc.proxima_calibracao IS NULL THEN 'SEM_CALIBRACAO'
        WHEN hc.proxima_calibracao < CURRENT_DATE THEN 'VENCIDA'
        WHEN hc.proxima_calibracao <= CURRENT_DATE + INTERVAL '30 days' THEN 'ATENCAO'
        ELSE 'EM_DIA'
    END AS status_vencimento,
    CASE 
        WHEN hc.proxima_calibracao IS NOT NULL 
        THEN CURRENT_DATE - hc.proxima_calibracao 
        ELSE NULL 
    END AS dias_vencimento
FROM 
    public.equipamentos e
LEFT JOIN LATERAL (
    SELECT * FROM public.historico_calibracoes 
    WHERE equipamento_id = e.id 
    ORDER BY data_calibracao DESC 
    LIMIT 1
) hc ON true
ORDER BY 
    CASE 
        WHEN hc.proxima_calibracao < CURRENT_DATE THEN 1
        WHEN hc.proxima_calibracao <= CURRENT_DATE + INTERVAL '30 days' THEN 2
        WHEN hc.proxima_calibracao IS NULL THEN 3
        ELSE 4
    END,
    hc.proxima_calibracao;

-- ============================================
-- 5. VIEW: vw_dashboard_calibracoes
-- Estatísticas de calibrações para dashboard
-- ============================================

CREATE OR REPLACE VIEW public.vw_dashboard_calibracoes AS
SELECT 
    COUNT(*) AS total_equipamentos,
    COUNT(CASE WHEN status_vencimento = 'EM_DIA' THEN 1 END) AS em_dia,
    COUNT(CASE WHEN status_vencimento = 'ATENCAO' THEN 1 END) AS atencao,
    COUNT(CASE WHEN status_vencimento = 'VENCIDA' THEN 1 END) AS vencidas,
    COUNT(CASE WHEN status_vencimento = 'SEM_CALIBRACAO' THEN 1 END) AS sem_calibracao,
    COUNT(CASE WHEN status_validacao = 'APROVADO' THEN 1 END) AS aprovados,
    COUNT(CASE WHEN status_validacao = 'REPROVADO' THEN 1 END) AS reprovados,
    ROUND(AVG(CASE WHEN percentual_aprovacao IS NOT NULL THEN percentual_aprovacao END), 2) AS media_aprovacao
FROM 
    public.vw_calibracoes_status;

-- ============================================
-- 6. FUNCTION: calcular_status_calibracao
-- Função para calcular status de calibração automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION public.calcular_status_calibracao(
    p_tipo_equipamento VARCHAR,
    p_tipo_pelicula VARCHAR,
    p_tipo_material VARCHAR,
    p_cor VARCHAR,
    p_geometria VARCHAR,
    p_valores_medicoes JSONB
)
RETURNS TABLE (
    status_validacao VARCHAR,
    valor_medio NUMERIC,
    valor_minimo_medido NUMERIC,
    valor_maximo_medido NUMERIC,
    valor_minimo_referencia NUMERIC,
    quantidade_medicoes INTEGER,
    quantidade_aprovadas INTEGER,
    percentual_aprovacao NUMERIC
) AS $$
DECLARE
    v_criterio RECORD;
    v_valor NUMERIC;
    v_soma NUMERIC := 0;
    v_count INTEGER := 0;
    v_min NUMERIC := 999999;
    v_max NUMERIC := 0;
    v_aprovadas INTEGER := 0;
    v_minimo_ref NUMERIC;
    v_status VARCHAR;
BEGIN
    -- Buscar critério de referência
    SELECT valor_minimo INTO v_minimo_ref
    FROM public.criterios_retrorrefletancia
    WHERE tipo_equipamento = p_tipo_equipamento
      AND (tipo_pelicula = p_tipo_pelicula OR tipo_pelicula IS NULL)
      AND (tipo_material = p_tipo_material OR tipo_material IS NULL)
      AND cor = p_cor
      AND (geometria = p_geometria OR geometria IS NULL)
      AND ativo = true
    LIMIT 1;

    -- Se não encontrou critério, retornar NULL
    IF v_minimo_ref IS NULL THEN
        RETURN QUERY SELECT 
            'INDETERMINADO'::VARCHAR,
            NULL::NUMERIC,
            NULL::NUMERIC,
            NULL::NUMERIC,
            NULL::NUMERIC,
            0::INTEGER,
            0::INTEGER,
            NULL::NUMERIC;
        RETURN;
    END IF;

    -- Processar medições
    FOR v_valor IN SELECT (value::text)::numeric FROM jsonb_array_elements(p_valores_medicoes)
    LOOP
        v_count := v_count + 1;
        v_soma := v_soma + v_valor;
        
        IF v_valor < v_min THEN
            v_min := v_valor;
        END IF;
        
        IF v_valor > v_max THEN
            v_max := v_valor;
        END IF;
        
        IF v_valor >= v_minimo_ref THEN
            v_aprovadas := v_aprovadas + 1;
        END IF;
    END LOOP;

    -- Determinar status
    IF p_tipo_equipamento = 'vertical' THEN
        -- Placas: TODAS as medições devem ser >= mínimo
        IF v_aprovadas = v_count THEN
            v_status := 'APROVADO';
        ELSE
            v_status := 'REPROVADO';
        END IF;
    ELSIF p_tipo_equipamento = 'horizontal' THEN
        -- Tintas: Média >= mínimo E >= 80% pontos OK
        IF (v_soma / v_count >= v_minimo_ref) AND ((v_aprovadas::NUMERIC / v_count) >= 0.8) THEN
            v_status := 'APROVADO';
        ELSE
            v_status := 'REPROVADO';
        END IF;
    ELSIF p_tipo_equipamento = 'tachas' THEN
        -- Tachas: Verificação por geometria (será tratado na aplicação)
        IF v_min >= v_minimo_ref THEN
            v_status := 'APROVADO';
        ELSE
            v_status := 'REPROVADO';
        END IF;
    ELSE
        v_status := 'INDETERMINADO';
    END IF;

    -- Retornar resultados
    RETURN QUERY SELECT 
        v_status,
        ROUND(v_soma / v_count, 2),
        v_min,
        v_max,
        v_minimo_ref,
        v_count,
        v_aprovadas,
        ROUND((v_aprovadas::NUMERIC / v_count) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. HABILITAR RLS (Row Level Security)
-- ============================================

ALTER TABLE public.criterios_retrorrefletancia ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler critérios
CREATE POLICY "Acesso leitura criterios" ON public.criterios_retrorrefletancia
    FOR SELECT USING (true);

-- Política: Apenas admins podem modificar (implementar posteriormente)
CREATE POLICY "Acesso escrita criterios" ON public.criterios_retrorrefletancia
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 8. MENSAGEM DE SUCESSO
-- ============================================

SELECT 
    'Schema de Calibração criado com sucesso!' AS mensagem,
    COUNT(*) AS criterios_inseridos
FROM public.criterios_retrorrefletancia;

SELECT 
    'Views criadas: vw_calibracoes_status, vw_dashboard_calibracoes' AS views,
    'Função criada: calcular_status_calibracao()' AS funcoes;
