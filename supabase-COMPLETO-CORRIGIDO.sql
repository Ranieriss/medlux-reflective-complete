-- ============================================
-- MEDLUX Reflective - Supabase Database Schema CORRIGIDO
-- ============================================
-- Script seguro que não dá erro em duplicatas
-- Versão: 1.1.0 - CORRIGIDO
-- Data: 2026-02-15
-- ============================================

-- Criar extensão UUID (se não existir)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABELA: usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(50) NOT NULL DEFAULT 'tecnico',
    ativo BOOLEAN DEFAULT true,
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para usuarios (com IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil ON public.usuarios(perfil);

-- ============================================
-- 2. TABELA: equipamentos
-- ============================================
CREATE TABLE IF NOT EXISTS public.equipamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ativo',
    fabricante VARCHAR(255),
    modelo VARCHAR(255),
    numero_serie VARCHAR(255),
    localizacao VARCHAR(255),
    data_aquisicao DATE,
    data_ultima_calibracao DATE,
    proxima_calibracao DATE,
    certificado_calibracao VARCHAR(255),
    observacoes TEXT,
    foto_url TEXT,
    qr_code TEXT,
    usuario_atual_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    geometria VARCHAR(50),
    funcao VARCHAR(100),
    status_operacional VARCHAR(50),
    localidade_cidade_uf VARCHAR(255),
    data_entrega_usuario DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.usuarios(id) ON DELETE SET NULL
);

-- Índices para equipamentos
CREATE INDEX IF NOT EXISTS idx_equipamentos_codigo ON public.equipamentos(codigo);
CREATE INDEX IF NOT EXISTS idx_equipamentos_tipo ON public.equipamentos(tipo);
CREATE INDEX IF NOT EXISTS idx_equipamentos_status ON public.equipamentos(status);
CREATE INDEX IF NOT EXISTS idx_equipamentos_proxima_calibracao ON public.equipamentos(proxima_calibracao);
CREATE INDEX IF NOT EXISTS idx_equipamentos_usuario_atual ON public.equipamentos(usuario_atual_id);

-- ============================================
-- 3. TABELA: vinculos
-- ============================================
CREATE TABLE IF NOT EXISTS public.vinculos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipamento_id UUID NOT NULL REFERENCES public.equipamentos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE,
    termo_pdf_url TEXT,
    assinatura_digital TEXT,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para vinculos
CREATE INDEX IF NOT EXISTS idx_vinculos_equipamento ON public.vinculos(equipamento_id);
CREATE INDEX IF NOT EXISTS idx_vinculos_usuario ON public.vinculos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_vinculos_ativo ON public.vinculos(ativo);

-- ============================================
-- 4. TABELA: historico_calibracoes
-- ============================================
CREATE TABLE IF NOT EXISTS public.historico_calibracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipamento_id UUID NOT NULL REFERENCES public.equipamentos(id) ON DELETE CASCADE,
    data_calibracao DATE NOT NULL,
    proxima_calibracao DATE NOT NULL,
    certificado_numero VARCHAR(255),
    certificado_pdf_url TEXT,
    laboratorio VARCHAR(255),
    responsavel VARCHAR(255),
    resultado VARCHAR(50),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.usuarios(id) ON DELETE SET NULL
);

-- Índices para historico_calibracoes
CREATE INDEX IF NOT EXISTS idx_calibracoes_equipamento ON public.historico_calibracoes(equipamento_id);
CREATE INDEX IF NOT EXISTS idx_calibracoes_data ON public.historico_calibracoes(data_calibracao);

-- ============================================
-- 5. TABELA: auditoria
-- ============================================
CREATE TABLE IF NOT EXISTS public.auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    entidade VARCHAR(50) NOT NULL,
    entidade_id UUID,
    acao VARCHAR(50) NOT NULL,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON public.auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidade ON public.auditoria(entidade);
CREATE INDEX IF NOT EXISTS idx_auditoria_acao ON public.auditoria(acao);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON public.auditoria(created_at);

-- ============================================
-- 6. TABELA: logs_erro
-- ============================================
CREATE TABLE IF NOT EXISTS public.logs_erro (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    tipo_erro VARCHAR(100) NOT NULL,
    mensagem TEXT NOT NULL,
    stack_trace TEXT,
    contexto JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para logs_erro
CREATE INDEX IF NOT EXISTS idx_logs_erro_tipo ON public.logs_erro(tipo_erro);
CREATE INDEX IF NOT EXISTS idx_logs_erro_created_at ON public.logs_erro(created_at);

-- ============================================
-- TRIGGERS: Atualizar updated_at automaticamente
-- ============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers se existirem (para evitar erro)
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON public.usuarios;
DROP TRIGGER IF EXISTS update_equipamentos_updated_at ON public.equipamentos;
DROP TRIGGER IF EXISTS update_vinculos_updated_at ON public.vinculos;

-- Trigger para usuarios
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para equipamentos
CREATE TRIGGER update_equipamentos_updated_at
    BEFORE UPDATE ON public.equipamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para vinculos
CREATE TRIGGER update_vinculos_updated_at
    BEFORE UPDATE ON public.vinculos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vinculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_calibracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_erro ENABLE ROW LEVEL SECURITY;

-- Drop políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários podem ver todos os usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Todos podem ver equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Todos podem inserir equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Todos podem atualizar equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Todos podem deletar equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Todos podem ver vínculos" ON public.vinculos;
DROP POLICY IF EXISTS "Todos podem criar vínculos" ON public.vinculos;
DROP POLICY IF EXISTS "Todos podem atualizar vínculos" ON public.vinculos;
DROP POLICY IF EXISTS "Todos podem ver calibrações" ON public.historico_calibracoes;
DROP POLICY IF EXISTS "Todos podem registrar calibrações" ON public.historico_calibracoes;
DROP POLICY IF EXISTS "Todos podem ver auditoria" ON public.auditoria;
DROP POLICY IF EXISTS "Sistema pode inserir auditoria" ON public.auditoria;
DROP POLICY IF EXISTS "Todos podem ver logs de erro" ON public.logs_erro;
DROP POLICY IF EXISTS "Sistema pode inserir logs de erro" ON public.logs_erro;

-- Políticas para usuarios
CREATE POLICY "Usuários podem ver todos os usuários"
    ON public.usuarios FOR SELECT
    USING (true);

CREATE POLICY "Usuários podem atualizar próprio perfil"
    ON public.usuarios FOR UPDATE
    USING (auth.uid() = id);

-- Políticas para equipamentos (todos podem ler e escrever por enquanto)
CREATE POLICY "Todos podem ver equipamentos"
    ON public.equipamentos FOR SELECT
    USING (true);

CREATE POLICY "Todos podem inserir equipamentos"
    ON public.equipamentos FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Todos podem atualizar equipamentos"
    ON public.equipamentos FOR UPDATE
    USING (true);

CREATE POLICY "Todos podem deletar equipamentos"
    ON public.equipamentos FOR DELETE
    USING (true);

-- Políticas para vinculos
CREATE POLICY "Todos podem ver vínculos"
    ON public.vinculos FOR SELECT
    USING (true);

CREATE POLICY "Todos podem criar vínculos"
    ON public.vinculos FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Todos podem atualizar vínculos"
    ON public.vinculos FOR UPDATE
    USING (true);

-- Políticas para historico_calibracoes
CREATE POLICY "Todos podem ver calibrações"
    ON public.historico_calibracoes FOR SELECT
    USING (true);

CREATE POLICY "Todos podem registrar calibrações"
    ON public.historico_calibracoes FOR INSERT
    WITH CHECK (true);

-- Políticas para auditoria (somente leitura)
CREATE POLICY "Todos podem ver auditoria"
    ON public.auditoria FOR SELECT
    USING (true);

CREATE POLICY "Sistema pode inserir auditoria"
    ON public.auditoria FOR INSERT
    WITH CHECK (true);

-- Políticas para logs_erro
CREATE POLICY "Todos podem ver logs de erro"
    ON public.logs_erro FOR SELECT
    USING (true);

CREATE POLICY "Sistema pode inserir logs de erro"
    ON public.logs_erro FOR INSERT
    WITH CHECK (true);

-- ============================================
-- DADOS INICIAIS: Usuário Admin
-- ============================================

-- Inserir usuário admin padrão (se não existir)
INSERT INTO public.usuarios (id, email, nome, senha_hash, perfil, ativo)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@medlux.com',
    'Administrador',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- admin123
    'administrador',
    true
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View: Equipamentos com status de calibração
CREATE OR REPLACE VIEW vw_equipamentos_status_calibracao AS
SELECT 
    e.*,
    u.nome AS usuario_atual_nome,
    u.email AS usuario_atual_email,
    CASE 
        WHEN e.proxima_calibracao IS NULL THEN 'SEM_DATA'
        WHEN e.proxima_calibracao < CURRENT_DATE THEN 'VENCIDA'
        WHEN e.proxima_calibracao <= CURRENT_DATE + INTERVAL '30 days' THEN 'VENCENDO'
        ELSE 'OK'
    END AS status_calibracao,
    CASE 
        WHEN e.proxima_calibracao IS NOT NULL THEN 
            e.proxima_calibracao - CURRENT_DATE
        ELSE NULL
    END AS dias_ate_calibracao
FROM public.equipamentos e
LEFT JOIN public.usuarios u ON e.usuario_atual_id = u.id;

-- View: Estatísticas do dashboard
CREATE OR REPLACE VIEW vw_dashboard_stats AS
SELECT 
    COUNT(*) AS total_equipamentos,
    COUNT(*) FILTER (WHERE status = 'ativo') AS equipamentos_ativos,
    COUNT(*) FILTER (WHERE status = 'manutencao') AS equipamentos_manutencao,
    COUNT(*) FILTER (WHERE proxima_calibracao < CURRENT_DATE) AS calibracoes_vencidas,
    COUNT(*) FILTER (WHERE proxima_calibracao BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') AS calibracoes_vencendo,
    COUNT(DISTINCT usuario_atual_id) FILTER (WHERE usuario_atual_id IS NOT NULL) AS vinculos_ativos
FROM public.equipamentos;

-- ============================================
-- FUNÇÕES ÚTEIS
-- ============================================

-- Função: Registrar ação na auditoria
CREATE OR REPLACE FUNCTION registrar_auditoria(
    p_usuario_id UUID,
    p_entidade VARCHAR(50),
    p_entidade_id UUID,
    p_acao VARCHAR(50),
    p_dados_anteriores JSONB DEFAULT NULL,
    p_dados_novos JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO public.auditoria (
        usuario_id,
        entidade,
        entidade_id,
        acao,
        dados_anteriores,
        dados_novos
    ) VALUES (
        p_usuario_id,
        p_entidade,
        p_entidade_id,
        p_acao,
        p_dados_anteriores,
        p_dados_novos
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MÓDULO DE CALIBRAÇÃO
-- ============================================

-- 1. TABELA: criterios_retrorrefletancia
CREATE TABLE IF NOT EXISTS public.criterios_retrorrefletancia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_equipamento VARCHAR(50) NOT NULL,
    tipo_pelicula VARCHAR(50),
    tipo_material VARCHAR(100),
    cor VARCHAR(50) NOT NULL,
    geometria VARCHAR(50),
    valor_minimo NUMERIC(10,2) NOT NULL,
    unidade VARCHAR(50) NOT NULL,
    norma_referencia VARCHAR(100),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_criterios_tipo_equipamento ON public.criterios_retrorrefletancia(tipo_equipamento);
CREATE INDEX IF NOT EXISTS idx_criterios_tipo_pelicula ON public.criterios_retrorrefletancia(tipo_pelicula);
CREATE INDEX IF NOT EXISTS idx_criterios_cor ON public.criterios_retrorrefletancia(cor);
CREATE INDEX IF NOT EXISTS idx_criterios_ativo ON public.criterios_retrorrefletancia(ativo);

-- 2. ATUALIZAR TABELA: historico_calibracoes
ALTER TABLE public.historico_calibracoes 
ADD COLUMN IF NOT EXISTS tipo_pelicula VARCHAR(50),
ADD COLUMN IF NOT EXISTS tipo_material VARCHAR(100),
ADD COLUMN IF NOT EXISTS cor_medicao VARCHAR(50),
ADD COLUMN IF NOT EXISTS geometria_medicao VARCHAR(50),
ADD COLUMN IF NOT EXISTS valores_medicoes JSONB,
ADD COLUMN IF NOT EXISTS valor_medio NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS valor_minimo_medido NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS valor_maximo_medido NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS valor_minimo_referencia NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS quantidade_medicoes INTEGER,
ADD COLUMN IF NOT EXISTS quantidade_aprovadas INTEGER,
ADD COLUMN IF NOT EXISTS percentual_aprovacao NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS status_validacao VARCHAR(50),
ADD COLUMN IF NOT EXISTS norma_referencia VARCHAR(100),
ADD COLUMN IF NOT EXISTS tecnico_responsavel VARCHAR(255),
ADD COLUMN IF NOT EXISTS condicoes_medicao TEXT,
ADD COLUMN IF NOT EXISTS temperatura_ambiente NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS umidade_relativa NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS fotos_medicao JSONB;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_calibracoes_status ON public.historico_calibracoes(status_validacao);
CREATE INDEX IF NOT EXISTS idx_calibracoes_tipo_pelicula ON public.historico_calibracoes(tipo_pelicula);
CREATE INDEX IF NOT EXISTS idx_calibracoes_cor ON public.historico_calibracoes(cor_medicao);

-- 3. POPULAR TABELA DE CRITÉRIOS (somente se estiver vazia)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.criterios_retrorrefletancia LIMIT 1) THEN
        -- SINALIZAÇÃO VERTICAL (PLACAS) - Tipo I
        INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, tipo_pelicula, cor, geometria, valor_minimo, unidade, norma_referencia) VALUES
        ('vertical', 'Tipo I', 'Branco', '0,2°/-4°', 70, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo I', 'Amarelo', '0,2°/-4°', 45, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo I', 'Vermelho', '0,2°/-4°', 14, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo I', 'Verde', '0,2°/-4°', 9, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo I', 'Azul', '0,2°/-4°', 4, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo I', 'Marrom', '0,2°/-4°', 1, 'cd/(lx·m²)', 'NBR 15426:2020');

        -- Tipo II
        INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, tipo_pelicula, cor, geometria, valor_minimo, unidade, norma_referencia) VALUES
        ('vertical', 'Tipo II', 'Branco', '0,2°/-4°', 140, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo II', 'Amarelo', '0,2°/-4°', 100, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo II', 'Vermelho', '0,2°/-4°', 25, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo II', 'Verde', '0,2°/-4°', 25, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo II', 'Azul', '0,2°/-4°', 14, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo II', 'Marrom', '0,2°/-4°', 4, 'cd/(lx·m²)', 'NBR 15426:2020');

        -- Tipo III
        INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, tipo_pelicula, cor, geometria, valor_minimo, unidade, norma_referencia) VALUES
        ('vertical', 'Tipo III', 'Branco', '0,2°/-4°', 250, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo III', 'Amarelo', '0,2°/-4°', 150, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo III', 'Vermelho', '0,2°/-4°', 45, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo III', 'Verde', '0,2°/-4°', 45, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo III', 'Azul', '0,2°/-4°', 25, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo III', 'Marrom', '0,2°/-4°', 7, 'cd/(lx·m²)', 'NBR 15426:2020');

        -- Tipo IV, V, VII, VIII (continuação dos critérios)
        INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, tipo_pelicula, cor, geometria, valor_minimo, unidade, norma_referencia) VALUES
        ('vertical', 'Tipo IV', 'Branco', '0,2°/-4°', 360, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo IV', 'Amarelo', '0,2°/-4°', 250, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo IV', 'Vermelho', '0,2°/-4°', 65, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo IV', 'Verde', '0,2°/-4°', 65, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo IV', 'Azul', '0,2°/-4°', 40, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo IV', 'Marrom', '0,2°/-4°', 13, 'cd/(lx·m²)', 'NBR 15426:2020');

        -- Tipo V
        INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, tipo_pelicula, cor, geometria, valor_minimo, unidade, norma_referencia) VALUES
        ('vertical', 'Tipo V', 'Branco', '0,2°/-4°', 700, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo V', 'Amarelo', '0,2°/-4°', 525, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo V', 'Vermelho', '0,2°/-4°', 140, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo V', 'Verde', '0,2°/-4°', 100, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo V', 'Azul', '0,2°/-4°', 80, 'cd/(lx·m²)', 'NBR 15426:2020');

        -- Tipo VII
        INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, tipo_pelicula, cor, geometria, valor_minimo, unidade, norma_referencia) VALUES
        ('vertical', 'Tipo VII', 'Branco', '0,2°/-4°', 750, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo VII', 'Amarelo', '0,2°/-4°', 525, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo VII', 'Vermelho', '0,2°/-4°', 170, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo VII', 'Verde', '0,2°/-4°', 105, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo VII', 'Azul', '0,2°/-4°', 85, 'cd/(lx·m²)', 'NBR 15426:2020');

        -- Tipo VIII
        INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, tipo_pelicula, cor, geometria, valor_minimo, unidade, norma_referencia) VALUES
        ('vertical', 'Tipo VIII', 'Branco', '0,2°/-4°', 700, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo VIII', 'Amarelo', '0,2°/-4°', 500, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo VIII', 'Vermelho', '0,2°/-4°', 120, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo VIII', 'Verde', '0,2°/-4°', 80, 'cd/(lx·m²)', 'NBR 15426:2020'),
        ('vertical', 'Tipo VIII', 'Azul', '0,2°/-4°', 60, 'cd/(lx·m²)', 'NBR 15426:2020');

        -- SINALIZAÇÃO HORIZONTAL (TINTAS)
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

        -- TACHAS REFLETIVAS
        INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, cor, geometria, valor_minimo, unidade, norma_referencia) VALUES
        ('tachas', 'Branco', '0,2°/0°', 167, 'mcd/lx', 'NBR 14636:2021'),
        ('tachas', 'Amarelo', '0,2°/0°', 100, 'mcd/lx', 'NBR 14636:2021'),
        ('tachas', 'Vermelho', '0,2°/0°', 42, 'mcd/lx', 'NBR 14636:2021'),
        ('tachas', 'Branco', '0,2°/20°', 67, 'mcd/lx', 'NBR 14636:2021'),
        ('tachas', 'Amarelo', '0,2°/20°', 40, 'mcd/lx', 'NBR 14636:2021'),
        ('tachas', 'Vermelho', '0,2°/20°', 17, 'mcd/lx', 'NBR 14636:2021');

        -- TACHÕES REFLETIVOS
        INSERT INTO public.criterios_retrorrefletancia (tipo_equipamento, cor, geometria, valor_minimo, unidade, norma_referencia, observacoes) VALUES
        ('tachoes', 'Branco', '0,2°/-4°', 200, 'mcd/lx', 'NBR 15576:2015', 'Valor típico bidirecional'),
        ('tachoes', 'Amarelo', '0,2°/-4°', 150, 'mcd/lx', 'NBR 15576:2015', 'Valor típico bidirecional'),
        ('tachoes', 'Vermelho', '0,2°/-4°', 70, 'mcd/lx', 'NBR 15576:2015', 'Uso em bloqueios');

        RAISE NOTICE '✅ Critérios de retrorrefletância inseridos com sucesso!';
    ELSE
        RAISE NOTICE '⚠️ Critérios já existem, pulando inserção.';
    END IF;
END $$;

-- 4. VIEW: vw_calibracoes_status
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

-- 5. VIEW: vw_dashboard_calibracoes
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

-- 6. FUNCTION: calcular_status_calibracao
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
        IF v_aprovadas = v_count THEN
            v_status := 'APROVADO';
        ELSE
            v_status := 'REPROVADO';
        END IF;
    ELSIF p_tipo_equipamento = 'horizontal' THEN
        IF (v_soma / v_count >= v_minimo_ref) AND ((v_aprovadas::NUMERIC / v_count) >= 0.8) THEN
            v_status := 'APROVADO';
        ELSE
            v_status := 'REPROVADO';
        END IF;
    ELSIF p_tipo_equipamento = 'tachas' THEN
        IF v_min >= v_minimo_ref THEN
            v_status := 'APROVADO';
        ELSE
            v_status := 'REPROVADO';
        END IF;
    ELSE
        v_status := 'INDETERMINADO';
    END IF;

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

-- 7. HABILITAR RLS
ALTER TABLE public.criterios_retrorrefletancia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso leitura criterios" ON public.criterios_retrorrefletancia;
DROP POLICY IF EXISTS "Acesso escrita criterios" ON public.criterios_retrorrefletancia;

CREATE POLICY "Acesso leitura criterios" ON public.criterios_retrorrefletancia
    FOR SELECT USING (true);

CREATE POLICY "Acesso escrita criterios" ON public.criterios_retrorrefletancia
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- FIM DO SCRIPT - MENSAGEM DE SUCESSO
-- ============================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM public.criterios_retrorrefletancia;
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MEDLUX Reflective - Schema completo!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 Tabelas criadas: 7';
    RAISE NOTICE '📋 Views criadas: 4';
    RAISE NOTICE '⚙️ Funções criadas: 2';
    RAISE NOTICE '📏 Critérios ABNT: % registros', v_count;
    RAISE NOTICE '🔒 RLS habilitado em todas as tabelas';
    RAISE NOTICE '========================================';
END $$;
