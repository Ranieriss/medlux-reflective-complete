-- ============================================
-- MEDLUX Reflective - Supabase Database Schema
-- ============================================
-- Este script cria todas as tabelas e políticas de segurança
-- Versão: 1.0.0
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

-- Índices para usuarios
CREATE INDEX idx_usuarios_email ON public.usuarios(email);
CREATE INDEX idx_usuarios_perfil ON public.usuarios(perfil);

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
CREATE INDEX idx_equipamentos_codigo ON public.equipamentos(codigo);
CREATE INDEX idx_equipamentos_tipo ON public.equipamentos(tipo);
CREATE INDEX idx_equipamentos_status ON public.equipamentos(status);
CREATE INDEX idx_equipamentos_proxima_calibracao ON public.equipamentos(proxima_calibracao);
CREATE INDEX idx_equipamentos_usuario_atual ON public.equipamentos(usuario_atual_id);

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
CREATE INDEX idx_vinculos_equipamento ON public.vinculos(equipamento_id);
CREATE INDEX idx_vinculos_usuario ON public.vinculos(usuario_id);
CREATE INDEX idx_vinculos_ativo ON public.vinculos(ativo);

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
CREATE INDEX idx_calibracoes_equipamento ON public.historico_calibracoes(equipamento_id);
CREATE INDEX idx_calibracoes_data ON public.historico_calibracoes(data_calibracao);

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
CREATE INDEX idx_auditoria_usuario ON public.auditoria(usuario_id);
CREATE INDEX idx_auditoria_entidade ON public.auditoria(entidade);
CREATE INDEX idx_auditoria_acao ON public.auditoria(acao);
CREATE INDEX idx_auditoria_created_at ON public.auditoria(created_at);

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
CREATE INDEX idx_logs_erro_tipo ON public.logs_erro(tipo_erro);
CREATE INDEX idx_logs_erro_created_at ON public.logs_erro(created_at);

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

-- Inserir usuário admin padrão
-- NOTA: A senha 'admin123' está em hash bcrypt
-- Você deve alterar isso na primeira vez que fizer login!
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
-- FIM DO SCRIPT
-- ============================================

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Schema do MEDLUX Reflective criado com sucesso!';
    RAISE NOTICE '📊 Tabelas: usuarios, equipamentos, vinculos, historico_calibracoes, auditoria, logs_erro';
    RAISE NOTICE '🔒 RLS habilitado em todas as tabelas';
    RAISE NOTICE '👤 Usuário admin criado: admin@medlux.com / admin123';
    RAISE NOTICE '⚠️  IMPORTANTE: Altere a senha do admin na primeira vez!';
END $$;
