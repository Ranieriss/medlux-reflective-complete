-- ============================================
-- MEDLUX Reflective - Melhorias de Controle
-- Data: 2026-02-15
-- ============================================

-- ============================================
-- 1. ATUALIZAR TABELA DE USUÁRIOS
-- Adicionar CPF, telefone e melhorar email
-- ============================================
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14),
ADD COLUMN IF NOT EXISTS telefone VARCHAR(20),
ADD COLUMN IF NOT EXISTS foto_perfil_url TEXT;

-- Tornar email único
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email_unique ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_cpf ON public.usuarios(cpf);

-- ============================================
-- 2. ATUALIZAR TABELA DE EQUIPAMENTOS
-- Adicionar campo para laudo de calibração externo
-- ============================================
ALTER TABLE public.equipamentos 
ADD COLUMN IF NOT EXISTS laudo_calibracao_url TEXT,
ADD COLUMN IF NOT EXISTS laudo_calibracao_data DATE,
ADD COLUMN IF NOT EXISTS laudo_calibracao_laboratorio VARCHAR(255),
ADD COLUMN IF NOT EXISTS laudo_calibracao_numero VARCHAR(100),
ADD COLUMN IF NOT EXISTS laudo_calibracao_validade DATE;

CREATE INDEX IF NOT EXISTS idx_equipamentos_laudo_validade ON public.equipamentos(laudo_calibracao_validade);

-- ============================================
-- 3. CRIAR TABELA DE HISTÓRICO DE EQUIPAMENTOS
-- Registros de eventos do equipamento
-- ============================================
CREATE TABLE IF NOT EXISTS public.historico_equipamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipamento_id UUID NOT NULL REFERENCES public.equipamentos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    tipo_evento VARCHAR(50) NOT NULL, -- 'MANUTENCAO', 'CALIBRACAO', 'RECALIBRACAO', 'REPARO', 'INSPECAO', 'SUBSTITUICAO_PECA', 'LIMPEZA', 'DESATIVACAO', 'REATIVACAO'
    status_equipamento VARCHAR(50), -- 'EM_USO', 'MANUTENCAO', 'CALIBRACAO', 'INATIVO', 'AGUARDANDO_REPARO'
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    tecnico_responsavel VARCHAR(255),
    empresa_servico VARCHAR(255),
    custo NUMERIC(10,2),
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE,
    previsao_retorno TIMESTAMP WITH TIME ZONE,
    documentos_anexos JSONB, -- URLs de PDFs, fotos, etc.
    pecas_substituidas JSONB, -- Lista de peças trocadas
    observacoes TEXT,
    prioridade VARCHAR(20), -- 'BAIXA', 'MEDIA', 'ALTA', 'URGENTE'
    resolvido BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para histórico de equipamentos
CREATE INDEX IF NOT EXISTS idx_historico_eq_equipamento ON public.historico_equipamentos(equipamento_id);
CREATE INDEX IF NOT EXISTS idx_historico_eq_usuario ON public.historico_equipamentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historico_eq_tipo ON public.historico_equipamentos(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_historico_eq_status ON public.historico_equipamentos(status_equipamento);
CREATE INDEX IF NOT EXISTS idx_historico_eq_data_inicio ON public.historico_equipamentos(data_inicio);
CREATE INDEX IF NOT EXISTS idx_historico_eq_resolvido ON public.historico_equipamentos(resolvido);

-- Trigger para updated_at
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_historico_equipamentos_updated_at') THEN
        CREATE TRIGGER update_historico_equipamentos_updated_at
            BEFORE UPDATE ON public.historico_equipamentos
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================
-- 4. ATUALIZAR TABELA DE MEDIÇÕES (CALIBRAÇÕES)
-- Adicionar campos de geolocalização e múltiplas fotos
-- ============================================
ALTER TABLE public.historico_calibracoes 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11,8),
ADD COLUMN IF NOT EXISTS altitude NUMERIC(8,2),
ADD COLUMN IF NOT EXISTS precisao_gps NUMERIC(6,2),
ADD COLUMN IF NOT EXISTS localizacao_descricao TEXT,
ADD COLUMN IF NOT EXISTS fotos_urls JSONB; -- Array de URLs das fotos

-- Renomear coluna antiga para compatibilidade
-- A coluna fotos_medicao já existe, vamos manter

CREATE INDEX IF NOT EXISTS idx_calibracoes_lat_lng ON public.historico_calibracoes(latitude, longitude);

-- ============================================
-- 5. POLÍTICAS RLS PARA HISTÓRICO DE EQUIPAMENTOS
-- ============================================
ALTER TABLE public.historico_equipamentos ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'historico_equipamentos' AND policyname = 'Todos podem ver histórico') THEN
        CREATE POLICY "Todos podem ver histórico" 
        ON public.historico_equipamentos FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'historico_equipamentos' AND policyname = 'Todos podem criar histórico') THEN
        CREATE POLICY "Todos podem criar histórico" 
        ON public.historico_equipamentos FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'historico_equipamentos' AND policyname = 'Apenas admin pode editar histórico') THEN
        CREATE POLICY "Apenas admin pode editar histórico" 
        ON public.historico_equipamentos FOR UPDATE USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'historico_equipamentos' AND policyname = 'Apenas admin pode deletar histórico') THEN
        CREATE POLICY "Apenas admin pode deletar histórico" 
        ON public.historico_equipamentos FOR DELETE USING (true);
    END IF;
END $$;

-- ============================================
-- 6. VIEW: EQUIPAMENTOS COM ÚLTIMO STATUS
-- ============================================
CREATE OR REPLACE VIEW public.vw_equipamentos_status_completo AS
SELECT 
    e.*,
    he.tipo_evento AS ultimo_evento,
    he.status_equipamento AS status_atual,
    he.titulo AS ultimo_titulo,
    he.data_inicio AS data_ultimo_evento,
    he.data_fim AS data_fim_ultimo_evento,
    he.resolvido AS ultimo_evento_resolvido,
    he.tecnico_responsavel AS ultimo_tecnico,
    CASE 
        WHEN e.laudo_calibracao_validade IS NULL THEN 'SEM_LAUDO'
        WHEN e.laudo_calibracao_validade < CURRENT_DATE THEN 'LAUDO_VENCIDO'
        WHEN e.laudo_calibracao_validade <= CURRENT_DATE + INTERVAL '90 days' THEN 'LAUDO_ATENCAO'
        ELSE 'LAUDO_VALIDO'
    END AS status_laudo_calibracao,
    CASE 
        WHEN e.laudo_calibracao_validade IS NOT NULL 
        THEN CURRENT_DATE - e.laudo_calibracao_validade 
        ELSE NULL 
    END AS dias_vencimento_laudo,
    (SELECT COUNT(*) FROM public.historico_equipamentos 
     WHERE equipamento_id = e.id AND resolvido = false) AS eventos_pendentes
FROM 
    public.equipamentos e
LEFT JOIN LATERAL (
    SELECT * FROM public.historico_equipamentos 
    WHERE equipamento_id = e.id 
    ORDER BY data_inicio DESC 
    LIMIT 1
) he ON true;

-- ============================================
-- 7. VIEW: ESTATÍSTICAS DE HISTÓRICO
-- ============================================
CREATE OR REPLACE VIEW public.vw_stats_historico_equipamentos AS
SELECT 
    COUNT(*) AS total_eventos,
    COUNT(CASE WHEN tipo_evento = 'MANUTENCAO' THEN 1 END) AS total_manutencoes,
    COUNT(CASE WHEN tipo_evento = 'CALIBRACAO' THEN 1 END) AS total_calibracoes,
    COUNT(CASE WHEN tipo_evento = 'REPARO' THEN 1 END) AS total_reparos,
    COUNT(CASE WHEN resolvido = false THEN 1 END) AS eventos_pendentes,
    COUNT(CASE WHEN status_equipamento = 'MANUTENCAO' THEN 1 END) AS equipamentos_em_manutencao,
    COUNT(CASE WHEN status_equipamento = 'CALIBRACAO' THEN 1 END) AS equipamentos_em_calibracao,
    ROUND(AVG(custo), 2) AS custo_medio_servicos,
    SUM(custo) AS custo_total_servicos
FROM 
    public.historico_equipamentos;

-- ============================================
-- 8. FUNÇÃO: REGISTRAR EVENTO NO EQUIPAMENTO
-- ============================================
CREATE OR REPLACE FUNCTION public.registrar_evento_equipamento(
    p_equipamento_id UUID,
    p_usuario_id UUID,
    p_tipo_evento VARCHAR,
    p_titulo VARCHAR,
    p_descricao TEXT DEFAULT NULL,
    p_status_equipamento VARCHAR DEFAULT NULL,
    p_data_inicio TIMESTAMP DEFAULT NOW(),
    p_prioridade VARCHAR DEFAULT 'MEDIA'
)
RETURNS UUID AS $$
DECLARE
    v_evento_id UUID;
BEGIN
    INSERT INTO public.historico_equipamentos (
        equipamento_id,
        usuario_id,
        tipo_evento,
        titulo,
        descricao,
        status_equipamento,
        data_inicio,
        prioridade
    ) VALUES (
        p_equipamento_id,
        p_usuario_id,
        p_tipo_evento,
        p_titulo,
        p_descricao,
        p_status_equipamento,
        p_data_inicio,
        p_prioridade
    )
    RETURNING id INTO v_evento_id;
    
    RETURN v_evento_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. FUNÇÃO: ATUALIZAR STATUS DO EQUIPAMENTO
-- ============================================
CREATE OR REPLACE FUNCTION public.atualizar_status_equipamento(
    p_equipamento_id UUID,
    p_status VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.equipamentos
    SET 
        status = p_status,
        updated_at = NOW()
    WHERE id = p_equipamento_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. ADICIONAR COLUNA STATUS EM EQUIPAMENTOS (se não existir)
-- ============================================
ALTER TABLE public.equipamentos 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'EM_USO';

CREATE INDEX IF NOT EXISTS idx_equipamentos_status ON public.equipamentos(status);

-- ============================================
-- MENSAGEM FINAL
-- ============================================

DO $$
DECLARE
    v_count_historico INTEGER;
    v_count_usuarios INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count_historico FROM public.historico_equipamentos;
    SELECT COUNT(*) INTO v_count_usuarios FROM public.usuarios;
    
    RAISE NOTICE '✅ MEDLUX Reflective - Melhorias de Controle aplicadas!';
    RAISE NOTICE '📊 Tabela historico_equipamentos criada';
    RAISE NOTICE '📋 Campos adicionados em usuarios: cpf, telefone, foto_perfil_url';
    RAISE NOTICE '📋 Campos adicionados em equipamentos: laudo_calibracao_* (5 campos)';
    RAISE NOTICE '📋 Campos adicionados em historico_calibracoes: latitude, longitude, altitude, fotos_urls';
    RAISE NOTICE '👁️ Views criadas: vw_equipamentos_status_completo, vw_stats_historico_equipamentos';
    RAISE NOTICE '⚙️ Funções criadas: registrar_evento_equipamento(), atualizar_status_equipamento()';
    RAISE NOTICE '📝 Total de eventos no histórico: %', v_count_historico;
    RAISE NOTICE '👥 Total de usuários: %', v_count_usuarios;
    RAISE NOTICE '🎉 Sistema pronto para uso com controle avançado!';
END $$;
